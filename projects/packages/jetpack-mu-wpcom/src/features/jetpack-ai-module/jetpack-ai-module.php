<?php
/**
 * Keep Jetpack AI usable on Atomic sites whose `ai` module never activated.
 *
 * Loaded at mu-plugin time from Jetpack_Mu_Wpcom::init(), not from
 * load_features(), because the preload below has to run before any regular
 * plugin registers an autoloader. Remove this file, and its require, once 16.2
 * reaches Atomic and the module can be toggled for real.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Visitor;

// Atomic only. Simple runs no Jetpack modules and keeps the `jetpack_ai_enabled`
// option as the AI master, so none of this applies there.
if ( ! Constants::is_true( 'IS_ATOMIC' ) ) {
	return;
}

/**
 * Load the newest `Status\Visitor` before a regular plugin can supply an older one.
 *
 * Reporting the module active (below) makes Image Studio enqueue, and it calls
 * `Visitor::is_tracking_automattician()`, added in jetpack-status 6.4.0. Some
 * plugins bundle an older jetpack-status through a plain Composer autoloader
 * (Social Chat / wp-whatsapp-chat ships 6.1.x). Composer prepends its autoloader,
 * and regular plugins register theirs after mu-plugins, so that older copy is
 * found first and the editor fatals with "Call to undefined method".
 *
 * PHP never autoloads a class twice. Loading `Visitor` here, at mu-plugin time,
 * lets the Jetpack autoloader resolve it to the newest copy across wpcomsh and
 * the Jetpack plugin before any regular plugin has registered an autoloader.
 * The older copy is then never loaded.
 *
 * This intentionally runs before `plugins_loaded`. The Jetpack autoloader builds
 * its class map from the `active_plugins` option when wpcomsh loads it, so the
 * version it picks here is the same one it would pick later in the request.
 * (With `JETPACK_AUTOLOAD_DEBUG_EARLY_LOADS` set, the autoloader warns about
 * this load. That is expected.)
 */
function preload_status_visitor() {
	class_exists( Visitor::class );
}

/**
 * Report the `ai` module as active so Jetpack AI keeps working.
 *
 * The module became the site-wide AI master switch off WordPress.com Simple, but
 * it only auto-activates once the release that introduced it ships. Until then a
 * site has AI switched off, which is not how Atomic behaved before the module
 * existed, and the switch is not reachable to turn it back on.
 *
 * AI is therefore on for everyone here, and cannot be turned off. That matches
 * Atomic before the module, where there was no site-wide switch at all.
 *
 * @param array $modules Active module slugs.
 * @return array Active module slugs.
 */
function keep_module_active( $modules ) {
	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	// Nothing to report active on a version that predates the module, or before
	// the Jetpack plugin has loaded at all. Reads the available list, not the
	// active one, so it does not re-enter this filter. Checked directly rather
	// than via Modules::is_module(), which treats an empty available list as
	// "anything goes" (a validate_file() quirk) and would add `ai` on a request
	// that asks for active modules before Jetpack loads.
	if ( ! in_array( 'ai', ( new Modules() )->get_available(), true ) ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}

preload_status_visitor();
add_filter( 'jetpack_active_modules', __NAMESPACE__ . '\\keep_module_active' );
