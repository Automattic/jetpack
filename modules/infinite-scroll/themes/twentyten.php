<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for @Twenty Ten and enqueue relevant styles.
 */

/**
 * Add theme support for infinity scroll
 */
function jetpack_twentyten_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'render'         => 'jetpack_twentyten_infinite_scroll_render',
		'footer'         => 'wrapper',
		'footer_widgets' => array(
			'first-footer-widget-area',
			'second-footer-widget-area',
			'third-footer-widget-area',
			'fourth-footer-widget-area',
		),
	) );
}
add_action( 'init', 'jetpack_twentyten_infinite_scroll_init' );

/**
 * Set the code to be rendered on for calling posts,
 * hooked to template parts when possible.
 *
 * Note: must define a loop.
 */
function jetpack_twentyten_infinite_scroll_render() {
	get_template_part( 'loop' );
}

/**
 * Enqueue CSS stylesheet with theme styles for infinity.
 */
function jetpack_twentyten_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) ) {
		// Add theme specific styles.
		wp_enqueue_style( 'infinity-twentyten', plugins_url( 'twentyten.css', __FILE__ ), array( 'the-neverending-homepage' ), '20121002' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentyten_infinite_scroll_enqueue_styles', 25 );
