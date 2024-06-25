<?php
/**
 * Features related to fully managed agency sites.
 *
 * @package jetpack-mu-wpcom
 */

/**
 * Whether to enable "fully managed agency site" features.
 * This is primarily used to hide WPCOM links, upsells, and features.
 *
 * @return bool True if the site is "fully managed agency site", false otherwise.
 */
function is_agency_managed_site() {
	return ! empty( get_option( 'is_fully_managed_agency_site' ) );
}
