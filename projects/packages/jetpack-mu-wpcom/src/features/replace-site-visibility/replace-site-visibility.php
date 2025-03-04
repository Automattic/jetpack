<?php
/**
 * Replaces the 'Site Visibility' privacy options selector with a Calypso link.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load dependencies.
 */
require_once __DIR__ . '/../../utils.php';

/**
 * Whether the current site is connected to Jetpack.
 *
 * @return bool
 */
function is_jetpack_connected() {
	// @phan-suppress-next-line PhanUndeclaredClassMethod
	return class_exists( 'Jetpack' ) && Jetpack::is_connection_ready();
}

/**
 * Render the Site Visibility setting.
 *
 * @param string $site_slug The slug of the site.
 */
function render_site_visibility( $site_slug ) {
	ob_start();

	?>
		<p>
			<?php esc_html_e( 'Control who can view your site.', 'jetpack-mu-wpcom' ); ?>
			<a href="https://wordpress.com/support/privacy-settings/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more', 'jetpack-mu-wpcom' ); ?></a>
		</p>
		<ul>
			<li>
				<label>
					<input type="radio" name="blog_public" value="0" class="tog">
					<?php esc_html_e( 'Coming Soon', 'jetpack-mu-wpcom' ); ?>
				</label>
				<p class="description">
					<?php esc_html_e( 'Your site is hidden from visitors behind a "Coming Soon" notice until it is ready for viewing.', 'jetpack-mu-wpcom' ); ?>
				</p>
				<ul>
					<li>
						<p>
							<?php esc_html_e( 'Enable "Share site" to let collaborators without an account view your site.', 'jetpack-mu-wpcom' ); ?>
						</p>
						<label>
							<input type="checkbox">
							<?php esc_html_e( 'Share site', 'jetpack-mu-wpcom' ); ?>
						</label>
						<span class="copy-to-clipboard-container">
							<button type="button" class="button button-small copy-attachment-url" data-clipboard-target="#attachment-details-two-column-copy-link"><?php esc_html_e( 'Copy URL to clipboard', 'jetpack-mu-wpcom' ); ?></button>
							<span class="success hidden" aria-hidden="true"><?php esc_html_e( 'Copied!', 'jetpack-mu-wpcom' ); ?></span>
						</span>
						<p class="description">
							<?php esc_html_e( 'Anyone with the link can view your site.', 'jetpack-mu-wpcom' ); ?>
						</p>
					</li>
				</ul>
			</li>
			<li>
				<label>
					<input type="radio" name="blog_public" value="1" class="tog">
					<?php esc_html_e( 'Public', 'jetpack-mu-wpcom' ); ?>
				</label>
				<p class="description">
					<?php esc_html_e( 'Your site is visible to everyone.', 'jetpack-mu-wpcom' ); ?>
				</p>
				<ul>
					<li>
						<label>
							<input name="blog_public" type="checkbox" value="0" checked="checked">
							<?php esc_html_e( 'Discourage search engines from indexing this site', 'jetpack-mu-wpcom' ); ?>
						</label>
						<p class="description">
							<?php esc_html_e( 'This option does not block access to your site — it is up to search engines to honor your request.', 'jetpack-mu-wpcom' ); ?>
						</p>
					</li>
					<li>
						<label>
							<input name="wpcom_data_sharing_opt_out" type="checkbox" value="true">
							<?php sprintf( /* translators: %s: the slug of the site */ esc_html__( 'Prevent third-party sharing for %s', 'jetpack-mu-wpcom' ), $site_slug ); ?>
						</label>
						<p class="description">
							<?php esc_html_e( 'This option will prevent this site’s content from being shared with our licensed network of content and research partners, including those that train AI models.', 'jetpack-mu-wpcom' ); ?>
							<a href="https://wordpress.com/support/privacy-settings/make-your-website-public/#prevent-third-party-sharing" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more', 'jetpack-mu-wpcom' ); ?></a>
						</p>
					</li>
				</ul>
			</li>
			<li>
				<label>
					<input type="radio" name="blog_public" value="-1" class="tog">
					<?php esc_html_e( 'Private', 'jetpack-mu-wpcom' ); ?>
				</label>
				<p class="description">
					<?php esc_html_e( 'Your site is only visible to you and logged-in members you approve. Everyone else will see a log in screen.', 'jetpack-mu-wpcom' ); ?>
				</p>
			</li>
		</ul>
	<?php
	$html = ob_get_clean();
	return $html;
}

/**
 * Load assets
 */
function replace_site_visibility_load_assets() {
	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-replace-site-visibility', array( 'js', 'css' ) );

	$data = wp_json_encode(
		array(
			'siteId' => get_wpcom_blog_id(),
		)
	);

	wp_add_inline_script(
		$handle,
		"var JETPACK_MU_WPCOM_SITE_VISIBILITY = $data;",
		'before'
	);
}

/**
 * Replaces the 'Site Visibility' privacy options selector with a Calypso link.
 */
function replace_site_visibility() {
	// We are not either in Simple or Atomic.
	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return;
	}

	$jetpack_status = new Automattic\Jetpack\Status();
	$site_slug      = $jetpack_status->get_site_suffix();
	$current_screen = wpcom_admin_get_current_screen();

	if ( ! is_jetpack_connected() && $jetpack_status->is_private_site() ) {
		$settings_url = esc_url_raw( sprintf( '/wp-admin/admin.php?page=jetpack' ) );
		$manage_label = __( 'Jetpack is disconnected & site is private. Reconnect Jetpack to manage site visibility settings.', 'jetpack-mu-wpcom' );
	} elseif ( ! is_jetpack_connected() ) {
		return;
	} else {
		$settings_url = esc_url_raw( sprintf( 'https://wordpress.com/settings/general/%s#site-privacy-settings', $site_slug ) );

		// To prevent "Default + hold-out" users from redirecting to /wp-admin/options-general.php.
		// p1738634823404529/1738634703.754159-slack-CRWCHQGUB
		if ( in_array( $current_screen, WPCOM_DUPLICATED_VIEW, true ) && wpcom_is_duplicate_views_experiment_enabled() ) {
			$settings_url = esc_url_raw( sprintf( 'https://wordpress.com/sites/settings/site/%s', $site_slug ) );
		}

		$manage_label = __( 'Manage your privacy settings', 'jetpack-mu-wpcom' );
	}

	$escaped_content = '<a href="' . esc_url( $settings_url ) . '">' . esc_html( $manage_label ) . '</a>';
	$escaped_content = render_site_visibility( $site_slug );

	replace_site_visibility_load_assets();
	?>
<noscript>
<p><?php echo wp_json_encode( $escaped_content, JSON_HEX_TAG | JSON_HEX_AMP ); ?></p>
</noscript>
<script>
( function() {
	var widgetArea = document.querySelector( '.option-site-visibility td' );
	if ( ! widgetArea ) {
		return;
	}
	widgetArea.innerHTML = <?php echo wp_json_encode( $escaped_content, JSON_HEX_TAG | JSON_HEX_AMP ); ?>;
} )()
</script>
		<?php
}
add_action( 'blog_privacy_selector', 'replace_site_visibility' );
