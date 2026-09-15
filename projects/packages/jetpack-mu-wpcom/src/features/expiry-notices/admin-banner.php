<?php
/**
 * Wp-admin banner notice for plans approaching expiry, in grace, or post-grace.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * What the banner renders from, or null if it shouldn't show.
 *
 * Not on block-editor screens: core hides admin notices there, the editor
 * notice carries the message, and the script would still count an impression.
 *
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_admin_banner_data(): ?array {
	return wpcom_expiry_notices_is_block_editor_screen() ? null : wpcom_expiry_notices_banner_data();
}

/**
 * Enqueue the banner's JS/CSS on admin_enqueue_scripts so the stylesheet lands in <head>.
 */
function wpcom_expiry_notices_enqueue_admin_banner_assets() {
	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}
	wpcom_expiry_notices_enqueue_surface(
		'expiry-notices-banner',
		'wpcomExpiryBanner',
		array(
			'metaKey'    => Expiry_Notice_Dismiss::banner_meta_key(),
			'trackProps' => wpcom_expiry_notices_track_props( $data['state'], $data['is_owner'], 'wp_admin' ),
		),
		'expiry-notices-admin-banner'
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_expiry_notices_enqueue_admin_banner_assets' );

/**
 * Render the banner on admin_notices.
 */
function wpcom_expiry_notices_render_admin_banner() {
	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}

	$state          = $data['state'];
	$urls           = $data['urls'];
	$is_dismissible = $data['is_dismissible'];
	$notice_class   = $data['is_early_warning'] ? 'notice-warning' : 'notice-error';
	$is_grace       = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	?>
	<div id="wpcom-expiry-banner" class="notice <?php echo esc_attr( $notice_class ); ?>" data-wpcom-expiry-banner>
		<p><strong><?php echo esc_html( wpcom_expiry_notices_banner_heading( $state ) ); ?></strong></p>
		<p><?php echo esc_html( wpcom_expiry_notices_banner_body( $state, $data['is_owner'] ) ); ?></p>
		<?php if ( null !== $urls || $is_dismissible ) : ?>
			<p class="wpcom-expiry-banner__actions">
				<?php if ( null !== $urls ) : ?>
					<?php wpcom_expiry_notices_render_cta_link( $urls['primary'], 'primary', 'button button-primary' ); ?>
					<?php if ( $is_grace ) : ?>
						<?php wpcom_expiry_notices_render_cta_link( $urls['secondary'], 'secondary', 'button' ); ?>
					<?php endif; ?>
				<?php endif; ?>
				<?php if ( $is_dismissible ) : ?>
					<button type="button" class="button wpcom-expiry-banner__dismiss" data-wpcom-expiry-dismiss>
						<?php esc_html_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>
					</button>
				<?php endif; ?>
			</p>
		<?php endif; ?>
	</div>
	<?php
}
add_action( 'admin_notices', 'wpcom_expiry_notices_render_admin_banner' );
