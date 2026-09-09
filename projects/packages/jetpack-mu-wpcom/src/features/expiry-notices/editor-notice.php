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
	$surface = array(
		'site-editor' => 'site_editor',
		'widgets'     => 'widgets',
	)[ wpcom_expiry_notices_current_screen_id() ] ?? 'post_editor';

	return array(
		'metaKey'       => Expiry_Notice_Dismiss::META_BANNER,
		'content'       => wpcom_expiry_notices_banner_sentence( $state, $data['is_owner'] ),
		'primary'       => null === $urls ? null : $urls['primary'],
		'secondary'     => null !== $urls && Expiry_Data::STATE_EXPIRED_GRACE === $state['state'] ? $urls['secondary'] : null,
		'isDismissible' => $data['is_dismissible'],
		'surface'       => $surface,
		'trackProps'    => wpcom_expiry_notices_track_props( $state, $data['is_owner'], $surface ),
	);
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
	wpcom_expiry_notices_enqueue_surface( 'expiry-notices-editor-notice', 'wpcomExpiryEditorNotice', $data );
}
add_action( 'enqueue_block_editor_assets', 'wpcom_expiry_notices_enqueue_editor_notice_assets' );
