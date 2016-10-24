<?php

/**
 * Module Name: Markdown
 * Module Description: Write posts or pages in plain-text Markdown syntax.
 * Sort Order: 31
 * First Introduced: 2.8
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: md, markdown
 */

include dirname( __FILE__ ) . '/markdown/easy-markdown.php';

// If the module is active, let's make this active for posting, period.
// Comments will still be optional.
add_filter( 'pre_option_' . WPCom_Markdown::POST_OPTION, '__return_true' );
function jetpack_markdown_posting_always_on() {
	// why oh why isn't there a remove_settings_field?
	global $wp_settings_fields;
	if ( isset( $wp_settings_fields['writing']['default'][ WPCom_Markdown::POST_OPTION ] ) ) {
		unset( $wp_settings_fields['writing']['default'][ WPCom_Markdown::POST_OPTION ] );
	}
}
add_action( 'admin_init', 'jetpack_markdown_posting_always_on', 11 );
