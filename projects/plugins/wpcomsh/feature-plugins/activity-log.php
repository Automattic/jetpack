<?php
/**
 * Keep the Jetpack Activity Log on for every Atomic site.
 *
 * @package wpcomsh
 */

/**
 * Force the Activity Log module on through Jetpack's feature policy.
 *
 * @param array $policy Map of feature slug to policy.
 * @return array
 */
function wpcomsh_force_activity_log_module( $policy ) {
	// Before 16.3 there is no module, and forcing an unknown slug triggers _doing_it_wrong().
	if ( ! defined( 'JETPACK__VERSION' ) || version_compare( JETPACK__VERSION, '16.3', '<' ) ) {
		return $policy;
	}

	$policy['activity-log'] = array( 'activation' => 'forced-on' );

	return $policy;
}
add_filter( 'jetpack_feature_policy', 'wpcomsh_force_activity_log_module' );
