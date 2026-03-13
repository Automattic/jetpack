<?php
/**
 * Domain-only sites Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Domain_Only_Admin_Menu.
 */
class Domain_Only_Admin_Menu extends Base_Admin_Menu {
	/**
	 * The `WPCOM_Email_Subscription_Checker` instance used to verify if a site has an email subscription.
	 *
	 * @var WPCOM_Email_Subscription_Checker
	 */
	private $email_subscriptions_checker;

	/**
	 * Constructor that lets us pass in a WPCOM_Email_Subscription_Checker dependency.
	 *
	 * @param WPCOM_Email_Subscription_Checker $email_subscriptions_checker The WPCOM_Email_Subscription_Checker instance.
	 */
	protected function __construct( $email_subscriptions_checker = null ) {
		parent::__construct();

		$this->email_subscriptions_checker = $email_subscriptions_checker;

		if ( empty( $this->email_subscriptions_checker ) ) {
			$this->set_email_subscription_checker( new WPCOM_Email_Subscription_Checker() );
		}
	}

	/**
	 * This setter lets us inject an WPCOM_Email_Subscription_Checker instance.
	 *
	 * @param WPCOM_Email_Subscription_Checker $email_subscriptions_checker An WPCOM_Email_Subscription_Checker instance.
	 *
	 * @return void
	 */
	public function set_email_subscription_checker( $email_subscriptions_checker ) {
		$this->email_subscriptions_checker = $email_subscriptions_checker;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		global $menu, $submenu;

		$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Manage Domain', 'jetpack-masterbar' ), __( 'Manage Domain', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain . '/edit/' . $this->domain, null, 'dashicons-admin-settings' );

		if ( $this->email_subscriptions_checker->has_email() ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_menu_page( esc_attr__( 'Manage Email', 'jetpack-masterbar' ), __( 'Manage Email', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain . '/manage/' . $this->domain, null, 'dashicons-admin-settings' );
		}
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Manage Purchases', 'jetpack-masterbar' ), __( 'Manage Purchases', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 'dashicons-cart' );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'My Mailboxes', 'jetpack-masterbar' ), __( 'My Mailboxes', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/mailboxes/' . $this->domain, null, 'dashicons-email' );
	}
}
