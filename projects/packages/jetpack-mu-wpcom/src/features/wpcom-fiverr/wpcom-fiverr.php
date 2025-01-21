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
function wpcom_fiverr_enqueue_scripts() {
	wp_enqueue_script(
		'wpcom-fiverr',
		plugins_url( 'build/wpcom-fiverr/wpcom-fiverr.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => false,
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_fiverr_enqueue_scripts' );

/**
 * Add the fiverr cta to the general settings page.
 */
function wpcom_fiverr() {
	add_settings_field( 'wpcom_fiverr_cta', '', 'wpcom_fiverr_cta', 'general', 'default' );
}
add_action( 'admin_init', 'wpcom_fiverr' );

/**
 * Display the fiverr cta on the general settings page.
 */
function wpcom_fiverr_cta() {
	?>
	<tr class="wpcom-fiverr-cta">
		<th>
			<?php echo esc_html__( 'Site Logo', 'jetpack-mu-wpcom' ); ?>
		</th>
		<td>
			<p><b>Make an incredible logo in minutes</b></p>
			<p>Pre-designed by top talent. Just add your touch.</p>
			<p>
				<button class="wpcom-fiverr-cta-button button">
					<svg width="20" height="20" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
						<circle cx="250" cy="250" r="177" fill="white"/>
						<path d="M500 250C500 111.93 388.07 0 250 0C111.93 0 0 111.93 0 250C0 388.07 111.93 500 250 500C388.07 500 500 388.07 500 250ZM360.42 382.5H294.77V237.2H231.94V382.5H165.9V237.2H128.45V183.45H165.9V167.13C165.9 124.54 198.12 95.48 246.05 95.48H294.78V149.22H256.93C241.62 149.22 231.95 157.58 231.95 171.12V183.45H360.43V382.5H360.42Z" fill="#1DBF73"/>
					</svg>
					Try Fiverr Logo Maker
				</button>
			</p>
		</td>
	</tr>
	<?php
}
