<?php
/**
 * Block-editor notice for plans in their final week, in grace, or post-grace.
 *
 * Core hides legacy admin notices on block-editor screens, so the banner's
 * message is carried into the editor's own notices store instead.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * What the editor notice renders from, or null if it shouldn't show.
 *
 * The banner's own answer: an editor screen is never the Dashboard, so the
 * early reminder is already excluded.
 *
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_editor_notice_data(): ?array {
	$data = wpcom_expiry_notices_banner_data();
	if ( null === $data ) {
		return null;
	}

	$state   = $data['state'];
	$urls    = $data['urls'];
	$surface = wpcom_expiry_notices_editor_surface( wpcom_expiry_notices_current_screen_id() );

	return array(
		'metaKey'       => Expiry_Notice_Dismiss::META_BANNER,
		'content'       => sprintf(
			/* translators: %1$s is the notice heading (e.g. "Your plan has expired"), %2$s is the rest of the notice. */
			__( '%1$s. %2$s', 'jetpack-mu-wpcom' ),
			wpcom_expiry_notices_admin_banner_heading( $state ),
			wpcom_expiry_notices_banner_body( $state, $data['is_owner'] )
		),
		'primary'       => null === $urls ? null : $urls['primary'],
		'secondary'     => null !== $urls && Expiry_Data::STATE_EXPIRED_GRACE === $state['state'] ? $urls['secondary'] : null,
		'isDismissible' => $data['is_dismissible'],
		'surface'       => $surface,
		'trackProps'    => wpcom_expiry_notices_track_props( $state, $data['is_owner'], $surface ),
	);
}

/**
 * The Tracks `surface` naming the editor the notice showed in.
 *
 * @param string $screen_id Current screen id.
 */
function wpcom_expiry_notices_editor_surface( string $screen_id ): string {
	switch ( $screen_id ) {
		case 'site-editor':
			return 'site_editor';
		case 'widgets':
			return 'widgets';
		default:
			return 'post_editor';
	}
}

/**
 * Enqueue the editor notice's JS.
 *
 * The Customizer fires enqueue_block_editor_assets too but renders no store
 * notices, hence the positive screen check.
 */
function wpcom_expiry_notices_enqueue_editor_notice_assets() {
	if ( ! wpcom_expiry_notices_is_block_editor_screen() ) {
		return;
	}
	$data = wpcom_expiry_notices_editor_notice_data();
	if ( null === $data ) {
		return;
	}
	wpcom_expiry_notices_enqueue_surface( 'expiry-notices-editor-notice', 'wpcomExpiryEditorNotice', $data, array( 'js' ) );
}
add_action( 'enqueue_block_editor_assets', 'wpcom_expiry_notices_enqueue_editor_notice_assets' );
