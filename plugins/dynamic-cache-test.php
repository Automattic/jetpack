<?php

/*
 * A function that uses the wpsc_cachedata filter to add a small message
 * and the current server time to every web page. The time increments
 * on every reload.
 *
 * On the Advanced Settings page enable "Enable dynamic caching".
 *
 * dynamic_cache_test_init()
 * This function is the first one to be called. This function hooks 
 * dynamic_cache_test_template() to the WordPress action, wp_footer.
 * This script is loaded before WordPress is and the add_action() 
 * function isn't defined at this time. 
 * This init function hooks onto the cache action "add_cacheaction"
 * that fires after WordPress (and add_action) is loaded.
 *
 *
 * dynamic_cache_test_template_tag()
 * This function hooks on to wp_footer and displays the secret template 
 * tag that will be replaced by our dynamic content on each page view.
 *
 *
 * dynamic_cache_test_filter()
 * This function hooks on to the filter through which all the cached data
 * sent to visitors is sent.
 * In this simple example the template tag is replaced by a html comment 
 * containing the text "Hello world at " and the current server time. 
 * If you want to use the output of a WordPress plugin or command you 
 * must enable "late init" on the settings page. Each time you reload 
 * the cached page this time will change. View the page source to examine 
 * this text.
 *
 * Plugin authors: NEVER define the template tag for your users. Make them 
 * choose one so it will be unique to their site.
 *
 * **** MAKE SURE YOU KEEP THE TEMPLATE TAG SECRET ****
 *
 */


/*
 * Uncomment the code below, enable dynamic caching on the Advanced Settings
 * page and clear the cache. 
 * Be sure to define DYNAMIC_CACHE_TEST_TAG too. Make it a random string
 * that will never appear on your website. In your own application this
 * tag can be whatever you like.
 */

/*
define( 'DYNAMIC_CACHE_TEST_TAG', '' ); // CHANGE THIS!
define( 'DYNAMIC_OUTPUT_BUFFER_TAG', '' ); // CHANGE THIS!

if ( DYNAMIC_CACHE_TEST_TAG == '' )
	return false;

// To use an output buffer when generating the dynamic section of your web page
// you must generate the HTML/JS/CSS and store it before the page is completed.
// That stored text is used by the wpsc_cachedata filter later when the same
// function is called again.
// You must also create a safety function. This function checks that your newly
// cached page is ready to be processed by the wpsc_cachedata filter. It's not
// required for already cached pages.
// See dynamic_output_buffer_test_safety() for an example. You must add this 
// to avoid the following error:
// "PHP Fatal error:  ob_start(): Cannot use output buffering in output buffering display handlers in..."
//
// Steps to run example plugin:
// 1. Add the DYNAMIC_OUTPUT_BUFFER_TAG text (as defined above) to your theme where the dynamic content should be.
// 2. Call dynamic_output_buffer_test() from your theme or an action like wp_footer
// 3. Clear all cached files.

function dynamic_output_buffer_test( &$cachedata = 0 ) {
	if ( defined( 'DYNAMIC_OB_TEXT' ) )
		return str_replace( DYNAMIC_OUTPUT_BUFFER_TAG, DYNAMIC_OB_TEXT, $cachedata );

	ob_start();
	// call the sidebar function, do something dynamic
	echo "<p>This is a test. The current time on the server is: " . date( 'H:i:s' ) . "</p>";
	$text = ob_get_contents();
	ob_end_clean();

	if ( $cachedata === 0 ) // called directly from the theme so store the output
		define( 'DYNAMIC_OB_TEXT', $text );
	else // called via the wpsc_cachedata filter. We only get here in cached pages in wp-cache-phase1.php
		return str_replace( DYNAMIC_OUTPUT_BUFFER_TAG, $text, $cachedata );

}
add_cacheaction( 'wpsc_cachedata', 'dynamic_output_buffer_test' );

function dynamic_output_buffer_test_safety( $safety ) {
	if ( defined( 'DYNAMIC_OB_TEXT' ) )
		return 1; // ready to replace tag with dynamic content.
	else
		return 0; // tag cannot be replaced.
}
add_cacheaction( 'wpsc_cachedata_safety', 'dynamic_output_buffer_test_safety' );

function dynamic_cache_test_filter( &$cachedata) {
	return str_replace( DYNAMIC_CACHE_TEST_TAG, "<!-- Hello world at " . date( 'H:i:s' ) . " -->", $cachedata );
}
add_cacheaction( 'wpsc_cachedata', 'dynamic_cache_test_filter' );

function dynamic_cache_test_template_tag() {
	echo DYNAMIC_CACHE_TEST_TAG; // This is the template tag
}

function dynamic_cache_test_init() {
	add_action( 'wp_footer', 'dynamic_cache_test_template_tag' );
}
add_cacheaction( 'add_cacheaction', 'dynamic_cache_test_init' );
*/
?>
