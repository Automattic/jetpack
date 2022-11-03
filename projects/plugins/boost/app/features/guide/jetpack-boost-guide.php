<?php

// Load guide on the front-end via the admin bar
function jetpack_boost_guide_scripts() {
	wp_enqueue_script( 'guide', plugins_url( 'dist/guide.js', __FILE__ ), array( 'jquery' ), '1.0.0', true );
	wp_enqueue_style( 'guide', plugins_url( 'dist/guide.css', __FILE__ ), array(), '1.0.0', 'all' );
}
add_action( 'wp_enqueue_scripts', 'jetpack_boost_guide_scripts' );
