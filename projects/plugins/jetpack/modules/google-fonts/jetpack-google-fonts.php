<?php
/**
 * Module: Jetpack Google Fonts
 *
 * @package automattic/jetpack
 */

// Load the Jetpack_Google_Fonts class.
require __DIR__ . '/class-jetpack-google-fonts.php';

new Jetpack_Google_Fonts();

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
