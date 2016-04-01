<?php
/**
 * Provides VideoPress videos support when module is disabled.
 *
 * @since 2.4
 * @since 3.9.5 Added compatibility with refactored VideoPress module.
 */

if ( ! Jetpack::is_module_active( 'videopress' ) ) {

	Jetpack::dns_prefetch( array(
		'//v0.wordpress.com',
	) );

	/**
	 * We won't have any videos less than sixty pixels wide. That would be silly.
	 */
	define( 'VIDEOPRESS_MIN_WIDTH', 60 );

	include_once JETPACK__PLUGIN_DIR . 'modules/videopress/utility-functions.php';
	include_once JETPACK__PLUGIN_DIR . 'modules/videopress/shortcode.php';

}