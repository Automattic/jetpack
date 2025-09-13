<?php
/**
 * Protected Owner error handling initialization for wpcomsh.
 *
 * This file loads and initializes the Protected Owner error handling
 * that integrates with the Jetpack connection error system.
 *
 * @package wpcomsh
 */

// Require the Protected Owner Error Handler class
require_once __DIR__ . '/class-protected-owner-error-handler.php';

// Initialize the Protected Owner error handler
add_action(
	'plugins_loaded',
	function () {
		// Initialize the Protected Owner Error Handler singleton
		\Automattic\WPComSH\Connection\Protected_Owner_Error_Handler::get_instance();
	},
	5
);
