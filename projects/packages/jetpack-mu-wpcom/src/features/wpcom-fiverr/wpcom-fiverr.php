<?php
/**
 * Adds a fiverr logo maker cta to the general settings page
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue assets needed by the fiverr cta.
 */
function _wpcom_fiverr_enqueue_scripts() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-fiverr/wpcom-fiverr.asset.php';

	wp_enqueue_style(
		'wpcom-fiverr',
		plugins_url( 'build/wpcom-fiverr/wpcom-fiverr.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-fiverr/wpcom-fiverr.css' )
	);

	wp_enqueue_script(
		'wpcom-fiverr',
		plugins_url( 'build/wpcom-fiverr/wpcom-fiverr.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-fiverr/wpcom-fiverr.js' ),
		array(
			'strategy'  => 'defer',
			'in_footer' => false,
		)
	);
}
add_action( 'admin_enqueue_scripts', '_wpcom_fiverr_enqueue_scripts' );

/**
 * Add the fiverr cta to the general settings page.
 */
function _wpcom_fiverr() {
	add_settings_field( 'wpcom_fiverr_cta', '', '_wpcom_fiverr_cta', 'general', 'default' );
}
add_action( 'admin_init', '_wpcom_fiverr' );

/**
 * Display the fiverr cta on the general settings page.
 */
function _wpcom_fiverr_cta() {
	?>
	<tr class="wpcom-fiverr-cta">
		<th>
			<?php esc_html_e( 'Site Logo', 'jetpack-mu-wpcom' ); ?>
		</th>
		<td>
			<p><b><?php esc_html_e( 'Make an incredible logo in minutes', 'jetpack-mu-wpcom' ); ?></b></p>
			<p><?php esc_html_e( 'Pre-designed by top talent. Just add your touch.', 'jetpack-mu-wpcom' ); ?></p>
			<button class="wpcom-fiverr-cta-button button">
				<svg width="20" height="20" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="250" cy="250" r="177" fill="white"/>
					<path d="M500 250C500 111.93 388.07 0 250 0C111.93 0 0 111.93 0 250C0 388.07 111.93 500 250 500C388.07 500 500 388.07 500 250ZM360.42 382.5H294.77V237.2H231.94V382.5H165.9V237.2H128.45V183.45H165.9V167.13C165.9 124.54 198.12 95.48 246.05 95.48H294.78V149.22H256.93C241.62 149.22 231.95 157.58 231.95 171.12V183.45H360.43V382.5H360.42Z" fill="#1DBF73"/>
				</svg>
				<?php esc_html_e( 'Try Fiverr Logo Maker', 'jetpack-mu-wpcom' ); ?>
			</button>
		</td>
	</tr>
	<?php
}
