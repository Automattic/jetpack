<?php
/**
 * AI Launchpad subscriber-count completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad;

/**
 * Completes the AI-selected subscriber-count tasks from wp-admin: `subscribers_added` /
 * `import_subscribers` (at least one email subscriber) and `add_10_email_subscribers` (at least ten).
 *
 * The catalog completes these in Calypso only, or via a helper that returns 0 on Atomic, so this reconciles the real
 * count via `fetch_subscriber_counts()` when the AI Launchpad page loads. The page gate keeps the lookup off every
 * other admin page, and it only runs while a selected subscriber task is still incomplete.
 */
class AI_Launchpad_Subscribers_Listener {

	/**
	 * Tasks that complete once the site has at least one email subscriber.
	 *
	 * `import_subscribers` id-maps to `subscribers_added`, so we mark whichever the AI selected.
	 */
	const SUBSCRIBERS_ADDED_TASKS = array( 'subscribers_added', 'import_subscribers' );

	/**
	 * Email subscriber count required to complete `add_10_email_subscribers`.
	 */
	const FIRST_TEN_TARGET = 10;

	/**
	 * Hooks the reconciliation onto admin_init.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_init', array( __CLASS__, 'maybe_complete_subscriber_tasks' ) );
	}

	/**
	 * Completes the AI-selected subscriber-count tasks whose threshold the site's
	 * email subscriber count now meets.
	 *
	 * @return void
	 */
	public static function maybe_complete_subscriber_tasks() {
		// Only reconcile on the AI Launchpad page, keeping the remote call off every other admin page.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['page'] ) || AI_Launchpad::MENU_SLUG !== sanitize_key( wp_unslash( $_GET['page'] ) ) ) {
			return;
		}

		$ai_task_ids = wpcom_ai_launchpad_get_ai_task_ids();
		if ( empty( $ai_task_ids ) ) {
			return;
		}

		$task_lists = wpcom_launchpad_checklists();

		$added_tasks = array_filter(
			self::SUBSCRIBERS_ADDED_TASKS,
			static function ( $task_id ) use ( $ai_task_ids, $task_lists ) {
				return in_array( $task_id, $ai_task_ids, true ) && ! $task_lists->is_task_id_complete( $task_id );
			}
		);

		$first_ten_pending = in_array( 'add_10_email_subscribers', $ai_task_ids, true )
			&& ! $task_lists->is_task_id_complete( 'add_10_email_subscribers' );

		// Nothing selected-and-incomplete: skip the remote call.
		if ( empty( $added_tasks ) && ! $first_ten_pending ) {
			return;
		}

		$count = static::get_email_subscriber_count();
		if ( null === $count ) {
			return;
		}

		if ( $count > 0 ) {
			foreach ( $added_tasks as $task_id ) {
				wpcom_mark_launchpad_task_complete( $task_id );
			}
		}

		if ( $first_ten_pending && $count >= self::FIRST_TEN_TARGET ) {
			wpcom_mark_launchpad_task_complete( 'add_10_email_subscribers' );
		}
	}

	/**
	 * The site's email subscriber count, retrieved on Atomic via Jetpack's `fetch_subscriber_counts()`.
	 *
	 * @return int|null The email subscriber count, or null when it cannot be retrieved.
	 */
	protected static function get_email_subscriber_count() {
		if ( ! function_exists( '\Automattic\Jetpack\Extensions\Subscriptions\fetch_subscriber_counts' ) ) {
			return null;
		}

		$counts = \Automattic\Jetpack\Extensions\Subscriptions\fetch_subscriber_counts();

		// Treat a 'failed' status as unknown rather than zero, so a transient failure never sticks.
		if ( isset( $counts['status'] ) && 'failed' === $counts['status'] ) {
			return null;
		}

		if ( ! isset( $counts['value']['email_subscribers'] ) ) {
			return null;
		}

		return (int) $counts['value']['email_subscribers'];
	}
}

AI_Launchpad_Subscribers_Listener::register();
