<?php
/**
 * Main plugin class.
 *
 * @package automattic/paypal-payments
 */

use Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons;

/**
 * Class PayPal_Payments
 *
 * @package Automattic\PaypalPayments
 */
class PayPal_Payments {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->init();
		$this->admin_init();
	}

	/**
	 * Add initial hooks.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'init', array( $this, 'register_hooks' ) );
	}

	/**
	 * Register the block.
	 */
	public function register_block() {
		PayPal_Payment_Buttons::register_block();
	}

	/**
	 * Register the hooks.
	 */
	public function register_hooks() {
		PayPal_Payment_Buttons::register_hooks();
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		PayPal_Payment_Buttons::load_editor_styles();
		PayPal_Payment_Buttons::load_editor_scripts();
	}

	/**
	 * Deactivation hook.
	 */
	public static function plugin_deactivation() {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				__( 'PayPal Payments plugin deactivated', 'paypal-payments' )
			);
		}
	}
}
