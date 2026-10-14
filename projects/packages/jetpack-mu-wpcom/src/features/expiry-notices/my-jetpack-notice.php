<?php
/**
 * My Jetpack notice for plans in their final week, in grace, or post-grace.
 *
 * Jetpack screens hide admin notices, so the banner's message is carried into
 * My Jetpack's own notices instead.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * Enqueue the script that hands the notice to My Jetpack's notices filter.
 */
function wpcom_expiry_notices_enqueue_my_jetpack_notice_assets() {
	$filter = wpcom_expiry_notices_my_jetpack_notices_filter();
	$data   = null === $filter ? null : wpcom_expiry_notices_banner_data();
	if ( null === $data ) {
		return;
	}

	$state = $data['state'];
	$urls  = $data['urls'];
	wpcom_expiry_notices_enqueue_surface(
		'expiry-notices-my-jetpack-notice',
		'wpcomExpiryMyJetpackNotice',
		array(
			'filter'        => $filter,
			'metaKey'       => Expiry_Notice_Dismiss::banner_meta_key(),
			'title'         => wpcom_expiry_notices_banner_heading( $state ),
			'message'       => wpcom_expiry_notices_banner_body( $state, $data['is_owner'] ),
			'primary'       => null === $urls ? null : $urls['primary'],
			'secondary'     => null === $urls ? null : $urls['secondary'],
			'isDismissible' => $data['is_dismissible'],
			'trackProps'    => wpcom_expiry_notices_track_props( $state, $data['is_owner'], 'my_jetpack' ),
		)
	);
}
add_action( 'myjetpack_enqueue_scripts', 'wpcom_expiry_notices_enqueue_my_jetpack_notice_assets' );
