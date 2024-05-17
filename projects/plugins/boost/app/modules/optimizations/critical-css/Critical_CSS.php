<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Critical_CSS implements Pluggable, Changes_Page_Output, Optimization {

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
	 * Check if the module is ready and already serving critical CSS.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return ( new Critical_CSS_State() )->is_generated();
	}

	public static function is_available() {
		return true !== Premium_Features::has_feature( Premium_Features::CLOUD_CSS );
	}

	/**
	 * This is only run if Critical CSS module has been activated.
	 */
	public function setup() {
		add_action( 'wp', array( $this, 'display_critical_css' ) );
		add_filter( 'jetpack_boost_total_problem_count', array( $this, 'update_total_problem_count' ) );

		Generator::init();
		Critical_CSS_Invalidator::init();
		CSS_Proxy::init();

		// Admin Notices
		Regenerate_Admin_Notice::init();

		return true;
	}

	public static function get_slug() {
		return 'critical_css';
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

	public function update_total_problem_count( $count ) {
		return ( new Critical_CSS_State() )->has_errors() ? ++$count : $count;
	}
}
