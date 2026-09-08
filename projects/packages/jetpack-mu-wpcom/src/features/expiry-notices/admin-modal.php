<?php
/**
 * Wp-admin modal for plans that have expired, in grace or after it.
 *
 * For sites that carry an Atomic transfer, which is not the same as sites that
 * are Atomic now -- see wpcom_expiry_notices_revert_applies_to_site(). Copy lives
 * here rather than in the React that renders it, because this package extracts
 * PHP strings for translation and not JS.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * Resolve the data the modal renders from, or null if it shouldn't show.
 * Shared by the enqueue and render hooks.
 *
 * @param bool $flush Drop the memo. For tests, which move the fixture under a
 *                    process that has already answered once.
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_admin_modal_data( bool $flush = false ): ?array {
	// Read twice per pageview -- once to enqueue, once to render -- and each read
	// costs a sticker lookup and a domain resolution. Distinct from null, which
	// is a real answer.
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

	if ( ! wpcom_expiry_notices_revert_applies_to_site( $state ) ) {
		return $memo;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_modal( $state ) ) {
		return $memo;
	}

	$meta_key = Expiry_Notice_Dismiss::modal_meta_key( $state );
	if ( null === $meta_key ) {
		return $memo;
	}

	$is_grace = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	$urls     = Expiry_Data::get_cta_urls( $state, wpcom_expiry_notices_current_admin_url() );

	$memo = array(
		'state'       => $state,
		'metaKey'     => $meta_key,
		'title'       => wpcom_expiry_notices_expired_heading( $state ),
		'description' => wpcom_expiry_notices_modal_description( $is_grace ),
		'listIntro'   => $is_grace ? '' : __( 'Here’s what changed:', 'jetpack-mu-wpcom' ),
		'items'       => wpcom_expiry_notices_modal_items( $is_grace ),
		'primary'     => wpcom_expiry_notices_modal_primary_cta( $state, $urls, $is_grace ),
		// Renewing is only one of two things to consider while the site is still
		// recoverable by paying for the same plan. Once it has been reverted the
		// only offer is to put it back, so there is nothing to compare.
		'secondary'   => $is_grace ? $urls['secondary'] : null,
		'imageUrl'    => plugins_url( 'images/plan-expired.svg', __FILE__ ),
	);

	return $memo;
}

/**
 * The paragraph under the title.
 *
 * @param bool $is_grace Whether the site is still inside the grace period.
 */
function wpcom_expiry_notices_modal_description( bool $is_grace ): string {
	if ( $is_grace ) {
		return __( 'Your site will be moved to the Free plan. We will also make these changes to your site:', 'jetpack-mu-wpcom' );
	}
	// Not "upgrade your plan": buying it again does not bring back what the
	// revert deleted, which is why the only button here goes to support.
	return __( 'Your site has been moved to the Free plan and set to private. Contact support to get help restoring it.', 'jetpack-mu-wpcom' );
}

/**
 * The listed changes, in the tense the site's state calls for.
 *
 * @param bool $is_grace Whether the site is still inside the grace period.
 * @return array<int,string>
 */
function wpcom_expiry_notices_modal_items( bool $is_grace ): array {
	$domain = Expiry_Domain::get_revert_domain();

	if ( $is_grace ) {
		$items = array();
		if ( null !== $domain ) {
			$items[] = sprintf(
				/* translators: %s is a WordPress.com domain name (e.g. example.wordpress.com). */
				__( 'Use %s as your primary domain.', 'jetpack-mu-wpcom' ),
				$domain
			);
		}
		$items[] = __( 'Remove your installed themes, plugins, and their data.', 'jetpack-mu-wpcom' );
		$items[] = __( 'Switch to the settings and theme you had before you upgraded.', 'jetpack-mu-wpcom' );
		$items[] = __( 'Your site will be set to private.', 'jetpack-mu-wpcom' );
		return $items;
	}

	$items = array( __( 'Your site is now private.', 'jetpack-mu-wpcom' ) );
	if ( null !== $domain ) {
		$items[] = sprintf(
			/* translators: %s is a WordPress.com domain name (e.g. example.wordpress.com). */
			__( 'Your primary domain was switched to %s.', 'jetpack-mu-wpcom' ),
			$domain
		);
	}
	$items[] = __( 'Your installed themes, plugins, and their data were removed from your site.', 'jetpack-mu-wpcom' );
	$items[] = __( 'Your settings and theme reverted to what you had before upgrading.', 'jetpack-mu-wpcom' );
	return $items;
}

/**
 * The primary CTA: renew while that still saves the site, support once it
 * doesn't.
 *
 * @param array<string,mixed> $state    Expiry state.
 * @param array<string,array> $urls     CTA URLs from Expiry_Data::get_cta_urls().
 * @param bool                $is_grace Whether the site is still inside the grace period.
 * @return array<string,string>
 */
function wpcom_expiry_notices_modal_primary_cta( array $state, array $urls, bool $is_grace ): array {
	return $is_grace ? $urls['primary'] : wpcom_expiry_notices_support_cta( $state );
}

/**
 * Enqueue + localize the modal's JS/CSS.
 */
function wpcom_expiry_notices_enqueue_admin_modal_assets() {
	$data = wpcom_expiry_notices_admin_modal_data();
	if ( null === $data ) {
		return;
	}

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'expiry-notices-admin-modal', array( 'js', 'css' ) );
	// Atomic wp-admin loads no Tracks transport of its own, so without this the
	// modal's events would accumulate in a plain array and be dropped on unload.
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts( $asset_handle );

	$state = $data['state'];
	unset( $data['state'] );

	wp_localize_script(
		$asset_handle,
		'wpcomExpiryModal',
		array_merge(
			$data,
			array( 'trackProps' => wpcom_expiry_notices_track_props( $state ) )
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_expiry_notices_enqueue_admin_modal_assets' );

/**
 * Render the element the modal mounts into.
 *
 * In the footer because the modal is an overlay: it belongs to the page rather
 * than to any position in it, and mounting late keeps it out of the way of the
 * admin notice area the banner uses.
 */
function wpcom_expiry_notices_render_admin_modal_root() {
	if ( null === wpcom_expiry_notices_admin_modal_data() ) {
		return;
	}
	echo '<div id="wpcom-expiry-modal-root"></div>';
}
add_action( 'admin_footer', 'wpcom_expiry_notices_render_admin_modal_root' );
