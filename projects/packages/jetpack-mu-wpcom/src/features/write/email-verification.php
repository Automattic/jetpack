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
