<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Critical_CSS_Start;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_Cloud_CSS;

class Cloud_CSS implements Pluggable, Has_Endpoints {

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
		add_action( 'save_post', array( $this, 'handle_save_post' ), 10, 2 );
		add_filter( 'jetpack_boost_total_problem_count', array( $this, 'update_total_problem_count' ) );
		add_filter( 'critical_css_invalidated', array( $this, 'handle_critical_css_invalidated' ) );

		Critical_CSS_Invalidator::init();
		Cloud_CSS_Followup::init();

		return true;
	}

	public static function is_available() {
		return true === Premium_Features::has_feature( Premium_Features::CLOUD_CSS );
	}

	public static function get_slug() {
		return 'cloud_css';
	}

	public function get_endpoints() {
		return array(
			new Update_Cloud_CSS(),
			new Critical_CSS_Start(),
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
			$pending = ( new Critical_CSS_State() )->has_pending_provider( $keys );

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
	 */
	public function generate_cloud_css( $providers = array() ) {
		$grouped_urls = array();

		foreach ( $providers as $source ) {
			$provider                  = $source['key'];
			$grouped_urls[ $provider ] = $source['urls'];
		}

		// Send the request to the Cloud.
		$client               = Boost_API::get_client();
		$payload              = array( 'providers' => $grouped_urls );
		$payload['requestId'] = md5( wp_json_encode( $payload ) . time() );
		return $client->post( 'cloud-css', $payload );
	}

	/**
	 * Handle regeneration of Cloud CSS when a post is saved.
	 */
	public function handle_save_post( $post_id, $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $post || ! isset( $post->post_type ) || ! is_post_publicly_viewable( $post ) ) {
			return;
		}

		$this->regenerate_cloud_css();
	}

	public function regenerate_cloud_css() {
		$result = $this->generate_cloud_css( $this->get_existing_sources() );
		if ( is_wp_error( $result ) ) {
			$state = new Critical_CSS_State();
			$state->set_error( $result->get_error_message() )->save();
		}
		return $result;
	}

	/**
	 * Called when stored Critical CSS has been invalidated. Triggers a new Cloud CSS request.
	 */
	public function handle_critical_css_invalidated() {
		$this->regenerate_cloud_css();
		Cloud_CSS_Followup::schedule();
	}

	public function get_existing_sources() {
		$state = new Critical_CSS_State();
		$data  = $state->get();
		if ( isset( $data['providers'] ) ) {
			$providers = $data['providers'];
		} else {
			$source_providers = new Source_Providers();
			$providers        = $source_providers->get_provider_sources();
		}

		return $providers;
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
