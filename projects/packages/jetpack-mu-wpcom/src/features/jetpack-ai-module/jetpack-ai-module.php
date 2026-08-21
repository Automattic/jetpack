<?php
/**
 * Keep Jetpack AI usable on Atomic sites whose `ai` module never activated.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module;

use Automattic\Jetpack\Constants;

// Atomic only. Simple runs no Jetpack modules and keeps the `jetpack_ai_enabled`
// option as the AI master, so none of this applies there. The loader already
// gates on IS_ATOMIC; this keeps the file safe wherever it is required from.
if ( ! Constants::is_true( 'IS_ATOMIC' ) ) {
	return;
}

/**
 * Option recording that someone turned the `ai` module off on purpose.
 */
const OPTED_OUT_OPTION = 'wpcom_jetpack_ai_module_opted_out';

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
function keep_module_active( $modules ) {
	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	// Keep an opt-out honoured even after auto-activation turns the module on,
	// which it does once the release the module was introduced in ships.
	if ( get_option( OPTED_OUT_OPTION ) ) {
		return array_values( array_diff( $modules, array( 'ai' ) ) );
	}

	if ( function_exists( 'jetpack_is_internal_testing_environment' ) && \jetpack_is_internal_testing_environment() ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}
add_filter( 'jetpack_active_modules', __NAMESPACE__ . '\\keep_module_active' );

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
function record_opt_out( $module, $success ) {
	if ( 'ai' === $module && $success ) {
		update_option( OPTED_OUT_OPTION, true );
	}
}
add_action( 'jetpack_deactivate_module', __NAMESPACE__ . '\\record_opt_out', 10, 2 );

/**
 * Clear the opt-out when AI is turned back on.
 *
 * @param string $module  Module slug.
 * @param bool   $success Whether the module was activated.
 * @return void
 */
function clear_opt_out( $module, $success ) {
	if ( 'ai' === $module && $success ) {
		delete_option( OPTED_OUT_OPTION );
	}
}
add_action( 'jetpack_activate_module', __NAMESPACE__ . '\\clear_opt_out', 10, 2 );
