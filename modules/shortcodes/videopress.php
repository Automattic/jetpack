<?php
/**
 * Provides VideoPress videos support when module is disabled.
 *
 * @since 2.4
 * @since 3.9.5 Added compatibility with refactored VideoPress module.
 */

if ( ! Jetpack::is_module_active( 'videopress' ) ) {

	function jetpack_dns_prefetch( $urls, $relation_type ) {
		if( 'dns-prefetch' == $relation_type ) {
			$urls[] = '//v0.wordpress.com'; 
		}
		return $urls;
	}
	 add_filter( 'wp_resource_hints', 'jetpack_resource_hints', 10, 2 );
	
	include_once JETPACK__PLUGIN_DIR . 'modules/videopress/utility-functions.php';
	include_once JETPACK__PLUGIN_DIR . 'modules/videopress/shortcode.php';

}
