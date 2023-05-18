<?php
/**
 * Reader related stats settings settings.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Stats\Settings;

/**
 * Renders the settings field for enabling/disabling post views in Reader.
 *
 * @return void
 */
function enabled_field_callback() {
	$is_enabled = get_option( 'wpcom_reader_views_enabled', true ); ?>
<input name="wpcom_reader_views_enabled" id="wpcom_reader_views_enabled" type="checkbox" value="1" <?php checked( $is_enabled ); ?>" />
<label for="wpcom_reader_views_enabled"><?php esc_html_e( 'Show post views in the WordPress.com Reader.', 'jetpack' ); ?></label>
	<?php
}

/**
 * Initialize the settings.
 *
 * @return void
 */
function init() {
	register_setting(
		'reading',
		'wpcom_reader_views_enabled',
		array(
			'type'         => 'boolean',
			'description'  => __( 'Show post views in the WordPress.com Reader.', 'jetpack' ),
			'show_in_rest' => true,
			'default'      => true,
		)
	);

	add_settings_field(
		'wpcom_reader_views_enabled',
		__( 'WordPress.com Reader', 'jetpack' ),
		__NAMESPACE__ . '\enabled_field_callback',
		'reading',
		'default'
	);
}

add_action( 'admin_init', __NAMESPACE__ . '\init' );
