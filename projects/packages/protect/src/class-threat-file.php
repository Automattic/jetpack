<?php
/**
 * What a file Scan flagged belongs to, and deleting or restoring it.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Works out whether a flagged file is part of WordPress, a plugin or a theme, and acts on it.
 *
 * @since $$next-version$$
 */
class Threat_File {

	/**
	 * Transient caching WordPress.org's checksums for the installed core version.
	 *
	 * @var string
	 */
	const CHECKSUMS_CACHE = 'jetpack_protect_dashboard_core_checksums';

	/**
	 * Files that configure the site, so deleting one would take it down.
	 *
	 * @var string[]
	 */
	const PROTECTED_FILES = array( 'wp-config.php', '.htaccess', '.user.ini', 'php.ini', 'web.config' );

	/**
	 * What a file belongs to.
	 *
	 * @param string $path The file's real path, inside the site.
	 * @return array The owner `type` (`plugin`, `theme`, `mu-plugin`, `core` or `none`), with `name` and `version` when known; core files add `modified`.
	 */
	public static function get_owner( $path ) {
		$plugin = self::get_plugin( $path );
		if ( $plugin ) {
			return $plugin;
		}

		$slug = self::get_first_segment( $path, get_theme_root() );
		if ( $slug ) {
			$theme = wp_get_theme( $slug );
			if ( $theme->exists() ) {
				return array(
					'type'    => 'theme',
					'name'    => $theme->get( 'Name' ),
					'version' => $theme->get( 'Version' ),
				);
			}
		}

		if ( self::get_first_segment( $path, WPMU_PLUGIN_DIR ) ) {
			return array( 'type' => 'mu-plugin' );
		}

		$relative = self::get_relative( $path, ABSPATH );
		$checksum = null === $relative ? null : ( self::get_core_checksums()[ $relative ] ?? null );
		if ( $checksum ) {
			return array(
				'type'     => 'core',
				'version'  => get_bloginfo( 'version' ),
				'modified' => md5_file( $path ) !== $checksum,
			);
		}

		return array( 'type' => 'none' );
	}

	/**
	 * Whether the file is a stray one, belonging to nothing the site needs, so deleting it is safe.
	 *
	 * @param string $path  The file's real path.
	 * @param array  $owner The file's owner, from get_owner().
	 * @return bool
	 */
	public static function can_delete( $path, $owner ) {
		if ( 'none' !== $owner['type'] || in_array( basename( $path ), self::PROTECTED_FILES, true ) ) {
			return false;
		}
		// Drop-ins such as object-cache.php sit loose in wp-content but run the site.
		if ( ! function_exists( '_get_dropins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return ! ( dirname( $path ) === realpath( WP_CONTENT_DIR ) && isset( _get_dropins()[ basename( $path ) ] ) );
	}

	/**
	 * Whether a modified core file can be put back as WordPress.org ships it.
	 *
	 * @param string $path  The file's real path.
	 * @param array  $owner The file's owner, from get_owner().
	 * @return bool
	 */
	public static function can_restore( $path, $owner ) {
		return 'core' === $owner['type'] && ! empty( $owner['modified'] ) && wp_is_writable( $path );
	}

	/**
	 * Whether code is in the uploads folder, where WordPress never puts any.
	 *
	 * @param string $path The file's real path.
	 * @return bool
	 */
	public static function is_code_in_uploads( $path ) {
		$uploads = wp_upload_dir( null, false );
		return null !== self::get_relative( $path, $uploads['basedir'] ) && (bool) preg_match( '/\.(php\d?|phtml|phar)$/i', $path );
	}

	/**
	 * Replace a modified core file with WordPress.org's copy, once its checksum matches.
	 *
	 * @param string $path The file's real path.
	 * @return true|WP_Error
	 */
	public static function restore( $path ) {
		$relative = self::get_relative( $path, ABSPATH );
		$checksum = null === $relative ? null : ( self::get_core_checksums()[ $relative ] ?? null );
		if ( null === $relative || ! $checksum ) {
			return new WP_Error( 'not_core_file', __( 'This isn’t a WordPress core file.', 'jetpack-protect-pkg' ), array( 'status' => 400 ) );
		}

		$response = wp_safe_remote_get( sprintf( 'https://core.svn.wordpress.org/tags/%s/%s', rawurlencode( get_bloginfo( 'version' ) ), implode( '/', array_map( 'rawurlencode', explode( '/', $relative ) ) ) ), array( 'timeout' => 20 ) );
		$original = is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ? null : wp_remote_retrieve_body( $response );
		if ( null === $original || md5( $original ) !== $checksum ) {
			return new WP_Error( 'original_unavailable', __( 'The original file couldn’t be downloaded from WordPress.org. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		if ( false === file_put_contents( $path, $original ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Checked writable, and verified against WordPress.org.
			return new WP_Error( 'file_not_written', __( 'WordPress couldn’t write the file. Check its permissions.', 'jetpack-protect-pkg' ), array( 'status' => 500 ) );
		}
		return true;
	}

	/**
	 * The installed plugin a file is in, if any.
	 *
	 * @param string $path The file's real path.
	 * @return array|null
	 */
	private static function get_plugin( $path ) {
		$relative = self::get_relative( $path, WP_PLUGIN_DIR );
		if ( null === $relative ) {
			return null;
		}
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugins = get_plugins();
		$segment = strtok( $relative, '/' );
		$file    = Dashboard_Threats::get_plugin_files( $plugins )[ basename( $segment, '.php' ) ] ?? null;
		// A loose file in the plugins folder isn't a plugin unless it is the plugin's own main file.
		if ( ! $file || ( false === strpos( $relative, '/' ) && $file !== $relative ) ) {
			return null;
		}
		return array(
			'type'    => 'plugin',
			'name'    => $plugins[ $file ]['Name'],
			'version' => $plugins[ $file ]['Version'],
		);
	}

	/**
	 * WordPress.org's checksums for the installed core files, cached for a day.
	 *
	 * @return array MD5 checksums keyed by path from ABSPATH; empty when WordPress.org is unreachable.
	 */
	private static function get_core_checksums() {
		$version = get_bloginfo( 'version' );
		$cached  = get_transient( self::CHECKSUMS_CACHE );
		if ( is_array( $cached ) && ( $cached['version'] ?? null ) === $version ) {
			return $cached['checksums'];
		}

		if ( ! function_exists( 'get_core_checksums' ) ) {
			require_once ABSPATH . 'wp-admin/includes/update.php';
		}
		$checksums = get_core_checksums( $version, 'en_US' );
		$checksums = is_array( $checksums ) ? $checksums : array();
		set_transient(
			self::CHECKSUMS_CACHE,
			array(
				'version'   => $version,
				'checksums' => $checksums,
			),
			$checksums ? DAY_IN_SECONDS : HOUR_IN_SECONDS
		);
		return $checksums;
	}

	/**
	 * A path relative to a directory.
	 *
	 * @param string $path      A real path.
	 * @param string $directory The directory.
	 * @return string|null Null when the path isn't inside it.
	 */
	private static function get_relative( $path, $directory ) {
		$directory = $directory ? realpath( $directory ) : false;
		if ( ! $directory || 0 !== strpos( $path, trailingslashit( $directory ) ) ) {
			return null;
		}
		return substr( $path, strlen( trailingslashit( $directory ) ) );
	}

	/**
	 * The folder or file directly inside a directory that a path is in, such as a plugin's slug.
	 *
	 * @param string $path      A real path.
	 * @param string $directory The directory.
	 * @return string|null
	 */
	private static function get_first_segment( $path, $directory ) {
		$relative = self::get_relative( $path, $directory );
		return null === $relative ? null : strtok( $relative, '/' );
	}
}
