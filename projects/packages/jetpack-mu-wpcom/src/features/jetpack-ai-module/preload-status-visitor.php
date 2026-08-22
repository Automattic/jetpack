<?php
/**
 * Load the newest `Status\Visitor` before a regular plugin can supply an older one.
 *
 * Jetpack AI surfaces (Image Studio, the Content Guidelines page) call
 * `Visitor::is_tracking_automattician()`, added in jetpack-status 6.4.0. Some
 * plugins bundle an older jetpack-status through a plain Composer autoloader
 * (Social Chat / wp-whatsapp-chat ships 6.1.x). Composer prepends its autoloader,
 * and regular plugins register theirs after mu-plugins, so that older copy is
 * found first and the editor fatals with "Call to undefined method
 * Automattic\Jetpack\Status\Visitor::is_tracking_automattician()".
 *
 * PHP never autoloads a class twice. Loading `Visitor` here, at mu-plugin time,
 * lets the Jetpack autoloader resolve it to the newest copy across wpcomsh and
 * the Jetpack plugin before any regular plugin has registered an autoloader.
 * The older copy is then never loaded.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module;

use Automattic\Jetpack\Status\Visitor;

/**
 * Trigger autoloading of `Status\Visitor` so the newest copy wins.
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

preload_status_visitor();
