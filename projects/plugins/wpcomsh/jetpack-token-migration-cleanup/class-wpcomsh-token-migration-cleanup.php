<?php
/**
 * Jetpack connection tokens cleanup during migration.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Tokens;

/**
 * Jetpack Connection tokens cleanup during migration.
 *
 * The connection tokens are locked to the current domain.
 * If the database is imported on another site (domain name doesn't match), the tokens get removed.
 *
 * @see https://github.com/Automattic/jetpack/pull/23597
 * @see p9dueE-4Ly-p2
 * @see \Automattic\Jetpack\Connection\Tokens::is_locked()
 */
class WPCOMSH_Token_Migration_Cleanup {

	/**
	 * Run before the AIOWPM export.
	 *
	 * @param mixed $params The parameters coming from the plugin.
	 *
	 * @return mixed
	 * @throws \Exception The token lock adding failed.
	 */
	public static function aiowpm_before_database_export( $params ) {
		if ( method_exists( Tokens::class, 'set_lock' ) ) {
			$is_locked = ( new Tokens() )->set_lock();
			if ( ! $is_locked ) {
				WPCOMSH_Log::unsafe_direct_log( 'connection_token_lock_not_set' );
			}
		}

		return $params;
	}

	/**
	 * Run after the AIOWPM export.
	 *
	 * @param mixed $params The parameters coming from the plugin.
	 *
	 * @return mixed
	 * @throws \Exception The token lock removal failed.
	 */
	public static function aiowpm_after_database_export( $params ) {
		if ( method_exists( Tokens::class, 'remove_lock' ) ) {
			$is_unlocked = ( new Tokens() )->remove_lock();
			if ( ! $is_unlocked ) {
				WPCOMSH_Log::unsafe_direct_log( 'connection_token_lock_not_removed' );
			}
		}

		return $params;
	}
}

// The priorities 180 and 250 are based on the AIOWPM plugin's setup.
// They ensure that the lock set immediately before the database gets exported,
// and removed as soon as the export is completed.
add_filter( 'ai1wm_export', array( 'WPCOMSH_Token_Migration_Cleanup', 'aiowpm_before_database_export' ), 180 );
add_filter( 'ai1wm_export', array( 'WPCOMSH_Token_Migration_Cleanup', 'aiowpm_after_database_export' ), 250 );
