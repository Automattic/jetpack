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
	 * @return array The owner `type` (`plugin`, `theme`, `mu-plugin`, `core`, `unknown` or `none`), with `name` and `version` when known; core files add `modified`.
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

		$checksum = self::get_core_checksum( $path );
		if ( $checksum ) {
			return array(
				'type'     => 'core',
				'version'  => get_bloginfo( 'version' ),
				'modified' => md5_file( $path ) !== $checksum,
			);
		}
		// Without WordPress.org's checksums, a core file outside wp-content looks like a stray one.
		if ( null !== self::get_relative( $path, ABSPATH ) && null === self::get_relative( $path, WP_CONTENT_DIR ) && ! self::get_core_checksums() ) {
			return array( 'type' => 'unknown' );
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
		if ( 'none' !== $owner['type'] || in_array( basename( $path ), self::PROTECTED_FILES, true ) || ! wp_is_file_mod_allowed( 'jetpack_protect_threat_file' ) ) {
			return false;
		}
		// Not in either, such as the site root's index.php that loads WordPress kept in its own directory.
		if ( ! is_file( $path ) || is_link( $path ) || ! self::get_deletable_root( $path ) ) {
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
		return 'core' === $owner['type'] && ! empty( $owner['modified'] ) && wp_is_writable( $path ) && wp_is_file_mod_allowed( 'jetpack_protect_threat_file' );
	}

	/**
	 * The WordPress directory or content directory a file is in, the only places a stray file is deleted from.
	 *
	 * @param string $path The file's real path.
	 * @return string|null The directory's real path, or null when the file is in neither.
	 */
	public static function get_deletable_root( $path ) {
		foreach ( array( WP_CONTENT_DIR, ABSPATH ) as $directory ) {
			if ( null !== self::get_relative( $path, $directory ) ) {
				return realpath( $directory );
			}
		}
		return null;
	}

	/**
	 * Delete a stray file that can_delete() allows, and only that regular file.
	 *
	 * @param string $path The file's real path.
	 * @return true|WP_Error
	 */
	public static function delete( $path ) {
		$root = self::get_deletable_root( $path );
		if ( $root && is_file( $path ) && ! is_link( $path ) && wp_delete_file_from_directory( $path, $root ) ) {
			clearstatcache( true, $path );
			if ( ! file_exists( $path ) ) {
				return true;
			}
		}
		return new WP_Error( 'threat_file_not_deleted', __( 'WordPress couldn’t delete the file. Check its permissions.', 'jetpack-protect-pkg' ), array( 'status' => 500 ) );
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
		$checksum = self::get_core_checksum( $path );
		if ( ! $checksum ) {
			return new WP_Error( 'not_core_file', __( 'This isn’t a WordPress core file.', 'jetpack-protect-pkg' ), array( 'status' => 400 ) );
		}

		$response = wp_safe_remote_get( sprintf( 'https://core.svn.wordpress.org/tags/%s/%s', rawurlencode( get_bloginfo( 'version' ) ), implode( '/', array_map( 'rawurlencode', explode( '/', $relative ) ) ) ), array( 'timeout' => 20 ) );
		$original = is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ? null : wp_remote_retrieve_body( $response );
		if ( null === $original ) {
			return new WP_Error( 'original_unavailable', __( 'The original file couldn’t be downloaded from WordPress.org. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}
		// Files such as wp-includes/version.php differ in a localized package, and WordPress.org only serves the English one.
		if ( md5( $original ) !== $checksum ) {
			return new WP_Error( 'original_mismatch', __( 'WordPress.org’s copy of this file doesn’t match your site’s WordPress package, so it can’t be restored here. Reinstall WordPress from Dashboard → Updates instead.', 'jetpack-protect-pkg' ), array( 'status' => 409 ) );
		}

		if ( false === file_put_contents( $path, $original ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Checked writable, and verified against WordPress.org.
			return new WP_Error( 'file_not_written', __( 'WordPress couldn’t write the file. Check its permissions.', 'jetpack-protect-pkg' ), array( 'status' => 500 ) );
		}
		// Else PHP can keep running the modified file's compiled code.
		if ( ! function_exists( 'wp_opcache_invalidate' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		wp_opcache_invalidate( $path, true );
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
	 * WordPress.org's checksum for a core file.
	 *
	 * @param string $path The file's real path.
	 * @return string|null Null when it isn't a core file.
	 */
	private static function get_core_checksum( $path ) {
		$relative = self::get_relative( $path, ABSPATH );
		return null === $relative ? null : self::get_core_checksums()[ $relative ] ?? null;
	}

	/**
	 * WordPress.org's checksums for the installed core files and language package, cached for a day.
	 *
	 * @return array MD5 checksums keyed by path from ABSPATH; empty when WordPress.org is unreachable.
	 */
	private static function get_core_checksums() {
		global $wp_local_package;
		$version = get_bloginfo( 'version' );
		$locale  = empty( $wp_local_package ) ? 'en_US' : $wp_local_package;
		$cached  = get_transient( self::CHECKSUMS_CACHE );
		if ( is_array( $cached ) && ( $cached['version'] ?? null ) === $version && ( $cached['locale'] ?? null ) === $locale ) {
			return $cached['checksums'];
		}

		if ( ! function_exists( 'get_core_checksums' ) ) {
			require_once ABSPATH . 'wp-admin/includes/update.php';
		}
		$checksums = get_core_checksums( $version, $locale );
		$checksums = is_array( $checksums ) ? $checksums : array();
		set_transient(
			self::CHECKSUMS_CACHE,
			array(
				'version'   => $version,
				'locale'    => $locale,
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
	public static function get_relative( $path, $directory ) {
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
