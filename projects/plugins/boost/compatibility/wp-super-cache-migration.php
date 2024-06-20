<?php
/**
 * Automatically enable Page Cache when migrating from WP Super Cache.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Super_Cache;

use Automattic\Jetpack_Boost\Lib\Analytics;
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

	// If Boost has already activated the Page Cache based on WPSC migration once, we don't want to do it again.
	// For example - if the user manually de-activates Page Cache in Boost.
	$migration_status = get_transient( 'jb_cache_moved_to_boost' );
	// If the cache is already migrated, we don't need to do anything.
	if ( get_transient( 'jb_boost_migration_complete' ) ) {
		return;
	}

	// If Super Cache has set the transient, log it to tracks, but only once.
	if ( $migration_status && ! get_transient( 'jb_boost_migration_tracked' ) ) {
		set_transient( 'jb_boost_migration_tracked', true, 7 * DAY_IN_SECONDS );
		Analytics::record_user_event( 'migrated_from_wpsc', array( 'source' => $migration_status ) );
	}

	// Only proceed to activate Page Cache in Jetpack Boost
	// if the user clicked the admin notice.
	if ( $migration_status !== 'notice' ) {
		return;
	}

	// Check if Boost has Page Cache already enabled.
	$status = new Status( Page_Cache::get_slug() );
	if ( $status->get() === true ) {
		return;
	}

	set_transient( 'jb_boost_migration_complete', true, 7 * DAY_IN_SECONDS );
	$status->set( true );
}

add_action( 'admin_init', __NAMESPACE__ . '\migrate_from_super_cache' );
