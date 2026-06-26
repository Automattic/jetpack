<?php
/**
 * AI Launchpad Jetpack Social completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassReference, PhanUndeclaredClassMethod -- The Publicize classes (Connections, Publicize_Utils) ship in the Jetpack plugin, available at runtime on Atomic; calls are guarded by class_exists.
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad;
use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\Publicize_Utils;

/**
 * Completes the Jetpack Social tasks from wp-admin when the AI Launchpad selected
 * them: `connect_social_media` / `drive_traffic` (a Publicize connection exists)
 * and `post_sharing_enabled` (the Publicize module is active).
 *
 * These catalog tasks have no `add_listener_callback` and complete in Calypso
 * only, so a wp-admin launchpad never ticks them. Jetpack Social runs locally,
 * so the real state is readable — but there is no local "connection created"
 * action on Atomic (connections are created through a proxied wpcom request).
 * This reconciles when the AI Launchpad page loads: the gate keeps the Publicize
 * connection lookup off every other admin page, and the per-task completion
 * check short-circuits once a task is done, so the lookup only runs while a
 * selected social task is still incomplete.
 */
class AI_Launchpad_Social_Listener {

	/**
	 * Hooks the reconciliation onto admin_init.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_init', array( __CLASS__, 'maybe_complete_social_tasks' ) );
	}

	/**
	 * Completes the AI-selected Jetpack Social tasks whose local signal is now true.
	 *
	 * @return void
	 */
	public static function maybe_complete_social_tasks() {
		// Only reconcile on the AI Launchpad page itself — that is where completion
		// must show, and it keeps the Publicize connection lookup off every other
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

		// post_sharing_enabled completes once the Publicize module is active.
		if (
			in_array( 'post_sharing_enabled', $ai_task_ids, true )
			&& ! $task_lists->is_task_id_complete( 'post_sharing_enabled' )
			&& class_exists( Publicize_Utils::class )
			&& Publicize_Utils::is_publicize_active()
		) {
			wpcom_mark_launchpad_task_complete( 'post_sharing_enabled' );
		}

		// connect_social_media / drive_traffic complete once a Publicize connection
		// exists. connect_social_media id-maps to drive_traffic, so completing
		// either writes the same status; we mark whichever the AI selected.
		$connection_tasks = array_filter(
			array( 'connect_social_media', 'drive_traffic' ),
			static function ( $task_id ) use ( $ai_task_ids, $task_lists ) {
				return in_array( $task_id, $ai_task_ids, true ) && ! $task_lists->is_task_id_complete( $task_id );
			}
		);

		if ( empty( $connection_tasks ) || ! class_exists( Connections::class ) ) {
			return;
		}

		$connections = Connections::get_all();
		if ( ! is_array( $connections ) || empty( $connections ) ) {
			return;
		}

		foreach ( $connection_tasks as $task_id ) {
			wpcom_mark_launchpad_task_complete( $task_id );
		}
	}
}

AI_Launchpad_Social_Listener::register();
