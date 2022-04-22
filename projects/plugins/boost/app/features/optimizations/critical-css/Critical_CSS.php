<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS;

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

	const RESET_REASON_STORAGE_KEY = 'jb-generate-critical-css-reset-reason';

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
		add_filter( 'jetpack_boost_admin_notices', array( $this, 'add_admin_notices' ) );

		REST_API::register( $this->get_endpoints() );
		return true;
	}

	public function get_slug() {
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
	 * Override; returns an admin notice to show if there was a reset reason.
	 *
	 * @todo
	 *      There should be an Admin_Notice class
	 *      To create a notice, (new Admin_Notice())->create("notice text");
	 *      To view notices: (new Admin_Notice())->get_all();
	 * @return null|\Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function add_admin_notices( $notices ) {
		$reason = \get_option( self::RESET_REASON_STORAGE_KEY );

		if ( $reason ) {
			$notices[] = new Regenerate_Admin_Notice( $reason );
		}

		return $notices;
	}

	/**
	 * Clear Critical CSS reset reason option.
	 *
	 * @todo Admin notices need to be moved elsewhere.
	 *        Note: Looks like we need a way to <construct> and <destroy> options throughout the app.
	 *        This is why it's currently awkwardly using a static method with a constant
	 *        If we could trust classes to use constructors properly - without performing actions
	 *        Then we could easily (and cheaply) instantiate all Boost objects
	 *        and kindly ask them to delete themselves
	 */
	public static function clear_reset_reason() {
		\delete_option( self::RESET_REASON_STORAGE_KEY );
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
	 * @todo Facepalm. PHP Typehinting is broken.
	 * @return Endpoint[]
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
