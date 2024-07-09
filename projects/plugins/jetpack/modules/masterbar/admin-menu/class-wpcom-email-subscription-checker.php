<?php
/**
 * A class that checks for the existence of email subscriptions for a user.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\WPCOM_Email_Subscription_Checker instead.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Masterbar\WPCOM_Email_Subscription_Checker as Masterbar_WPCOM_Email_Subscription_Checker;
/**
 * WPCOM_Email_Subscription_Checker
 */
class WPCOM_Email_Subscription_Checker {
	/**
	 * Checks if a user's site has an email subscription
	 *
	 * @deprecated 13.7
	 *
	 * @return bool
	 */
	public function has_email() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_Email_Subscription_Checker::has_email' );

		$email_subscriptions_checker_wrapper = new Masterbar_WPCOM_Email_Subscription_Checker();

		return $email_subscriptions_checker_wrapper->has_email();
	}
}
