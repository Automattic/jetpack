<?php
/**
 * Automatically enable Page Cache when migrating from WP Super Cache.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Super_Cache;

use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;


/**
 * Accept migrations from WP Super Cache
 */
function migrate_from_super_cache() {

	// Check if Jetpack Boost Page Cache module is enabled
	if ( ! class_exists( Page_Cache::class ) ) {
		return;
	}

	if ( ! Page_Cache::is_available() ) {
		return;
	}

	$migration_status = get_transient( 'jb_cache_moved_to_boost' );
	if ( $migration_status !== 'notice' ) {
		return;
	}

	$status = new Status( Page_Cache::get_slug() );
	if ( $status->get() === true ) {
		return;
	}

	// If the cache is already migrated, we don't need to do anything.
	if ( get_transient( 'jb_boost_migration_complete' ) ) {
		return;
	}
	set_transient( 'jb_boost_migration_complete', true, 7 * DAY_IN_SECONDS );
	$status->set( true );
}

add_action( 'admin_init', __NAMESPACE__ . '\migrate_from_super_cache' );
