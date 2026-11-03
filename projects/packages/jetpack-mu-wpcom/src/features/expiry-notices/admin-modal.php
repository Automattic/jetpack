<?php
/**
 * Wp-admin modal for plans that have expired, in grace or after it.
 *
 * Copy lives here rather than in the React that renders it, because this
 * package extracts PHP strings for translation and not JS.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Domain;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner;

/**
 * What the modal renders from, or null if it shouldn't show.
 *
 * Owners only: the modal exists to interrupt someone into acting, and an admin
 * who cannot renew has nothing to act on. The banner tells them why.
 *
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_admin_modal_data(): ?array {
	$state = wpcom_expiry_notices_eligible_state();
	if ( null === $state
		|| ! wpcom_expiry_notices_revert_applies_to_site( $state )
		|| ! Expiry_Notice_Dismiss::should_show_modal( $state )
		|| ! Expiry_Owner::current_user_is_owner( $state ) ) {
		return null;
	}

	$is_grace = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	$urls     = Expiry_Data::get_cta_urls( $state, wpcom_expiry_notices_current_url() );

	return array(
		'state'       => $state,
		'metaKey'     => Expiry_Notice_Dismiss::modal_meta_key( $state ),
		'title'       => wpcom_expiry_notices_expired_heading( $state ),
		'description' => $is_grace
			? __( 'Your site will be moved to the Free plan. We will also make these changes to your site:', 'jetpack-mu-wpcom' )
			: __( 'Your site has been moved to the Free plan and set to private. Contact support to get help restoring it.', 'jetpack-mu-wpcom' ),
		'listIntro'   => $is_grace ? '' : __( 'Here’s what changed:', 'jetpack-mu-wpcom' ),
		'items'       => wpcom_expiry_notices_modal_items( $is_grace ),
		'primary'     => $is_grace ? $urls['primary'] : wpcom_expiry_notices_support_cta( $state ),
		// Nothing to compare against once the site is already on Free.
		'secondary'   => $is_grace ? $urls['secondary'] : null,
		'imageUrl'    => plugins_url( 'images/plan-expired.svg', __FILE__ ),
	);
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
 * Enqueue the modal's JS/CSS.
 */
function wpcom_expiry_notices_enqueue_admin_modal_assets() {
	$data = wpcom_expiry_notices_admin_modal_data();
	if ( null === $data ) {
		return;
	}

	$state = $data['state'];
	unset( $data['state'] );
	$data['trackProps'] = wpcom_expiry_notices_track_props( $state, true, 'wp_admin' );

	// The bundle declares the components scripts but not their stylesheet.
	wp_enqueue_style( 'wp-components' );
	wpcom_expiry_notices_enqueue_surface( 'expiry-notices-admin-modal', 'wpcomExpiryModal', $data, 'expiry-notices-admin-modal' );
}
add_action( 'admin_enqueue_scripts', 'wpcom_expiry_notices_enqueue_admin_modal_assets' );

/**
 * Render the element the modal mounts into.
 */
function wpcom_expiry_notices_render_admin_modal_root() {
	if ( null === wpcom_expiry_notices_admin_modal_data() ) {
		return;
	}
	echo '<div id="wpcom-expiry-modal-root"></div>';
}
add_action( 'admin_footer', 'wpcom_expiry_notices_render_admin_modal_root' );
