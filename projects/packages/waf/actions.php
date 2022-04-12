<?php
/**
 * Action Hooks for Jetpack WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

// We don't want to be anything in here outside WP context.
if ( ! function_exists( 'add_action' ) ) {
	return;
}

/**
 * Triggers when the Jetpack plugin is updated
 */
add_action(
	'upgrader_process_complete',
	array( __NAMESPACE__ . '\Waf_Runner', 'update_rules_if_changed' )
);

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
	function () {
		require_once __DIR__ . '/run.php';
	}
);

/**
 * Will update the rules.php file on every page load; temporarily replaces the
 * register_activation_hook since on activation the user hasn't yet connected
 * their site to Jetpack and may not have a wpcom user id.
 *
 * @return void
 */
add_action(
	'wp_loaded',
	function () {
		Waf_Runner::activate();
	}
);
