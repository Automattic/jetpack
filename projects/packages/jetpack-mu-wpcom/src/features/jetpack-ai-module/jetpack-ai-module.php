<?php
/**
 * Keep the `ai` module off where the loaded Status package cannot serve it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Visitor;

// Atomic only. Simple runs no Jetpack modules and keeps the `jetpack_ai_enabled`
// option as the AI master, so none of this applies there.
if ( ! Constants::is_true( 'IS_ATOMIC' ) ) {
	return;
}

/**
 * Report the `ai` module inactive when an older copy of Visitor is in play.
 *
 * Jetpack AI surfaces call `Visitor::is_tracking_automattician()`, added in
 * jetpack-status 6.4.0. A plugin can supply an older copy of that class through
 * its own autoloader, leaving the method undefined and the editor fataling on
 * every load. Reporting the module inactive keeps those surfaces from loading.
 *
 * AI is unavailable on such a site until the call sites tolerate an older copy.
 * Remove this once that ships.
 *
 * @param array $modules Active module slugs.
 * @return array Active module slugs.
 */
function gate_module_on_status_version( $modules ) {
	if ( ! is_array( $modules ) || ! in_array( 'ai', $modules, true ) ) {
		return $modules;
	}

	if ( class_exists( Visitor::class ) && ! method_exists( Visitor::class, 'is_tracking_automattician' ) ) {
		return array_values( array_diff( $modules, array( 'ai' ) ) );
	}

	return $modules;
}
add_filter( 'jetpack_active_modules', __NAMESPACE__ . '\\gate_module_on_status_version' );
