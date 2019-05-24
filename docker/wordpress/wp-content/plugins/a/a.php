<?php
/*
* Plugin Name: a
*/

use Jetpack\Assets\Logo;

require __DIR__ . '/vendor/autoload.php';

add_action( 'plugins_loaded', function() {
	add_filter( 'the_content', function() {
		$logo = new Logo();
		return $logo->render();
	} );
} );
