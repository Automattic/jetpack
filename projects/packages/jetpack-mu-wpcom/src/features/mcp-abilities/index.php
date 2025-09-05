<?php
/**
 * MCP Abilities Feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load the main MCP class
require_once __DIR__ . '/WpcomMcp.php';

// Initialize the MCP system
new Automattic\WpcomMcp\WpcomMcp();
