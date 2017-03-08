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

/**
 * Markdown should be enabled for posts whenever the module is active.
 * We don't need any additional checkbox in Settings > Writing for that option.
 *
 * In addition to the filter above, the option is also automatically set when
 * the Markdown module is activated, thanks to the jetpack_activate_module_markdown filter.
 *
 * @see https://github.com/Automattic/jetpack/pull/6548
 */

// Step 1. Force the option on whenever this file is loaded (i.e. when the module is acive).
add_filter( 'pre_option_' . WPCom_Markdown::POST_OPTION, '__return_true' );

/**
 * Step 2: remove checkbox set in modules/markdown/easy-markdown.php.
 * We don't just remove the register_setting call there because the checkbox is
 * needed on WordPress.com, where the file is sync'ed verbatim.
 */
function jetpack_markdown_posting_always_on() {
	// why oh why isn't there a remove_settings_field?
	global $wp_settings_fields;
	if ( isset( $wp_settings_fields['writing']['default'][ WPCom_Markdown::POST_OPTION ] ) ) {
		unset( $wp_settings_fields['writing']['default'][ WPCom_Markdown::POST_OPTION ] );
	}
}
add_action( 'admin_init', 'jetpack_markdown_posting_always_on', 11 );
