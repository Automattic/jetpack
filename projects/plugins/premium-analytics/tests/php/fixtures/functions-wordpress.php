<?php
/**
 * WordPress function test doubles for the plugin wrapper test.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

/**
 * Record an action registration without booting WordPress.
 *
 * @param string   $hook_name     Hook name.
 * @param callable $callback      Hook callback.
 * @param int      $priority      Hook priority.
 * @param int      $accepted_args Number of accepted arguments.
 * @return true
 */
function add_action( $hook_name, $callback, $priority = 10, $accepted_args = 1 ) {
	$GLOBALS['jpa_test_actions'][ $hook_name ][] = array(
		'callback'      => $callback,
		'priority'      => $priority,
		'accepted_args' => $accepted_args,
	);

	return true;
}
