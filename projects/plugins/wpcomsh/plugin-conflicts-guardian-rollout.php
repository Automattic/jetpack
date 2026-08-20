<?php
/**
 * Rollout percentage for the Plugin Conflicts Guardian.
 *
 * The guardian itself lives in the jetpack-mu-wpcom package, which ships on a
 * weekly release train. Its cohort size lives here instead so a ramp — or a
 * rollback — can be deployed when it's needed rather than when the train runs.
 *
 * @package wpcomsh
 */

/**
 * Percentage of Atomic sites the guardian is active on, 0-100.
 *
 * Bucketing is stable, so raising this only ever adds sites. Set to 0 to turn
 * the guardian off everywhere.
 */
const WPCOMSH_PCG_ROLLOUT_PERCENTAGE = 1;

add_filter(
	'pcg_rollout_percentage',
	function () {
		return WPCOMSH_PCG_ROLLOUT_PERCENTAGE;
	}
);
