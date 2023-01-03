<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Recommendations;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Error;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Request;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Status;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generator_Success;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Recommendations_Dismiss;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Recommendations_Reset;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Critical_CSS implements Feature, Has_Endpoints {

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

	/**
	 * Prepare module. This is run irrespective of the module activation status.
	 */
	public function __construct() {
		$this->storage = new Critical_CSS_Storage();
		$this->paths   = new Source_Providers();
	}

	/**
	 * This is only run if Critical CSS module has been activated.
	 */
	public function setup() {
		// Touch to setup the post type. This is a temporary hack.
		// This should instantiate a new Post_Type_Storage class,
		// so that Critical_CSS class is responsible
		// for setting up the storage.
		$recommendations = new Recommendations();
		$recommendations->attach_hooks();

		add_action( 'wp', array( $this, 'display_critical_css' ) );

		if ( Generator::is_generating_critical_css() ) {
			add_action( 'wp_head', array( $this, 'display_generate_meta' ), 0 );
			$this->force_logged_out_render();
		}

		Critical_CSS_Invalidator::init();
		CSS_Proxy::init();

		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_critical_css_constants' ) );

		REST_API::register( $this->get_endpoints() );

		// Admin Notices
		Regenerate_Admin_Notice::init();

		return true;
	}

	public static function get_slug() {
		return 'critical-css';
	}

	/**
	 * Renders a <meta> tag used to verify this is a valid page to generate Critical CSS with.
	 */
	public function display_generate_meta() {
		?>
		<meta name="jb-generate-critical-css" content="true"/>
		<?php
	}

	public function display_critical_css() {
		// Don't look for Critical CSS in the dashboard.
		if ( is_admin() ) {
			return;
		}
		// Don't display Critical CSS when generating Critical CSS.
		if ( Generator::is_generating_critical_css() ) {
			return;
		}

		// Don't show Critical CSS in customizer previews.
		if ( is_customize_preview() ) {
			return;
		}

		// Get the Critical CSS to show.
		$critical_css = $this->paths->get_current_request_css();
		if ( ! $critical_css ) {
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
	 * Force the current page to render as viewed by a logged out user. Useful when generating
	 * Critical CSS.
	 */
	private function force_logged_out_render() {
		$current_user_id = get_current_user_id();

		if ( 0 !== $current_user_id ) {
			// Force current user to 0 to ensure page is rendered as a non-logged-in user.
			wp_set_current_user( 0 );

			// Turn off display of admin bar.
			add_filter( 'show_admin_bar', '__return_false', PHP_INT_MAX );
		}
	}

	/**
	 * Add Critical CSS related constants to be passed to JavaScript only if the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_critical_css_constants( $constants ) {
		// Information about the current status of Critical CSS / generation.
		$generator                      = new Generator();
		$constants['criticalCssStatus'] = $generator->get_local_critical_css_generation_info();

		return $constants;
	}

	/**
	 * @return Endpoint::class[]
	 *
	 */
	public function get_endpoints() {
		return array(
			Generator_Status::class,
			Generator_Request::class,
			Generator_Success::class,
			Recommendations_Dismiss::class,
			Recommendations_Reset::class,
			Generator_Error::class,
		);
	}

	/**
	 * @inheritDoc
	 */
	public function setup_trigger() {
		return 'init';
	}
}
