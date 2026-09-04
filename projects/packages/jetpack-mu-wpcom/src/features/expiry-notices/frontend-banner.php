<?php
/**
 * Front-end banner for plans in their final week, in grace, or post-grace.
 * Admins only; visitors never see it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * Resolve the data needed to render the banner, or null if it shouldn't show.
 *
 * Memoized: the enqueue, body-class, and render hooks all ask per pageview,
 * and each read costs a user-meta lookup and a site-slug resolution.
 *
 * @param bool $flush Drop the memo. For tests, which move the fixture under a
 *                    process that has already answered once.
 * @return array{state:array,is_dismissible:bool,urls:array}|null
 */
function wpcom_expiry_notices_frontend_banner_data( bool $flush = false ): ?array {
	// Distinct from null, which is a real answer worth remembering.
	static $memo = false;

	if ( $flush ) {
		$memo = false;
		return null;
	}

	if ( false !== $memo ) {
		return $memo;
	}

	$memo  = null;
	$state = wpcom_expiry_notices_eligible_state();
	if ( null === $state ) {
		return $memo;
	}

	// The early reminder is a Dashboard-only nudge; the front-end has no
	// equivalent quiet corner for it.
	if ( wpcom_expiry_notices_is_early_warning( $state ) ) {
		return $memo;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return $memo;
	}

	$memo = array(
		'state'          => $state,
		'is_dismissible' => Expiry_Notice_Dismiss::is_dismissible( $state ),
		'urls'           => wpcom_expiry_notices_banner_urls( $state, wpcom_expiry_notices_current_frontend_url() ),
	);

	return $memo;
}

/**
 * The URL of the current front-end page, for checkout to send the user back to.
 * Transient query args are stripped so the return trip doesn't replay them.
 */
function wpcom_expiry_notices_current_frontend_url(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
	if ( '' === $request_uri ) {
		return home_url( '/' );
	}
	return home_url( remove_query_arg( wp_removable_query_args(), $request_uri ) );
}
