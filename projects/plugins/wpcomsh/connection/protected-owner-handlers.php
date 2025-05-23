<?php
/**
 * Protected Owner handlers initialization.
 *
 * @package wpcomsh
 */

// Require the handler classes
require_once __DIR__ . '/class-protected-owner-error-handler.php';
require_once __DIR__ . '/class-protected-owner-permission-handler.php';

// Initialize Protected Owner handlers
add_action(
	'plugins_loaded',
	function () {
		// Initialize the handlers
		\Automattic\WPComSH\Connection\Protected_Owner_Error_Handler::get_instance();
		\Automattic\WPComSH\Connection\Protected_Owner_Permission_Handler::get_instance();

		// Hook into Jetpack's connection errors initial state filter
		add_filter( 'react_connection_errors_initial_state', array( \Automattic\WPComSH\Connection\Protected_Owner_Error_Handler::get_instance(), 'jetpack_react_dashboard_error' ), 20 );
	},
	5
);
