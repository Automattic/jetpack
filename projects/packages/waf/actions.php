<?php
/**
 * Action Hooks for Jetpack WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Constants as Jetpack_Constants;

// We don't want to be anything in here outside WP context.
if ( ! function_exists( 'add_action' ) ) {
	return;
}

/**
 * Triggers when the Jetpack plugin is activated
 */
register_activation_hook(
	Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_FILE' ),
	array( __NAMESPACE__ . '\Waf_Runner', 'activate' )
);

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
