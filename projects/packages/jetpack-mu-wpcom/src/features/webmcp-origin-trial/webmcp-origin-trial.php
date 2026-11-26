<?php
/**
 * Enable the WebMCP origin trial on WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

$print_webmcp_origin_trial = static function () {
	// Chrome validates the third-party token against the origin of this script.
	wp_print_script_tag( array( 'src' => 'https://s0.wp.com/wp-content/js/webmcp-origin-trial.js' ) );
};

add_action( 'wp_head', $print_webmcp_origin_trial, 0 );
add_action( 'admin_print_scripts', $print_webmcp_origin_trial, 0 );
add_action( 'login_print_scripts', $print_webmcp_origin_trial, 0 );
