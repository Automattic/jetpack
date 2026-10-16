<?php
/**
 * Test fixture for wpcomsh's private-site module filter.
 *
 * @package jetpack
 */

namespace Private_Site;

/**
 * Removes modules that wpcomsh suppresses while an Atomic site is private.
 *
 * @param array $modules Active module slugs.
 * @return array Filtered module slugs.
 */
function filter_jetpack_active_modules( $modules ) {
	return array_values( array_diff( $modules, array( 'sitemaps' ) ) );
}
