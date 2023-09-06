<?php
/**
 * Domain-only sites Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-base-admin-menu.php';
require_once __DIR__ . '/class-wpcom-email-subscription-checker.php';

/**
 * Class Domain_Only_Admin_Menu.
 */
class Domain_Only_Admin_Menu extends Base_Admin_Menu {
	/**
	 * The `WPCOM_Email_Subscription_Checker` instance used to verify if a site has an email subscription.
	 *
	 * @var \WPCOM_Email_Subscription_Checker
	 */
	private $email_subscriptions_checker;

	/**
	 * Constructor that lets us pass in a WPCOM_Email_Subscription_Checker dependency.
	 *
	 * @param \WPCOM_Email_Subscription_Checker $email_subscriptions_checker The WPCOM_Email_Subscription_Checker instance.
	 */
	protected function __construct( $email_subscriptions_checker = null ) {
		parent::__construct();

		$this->email_subscriptions_checker = $email_subscriptions_checker;

		if ( empty( $this->email_subscriptions_checker ) ) {
			$this->set_email_subscription_checker( new \WPCOM_Email_Subscription_Checker() );
		}
	}

	/**
	 * This setter lets us inject an WPCOM_Email_Subscription_Checker instance.
	 *
	 * @param \WPCOM_Email_Subscription_Checker $email_subscriptions_checker An WPCOM_Email_Subscription_Checker instance.
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

		add_menu_page( esc_attr__( 'Manage Domain', 'jetpack' ), __( 'Manage Domain', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain . '/edit/' . $this->domain, null, 'dashicons-admin-settings' );

		if ( $this->email_subscriptions_checker->has_email() ) {
			add_menu_page( esc_attr__( 'Manage Email', 'jetpack' ), __( 'Manage Email', 'jetpack' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain . '/manage/' . $this->domain, null, 'dashicons-admin-settings' );
		}

		add_menu_page( esc_attr__( 'Manage Purchases', 'jetpack' ), __( 'Manage Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 'dashicons-cart' );
		add_menu_page( esc_attr__( 'Inbox', 'jetpack' ), __( 'Inbox', 'jetpack' ), 'manage_options', 'https://wordpress.com/inbox/' . $this->domain, null, 'dashicons-email' );

		$this->add_users_menu();
	}

	/**
	 * Add users menu
	 */
	public function add_users_menu() {
		add_menu_page( esc_attr__( 'Users', 'jetpack' ), __( 'Users', 'jetpack' ), 'list_users', 'https://wordpress.com/people/team/' . $this->domain, null, 'dashicons-admin-users' );

		$submenus_to_update = array(
			'profile.php' => 'https://wordpress.com/me',
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'users.php' ) ) {
			$submenus_to_update['users.php']    = 'https://wordpress.com/people/team/' . $this->domain;
			$submenus_to_update['user-new.php'] = 'https://wordpress.com/people/new/' . $this->domain;
		}

		$slug = current_user_can( 'list_users' ) ? 'users.php' : 'profile.php';
		$this->update_submenus( $slug, $submenus_to_update );

		add_submenu_page( 'users.php', esc_attr__( 'Add New', 'jetpack' ), __( 'Add New', 'jetpack' ), 'promote_users', 'https://wordpress.com/people/new/' . $this->domain, null, 1 );
		add_submenu_page( 'users.php', esc_attr__( 'Users', 'jetpack' ), __( 'Users', 'jetpack' ), 'list_users', 'https://wordpress.com/people/team' . $this->domain, null, 3 );
	}
}
