<?php
/**
 * Admin notification helpers.
 *
 * Generic functions for sending notifications to WordPress.com users.
 * Works on Simple and Atomic/WoW sites; gracefully no-ops when
 * platform APIs are unavailable.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Send a WordPress.com bell notification.
 *
 * Wraps notes_send_callback (available on Simple sites). Gracefully
 * no-ops when the function is unavailable (Atomic / self-hosted).
 *
 * @param int    $recipient_id The user ID to notify.
 * @param string $type         Notification type identifier (e.g. 'rtc_collaborator_blocked').
 * @param array  $data         Arbitrary payload attached to the notification.
 * @param string $dedup_key    Deduplication key — repeat calls with the same key update the existing note.
 */
function wpcom_send_bell_notification( $recipient_id, $type, $data, $dedup_key ) {
	if ( ! function_exists( 'notes_send_callback' ) ) {
		return;
	}

	notes_send_callback(
		$recipient_id,
		$type,
		$data,
		$dedup_key,
		1,     // Mark as unread.
		false  // Allow updating existing note.
	);
}
