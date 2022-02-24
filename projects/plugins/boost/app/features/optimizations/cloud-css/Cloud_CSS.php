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
			return;
		}

		$display = new Display_Critical_CSS( $critical_css );
		add_action( 'wp_head', array( $display, 'display_critical_css' ), 0 );
		add_filter( 'style_loader_tag', array( $display, 'asynchronize_stylesheets' ), 10, 4 );
		add_action( 'wp_footer', array( $display, 'onload_flip_stylesheets' ) );
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
