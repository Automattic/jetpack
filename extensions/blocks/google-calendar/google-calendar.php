<?php
/**
 * Google Calendar Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/google-calendar',
	array(
		'attributes'           => array(
			'url'    => array(
				'type' => 'string',
			),
			'width'  => array(
				'type'    => 'integer',
				'default' => 800,
			),
			'height' => array(
				'type'    => 'integer',
				'default' => 600,
			),
		),
		'render_callback'      => 'jetpack_google_calendar_block_load_assets',
		'version_requirements' => array(
			'wp'     => '5.4',
			'plugin' => '7.2',
		),
	)
);

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array $attr Array containing the Google Calendar block attributes.
 * @return string
 */
function jetpack_google_calendar_block_load_assets( $attr ) {
	$width  = isset( $attr['width'] ) ? $attr['width'] : '800';
	$height = isset( $attr['height'] ) ? $attr['height'] : '600';
	$url    = isset( $attr['url'] ) ? $attr['url'] : '';

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar">
	<amp-iframe src="${url}" frameborder="0" style="border:0" scrolling="no" width="${width}" height="${height}" sandbox="allow-scripts allow-same-origin" layout="responsive"></amp-iframe>
</div>
EOT;
	} else {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar">
	<iframe src="${url}" frameborder="0" style="border:0" scrolling="no" width="${width}" height="${height}"></iframe>
</div>
EOT;
	}
}
