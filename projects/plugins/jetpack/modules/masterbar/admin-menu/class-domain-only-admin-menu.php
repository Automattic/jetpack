<?php
/**
 * Domain-only sites Admin Menu file.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Masterbar\Domain_Only_Admin_Menu instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Domain_Only_Admin_Menu as Masterbar_Domain_Only_Admin_Menu;

/**
 * Class Domain_Only_Admin_Menu.
 */
class Domain_Only_Admin_Menu extends Masterbar_Domain_Only_Admin_Menu {
	/**
	 * This setter lets us inject an WPCOM_Email_Subscription_Checker instance.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param \WPCOM_Email_Subscription_Checker $email_subscriptions_checker An WPCOM_Email_Subscription_Checker instance.
	 *
	 * @return void
	 */
	public function set_email_subscription_checker( $email_subscriptions_checker ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\Domain_Only_Admin_Menu::set_email_subscription_checker' );
		parent::set_email_subscription_checker( $email_subscriptions_checker );
	}

	/**
	 * Create the desired menu output.
	 *
	 * @deprecated $$next-version$$
	 */
	public function reregister_menu_items() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\Domain_Only_Admin_Menu::reregister_menu_items' );
		parent::reregister_menu_items();
	}
}
