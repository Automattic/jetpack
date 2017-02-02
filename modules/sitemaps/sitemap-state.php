<?php
/**
 * Abstract sitemap generation state class.
 *
 * @package Jetpack
 * @since 4.7.0
 * @author Automattic
 */

require_once dirname( __FILE__ ) . '/sitemap-librarian.php';

if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
	require_once dirname( __FILE__ ) . '/sitemap-logger.php';
}

/**
 * This class provides an interface for storing and retrieving
 * the state of a sitemap generation phase. Whenever the builder
 * wants to build a new sitemap page, it uses this class to see
 * what the current state of the sitemap is. The lock is stored
 * as a transient with max lifetime of 15 minutes; this way if our
 * builder times out before unlocking the state, the lock will expire
 * before the builder tries again.
 *
 * @since 4.7.0
 */
class Jetpack_Sitemap_State {

	/**
	 * Initial state for the sitemap generator.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @return array $args {
	 *     @type string sitemap-type  The type of sitemap to be generated.
	 *     @type int    last-added    The largest index to be added to a generated sitemap page.
	 *     @type int    number        The index of the sitemap to be generated.
	 *     @type string last-modified The latest timestamp seen.
	 *     @type array  max           The latest index of each sitemap type seen.
	 * }
	 */
	private static function initial() {
		return array(
			'sitemap-type'  => 'page-sitemap',
			'last-added'    => 0,
			'number'        => 0,
			'last-modified' => '1970-01-01 00:00:00',
			'max'           => array(),
		);
	}

	/**
	 * Reset the sitemap state.
	 *
	 * @access public
	 * @since 4.7.0
	 */
	public static function reset() {
		delete_transient( 'jetpack-sitemap-state-lock' );
		update_option(
			'jetpack-sitemap-state',
			self::initial()
		);
	}

	/**
	 * Store a sitemap state, and unlock it.
	 *
	 * @access public
	 * @since 4.7.0
	 *
	 * @param array $args {
	 *     @type string sitemap-type  The type of sitemap to be generated.
	 *     @type int    last-added    The largest index to be added to a generated sitemap page.
	 *     @type int    number        The index of the sitemap to be generated.
	 *     @type string last-modified The latest timestamp seen.
	 * }
	 */
	public static function check_in( $state ) {
		// Get the old max value.
		$state['max'] = get_option( 'jetpack-sitemap-state', self::initial() )['max'];

		// Update the max value of the current type.
		$state['max'][ $state['sitemap-type'] ]['number']  = $state['number'];
		$state['max'][ $state['sitemap-type'] ]['lastmod'] = $state['last-modified'];

		delete_transient( 'jetpack-sitemap-state-lock' );
		update_option( 'jetpack-sitemap-state', $state );
	}

	/**
	 * Read the stored sitemap state. Returns false if the state is locked.
	 * 
	 * @access public
	 * @since 4.7.0
	 *
	 * @return bool|array $args {
	 *     @type string sitemap-type  The type of sitemap to be generated.
	 *     @type int    last-added    The largest index to be added to a generated sitemap page.
	 *     @type int    number        The index of the sitemap to be generated.
	 *     @type string last-modified The latest timestamp seen.
	 *     @type array  max           The latest index of each sitemap type seen.
	 * }
	 */
	public static function check_out() {
		// See if the state is locked.
		if ( true === get_transient( 'jetpack-sitemap-state-lock' ) ) {
			// If so, return false.
			return false;
		} else {
			// Otherwise, lock the state for 15 minutes and then return it.
			set_transient( 'jetpack-sitemap-state-lock', true, 60*15 );
			return get_option( 'jetpack-sitemap-state', self::initial() );
		}
	}

	public static function delete() {
		delete_transient( 'jetpack-sitemap-state-lock' );
		delete_option( 'jetpack-sitemap-state' );
	}

}

//Jetpack_Sitemap_State::delete();
