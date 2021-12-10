<?php
/**
 * Implements the Critical CSS functionality.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\API\Status;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Path_Providers\Paths;
use Automattic\Jetpack_Boost\Modules\Module;


class Critical_CSS extends Module {

	const MODULE_SLUG = 'critical-css';

	/**
	 * Critical CSS storage class instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	protected $storage;

	/**
	 * Prepare module. This is run irrespective of the module activation status.
	 */
	public function on_prepare() {

		$this->storage  = new Critical_CSS_Storage();
		$this->paths    = new Paths();
		$this->rest_api = new REST_API();



	}

	/**
	 * This is only run if Critical CSS module has been activated.
	 */
	protected function on_initialize() {
		// Touch to set-up the post type. This is a temporary hack.
		// This should instantiate a new Post_Type_Storage class,
		// so that Critical_CSS class is responsible
		// for setting up the storage.

		$this->rest_api->on_initialize();
		Status::register();
		// Update ready flag used to indicate Boost optimizations are warmed up in metatag.
		add_filter( 'jetpack_boost_url_ready', array( $this, 'is_ready_filter' ), 10, 1 );

		add_action( 'wp', array( $this, 'display_critical_css' ) );


		if ( Generator::is_generating_critical_css() ) {
			add_action( 'wp_head', array( $this, 'display_generate_meta' ), 0 );
			$this->force_logged_out_render();
		}

		add_action( 'handle_theme_change', array( $this, 'clear_critical_css' ) );
		add_action( 'jetpack_boost_clear_cache', array( $this, 'clear_critical_css' ) );
		add_filter( 'jetpack_boost_js_constants', array( $this->rest_api, 'add_critical_css_constants' ) );

		return true;
	}

	/**
	 * Run on plugin uninstall
	 */
	public function on_uninstall() {
		self::clear_reset_reason();
	}

	public function register_rest_routes() {
		$this->rest_api->register_rest_routes();


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

		// Don't look for Critical CSS in the dashboard
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

		// Get the Critical CSS to show
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
	 * Clear Critical CSS.
	 */
	public function clear_critical_css() {
		// Mass invalidate all cached values.
		// ^^ Not true anymore. Mass invalidate __some__ cached values.
		$this->storage->clear();
		Critical_CSS_State::reset();
	}



	/**
	 * Check if the current URL is warmed up. For this module, "warmed up" means that
	 * either Critical CSS has been generated for this page, or this page is not
	 * eligible to have Critical CSS generated for it.
	 *
	 * @param bool $ready Injected filter value.
	 *
	 * @return bool
	 */
	public function is_ready_filter( $ready ) {
		if ( ! $ready ) {
			return $ready;
		}

		// If this page has no provider keys, it is ineligible for Critical CSS.
		$keys = $this->paths->get_current_request_css_keys();
		if ( count( $keys ) === 0 ) {
			return true;
		}

		// Return "ready" if Critical CSS has been generated.
		return ! empty( $this->paths->get_current_request_css() );
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
	 * @return null|\Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		$reason = \get_option( REST_API::RESET_REASON_STORAGE_KEY );

		if ( ! $reason ) {
			return NULL;
		}

		return array( new Regenerate_Admin_Notice( $reason ) );
	}

	/**
	 * Clear Critical CSS reset reason option.
	 */
	public static function clear_reset_reason() {
		\delete_option( REST_API::RESET_REASON_STORAGE_KEY );
	}




}
