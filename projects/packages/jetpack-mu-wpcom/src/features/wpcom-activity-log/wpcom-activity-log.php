<?php
/**
 * Activity Log on WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Forces the Activity Log module on, since the Jetpack menu links to it regardless of the module.
 *
 * A forced module is what My Jetpack and Jetpack Settings render as locked on, rather than as a toggle.
 *
 * @param array $modules Active module slugs.
 * @return array
 */
function wpcom_force_activity_log_module( $modules ) {
	$modules[] = 'activity-log';

	return array_values( array_unique( $modules ) );
}
