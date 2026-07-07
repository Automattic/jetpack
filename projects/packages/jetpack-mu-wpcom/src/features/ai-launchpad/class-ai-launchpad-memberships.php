<?php
/**
 * AI Launchpad memberships completion override.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassMethod -- Jetpack_Memberships ships in the Jetpack plugin, available at runtime on Atomic; calls are guarded by class_exists.
 */

/**
 * Recomputes the memberships task completion from Jetpack_Memberships' local signals.
 *
 * The catalog's own callbacks are always false on Atomic (their membership settings return null there), so the REST
 * read path uses this instead. Jetpack_Memberships syncs the connected-account flag and membership plans down locally.
 */
class AI_Launchpad_Memberships {

	/**
	 * Membership tasks whose completion the AI Launchpad recomputes locally.
	 */
	const OVERRIDDEN_TASK_IDS = array(
		'stripe_connected',
		'set_up_payments',
		'paid_offer_created',
		'newsletter_plan_created',
	);

	/**
	 * Whether the AI Launchpad recomputes completion for the given task locally.
	 *
	 * @param string $task_id The catalog task ID.
	 * @return bool
	 */
	public static function has_override( $task_id ) {
		return in_array( $task_id, self::OVERRIDDEN_TASK_IDS, true );
	}

	/**
	 * Whether an overridden membership task is complete, from Jetpack_Memberships'
	 * local signals. Returns false for non-overridden tasks and when the memberships
	 * module is unavailable.
	 *
	 * @param string $task_id The catalog task ID.
	 * @return bool
	 */
	public static function is_task_complete( $task_id ) {
		if ( ! class_exists( 'Jetpack_Memberships' ) ) {
			return false;
		}

		switch ( $task_id ) {
			case 'stripe_connected':
			case 'set_up_payments':
				// A connected account means a payment method is set up; wpcom completes both on Stripe-connect.
				return (bool) Jetpack_Memberships::has_connected_account();
			case 'paid_offer_created':
				return (bool) Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments();
			case 'newsletter_plan_created':
				return (bool) Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments( 'newsletter' );
		}

		return false;
	}
}
