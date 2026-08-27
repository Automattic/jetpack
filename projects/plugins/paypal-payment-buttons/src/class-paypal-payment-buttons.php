<?php
/**
 * Primary class file for the PayPal Payment Buttons plugin.
 *
 * @package automattic/paypal-payment-buttons
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons as Jetpack_PayPal_Payment_Buttons;

/**
 * Class PayPal_Payment_Buttons
 */
class PayPal_Payment_Buttons {

	/**
	 * Plugin instance.
	 *
	 * @var PayPal_Payment_Buttons
	 */
	private static $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @return PayPal_Payment_Buttons
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initialize the plugin and register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		$instance = self::instance();
		$instance->init_hooks();
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		// Private constructor to prevent direct instantiation
	}

	/**
	 * Initialize WordPress hooks.
	 *
	 * @return void
	 */
	public function init_hooks() {
		// Register standalone script stubs for Jetpack dependencies not available outside the monorepo.
		add_action( 'init', array( $this, 'register_standalone_script_stubs' ), 1 );

		// Initialize PayPal Payment Buttons block with correct dist path
		add_action( 'init', array( $this, 'register_paypal_block' ), 9 );

		// Initialize PayPal API integration (REST routes for OAuth + button management).
		Jetpack_PayPal_Payment_Buttons::init_api();

		// Initialize admin dashboard (Payment Links list page).
		if ( is_admin() ) {
			Jetpack_PayPal_Payment_Buttons::init_admin();
		}

		// Load scripts for the editing interface
		add_action( 'enqueue_block_editor_assets', array( Jetpack_PayPal_Payment_Buttons::class, 'load_editor_scripts' ), 9 );

		// Provide block availability data for editor
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_availability_data' ), 10 );

		// Load styles in the editor iframe context
		if ( is_admin() ) {
			add_action( 'enqueue_block_assets', array( Jetpack_PayPal_Payment_Buttons::class, 'load_editor_styles' ), 9 );
		}
	}

	/**
	 * Register script stubs for Jetpack dependencies that are not available in standalone mode.
	 *
	 * The editor.js bundle declares `jetpack-script-data` as a dependency (from
	 *
	 * @automattic/jetpack-script-data). In the Jetpack plugin this is registered by the
	 * Assets package, but in standalone mode it does not exist. WordPress silently
	 * refuses to enqueue scripts with unregistered dependencies, so we register an
	 * empty stub to satisfy the dependency chain.
	 */
	public function register_standalone_script_stubs() {
		if ( ! wp_script_is( 'jetpack-script-data', 'registered' ) ) {
			wp_register_script( 'jetpack-script-data', false, array(), '1.0.0', false );

			// The webpack build externalizes @automattic/jetpack-script-data to
			// window.JetpackScriptDataModule (UMD global). The module's getScriptData()
			// returns window.JetpackScriptData. Without these globals the editor.js
			// bundle crashes at module init time in connection/state/store.jsx.
			$current_user = wp_get_current_user();
			$script_data  = wp_json_encode(
				array(
					'site' => array(
						'icon'       => get_site_icon_url(),
						'title'      => get_bloginfo( 'name' ),
						'admin_url'  => admin_url(),
						'rest_root'  => esc_url_raw( rest_url() ),
						'rest_nonce' => wp_create_nonce( 'wp_rest' ),
						'wp_version' => get_bloginfo( 'version' ),
					),
					'user' => array(
						'current_user' => array(
							'id'           => $current_user->ID,
							'display_name' => $current_user->display_name,
							'capabilities' => array(
								'manage_options' => current_user_can( 'manage_options' ),
								'manage_modules' => current_user_can( 'manage_options' ),
							),
						),
					),
				),
				JSON_HEX_TAG | JSON_HEX_AMP
			);

			$inline_js = sprintf(
				'window.JetpackScriptData = %s;'
				. 'window.JetpackScriptDataModule = { getScriptData: function() { return window.JetpackScriptData; } };',
				$script_data
			);

			wp_add_inline_script( 'jetpack-script-data', $inline_js, 'before' );
		}
	}

	/**
	 * Register the PayPal Payment Buttons block with the correct dist path.
	 */
	public function register_paypal_block() {
		// Get the path to the dist directory in the paypal-payments package
		$package_dir = dirname( __DIR__ ) . '/jetpack_vendor/automattic/jetpack-paypal-payments';
		$dist_dir    = $package_dir . '/dist/paypal-payment-buttons';

		if ( ! is_dir( $dist_dir ) ) {
			return false;
		}

		// Register the block using the Blocks package with the correct dist path
		Blocks::jetpack_register_block(
			$dist_dir,
			array(
				'render_callback' => array( Jetpack_PayPal_Payment_Buttons::class, 'render_block' ),
			)
		);
	}

	/**
	 * Enqueue block availability data for the editor.
	 */
	public function enqueue_block_availability_data() {
		// Only enqueue in the block editor
		if ( ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || ! $screen->is_block_editor() ) {
			return;
		}

		// Provide the availability data that the block registration JavaScript expects
		$availability_data = array(
			'available_blocks' => array(
				'paypal-payment-buttons' => array(
					'available' => true,
				),
			),
		);

		wp_localize_script(
			'jp-paypal-payments-ncps-blocks',
			'Jetpack_Editor_Initial_State',
			$availability_data
		);
	}

	/**
	 * Plugin deactivation handler.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		// Cleanup on deactivation
	}
}
