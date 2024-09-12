<?php
/**
 * Media Library Private Site CDN Notice
 *
 * @package wpcomsh
 **/

/**
 * If site is private we add a notice to the media library explaining we disable the Jetpack
 * module 'photon-cdn' on private sites which results in broken media library thumbnails.
 *
 * @see private-site.php
 **/
function wpcomsh_media_library_private_site_cdn_notice() {
	global $pagenow;
	if ( 'upload.php' === $pagenow && defined( 'AT_PRIVACY_MODEL' ) && 'wp_uploads' === AT_PRIVACY_MODEL ) {
		$message = sprintf(
			/* translators: Message explaining why image thumbnails may not display */
			__(
				'The image CDN is disabled because your site is marked Private. If image thumbnails do not display in your Media Library, you can switch to Coming Soon mode.  <a href="%1$s" target=_blank>Learn more</a>.',
				'wpcomsh'
			),
			esc_url(
				'https://wordpress.com/support/settings/privacy-settings/'
			)
		);

		printf(
			'<div class="notice wpcomsh-notice">
				<span class="notice__icon-wrapper notice__icon-wrapper-pink">
					<span class="dashicons dashicons-warning"></span>
				</span>
				<span class="notice__content">
					<span class="notice__text">%s</span>
				</span>
			</div>',
			wp_kses_post( $message )
		);
	}
}
add_action( 'admin_notices', 'wpcomsh_media_library_private_site_cdn_notice' );
