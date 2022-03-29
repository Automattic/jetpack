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

define( 'JETPACK_WAF_VERSION', '1.0.3' );
define( 'JETPACK_WAF_DIR', __DIR__ );

/**
 * Triggers when the Jetpack plugin is activated
 */
register_activation_hook(
	JETPACK__PLUGIN_FILE,
	array( __NAMESPACE__ . '\Waf', 'activate' )
);

/**
 * Runs the WAF in the WP context.
 *
 * @return void
 */
add_action(
	'plugin_loaded',
	function () {
		Waf::update();
		require_once __DIR__ . '/run.php';
	}
);
