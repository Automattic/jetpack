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
		// The API-managed buttons ship behind a flag; register it before anything reads it.
		Jetpack_PayPal_Payment_Buttons::register_feature_flags();

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
	 * Register the PayPal Payment Buttons block with the correct dist path.
	 */
	public function register_paypal_block() {
		// Get the path to the dist directory in the paypal-payments package
		$package_dir = dirname( __DIR__ ) . '/jetpack_vendor/automattic/jetpack-paypal-payments';
		$dist_dir    = $package_dir . '/dist/paypal-payment-buttons';

		if ( ! is_dir( $dist_dir ) ) {
			return false;
		}

		Jetpack_PayPal_Payment_Buttons::register_block_style();

		// Register the block using the Blocks package with the correct dist path
		Blocks::jetpack_register_block(
			$dist_dir,
			array(
				'render_callback' => array( Jetpack_PayPal_Payment_Buttons::class, 'render_block' ),
				'style'           => Jetpack_PayPal_Payment_Buttons::STYLE_HANDLE,
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
			'feature_flags'    => Jetpack_PayPal_Payment_Buttons::add_editor_feature_flags( array() ),
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
