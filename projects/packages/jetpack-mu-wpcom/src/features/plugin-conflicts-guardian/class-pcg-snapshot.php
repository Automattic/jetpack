<?php
/**
 * Pre-update snapshot for plugin updates.
 *
 * Captures enough state before an update to decide whether the post-update
 * probe needs to run (was_active) and what to roll back to if it fails
 * (version).
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Transient-backed snapshot of a plugin's state immediately before an update.
 */
class PCG_Snapshot {

	const LIFETIME = 10 * MINUTE_IN_SECONDS;

	/**
	 * Capture and persist the snapshot for $plugin_file.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR, e.g. "akismet/akismet.php".
	 * @return array{plugin_file:string,slug:string,version:string,was_active:bool,timestamp:float}|null
	 *         The stored snapshot, or null when we lack enough info to make one.
	 */
	public static function capture( $plugin_file ) {
		$plugin_file = (string) $plugin_file;
		if ( '' === $plugin_file ) {
			return null;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$abs = WP_PLUGIN_DIR . '/' . $plugin_file;
		if ( ! is_file( $abs ) ) {
			return null;
		}

		$data = get_plugin_data( $abs, false, false );

		$snapshot = array(
			'plugin_file' => $plugin_file,
			'slug'        => self::slug_from_file( $plugin_file ),
			'version'     => (string) ( $data['Version'] ?? '' ),
			'was_active'  => is_plugin_active( $plugin_file ),
			'timestamp'   => microtime( true ),
		);

		set_transient( self::transient_key( $plugin_file ), $snapshot, self::LIFETIME );

		return $snapshot;
	}

	/**
	 * Read the snapshot for $plugin_file, consuming it (single use).
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return array|null
	 */
	public static function consume( $plugin_file ) {
		$key  = self::transient_key( (string) $plugin_file );
		$data = get_transient( $key );
		delete_transient( $key );
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Derive the plugin slug (directory name) from the plugin_file basename.
	 * Single-file plugins (e.g. "hello.php") use the stem.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string
	 */
	public static function slug_from_file( $plugin_file ) {
		$plugin_file = (string) $plugin_file;
		if ( false !== strpos( $plugin_file, '/' ) ) {
			return dirname( $plugin_file );
		}
		return pathinfo( $plugin_file, PATHINFO_FILENAME );
	}

	/**
	 * Transient key for a plugin_file snapshot.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string
	 */
	public static function transient_key( $plugin_file ) {
		return 'pcg_snap_' . md5( (string) $plugin_file );
	}
}
