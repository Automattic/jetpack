<?php
/**
 * Jetpack Backup Helper Script Manager class (static wrapper).
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup;

/**
 * Manage installation, deletion and cleanup of Helper Scripts to assist with backing up Jetpack Sites.
 *
 * A static wrapper around an "implementation" class so that it gets autoloaded late, and we always get the latest
 * version of the class instead of a random version of it:
 *
 * https://github.com/Automattic/jetpack/pull/34297#discussion_r1424227489
 */
class Helper_Script_Manager {

	/**
	 * Instance of helper script manager implementation, or null if not initialized yet.
	 *
	 * @var Helper_Script_Manager_Impl|null
	 */
	protected static $impl = null;

	/**
	 * Initialize an instance of helper script manager implementation (if needed).
	 *
	 * @return void
	 */
	protected static function initialize_impl_if_needed() {
		if ( null === static::$impl ) {
			static::$impl = new Helper_Script_Manager_Impl();
		}
	}

	/**
	 * Install a Helper Script, and returns its filesystem path and access url.
	 *
	 * @param string $script_body Helper Script file contents.
	 *
	 * @return array|\WP_Error Either an array containing the filesystem path ("path"), the URL ("url") of the helper
	 *   script, and the WordPress root ("abspath"), or an instance of WP_Error.
	 */
	public static function install_helper_script( $script_body ) {
		static::initialize_impl_if_needed();
		return static::$impl->install_helper_script( $script_body );
	}

	/**
	 * Ensure that the helper script is gone (by deleting it, if needed).
	 *
	 * @param string $path Path to the helper script to delete.
	 *
	 * @return true|\WP_Error True if the file helper script is gone (either it got deleted, or it was never there), or
	 *   WP_Error instance on deletion failures.
	 */
	public static function delete_helper_script( $path ) {
		static::initialize_impl_if_needed();
		return static::$impl->delete_helper_script( $path );
	}

	/**
	 * Search for Helper Scripts that are suspiciously old, and clean them out.
	 *
	 * @return true|\WP_Error True if all expired helper scripts got cleaned up successfully, or an instance of
	 *   WP_Error if one or more expired helper scripts didn't manage to get cleaned up.
	 */
	public static function cleanup_expired_helper_scripts() {
		static::initialize_impl_if_needed();
		return static::$impl->cleanup_expired_helper_scripts();
	}

	/**
	 * Search for and delete all Helper Scripts. Used during uninstallation.
	 *
	 * @return true|\WP_Error True if all helper scripts got deleted successfully, or an instance of WP_Error if one or
	 *   more helper scripts didn't manage to get deleted.
	 */
	public static function delete_all_helper_scripts() {
		static::initialize_impl_if_needed();
		return static::$impl->delete_all_helper_scripts();
	}
}
