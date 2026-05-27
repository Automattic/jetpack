<?php
/**
 * Plugin Name: Akismet Experimental UI
 * Description: Internal R&D — experimental admin UI exploring the Akismet → WordPress trust layer pivot. NOT for production. See MODERNIZATION_NOTES.md and ../akismet-modernization/GUARDRAILS.md.
 * Version: 0.1.0
 * Author: Devin Walker (devin.walker@a8c.com)
 * License: GPL-2.0-or-later
 * Text Domain: akismet
 *
 * @package Akismet_Experimental
 */

defined( 'ABSPATH' ) || exit;

// Plugin path constant. Mirrors `AKISMET__PLUGIN_DIR` from the production plugin
// so the class works whether mounted standalone or copied into wpcom's
// mu-plugins/akismet-3.0/ directory.
if ( ! defined( 'AKISMET_EXPERIMENTAL__PLUGIN_DIR' ) ) {
	define( 'AKISMET_EXPERIMENTAL__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'AKISMET_EXPERIMENTAL__PLUGIN_FILE' ) ) {
	define( 'AKISMET_EXPERIMENTAL__PLUGIN_FILE', __FILE__ );
}

// Bootstrap the experimental class only when the wp-config gate is on.
// See GUARDRAILS.md §"Code-level guardrails".
if ( defined( 'AKISMET_EXPERIMENTAL_UI' ) && AKISMET_EXPERIMENTAL_UI === true ) {
	// REST API class must load before the main class — the main class calls
	// REST init at the bottom of its file, so it needs the dependency in scope.
	require_once AKISMET_EXPERIMENTAL__PLUGIN_DIR . 'class.akismet-experimental-rest-api.php';
	require_once AKISMET_EXPERIMENTAL__PLUGIN_DIR . 'class.akismet-experimental.php';
}
