<?php
/**
 * Write — email-verification launch gate.
 *
 * Backs the post-publish checklist's inline "confirm your email to launch" step.
 * The blocked state is computed here and passed into the overlay at render time
 * (see post-publish-checklist.php) rather than fetched over REST, because a wpcom
 * Simple site serves no REST API at its own hostname — a same-origin status fetch
 * would 404 and silently fail open.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether the current user's site launch must be blocked pending email verification.
 *
 * Mirrors wpcom's launch_blocked_for_unverified_email() so the overlay can't
 * disagree with the back-end launch gate: only Write On sites
 * (`site_creation_flow = 'write-on'`) are gated, and only when the launching
 * user's email is unverified. Email_Verification is a WordPress.com-side class;
 * when it's absent (non-wpcom context) nothing is blocked, so the overlay fails
 * open to the plain launch redirect.
 *
 * @return bool True when launch should be blocked.
 */
function wpcom_write_launch_blocked_for_unverified_email() {
	if ( ! class_exists( 'Email_Verification' ) ) {
		return false;
	}

	// Exact match: `site_creation_flow` is reused by many flows.
	if ( 'write-on' !== get_option( 'site_creation_flow' ) ) {
		return false;
	}

	return Email_Verification::is_email_unverified();
}

/**
 * Nonce action shared by the checklist's resend and re-check ajax endpoints.
 */
const WPCOM_WRITE_EMAIL_VERIFICATION_NONCE = 'wpcom_write_email_verification';

/**
 * Admin-ajax: resend the current user's email-verification message.
 *
 * The post-publish checklist's "confirm your email" step calls this so the author
 * can re-request the verification email without leaving the page. admin-ajax is the
 * transport because a wpcom Simple site serves no REST API at its own hostname.
 *
 * Logged-in only (registered on `wp_ajax_`, not `wp_ajax_nopriv_`); Email_Verification
 * is a WordPress.com-side class, so off-wpcom this fails closed rather than fatally.
 *
 * @return void
 */
function wpcom_write_ajax_resend_verification_email() {
	check_ajax_referer( WPCOM_WRITE_EMAIL_VERIFICATION_NONCE, 'nonce' );

	if ( ! class_exists( 'Email_Verification' ) ) {
		wp_send_json_error( array( 'message' => 'unavailable' ), 400, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	// @phan-suppress-next-line PhanUndeclaredStaticMethod -- class_exists guarded above; resend_verification_email() isn't in the generated wpcom stub, unlike is_email_unverified().
	Email_Verification::resend_verification_email();

	wp_send_json_success( null, 200, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
}
add_action( 'wp_ajax_wpcom_write_resend_verification_email', 'wpcom_write_ajax_resend_verification_email' );

/**
 * Admin-ajax: report whether the current user's email is now verified.
 *
 * Lets the "confirm your email" step re-check status after the author clicks the
 * verification link out-of-band, so a user who has verified isn't trapped and one
 * who hasn't can't slip past to the launch flow. wpcom's verify_email() clears the
 * cached user attribute when the link is clicked, so a fresh request reads current
 * state without this endpoint reaching into that cache.
 *
 * @return void
 */
function wpcom_write_ajax_check_email_verification() {
	check_ajax_referer( WPCOM_WRITE_EMAIL_VERIFICATION_NONCE, 'nonce' );

	if ( ! class_exists( 'Email_Verification' ) ) {
		wp_send_json_error( array( 'message' => 'unavailable' ), 400, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	}

	wp_send_json_success( array( 'verified' => ! Email_Verification::is_email_unverified() ), 200, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
}
add_action( 'wp_ajax_wpcom_write_check_email_verification', 'wpcom_write_ajax_check_email_verification' );
