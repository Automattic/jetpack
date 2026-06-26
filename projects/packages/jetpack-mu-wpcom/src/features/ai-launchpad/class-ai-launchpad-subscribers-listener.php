<?php
/**
 * AI Launchpad subscriber-count completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad;

/**
 * Completes the subscriber-count tasks from wp-admin when the AI Launchpad
 * selected them: `subscribers_added` / `import_subscribers` (the site has at
 * least one email subscriber) and `add_10_email_subscribers` (at least ten).
 *
 * The catalog completes these in Calypso only (an option write on import-start)
 * or via `wpcom_launchpad_get_newsletter_subscriber_count`, which hard-requires
 * `IS_WPCOM` and so returns 0 on Atomic. But the real count is retrievable on
 * Atomic through `fetch_subscriber_counts()` — the same `jetpack.fetchSubscriberCounts`
 * call Jetpack's Subscribe block already makes there. This reconciles when the
 * AI Launchpad page loads: the page gate keeps the lookup off every other admin
 * page, and the per-task completion check short-circuits once a task is done, so
 * the lookup only runs while a selected subscriber task is still incomplete.
 */
class AI_Launchpad_Subscribers_Listener {

	/**
	 * Tasks that complete once the site has at least one email subscriber.
	 * `import_subscribers` id-maps to `subscribers_added`, so completing either
	 * writes the same status; we mark whichever the AI selected.
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
		// Only reconcile on the AI Launchpad page itself — that is where completion
		// must show, and it keeps the remote subscribers/stats call off every other
		// admin page.
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

		// Nothing selected-and-incomplete: skip the remote call entirely.
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
	 * The site's email subscriber count, retrieved on Atomic via Jetpack's
	 * `fetch_subscriber_counts()` (the Subscribe block's `jetpack.fetchSubscriberCounts`
	 * path, transient-cached). The blog-token `subscribers/stats` REST endpoint is
	 * not reliably reachable here, so this uses the proven counts path instead.
	 *
	 * @return int|null The email subscriber count, or null when it cannot be retrieved.
	 */
	protected static function get_email_subscriber_count() {
		if ( ! function_exists( '\Automattic\Jetpack\Extensions\Subscriptions\fetch_subscriber_counts' ) ) {
			return null;
		}

		$counts = \Automattic\Jetpack\Extensions\Subscriptions\fetch_subscriber_counts();

		// On Atomic the helper reports a 'failed' status when the wpcom call errored;
		// treat that as unknown rather than zero so a transient failure never sticks.
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
