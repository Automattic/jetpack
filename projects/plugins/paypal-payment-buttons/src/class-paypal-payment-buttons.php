<?php
/**
 * Primary class file for the PayPal Payment Buttons plugin.
 *
 * @package automattic/paypal-payment-buttons
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class PayPal_Payment_Buttons
 *
 * @phan-constructor-used-for-side-effects
 */
class PayPal_Payment_Buttons {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Initialize PayPal Payment Buttons block with correct dist path
		add_action( 'init', array( $this, 'register_paypal_block' ), 9 );

		// Load scripts for the editing interface
		add_action( 'enqueue_block_editor_assets', array( 'Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons', 'load_editor_scripts' ), 9 );

		// Provide block availability data for editor
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_availability_data' ), 10 );

		// Load styles in the editor iframe context
		if ( is_admin() ) {
			add_action( 'enqueue_block_assets', array( 'Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons', 'load_editor_styles' ), 9 );
		}

		// Add admin menu
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
	}

	/**
	 * Register the PayPal Payment Buttons block with the correct dist path.
	 */
	public function register_paypal_block() {
		// Get the path to the dist directory in the paypal-payments package
		$package_dir = dirname( __DIR__ ) . '/vendor/automattic/jetpack-paypal-payments';
		$dist_dir    = $package_dir . '/dist/paypal-payment-buttons';

		if ( ! is_dir( $dist_dir ) ) {
			return false;
		}

		// Register the block using the Blocks package with the correct dist path
		\Automattic\Jetpack\Blocks::jetpack_register_block(
			$dist_dir,
			array(
				'render_callback' => array( 'Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons', 'render_block' ),
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
	 * Add admin menu for the plugin.
	 */
	public function add_admin_menu() {
		$page_suffix = add_menu_page(
			__( 'PayPal Payment Buttons', 'paypal-payment-buttons' ),
			_x( 'PayPal Buttons', 'The PayPal Payment Buttons product name, without the Jetpack prefix', 'paypal-payment-buttons' ),
			'manage_options',
			'paypal-payment-buttons',
			array( $this, 'plugin_settings_page' ),
			'dashicons-money-alt'
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
		<div id="paypal-payment-buttons-root"></div>
		<?php
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		// Only enqueue on our admin page
		$screen = get_current_screen();
		if ( $screen && $screen->id !== 'toplevel_page_paypal-payment-buttons' ) {
			return;
		}

		wp_enqueue_script(
			'paypal-payment-buttons-admin',
			plugins_url( 'build/index.js', PAYPAL_PAYMENT_BUTTONS_ROOT_FILE ),
			array( 'wp-element', 'wp-i18n' ),
			filemtime( PAYPAL_PAYMENT_BUTTONS_DIR . 'build/index.js' ),
			true
		);

		// Only enqueue CSS if the file exists
		$css_file = PAYPAL_PAYMENT_BUTTONS_DIR . 'build/index.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				'paypal-payment-buttons-admin',
				plugins_url( 'build/index.css', PAYPAL_PAYMENT_BUTTONS_ROOT_FILE ),
				array(),
				filemtime( $css_file )
			);
		}
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
