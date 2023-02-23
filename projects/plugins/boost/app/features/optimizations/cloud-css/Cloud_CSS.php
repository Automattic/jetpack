<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Request_Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_Cloud_CSS;

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
		add_filter( 'jetpack_boost_total_problem_count', array( $this, 'update_total_problem_count' ) );

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
		);
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
			$keys    = $this->paths->get_current_request_css_keys();
			$pending = ( new Cloud_CSS_State() )->has_pending_provider( $keys );

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
	public function generate_cloud_css() {
		$client   = new Cloud_CSS_Request();
		$response = $client->request_generate();

		// Set a one off cron job one hour from now. This will resend the request in case it failed.
		Cloud_CSS_Cron::install( time() + HOUR_IN_SECONDS );

		if ( is_wp_error( $response ) ) {
			$state = new Critical_CSS_State();
			$state->set_error( $response->get_error_message() );
		}
		return $response;
	}

	/**
	 * Store the Cloud Critical CSS or the error response.
	 *
	 * @param array $params Request parameters with the Cloud CSS status.
	 *
	 * @return bool[]|\WP_Error Update status response.
	 */
	public function update_cloud_css( $params ) {
		try {
			$providers = $this->remove_generation_args( $params['providers'] );
			$state     = new Cloud_CSS_State();
			$storage   = new Critical_CSS_Storage();

			$unknown_error = __( 'An unknown error occurred', 'jetpack-boost' );

			foreach ( $providers as $provider => $result ) {
				if ( ! isset( $result['data'] ) ) {
					$state->critical_css_state->set_error( $unknown_error );
					continue;
				}
				$data = $result['data'];

				// Success
				if ( ! empty( $result['success'] ) ) {
					$state->set_source_success( $provider );
					$storage->store_css( $provider, $data['css'] );
					continue;
				}

				// Show Stopping failure with an error message.
				if ( ! empty( $data['show_stopper'] ) && ! empty( $data['error'] ) ) {
					$state->set_source_error( $data['error'] );
					continue;
				}

				// Non show stopping failure with an error message.
				if ( ! empty( $data['urls'] ) && is_array( $data['urls'] ) ) {
					$state->set_source_error( $provider, $data['urls'] );
					continue;
				}

				$state->set_source_error( $provider, $data['error'] );
			}
			$state->save();

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
	 * Updates the total problem count for Boost if something's
	 * wrong with Cloud CSS.
	 *
	 * @param int $count The current problem count.
	 *
	 * @return int
	 */
	public function update_total_problem_count( $count ) {
		return ( new Critical_CSS_State() )->has_errors() ? ++$count : $count;
	}
}
