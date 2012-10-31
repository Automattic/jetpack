<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for Twenty Twelve and enqueue relevant styles.
 */

/**
 * Add theme support for infinity scroll
 */
function twenty_twelve_infinite_scroll_init() {
    add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'footer_widgets' => false
	) );
}
add_action( 'after_setup_theme', 'twenty_twelve_infinite_scroll_init' );

/**
 * Enqueue CSS stylesheet with theme styles for infinity.
 */
function twenty_twelve_infinite_scroll_enqueue_styles() {
    // Add theme specific styles.
    wp_enqueue_style( 'infinity-twentytwelve', plugins_url( 'twentytwelve.css', __FILE__ ), array( 'the-neverending-homepage' ), '20120817' );
}
add_action( 'wp_enqueue_scripts', 'twenty_twelve_infinite_scroll_enqueue_styles', 25 );