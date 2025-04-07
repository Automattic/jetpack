<?php
/**
 * Registers settings fields to options-general.php for a4a sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load dependencies.
 */
require_once __DIR__ . '/../../utils.php';

/**
 * Render the Agency settings.
 */
function a4a_render_agency_settings() {
	if ( is_wpcom_agency_dev_site() ) {
		$description = sprintf(
			wp_kses(
				/* translators: Placeholder is a link to a support document. */
				__( 'Clients can\'t access the <a href="%1$s" target="_blank" rel="noopener noreferrer">WordPress.com Help Center ↗</a> or <a href="%2$s" target="_blank" rel="noopener noreferrer">hosting features ↗</a> on development sites. You may configure access after the site is launched.', 'jetpack-mu-wpcom' ),
				array(
					'a' => array(
						'href'   => array(),
						'target' => array(),
						'rel'    => array(),
					),
				)
			),
			esc_url( 'https://wordpress.com/support/help-support-options/#how-to-contact-us' ),
			esc_url( 'https://developer.wordpress.com/docs/developer-tools/web-server-settings/' )
		);

		?>
		<p class="description">
			<?php echo $description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we escape things above. ?>
			<a href="<?php echo esc_url( 'https://agencieshelp.automattic.com/knowledge-base/free-development-licenses-for-wordpress-com-hosting/' ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more', 'jetpack-mu-wpcom' ); ?></a>.
		</p>
		<?php
	} else {
		$is_fully_managed_agency_site_label = sprintf(
			wp_kses(
				/* translators: Placeholder is a link to a support document. */
				__( 'Allow clients to use the <a href="%1$s" target="_blank" rel="noopener noreferrer">WordPress.com Help Center ↗</a> and <a href="%2$s" target="_blank" rel="noopener noreferrer">hosting features ↗</a>.', 'jetpack-mu-wpcom' ),
				array(
					'a' => array(
						'href'   => array(),
						'target' => array(),
						'rel'    => array(),
					),
				)
			),
			esc_url( 'https://wordpress.com/support/help-support-options/#how-to-contact-us' ),
			esc_url( 'https://developer.wordpress.com/docs/developer-tools/web-server-settings/' )
		);

		$is_fully_managed_agency_site_value = checked( is_fully_managed_agency_site(), true, false );

		?>
		<fieldset id="a4a-agency-settings">
			<legend class="screen-reader-text"><?php esc_html_e( 'Agency settings', 'jetpack-mu-wpcom' ); ?></legend>
			<label for="is_fully_managed_agency_site">
				<input name="is_fully_managed_agency_site" type="checkbox" value="1" <?php echo $is_fully_managed_agency_site_value; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we escape things above. ?> />
				<?php echo $is_fully_managed_agency_site_label; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we escape things above. ?>
			</label>
		</fieldset>
		<?php
	}
}

/**
 * Register a4a settings fields.
 */
function a4a_register_options_general_fields() {
	add_settings_field(
		'a4a-settings',
		__( 'Agency settings', 'jetpack-mu-wpcom' ),
		'a4a_render_agency_settings',
		'general'
	);
}
add_action( 'load-options-general.php', 'a4a_register_options_general_fields' );

/**
 * Register a4a allowed options.
 *
 * @param array $allowed_options The allowed options list.
 * @return array
 */
function a4a_register_allowed_options( $allowed_options ) {
	$new_options = array(
		'general' => array( 'is_fully_managed_agency_site' ),
	);

	$allowed_options = add_allowed_options( $new_options, $allowed_options );

	return $allowed_options;
}
add_filter( 'allowed_options', 'a4a_register_allowed_options' );
