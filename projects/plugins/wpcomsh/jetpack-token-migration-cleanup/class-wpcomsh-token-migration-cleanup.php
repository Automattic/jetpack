<?php
/**
 * Jetpack connection tokens cleanup during migration.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Tokens;

/**
 * Jetpack Connection tokens cleanup during migration.
 */
class WPCOMSH_Token_Migration_Cleanup {

	/**
	 * Run before the AIOWPM export.
	 *
	 * @param mixed $params The parameters coming from the plugin.
	 *
	 * @return mixed
	 */
	public static function aiowpm_before_export( $params ) {
		if ( method_exists( Tokens::class, 'set_lock' ) ) {
			( new Tokens() )->set_lock();
		}

		return $params;
	}

	/**
	 * Run after the AIOWPM export.
	 *
	 * @param mixed $params The parameters coming from the plugin.
	 *
	 * @return mixed
	 */
	public static function aiowpm_after_export( $params ) {
		if ( method_exists( Tokens::class, 'remove_lock' ) ) {
			( new Tokens() )->remove_lock();
		}

		return $params;
	}
}

add_filter( 'ai1wm_export', array( 'WPCOMSH_Token_Migration_Cleanup', 'aiowpm_before_export' ), 180 );
add_filter( 'ai1wm_export', array( 'WPCOMSH_Token_Migration_Cleanup', 'aiowpm_after_export' ), 250 );
