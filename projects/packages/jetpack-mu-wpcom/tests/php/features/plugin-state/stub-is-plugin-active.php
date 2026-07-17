<?php
/**
 * Test double shadowing core's is_plugin_active() for the Plugin_State namespace.
 *
 * PHP resolves an unqualified call made inside a namespace against that namespace before
 * falling back to the global one, so defining is_plugin_active() here intercepts the
 * controller's call without disturbing core or any other caller.
 *
 * It delegates to core unless a test has installed an answer. That seam exists for the
 * network-activation case, which WorDBless cannot produce for real: multisite has to be on
 * before WordPress loads -- wp-settings.php either requires ms-settings.php or pins
 * MULTISITE to false -- and the test bootstrap has already loaded WordPress by the time a
 * test runs.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State;

/**
 * Shadow of core's is_plugin_active().
 *
 * @param string $plugin The plugin file.
 *
 * @return bool
 */
function is_plugin_active( $plugin ) {
	if ( isset( $GLOBALS['plugin_state_test_active_plugins'] ) ) {
		$GLOBALS['plugin_state_test_asked_about'][] = $plugin;

		return in_array( $plugin, $GLOBALS['plugin_state_test_active_plugins'], true );
	}

	return \is_plugin_active( $plugin );
}
