<?php
namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Contracts\Feature;
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

		REST_API::register( $this->get_endpoints() );
		Critical_CSS_Invalidator::init();

		return true;
	}

	public function get_slug() {
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

		$client = new Cloud_CSS_Request( $state );
		return $client->request_generate();
	}

	/**
	 * Handle regeneration of Cloud CSS when a post is saved.
	 */
	public function handle_save_post( $post_id, $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $post || ! isset( $post->post_type ) || ! is_post_publicly_viewable( $post ) ) {
			return;
		}

		$this->generate_cloud_css( $post );
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
		$state                       = new Critical_CSS_State( 'cloud' );
		$constants['cloudCssStatus'] = $state->get_generation_status();

		return $constants;
	}
}
