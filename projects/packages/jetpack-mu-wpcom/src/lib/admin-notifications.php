<?php
/**
 * Admin notification helpers.
 *
 * Generic functions for sending bell notifications and HTML emails
 * to WordPress.com users. Works on Simple and Atomic/WoW sites;
 * gracefully no-ops when platform APIs are unavailable.
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

/**
 * Send an HTML email notification.
 *
 * Uses wp_html_mail when available (Simple sites), falls back to wp_mail
 * with a temporary text/html content-type filter.
 *
 * @param string $to_email Recipient email address.
 * @param string $subject  Email subject line.
 * @param string $html     Full HTML email body.
 */
function wpcom_send_email_notification( $to_email, $subject, $html ) {
	$send = function_exists( 'wp_html_mail' ) ? 'wp_html_mail' : 'wp_mail';

	if ( 'wp_mail' === $send ) {
		add_filter( 'wp_mail_content_type', '_wpcom_email_html_content_type' );
	}

	call_user_func( $send, $to_email, $subject, $html );

	if ( 'wp_mail' === $send ) {
		remove_filter( 'wp_mail_content_type', '_wpcom_email_html_content_type' );
	}
}

/**
 * Return text/html content type for wp_mail.
 *
 * Internal callback — not part of the public API.
 *
 * @return string
 */
function _wpcom_email_html_content_type() {
	return 'text/html';
}

/**
 * Build a branded HTML email template.
 *
 * Produces a single-column email with a hero illustration, heading,
 * body text, and a prominent CTA button. Matches the WordPress.com
 * design system.
 *
 * @param string $hero_url  URL to the hero illustration image.
 * @param string $heading   Email heading / title.
 * @param string $body      Email body text (may contain HTML entities).
 * @param string $cta_url   URL for the CTA button.
 * @param string $cta_label Label for the CTA button.
 * @return string Full HTML email string.
 */
function wpcom_build_email_html( $hero_url, $heading, $body, $cta_url, $cta_label ) {
	$hero_url  = esc_url( $hero_url );
	$cta_url   = esc_url( $cta_url );
	$cta_label = esc_html( $cta_label );
	$heading   = esc_html( $heading );

	return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="409" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:409px;">
	<!-- Hero illustration -->
	<tr>
		<td style="padding:0;line-height:0;">
			<img src="{$hero_url}" alt="" width="409" style="width:100%;height:auto;display:block;border-radius:8px 8px 0 0;" />
		</td>
	</tr>
	<!-- Body -->
	<tr>
		<td style="padding:24px 32px 32px;">
			<h1 style="margin:0;font-size:20px;font-weight:600;line-height:1.3;color:#1e1e1e;">{$heading}</h1>
			<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#1e1e1e;">{$body}</p>
			<!-- CTA button -->
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
			<tr><td align="center">
				<a href="{$cta_url}" target="_blank" style="display:inline-block;width:100%;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;background-color:#3858e9;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">{$cta_label}</a>
			</td></tr>
			</table>
		</td>
	</tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
}
