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
		// Initialize PayPal Payment Buttons block
		add_action( 'init', array( 'Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons', 'register_block' ) );

		// Add admin menu
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
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
		// Admin initialization can be added here if needed
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<p><?php esc_html_e( 'PayPal Payment Buttons settings will be displayed here.', 'paypal-payment-buttons' ); ?></p>
		</div>
		<?php
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
