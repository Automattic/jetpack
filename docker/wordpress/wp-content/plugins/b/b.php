<?php
/*
* Plugin Name: b
*/

use Jetpack\Assets\Logo;

require __DIR__ . '/vendor/autoload_packages.php';

add_action( 'plugins_loaded', function() {
	add_filter( 'the_content', function() {
		$logo = new Logo();
		return $logo->render();
	} );
} );
