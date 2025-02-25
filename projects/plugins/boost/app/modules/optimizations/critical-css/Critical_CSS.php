<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Data_Sync\Critical_CSS_Meta_Entry;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync\Data_Sync_Schema;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Regenerate_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Error_Dismissed;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Errors;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Critical_CSS implements Pluggable, Changes_Page_Output, Optimization, Has_Data_Sync {

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

	public function register_data_sync( Data_Sync $instance ) {
		$instance->register( 'critical_css_state', Data_Sync_Schema::critical_css_state() );
		$instance->register( 'critical_css_meta', Data_Sync_Schema::critical_css_meta(), new Critical_CSS_Meta_Entry() );
		$instance->register( 'critical_css_suggest_regenerate', Data_Sync_Schema::critical_css_suggest_regenerate() );
		$instance->register_action( 'critical_css_state', 'request-regenerate', Schema::as_void(), new Regenerate_CSS() );
		$instance->register_action( 'critical_css_state', 'set-provider-css', Data_Sync_Schema::critical_css_set_provider(), new Set_Provider_CSS() );
		$instance->register_action( 'critical_css_state', 'set-provider-errors', Data_Sync_Schema::critical_css_set_provider_errors(), new Set_Provider_Errors() );
		$instance->register_action( 'critical_css_state', 'set-provider-errors-dismissed', Data_Sync_Schema::critical_css_set_provider_errors_dismissed(), new Set_Provider_Error_Dismissed() );
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

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG === true ) {
			$critical_css = "/* Critical CSS Key: {$this->paths->get_current_critical_css_key()} */\n" . $critical_css;
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
