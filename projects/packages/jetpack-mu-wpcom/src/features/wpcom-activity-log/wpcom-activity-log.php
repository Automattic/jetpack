<?php
/**
 * Activity Log on WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Keeps the Activity Log module switched on.
 *
 * WordPress.com provides the Activity Log as part of the hosting and links to it from the
 * Jetpack menu, so My Jetpack should report the feature as active however the site's own
 * `jetpack_active_modules` option reads. Simple sites need no pin, because
 * `Modules::is_active()` already answers true for them.
 *
 * Runs last in `Modules::get_active()`, after the intersection with the available modules,
 * so the slug survives on a site with no Jetpack plugin.
 *
 * @param array $modules Active module slugs.
 * @return array
 */
function wpcom_pin_activity_log_module( $modules ) {
	$modules[] = 'activity-log';

	return array_values( array_unique( $modules ) );
}
