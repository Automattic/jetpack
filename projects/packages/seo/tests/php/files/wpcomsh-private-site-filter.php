<?php
/**
 * Test fixture for wpcomsh's private-site module filter.
 *
 * Mirrors `Private_Site\filter_jetpack_active_modules` in
 * `projects/plugins/wpcomsh/private-site/private-site.php`, which strips the modules
 * wpcomsh suppresses while an Atomic site is private or coming soon. The package
 * reads module state around this callback by name, so a test needs it to exist.
 *
 * @package automattic/jetpack-seo
 */

namespace Private_Site;

/**
 * Removes modules that wpcomsh suppresses while an Atomic site is private.
 *
 * @param array $modules Active module slugs.
 * @return array Filtered module slugs.
 */
function filter_jetpack_active_modules( $modules ) {
	return array_values( array_diff( (array) $modules, array( 'sitemaps', 'verification-tools' ) ) );
}
