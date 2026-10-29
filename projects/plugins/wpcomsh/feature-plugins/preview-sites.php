<?php
/**
 * Preview sites: unpaid sites in WordPress.com's preview funnel.
 *
 * @package wpcomsh
 */

/**
 * Whether this site is an unpaid preview: WordPress.com sets WPCOM_IS_PREVIEW_SITE in Atomic persistent
 * data while a preview is unpaid and removes it when it is bought.
 *
 * Reads persistent data, which is a file on the site, never the database. A site with purchases is never a
 * preview, even if the mark outlived the purchase because its removal failed.
 *
 * @return bool
 */
function wpcomsh_is_preview_site() {
	$persistent_data = new Atomic_Persistent_Data();
	if ( ! $persistent_data->WPCOM_IS_PREVIEW_SITE ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName
		return false;
	}

	return ! ( function_exists( 'wpcom_get_site_purchases' ) && wpcom_get_site_purchases() );
}

/**
 * Prints the preview banner at the top of an unpaid preview site.
 *
 * Visitors who came in through a share link learn it is a preview, so it can't stand in for a bought site.
 * The owner is asked to choose a plan to keep it. Anyone can dismiss it for themselves, in their browser.
 * Share-link detection is Coming Soon's, which only loads while Coming Soon is on.
 *
 * @return void
 */
function wpcomsh_preview_site_banner() {
	if ( ! wpcomsh_is_preview_site() || isset( $_COOKIE['wpcom_preview_banner_dismissed'] ) ) {
		return;
	}

	$share_code = function_exists( 'A8C\FSE\Coming_soon\get_share_code' ) ? A8C\FSE\Coming_soon\get_share_code() : '';
	if ( $share_code && A8C\FSE\Coming_soon\is_accessed_by_valid_share_link( $share_code ) ) {
		$link = sprintf(
			'<a href="%s" target="_blank" rel="noopener">%s</a>',
			esc_url( 'https://wordpress.com/hosting/?utm_source=share_link_preview&utm_medium=referral&utm_campaign=preview_site_banner' ),
			esc_html__( 'WordPress.com hosting ↗', 'wpcomsh' )
		);
		/* translators: %s: link to WordPress.com hosting. */
		$message = sprintf( esc_html__( 'This is a preview site, powered by %s', 'wpcomsh' ), $link );
	} elseif ( current_user_can( 'manage_options' ) ) {
		$link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( 'https://wordpress.com/plans/' . wp_parse_url( home_url(), PHP_URL_HOST ) . '?utm_source=preview_site&utm_medium=banner' ),
			esc_html__( 'Choose a plan to keep it ↗', 'wpcomsh' )
		);
		/* translators: %s: link to choose a plan for this site. */
		$message = sprintf( esc_html__( 'This is a preview site. %s', 'wpcomsh' ), $link );
	} else {
		return;
	}
	?>
	<div id="wpcomsh-preview-site-banner" class="wp-exclude-emoji" style="display:flex;align-items:center;gap:8px;padding:2px 32px;background:#3858e9;color:#fff;font:14px/1.4 -apple-system,system-ui,BlinkMacSystemFont,sans-serif;">
		<p style="margin:14px 0;color:inherit;">
			<?php echo $message; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above. ?>
		</p>
		<button type="button" aria-label="<?php esc_attr_e( 'Dismiss', 'wpcomsh' ); ?>" style="margin-left:auto;background:none;border:0;color:inherit;font-size:24px;line-height:1;cursor:pointer;" onclick="document.cookie='wpcom_preview_banner_dismissed=1;path=/;max-age=31536000';this.parentNode.remove();">&times;</button>
	</div>
	<style>#wpcomsh-preview-site-banner a{color:#fff;text-decoration:underline;text-underline-offset:4px}#wpcomsh-preview-site-banner a:hover{text-decoration:none}</style>
	<?php
}
add_action( 'wp_body_open', 'wpcomsh_preview_site_banner' );
