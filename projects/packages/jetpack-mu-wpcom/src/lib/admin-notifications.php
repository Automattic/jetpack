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
 * On Simple sites calls notes_send_callback directly.
 * On WoW/Atomic sites calls the wpcom/v2/site-notifications REST endpoint.
 * Gracefully no-ops when neither path is available.
 *
 * @param int    $recipient_id The user ID to notify.
 * @param string $type         Notification type identifier (e.g. 'rtc_collaborator_blocked').
 * @param array  $data         Arbitrary payload attached to the notification.
 * @param string $dedup_key    Deduplication key — repeat calls with the same key update the existing note.
 */
function wpcom_send_bell_notification( $recipient_id, $type, $data, $dedup_key ) {
	// Simple sites: call directly.
	if ( function_exists( 'notes_send_callback' ) ) {
		notes_send_callback(
			$recipient_id,
			$type,
			$data,
			$dedup_key,
			1,     // Mark as unread.
			false  // Allow updating existing note.
		);
		return;
	}

	// WoW/Atomic sites: call the wpcom REST endpoint.
	if ( ! class_exists( '\Automattic\Jetpack\Connection\Client' ) ) {
		return;
	}

	$blog_id = \Jetpack_Options::get_option( 'id' );
	if ( ! $blog_id ) {
		return;
	}

	\Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		sprintf( '/sites/%d/site-notifications', $blog_id ),
		'2',
		array(
			'method'  => 'POST',
			'headers' => array( 'content-type' => 'application/json' ),
		),
		wp_json_encode(
			array(
				'recipient_id' => $recipient_id,
				'type'         => $type,
				'data'         => $data,
				'dedup_key'    => $dedup_key,
			),
			JSON_UNESCAPED_SLASHES
		),
		'wpcom'
	);
}
