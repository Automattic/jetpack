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
 * Resolve the data the editor notice renders from, or null if it shouldn't show.
 *
 * The banner's own answer: an editor screen is never the Dashboard, so the
 * early reminder is already excluded.
 *
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_editor_notice_data(): ?array {
	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return null;
	}

	$state  = $data['state'];
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

	return array(
		'metaKey'       => Expiry_Notice_Dismiss::META_BANNER,
		'content'       => sprintf(
			/* translators: %1$s is the notice heading (e.g. "Your plan has expired"), %2$s is the rest of the notice. */
			__( '%1$s. %2$s', 'jetpack-mu-wpcom' ),
			wpcom_expiry_notices_admin_banner_heading( $state ),
			wpcom_expiry_notices_admin_banner_body( $state )
		),
		'primary'       => $data['urls']['primary'],
		'secondary'     => Expiry_Data::STATE_EXPIRED_GRACE === $state['state'] ? $data['urls']['secondary'] : null,
		'isDismissible' => $data['is_dismissible'],
		'context'       => wpcom_expiry_notices_editor_context( $screen ? $screen->id : '' ),
		'trackProps'    => wpcom_expiry_notices_track_props( $state ),
	);
}

/**
 * The Tracks `context` naming the editor the notice showed in.
 *
 * @param string $screen_id Current screen id.
 */
function wpcom_expiry_notices_editor_context( string $screen_id ): string {
	switch ( $screen_id ) {
		case 'site-editor':
			return 'site-editor';
		case 'widgets':
			return 'widgets';
		default:
			return 'post-editor';
	}
}

/**
 * Enqueue the editor notice's JS with its data inlined.
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

	// Not wp_localize_script(), which casts every top-level scalar to a string
	// and would hand the client "" for a false `isDismissible`.
	$json = wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_HEX_APOS );
	if ( false === $json ) {
		return;
	}

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'expiry-notices-editor-notice', array( 'js' ) );
	// Atomic wp-admin loads no Tracks transport of its own, so without this the
	// notice's events would accumulate in a plain array and be dropped on unload.
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts( $asset_handle );
	wp_add_inline_script( $asset_handle, 'window.wpcomExpiryEditorNotice = ' . $json . ';', 'before' );
}
add_action( 'enqueue_block_editor_assets', 'wpcom_expiry_notices_enqueue_editor_notice_assets' );
