<?php
/**
 * Keep Jetpack AI usable on Atomic sites whose `ai` module never activated.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Report the `ai` module as active so Jetpack AI keeps working.
 *
 * The module is the site-wide AI master switch off WordPress.com Simple, but the
 * My Jetpack card that toggles it only renders in internal testing environments.
 * A site whose module never activated therefore has AI switched off with no
 * control anywhere to switch it back on, which is what happens on any release
 * before the one the module was introduced in.
 *
 * Internal testing environments are left alone: the switch is reachable there,
 * and forcing it on would make it impossible to test the off state.
 *
 * Remove this along with the gate on the module itself once the AI settings page
 * ships and the switch is reachable everywhere.
 *
 * @param array $modules Active module slugs.
 * @return array Active module slugs.
 */
function wpcom_keep_jetpack_ai_module_active( $modules ) {
	if ( function_exists( 'jetpack_is_internal_testing_environment' ) && jetpack_is_internal_testing_environment() ) {
		return $modules;
	}

	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}
add_filter( 'jetpack_active_modules', 'wpcom_keep_jetpack_ai_module_active' );
