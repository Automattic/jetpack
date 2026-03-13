<?php
/**
 * Module: Widget Visibility
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Module Name: Widget Visibility
 * Module Description: Choose which widgets appear on specific pages or posts with advanced controls.
 * First Introduced: 2.4
 * Requires Connection: No
 * Auto Activate: No
 * Sort Order: 17
 * Module Tags: Appearance
 * Feature: Appearance
 * Additional Search Queries: widget visibility, logic, conditional, widgets, widget
 */

require __DIR__ . '/widget-visibility/widget-conditions.php';
