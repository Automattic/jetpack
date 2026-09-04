<?php
/**
 * Sitewide plan-expiry notices: shared infrastructure loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// @codeCoverageIgnoreStart
require_once __DIR__ . '/class-expiry-data.php';
require_once __DIR__ . '/class-expiry-domain.php';
require_once __DIR__ . '/class-expiry-notice-dismiss.php';
// @codeCoverageIgnoreEnd

// @codeCoverageIgnoreStart -- shadowed by the test stub in tests/lib/functions-wordpress.php.
if ( ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
	/**
	 * Source of purchase data for the expiry-notices feature. Pre-definable
	 * by a test mu-plugin without redeclaring `wpcom_get_site_purchases()`
	 * (which has no `function_exists` guard upstream and would fatal).
	 *
	 * @return array
	 *
	 * @phan-suppress PhanRedefineFunction -- phan sees both this and the test stub as definitions even though only one loads at runtime.
	 */
	function wpcom_expiry_get_purchases() {
		if ( function_exists( 'wpcom_get_site_purchases' ) ) {
			return wpcom_get_site_purchases();
		}
		return array();
	}
}
// @codeCoverageIgnoreEnd

/**
 * Whether the new expiry notices are switched on for this site.
 *
 * The rollout that gated this is finished, so the answer is yes unless something
 * says otherwise. Kept as a function rather than inlined because it is the one
 * predicate both halves of the swap read: the notices themselves, and the
 * suppression of the ones they replace -- wpcomsh's Atomic banner here, and the
 * legacy plan-renew prompt on the WordPress.com side. They must never disagree,
 * or a site ends up showing both notices or neither.
 */
function wpcom_expiry_notices_is_enabled_for_site(): bool {
	/**
	 * Filters whether the new expiry notices are enabled for this site.
	 *
	 * Both the new notices and the suppression of the ones they replace read
	 * this, so overriding it moves the whole swap together. Left in place after
	 * the rollout as the way to hold a single site back.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled    Whether the site is on the new expiry notices.
	 * @param int  $percentage Share of sites the rollout targets. Always 100 now
	 *                         that it is complete; passed so that callbacks
	 *                         declaring both parameters keep working.
	 */
	return (bool) apply_filters( 'wpcom_expiry_notices_enabled', true, 100 );
}

/**
 * The expiry state this user should be shown something about, or null.
 *
 * The audience test every surface shares. Memoized because several hooks reach
 * it per admin pageview -- each surface enqueues and renders -- and nothing can
 * change the answer mid-request.
 *
 * @param bool $flush Drop the memo. For tests, which move the purchase fixture
 *                    under a process that has already answered once.
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_eligible_state( bool $flush = false ): ?array {
	// Distinct from null, which is a real answer worth remembering.
	static $memo = false;

	if ( $flush ) {
		$memo = false;
		return null;
	}

	if ( false !== $memo ) {
		return $memo;
	}

	$memo = null;

	if ( ! current_user_can( 'manage_options' ) ) {
		return $memo;
	}

	// Excluded to match the Simple notice this replaces. Guarded because
	// `wpcom_is_vip()` only exists on wpcom.
	if ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) {
		return $memo;
	}

	$state = \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::get_expiry_state();
	if ( null === $state || \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::STATE_ACTIVE === $state['state'] ) {
		return $memo;
	}

	$memo = $state;
	return $memo;
}

/**
 * The "Your {plan} plan has expired" heading, shared by the banner and the modal.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_expired_heading( array $state ): string {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';

	// Every stage has a variant without the plan name, for the rare purchase
	// whose slug the Plans package can't resolve to a short name.
	if ( '' === $plan ) {
		return __( 'Your plan has expired', 'jetpack-mu-wpcom' );
	}

	return sprintf(
		/* translators: %s is the plan name (e.g. Business). */
		__( 'Your %s plan has expired', 'jetpack-mu-wpcom' ),
		$plan
	);
}

/**
 * Whether the revert this feature describes applies to this site, now.
 *
 * Past the grace period this waits on the sticker rather than the date, because
 * the revert runs off the subscription-removal record and can lag the state by
 * days. Before then the changes are still ahead, which only Atomic faces.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_revert_applies_to_site( array $state ): bool {
	if ( \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::STATE_EXPIRED === ( $state['state'] ?? '' ) ) {
		return wpcom_has_blog_sticker( 'blog-transfer-reverted', get_wpcom_blog_id() );
	}

	return \Automattic\Jetpack\Constants::is_true( 'IS_ATOMIC' );
}

/**
 * The CTA a reverted site gets, pointing at support rather than checkout.
 *
 * Buying the plan again does not undo the revert, so only support can help with
 * what the notice says was lost. `url` is the fallback for a click the Help
 * Center could not answer.
 *
 * @param array<string,mixed> $state Expiry state.
 * @return array{label:string,url:string,message:string}
 */
function wpcom_expiry_notices_support_cta( array $state ): array {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';

	if ( '' === $plan ) {
		$message = __( 'My plan expired and I need your help getting it restored.', 'jetpack-mu-wpcom' );
	} else {
		$message = sprintf(
			/* translators: %s is the plan name (e.g. Business). */
			__( 'My %s plan expired and I need your help getting it restored.', 'jetpack-mu-wpcom' ),
			$plan
		);
	}

	return array(
		'label'   => __( 'Contact support', 'jetpack-mu-wpcom' ),
		// Where the Help Center package itself sends people when it cannot open
		// in place, so a click still lands somewhere useful without its bundle.
		'url'     => 'https://wordpress.com/help?help-center=home',
		'message' => $message,
	);
}

/**
 * The Tracks props every surface's events carry.
 *
 * @param array<string,mixed> $state Expiry state.
 * @return array{state:string,days_remaining:int,product_slug:string}
 */
function wpcom_expiry_notices_track_props( array $state ): array {
	return array(
		'state'          => (string) ( $state['state'] ?? '' ),
		'days_remaining' => isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0,
		'product_slug'   => isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '',
	);
}

/**
 * Whether the current screen is a block editor: post editor, site editor, or
 * block widgets.
 */
function wpcom_expiry_notices_is_block_editor_screen(): bool {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	return $screen ? $screen->is_block_editor() : false;
}

/**
 * Load the wp-admin banner, modal, and editor notice, unless something has held
 * this site back.
 *
 * On `init` rather than at file load. This file is required on `plugins_loaded`,
 * and every hook any surface registers fires later still, so waiting keeps the
 * requires off the bootstrap at no cost.
 */
function wpcom_expiry_notices_maybe_load_admin_banner() {
	if ( is_admin() && wpcom_expiry_notices_is_enabled_for_site() ) {
		require_once __DIR__ . '/admin-banner.php';
		require_once __DIR__ . '/admin-modal.php';
		require_once __DIR__ . '/editor-notice.php';
	}
}
add_action( 'init', 'wpcom_expiry_notices_maybe_load_admin_banner' ); // @codeCoverageIgnore

/**
 * Register the dismiss meta keys. Gated on admin / REST so we don't pay the
 * register_meta cost on every front-end request.
 */
function wpcom_expiry_notices_register_meta() {
	if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	if ( ! wpcom_expiry_notices_is_enabled_for_site() ) {
		return;
	}
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss::register_user_meta();
}
add_action( 'init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore
// `init` alone never registers these on a REST request: WP defines REST_REQUEST
// in rest_api_loaded() on `parse_request`, which fires after `init`, so the
// guard above bails and the write silently no-ops -- the endpoint drops an
// unregistered meta key and still answers 200. Every dismissal arrives over
// REST, so without this hook none of them persist.
add_action( 'rest_api_init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore

/**
 * Build the full URL of the current admin page so checkout can redirect back.
 * Strips transient query args (`settings-updated`, `_wpnonce`, etc.) so the
 * redirected user doesn't re-trigger one-shot admin notices or hit stale
 * nonces on return.
 */
function wpcom_expiry_notices_current_admin_url(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
	if ( '' === $request_uri ) {
		return admin_url();
	}
	$request_uri = remove_query_arg( wp_removable_query_args(), $request_uri );
	$admin_path  = preg_replace( '#^/?wp-admin/?#', '', $request_uri );
	return admin_url( ltrim( $admin_path, '/' ) );
}
