<?php
/**
 * Module Name: Concatenation
 * Module Description: Concatenate scripts and styles.
 * First Introduced: 1.4
 * Sort Order: 21
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Scripts
 * Feature: Other
 * Additional Search Queries: scripts, styles, performance
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/concat/class.jetpack-concat.php';
require_once __DIR__ . '/concat/class.jetpack-styles.php';
require_once __DIR__ . '/concat/class.jetpack-scripts.php';

Jetpack_Concat::get_instance();
if( ! is_admin() ) {
	new JetPack_Styles();
	new JetPack_Scripts();
}

