<?php
/**
 * AI Launchpad Jetpack Social completion listener.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassReference, PhanUndeclaredClassMethod -- The Publicize Connections class ships in the Jetpack plugin, available at runtime on Atomic; calls are guarded by class_exists.
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad;
use Automattic\Jetpack\Publicize\Connections;

/**
 * Completes the AI-selected Jetpack Social tasks from wp-admin: `connect_social_media` /
 * `drive_traffic` complete once a Publicize connection exists.
 *
 * These catalog tasks have no `add_listener_callback` and there is no local "connection created" action on Atomic, so
 * this reconciles the local state when the AI Launchpad page loads. The page gate keeps the lookup off every other
 * admin page, and it only runs while a selected social task is still incomplete.
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
		// Only reconcile on the AI Launchpad page, keeping the Publicize connection lookup off every other admin page.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['page'] ) || AI_Launchpad::MENU_SLUG !== sanitize_key( wp_unslash( $_GET['page'] ) ) ) {
			return;
		}

		$ai_task_ids = wpcom_ai_launchpad_get_ai_task_ids();
		if ( empty( $ai_task_ids ) ) {
			return;
		}

		$task_lists = wpcom_launchpad_checklists();

		// connect_social_media / drive_traffic complete once a Publicize connection exists. connect_social_media
		// id-maps to drive_traffic, so we mark whichever the AI selected.
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
