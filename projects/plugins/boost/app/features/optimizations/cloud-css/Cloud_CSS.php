<?php
namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Cloud_CSS_Status;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Request_Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Cloud_CSS implements Feature, Has_Endpoints {

	/**
	 * Critical CSS storage class instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	protected $storage;

	/**
	 * Critical CSS Provider Paths.
	 *
	 * @var Source_Providers
	 */
	protected $paths;

	public function __construct() {
		$this->storage = new Critical_CSS_Storage();
		$this->paths   = new Source_Providers();
	}
	public function setup() {
		add_action( 'wp', array( $this, 'display_critical_css' ) );
		add_action( 'jetpack_boost_after_clear_cache', array( $this, 'generate_cloud_css' ) );
		add_action( 'save_post', array( $this, 'handle_save_post' ), 10, 2 );
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_critical_css_constants' ) );
		add_filter( 'jetpack_boost_total_problem_count', array( $this, 'update_total_problem_count' ) );

		REST_API::register( $this->get_endpoints() );
		Critical_CSS_Invalidator::init();
		Cloud_CSS_Cron::init();

		return true;
	}

	public static function get_slug() {
		return 'cloud-css';
	}

	public function get_endpoints() {
		return array(
			new Request_Cloud_CSS(),
			new Update_Cloud_CSS(),
			new Cloud_CSS_Status(),
		);
	}

	/**
	 * @inheritDoc
	 */
	public function setup_trigger() {
		return 'init';
	}

	public function display_critical_css() {

		// Don't look for Critical CSS in the dashboard.
		if ( is_admin() ) {
			return;
		}

		// Don't show Critical CSS in customizer previews.
		if ( is_customize_preview() ) {
			return;
		}

		// Get the Critical CSS to show.
		$critical_css = $this->paths->get_current_request_css();
		if ( ! $critical_css ) {
			$source_providers = new Source_Providers();
			$keys             = $source_providers->get_current_request_css_keys();
			$state            = new Critical_CSS_State( 'cloud' );
			$pending          = $state->has_pending_provider( $keys );

			// If Cloud CSS is still generating and the user is logged in, render the status information in a comment.
			if ( $pending && is_user_logged_in() ) {
				$display = new Display_Critical_CSS( '/* ' . __( 'Jetpack Boost is currently generating critical css for this page', 'jetpack-boost' ) . ' */' );
				add_action( 'wp_head', array( $display, 'display_critical_css' ), 0 );
			}
			return;
		}

		$display = new Display_Critical_CSS( $critical_css );
		add_action( 'wp_head', array( $display, 'display_critical_css' ), 0 );
		add_filter( 'style_loader_tag', array( $display, 'asynchronize_stylesheets' ), 10, 4 );
		add_action( 'wp_footer', array( $display, 'onload_flip_stylesheets' ) );

		// Ensure admin bar compatibility.
		Admin_Bar_Compatibility::init();
	}

	/**
	 * Create a Cloud CSS requests for provider groups.
	 *
	 * Initialize the Cloud CSS request. Provide $post parameter to limit generating to provider groups only associated
	 * with a specific post.
	 *
	 * @param \WP_Post|null $post Post of any post type to limit provider groups.
	 */
	public function generate_cloud_css( $post = null ) {
		$state            = new Critical_CSS_State( 'cloud' );
		$source_providers = new Source_Providers();
		if ( $post ) {
			$state->add_request_context( $post );
		}
		$state->create_request( $source_providers->get_providers() );

		$client    = new Cloud_CSS_Request();
		$providers = $state->get_provider_urls();
		$response  = $client->request_generate( $providers );

		// Set a one off cron job one hour from now. This will resend the request in case it failed.
		Cloud_CSS_Cron::install( time() + HOUR_IN_SECONDS );

		if ( is_wp_error( $response ) ) {
			$state->set_as_failed( $response->get_error_message() );
		}
		return $response;
	}

	/**
	 * Store the Cloud Critical CSS or the error response.
	 *
	 * @param  array $params    Request parameters with the Cloud CSS status.
	 * @return bool[]|\WP_Error Update status response.
	 */
	public function update_cloud_css( $params ) {
		try {
			$providers = $this->remove_generation_args( $params['providers'] );
			$state     = new Critical_CSS_State( 'cloud' );
			$storage   = new Critical_CSS_Storage();

			foreach ( $providers as $provider => $result ) {
				if ( ! isset( $result['data'] ) ) {
					$state->set_as_failed( __( 'An unknown error occurred', 'jetpack-boost' ) );
					continue;
				}
				$data = $result['data'];
				if ( isset( $result['success'] ) && $result['success'] ) {
					$state->set_source_success( $provider );
					$storage->store_css( $provider, $data['css'] );
				} elseif ( isset( $data['show_stopper'] ) && $data['show_stopper'] ) {
					$state->set_as_failed( $data['error'] );
				} else {
					$state->set_source_error( $provider, $data['urls'] );
				}
			}
			$state->maybe_set_status();

			return array( 'success' => true );
		} catch ( \Exception $e ) {
			return new \WP_Error( 'invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Remove jb-generate-critical-css arg from each URL in the provider set.
	 */
	private function remove_generation_args( $providers ) {
		foreach ( $providers as &$provider ) {
			if ( ! isset( $provider['data'] ) || ! isset( $provider['data']['urls'] ) ) {
				continue;
			}
			$formatted = array();
			foreach ( $provider['data']['urls'] as $url => $error ) {
				$url                  = remove_query_arg( 'jb-generate-critical-css', $url );
				$error['meta']['url'] = $url;
				$formatted[ $url ]    = $error;
			}
			$provider['data']['urls'] = $formatted;
		}
		return $providers;
	}

	/**
	 * Handle regeneration of Cloud CSS when a post is saved.
	 */
	public function handle_save_post( $post_id, $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $post || ! isset( $post->post_type ) || ! is_post_publicly_viewable( $post ) ) {
			return;
		}

		$this->generate_cloud_css();
	}

	/**
	 * Add Cloud CSS related constants to be passed to JavaScript only if the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_critical_css_constants( $constants ) {
		// Information about the current status of Cloud CSS / generation.
		$generator                      = new Generator( 'cloud' );
		$constants['criticalCssStatus'] = $generator->get_critical_css_status();

		return $constants;
	}

	/**
	 * Return whether the Cloud CSS has an error or not.
	 *
	 * @return boolean
	 */
	public function has_health_problem() {
		$cloud_css = new Critical_CSS_State( 'cloud' );

		return $cloud_css->get_status() === 'error';
	}

	/**
	 * Updates the total problem count for Boost if something's
	 * wrong with Cloud CSS.
	 *
	 * @param  int $count The current problem count.
	 * @return int
	 */
	public function update_total_problem_count( $count ) {
		$has_problem = $this->has_health_problem();

		return $has_problem ? ++$count : $count;
	}
}
