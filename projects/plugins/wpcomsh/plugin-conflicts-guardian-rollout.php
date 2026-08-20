<?php
/**
 * Rollout percentage for the Plugin Conflicts Guardian, which ships in
 * jetpack-mu-wpcom. It lives here so it can be deployed on demand.
 *
 * @package wpcomsh
 */

/**
 * Percentage of Atomic sites the guardian runs on, 0-100. Raising it only
 * ever adds sites; 0 turns it off.
 */
const WPCOMSH_PCG_ROLLOUT_PERCENTAGE = 1;

add_filter(
	'pcg_rollout_percentage',
	function () {
		return WPCOMSH_PCG_ROLLOUT_PERCENTAGE;
	}
);
