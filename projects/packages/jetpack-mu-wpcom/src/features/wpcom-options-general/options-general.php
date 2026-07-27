<?php
/**
 * Override /wp-admin/options-general.php
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Normalize a site logo value to a positive attachment ID.
 *
 * The value may hold an attachment ID, a legacy `array( 'id' => ... )`, or a WP_Error,
 * so anything that is not a positive scalar resolves to 0.
 *
 * @param mixed $value The raw site_logo option or custom_logo theme mod value.
 * @return int A positive attachment ID, or 0 when none is usable.
 */
function wpcom_normalize_site_logo_id( $value ) {
	if ( is_array( $value ) && isset( $value['id'] ) ) {
		$value = $value['id'];
	}
	return ( is_scalar( $value ) && (int) $value > 0 ) ? (int) $value : 0;
}

/**
 * Resolve the URL for editing the current site logo.
 *
 * Block themes use the Site Editor's Identity screen; classic themes use the
 * Customizer control matching their logo support (mirroring the logo-tool feature).
 * The URL is empty when no reliable destination exists, so callers can omit the link.
 *
 * @return array{url:string, is_block:bool} The edit URL and block-theme flag.
 */
function wpcom_site_logo_edit_link() {
	if ( wp_is_block_theme() ) {
		// The Identity screen shipped in Gutenberg 22.8 / WordPress 7.1; omit the
		// link when it is unavailable.
		$has_identity = defined( 'GUTENBERG_VERSION' )
			? version_compare( GUTENBERG_VERSION, '22.8', '>=' )
			: version_compare( get_bloginfo( 'version' ), '7.1', '>=' );

		return array(
			'url'      => $has_identity ? admin_url( 'site-editor.php?p=%2Fidentity' ) : '',
			'is_block' => true,
		);
	}

	if ( current_theme_supports( 'custom-logo' ) ) {
		$url = admin_url( 'customize.php?autofocus[control]=custom_logo' );
	} elseif ( current_theme_supports( 'site-logo' ) ) {
		$url = admin_url( 'customize.php?autofocus[control]=site_logo' );
	} else {
		$url = '';
	}

	return array(
		'url'      => $url,
		'is_block' => false,
	);
}

/**
 * The Fiverr logo-maker CTA button's DOM.
 */
function wpcom_fiverr_cta_button() {
	?>
	<button class="wpcom-fiverr-cta-button button" type="button">
		<svg width="20" height="20" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="250" cy="250" r="177" fill="white"/>
			<path d="M500 250C500 111.93 388.07 0 250 0C111.93 0 0 111.93 0 250C0 388.07 111.93 500 250 500C388.07 500 500 388.07 500 250ZM360.42 382.5H294.77V237.2H231.94V382.5H165.9V237.2H128.45V183.45H165.9V167.13C165.9 124.54 198.12 95.48 246.05 95.48H294.78V149.22H256.93C241.62 149.22 231.95 157.58 231.95 171.12V183.45H360.43V382.5H360.42Z" fill="#1DBF73"/>
		</svg>
		<?php esc_html_e( 'Try Fiverr Logo Maker', 'jetpack-mu-wpcom' ); ?>
	</button>
	<?php
}

/**
 * The fiverr cta's DOM.
 */
function wpcom_fiverr_cta() {
	// Core keeps the site_logo option and custom_logo theme mod in sync; read either.
	$logo_id = wpcom_normalize_site_logo_id( get_option( 'site_logo' ) );
	if ( ! $logo_id ) {
		$logo_id = wpcom_normalize_site_logo_id( get_theme_mod( 'custom_logo' ) );
	}

	$logo_img = '';
	if ( $logo_id ) {
		// Fall back to the site title when the logo has no alt text, so the preview
		// is still announced to assistive technology.
		$logo_alt = trim( wp_strip_all_tags( (string) get_post_meta( $logo_id, '_wp_attachment_image_alt', true ) ) );
		if ( '' === $logo_alt ) {
			$site_name = get_bloginfo( 'name' );
			$logo_alt  = $site_name
				/* translators: %s: The site title. */
				? sprintf( __( 'Current site logo for %s', 'jetpack-mu-wpcom' ), $site_name )
				: __( 'Current site logo', 'jetpack-mu-wpcom' );
		}
		// Request a proportional size, not a square, so wide logos aren't shown as a
		// center-cropped thumbnail; CSS caps the dimensions.
		$logo_img = wp_get_attachment_image(
			$logo_id,
			'medium',
			false,
			array(
				'class' => 'wpcom-site-logo-preview-image',
				'alt'   => $logo_alt,
			)
		);
	}
	?>
	<div id="wpcom-fiverr-cta">
		<?php if ( $logo_img ) : ?>
			<div class="wpcom-site-logo">
				<div class="wpcom-site-logo-preview">
					<?php echo $logo_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_get_attachment_image() returns escaped markup. ?>
				</div>
				<?php wpcom_fiverr_cta_button(); ?>
			</div>
			<?php
			$logo_edit_link = wpcom_site_logo_edit_link();
			// Only promise an edit path when a known destination exists.
			if ( $logo_edit_link['url'] ) :
				?>
				<p class="description">
					<?php
					if ( $logo_edit_link['is_block'] ) {
						printf(
							/* translators: %1$s: opening link tag to the Site Editor, %2$s: closing link tag. */
							esc_html__( 'Displays in your site\'s layout via the Site Logo block. %1$sYou can change your site logo in the site editor%2$s.', 'jetpack-mu-wpcom' ),
							'<a href="' . esc_url( $logo_edit_link['url'] ) . '">',
							'</a>'
						);
					} else {
						printf(
							/* translators: %1$s: opening link tag to the Customizer, %2$s: closing link tag. */
							esc_html__( '%1$sYou can change your site logo in the Customizer%2$s.', 'jetpack-mu-wpcom' ),
							'<a href="' . esc_url( $logo_edit_link['url'] ) . '">',
							'</a>'
						);
					}
					?>
				</p>
				<?php
			endif;
			?>
		<?php else : ?>
			<p><b><?php esc_html_e( 'Make an incredible logo in minutes', 'jetpack-mu-wpcom' ); ?></b></p>
			<p><?php esc_html_e( 'Pre-designed by top talent. Just add your touch.', 'jetpack-mu-wpcom' ); ?></p>
			<?php wpcom_fiverr_cta_button(); ?>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * Add the fiverr cta to the general settings page.
 */
function wpcom_fiverr() {
	add_settings_field( 'wpcom_fiverr_cta', __( 'Site Logo', 'jetpack-mu-wpcom' ), 'wpcom_fiverr_cta', 'general', 'default' );
}
add_action( 'load-options-general.php', 'wpcom_fiverr' );

/**
 * DOM for the link to the Site Management Panel on WordPress.com.
 */
function wpcom_site_management_panel_link() {
	?>
	<a href="https://wordpress.com/sites/<?php echo esc_attr( wpcom_get_site_slug() ); ?>/settings">
		<?php esc_html_e( 'Manage gift subscriptions, ownership, and other site tools on WordPress.com ↗', 'jetpack-mu-wpcom' ); ?>
	</a>
	<?php
}

/**
 * Add the link to the Site Management Panel on WordPress.com to the general settings page.
 */
function wpcom_site_management_panel() {
	$current_screen = wpcom_admin_get_current_screen();
	if ( in_array( $current_screen, WPCOM_DUPLICATED_VIEW, true ) ) {
		add_settings_field( 'wpcom_site_management_panel_link', __( 'WordPress.com Site Settings', 'jetpack-mu-wpcom' ), 'wpcom_site_management_panel_link', 'general' );
	}
}
add_action( 'load-options-general.php', 'wpcom_site_management_panel' );

/**
 * Display the site URL in General Settings on Simple Classic sites.
 */
function wpcom_enqueue_options_general_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-options-general/wpcom-options-general.asset.php';

	wp_enqueue_style(
		'wpcom-options-general',
		plugins_url( 'build/wpcom-options-general/wpcom-options-general.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-options-general/wpcom-options-general.css' )
	);

	wp_enqueue_script(
		'wpcom-options-general',
		plugins_url( 'build/wpcom-options-general/wpcom-options-general.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-options-general/wpcom-options-general.js' ),
		true
	);
	wp_set_script_translations( 'wpcom-options-general', 'jetpack-mu-wpcom' );
	$site_slug           = wpcom_get_site_slug();
	$options_general_url = admin_url( 'options-general.php' );
	wp_add_inline_script(
		'wpcom-options-general',
		'window.wpcomSiteUrl = ' . wp_json_encode(
			array(
				'siteUrl'           => get_site_url(),
				'homeUrl'           => home_url(),
				'siteSlug'          => $site_slug,
				'optionsGeneralUrl' => $options_general_url,
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_options_general_assets' );
