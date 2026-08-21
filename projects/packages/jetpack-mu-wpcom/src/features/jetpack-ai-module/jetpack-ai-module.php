<?php
/**
 * Keep Jetpack AI usable on Atomic sites whose `ai` module never activated.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Option recording that someone turned the `ai` module off on purpose.
 */
const WPCOM_JETPACK_AI_MODULE_OPTED_OUT = 'wpcom_jetpack_ai_module_opted_out';

/**
 * Report the `ai` module as active so Jetpack AI keeps working.
 *
 * The module is the site-wide AI master switch off WordPress.com Simple, but the
 * My Jetpack card that toggles it only renders in internal testing environments.
 * A site whose module never activated therefore has AI switched off with no
 * control anywhere to switch it back on, which is what happens on any release
 * before the one the module was introduced in.
 *
 * Two cases are left alone, so this defaults AI on rather than forcing it on:
 * an explicit opt-out, and internal testing environments, where the switch is
 * already reachable and the off state needs to stay testable.
 *
 * Remove this along with the gate on the module itself once the AI settings page
 * ships and the switch is reachable everywhere.
 *
 * @param array $modules Active module slugs.
 * @return array Active module slugs.
 */
function wpcom_keep_jetpack_ai_module_active( $modules ) {
	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	if ( get_option( WPCOM_JETPACK_AI_MODULE_OPTED_OUT ) ) {
		return $modules;
	}

	if ( function_exists( 'jetpack_is_internal_testing_environment' ) && jetpack_is_internal_testing_environment() ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}
add_filter( 'jetpack_active_modules', 'wpcom_keep_jetpack_ai_module_active' );

/**
 * Record an explicit opt-out so turning AI off sticks.
 *
 * Deactivating removes the module from `active_modules`, which the filter above
 * would immediately undo. The option is what tells the two apart: a site that
 * never activated the module, and a site that turned it off.
 *
 * @param string $module  Module slug.
 * @param bool   $success Whether the module was deactivated.
 * @return void
 */
function wpcom_record_jetpack_ai_module_opt_out( $module, $success ) {
	if ( 'ai' === $module && $success ) {
		update_option( WPCOM_JETPACK_AI_MODULE_OPTED_OUT, true );
	}
}
add_action( 'jetpack_deactivate_module', 'wpcom_record_jetpack_ai_module_opt_out', 10, 2 );

/**
 * Clear the opt-out when AI is turned back on.
 *
 * @param string $module  Module slug.
 * @param bool   $success Whether the module was activated.
 * @return void
 */
function wpcom_clear_jetpack_ai_module_opt_out( $module, $success ) {
	if ( 'ai' === $module && $success ) {
		delete_option( WPCOM_JETPACK_AI_MODULE_OPTED_OUT );
	}
}
add_action( 'jetpack_activate_module', 'wpcom_clear_jetpack_ai_module_opt_out', 10, 2 );
