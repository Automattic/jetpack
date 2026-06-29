<?php
/**
 * AI Launchpad memberships completion override.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassMethod -- Jetpack_Memberships ships in the Jetpack plugin, available at runtime on Atomic; calls are guarded by class_exists.
 */

/**
 * Recomputes the memberships task completion from Jetpack_Memberships' local
 * signals, which the AI Launchpad REST read path uses instead of the catalog's
 * own `is_complete_callback`s for these tasks.
 *
 * The catalog computes these from `wpcom_launchpad_get_membership_settings()`,
 * which returns null under `IS_ATOMIC`, so `wpcom_launchpad_is_stripe_connected`
 * / `wpcom_launchpad_has_paid_membership_plans` are always false on Atomic — and
 * because those callbacks recompute (ignoring any stored option), an
 * option-writing listener could not surface them. The real state is readable
 * locally on Atomic, though: Jetpack_Memberships syncs the connected-account
 * flag down as a site option and mirrors membership plans as the local
 * `jp_mem_plan` CPT. This reads those instead.
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
				// Stripe connected = a payment method is set up; wpcom completes both
				// on Stripe-connect (memberships/connected-accounts.php).
				return (bool) Jetpack_Memberships::has_connected_account();
			case 'paid_offer_created':
				return (bool) Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments();
			case 'newsletter_plan_created':
				return (bool) Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments( 'newsletter' );
		}

		return false;
	}
}
