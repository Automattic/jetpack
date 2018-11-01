<?php
/*
 * Load code specific to some Guternberg blocks
 * This file is special, and is not an actual `module` as such.
 * It is included by ./module-extras.php
 */

jetpack_register_block(
	'map',
	array(
		'render_callback' => 'jetpack_map_load_assets',
	)
);

function jetpack_map_load_assets( $attr, $content ) {
	$maps_dependencies = array(
		'wp-element',
		'wp-i18n',
		'wp-api-fetch',
	);
	Jetpack_Gutenberg::load_assets_as_required( 'map', $map_dependencies );
	return $content;
}
