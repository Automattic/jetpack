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
 * Triggers when the Jetpack plugin is activated
 */
register_activation_hook(
	JETPACK__PLUGIN_FILE,
	array( __NAMESPACE__ . '\WafRunner', 'activate' )
);

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
	function () {
		WafRunner::update();
		require_once __DIR__ . '/run.php';
	}
);
