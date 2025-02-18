<?php
/**
 * Override /wp-admin/options-general.php
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * The fiverr cta's DOM.
 */
function wpcom_fiverr_cta() {
	?>
	<div id="wpcom-fiverr-cta">
		<p><b><?php esc_html_e( 'Make an incredible logo in minutes', 'jetpack-mu-wpcom' ); ?></b></p>
		<p><?php esc_html_e( 'Pre-designed by top talent. Just add your touch.', 'jetpack-mu-wpcom' ); ?></p>
		<button class="wpcom-fiverr-cta-button button">
			<svg width="20" height="20" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="250" cy="250" r="177" fill="white"/>
				<path d="M500 250C500 111.93 388.07 0 250 0C111.93 0 0 111.93 0 250C0 388.07 111.93 500 250 500C388.07 500 500 388.07 500 250ZM360.42 382.5H294.77V237.2H231.94V382.5H165.9V237.2H128.45V183.45H165.9V167.13C165.9 124.54 198.12 95.48 246.05 95.48H294.78V149.22H256.93C241.62 149.22 231.95 157.58 231.95 171.12V183.45H360.43V382.5H360.42Z" fill="#1DBF73"/>
			</svg>
			<?php esc_html_e( 'Try Fiverr Logo Maker', 'jetpack-mu-wpcom' ); ?>
		</button>
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
	<a href="https://wordpress.com/sites/settings/site/<?php echo esc_attr( wpcom_get_site_slug() ); ?>">
		<?php esc_html_e( 'Manage site visibility, gift subscriptions, ownership, and other site tools on WordPress.com ↗', 'jetpack-mu-wpcom' ); ?>
	</a>
	<?php
}

/**
 * Add the link to the Site Management Panel on WordPress.com to the general settings page.
 */
function wpcom_site_management_panel() {
	$current_screen = wpcom_admin_get_current_screen();
	if ( in_array( $current_screen, WPCOM_DUPLICATED_VIEW, true ) && wpcom_is_duplicate_views_experiment_enabled() ) {
		add_settings_field( 'wpcom_site_management_panel_link', __( 'WordPress.com Site Settings', 'jetpack-mu-wpcom' ), 'wpcom_site_management_panel_link', 'general', 'default' );
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

	$site_slug           = wpcom_get_site_slug();
	$options_general_url = admin_url( 'options-general.php' );
	wp_add_inline_script(
		'wpcom-options-general',
		'window.wpcomSiteUrl = ' . wp_json_encode(
			array(
				'siteUrl'           => get_option( 'siteurl' ),
				'homeUrl'           => get_option( 'home' ),
				'siteSlug'          => $site_slug,
				'optionsGeneralUrl' => $options_general_url,
			)
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_options_general_assets' );
