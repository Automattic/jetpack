<?php
/**
 * The Jetpack Connection Tokens Locks class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 *
 * Jetpack Connection tokens cleanup during migration.
 * This class encapsulates plugin or tool specific code that activates token lock upon migration.
 *
 * The connection tokens are locked to the current domain.
 * If the database is imported on another site (domain name doesn't match), the tokens get removed.
 *
 * @see https://github.com/Automattic/jetpack/pull/23597
 * @see \Automattic\Jetpack\Connection\Tokens::is_locked()
 *
 * @phan-constructor-used-for-side-effects
 */
class Tokens_Locks {

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $is_initialized = false;

	/**
	 * Run the initializers if they haven't been run already.
	 */
	public function __construct() {
		if ( static::$is_initialized ) {
			return;
		}

		$this->init_aiowpm();

		static::$is_initialized = true;
	}

	/**
	 * Set the token lock for AIOWPM plugin export.
	 *
	 * @param array $params The filter parameters.
	 *
	 * @return array
	 */
	public function aiowpm_set_lock( $params ) {
		( new Tokens() )->set_lock();
		return $params;
	}

	/**
	 * Remove the token lock for AIOWPM plugin export.
	 *
	 * @param array $params The filter parameters.
	 *
	 * @return array
	 */
	public function aiowpm_remove_lock( $params ) {
		( new Tokens() )->remove_lock();
		return $params;
	}

	/**
	 * Initialize the All-in-One-WP-Migration plugin hooks.
	 *
	 * @return void
	 */
	private function init_aiowpm() {
		add_filter( 'ai1wm_export', array( $this, 'aiowpm_set_lock' ), 180 );
		add_filter( 'ai1wm_export', array( $this, 'aiowpm_remove_lock' ), 250 );
	}
}
