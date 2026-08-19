<?php
/**
 * Stand-in for the jetpack-mu-wpcom expiry-notices rollout gate.
 *
 * The real one ships in jetpack-mu-wpcom, which this suite doesn't load, and
 * `wpcomsh_plan_notices()` reaches for it through `function_exists()`. Without
 * a definition here the legacy notice's stand-down path would never be
 * exercised. Defaults to off -- the answer a site outside the rollout gets --
 * and honours the same filter as the real gate so tests can switch a site in.
 *
 * @package wpcomsh
 */

if ( ! function_exists( 'wpcom_expiry_notices_is_enabled_for_site' ) ) {
	/**
	 * Whether the site is in the expiry-notices rollout.
	 *
	 * @return bool
	 */
	function wpcom_expiry_notices_is_enabled_for_site() {
		return (bool) apply_filters( 'wpcom_expiry_notices_enabled', false, 0 );
	}
}
