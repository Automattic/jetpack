<?php
/**
 * Keep the Jetpack Activity Log on for every Atomic site.
 *
 * @package wpcomsh
 */

/**
 * Force the Activity Log module on through Jetpack's feature policy.
 *
 * @param array       $policy          Map of feature slug to policy.
 * @param string|null $jetpack_version Jetpack version to check, defaulting to the running one.
 * @return array
 */
function wpcomsh_force_activity_log_module( $policy, $jetpack_version = null ) {
	if ( null === $jetpack_version && defined( 'JETPACK__VERSION' ) ) {
		$jetpack_version = JETPACK__VERSION;
	}

	// Older builds have no module, and forcing an unknown slug triggers _doing_it_wrong().
	if ( ! $jetpack_version || version_compare( $jetpack_version, '16.3-a.3', '<' ) ) {
		return $policy;
	}

	$policy['activity-log'] = array( 'activation' => 'forced-on' );

	return $policy;
}
add_filter( 'jetpack_feature_policy', 'wpcomsh_force_activity_log_module' );
