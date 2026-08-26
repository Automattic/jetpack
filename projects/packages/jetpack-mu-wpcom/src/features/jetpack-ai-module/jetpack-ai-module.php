<?php
/**
 * Retained, unloaded, so the file deletion deploys separately from the require removal.
 *
 * Nothing requires this file. It is deleted in a follow-up once this has deployed.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Module;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;

// Atomic only. Simple runs no Jetpack modules and keeps the `jetpack_ai_enabled`
// option as the AI master, so none of this applies there.
if ( ! Constants::is_true( 'IS_ATOMIC' ) ) {
	return;
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
 * Atomic before the module, where there was no site-wide switch at all. Revert
 * this once the release reaches Atomic and the module can be toggled for real.
 *
 * @param array $modules Active module slugs.
 * @return array Active module slugs.
 */
function keep_module_active( $modules ) {
	if ( ! is_array( $modules ) ) {
		return $modules;
	}

	// Nothing to report active on a version that predates the module. Reads the
	// available list, not the active one, so it does not re-enter this filter.
	if ( ! ( new Modules() )->is_module( 'ai' ) ) {
		return $modules;
	}

	if ( ! in_array( 'ai', $modules, true ) ) {
		$modules[] = 'ai';
	}

	return $modules;
}
