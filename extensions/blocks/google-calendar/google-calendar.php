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
		'attributes'      => array(
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
		'render_callback' => 'jetpack_google_calendar_block_load_assets',
	)
);

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array $attr Array containing the Google Calendar block attributes.
 * @return string
 */
function jetpack_google_calendar_block_load_assets( $attr ) {
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar">
	<amp-iframe src="${attr['url']}" frameborder="0" style="border:0" scrolling="no" width="${attr['width']}" height="${attr['height']}" sandbox="allow-scripts allow-same-origin" layout="responsive"></amp-iframe>
</div>
EOT;
	} else {
		return <<<EOT
<div class="wp-block-jetpack-google-calendar">
	<iframe src="${attr['url']}" frameborder="0" style="border:0" scrolling="no" width="${attr['width']}" height="${attr['height']}"></iframe>
</div>
EOT;
	}
}
