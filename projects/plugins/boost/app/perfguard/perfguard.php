<?php

// Load perfguard on the front-end via the admin bar
function perfguard_enqueue() {
	wp_enqueue_script( 'perfguard', plugins_url( 'perfguard.js', __FILE__ ), array( 'jquery' ), '1.0.0', true );
	wp_enqueue_style( 'perfguard', plugins_url( 'perfguard.css', __FILE__ ), array(), '1.0.0', 'all' );
}
add_action( 'wp_enqueue_scripts', 'perfguard_enqueue' );
