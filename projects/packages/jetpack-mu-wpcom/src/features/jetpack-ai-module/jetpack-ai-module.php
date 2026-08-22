<?php
/**
 * Keep Jetpack AI usable on Atomic sites whose `ai` module never activated.
 *
 * Loaded at mu-plugin time from Jetpack_Mu_Wpcom::init(), not from
 * load_features(), because the preload below has to run before any regular
 * plugin registers an autoloader.
 *
 * Temporary until 16.2 reaches Atomic and the module can be toggled for real.
 * Remove in two stages so the wpcom mid-deploy safety check does not fail:
 * first a PR that only removes the require in init() (deploy it), then a
 * follow-up that deletes this file.
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
 *
 * Dev-only caveat: when the package is loaded through the Beta Tester plugin
 * (`JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN`), this runs at regular-plugin time
 * from that plugin's plain Composer autoloader, so it pins that build's copy.
 * No worse than without the preload; just not the guarantee above.
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
 * @param mixed $modules Active module slugs. Normally an array; anything else is passed through.
 * @return mixed Active module slugs.
 */
function keep_module_active( $modules ) {
	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	// Safety net. If an older Visitor got defined anyway, the AI surfaces would
	// fatal, so keep the module off rather than on.
	if ( ! method_exists( Visitor::class, 'is_tracking_automattician' ) ) {
		return array_values( array_diff( $modules, array( 'ai' ) ) );
	}

	// Nothing to report active before the Jetpack plugin has loaded, or on a
	// version that predates the module.
	// @phan-suppress-next-line PhanUndeclaredClassReference, PhanUndeclaredClassMethod -- class_exists and method_exists guarded on the same line; Jetpack is the standalone plugin on Atomic, not a package this one requires.
	if ( ! class_exists( 'Jetpack' ) || ! method_exists( 'Jetpack', 'is_module' ) || ! \Jetpack::is_module( 'ai' ) ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}

preload_status_visitor();
add_filter( 'jetpack_active_modules', __NAMESPACE__ . '\\keep_module_active' );
