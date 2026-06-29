<?php
/**
 * Plugin Name: Fix monorepo plugins_url
 * Description: In the Jetpack Docker dev environment, plugins_url fails for packages becuase the symlinks from vendor cause it to be unable to find the "plugin" that the URL is supposed to be relative to.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Docker\MuPlugin\FixMonorepoPluginsUrl;

use Jetpack\Docker\MuPlugin\Monorepo;

// This allows us to use the most unstable version of packages, e.g. the monorepo versions.
if ( ! defined( 'JETPACK_AUTOLOAD_DEV' ) ) {
	define( 'JETPACK_AUTOLOAD_DEV', true );
}

/**
 * Fix the plugins_url in the Docker dev environment.
 *
 * @param string $url    The complete URL to the plugins directory including scheme and path.
 * @param string $path   Path relative to the URL to the plugins directory. Blank string
 *                       if no path is specified.
 * @param string $plugin The plugin file path to be relative to. Blank string if no plugin
 *                       is specified.
 * @return string Filtered URL
 */
function jetpack_docker_plugins_url( $url, $path, $plugin ) {
	global $wp_plugin_paths;

	$packages = ( new Monorepo() )->get( 'packages' );

	if ( strpos( $url, $packages ) !== false && strpos( $plugin, $packages ) === 0 ) {
		// The vendor symlink follows the package's composer name, which usually —
		// but not always — matches the directory name (e.g., packages/scan/ has
		// composer name automattic/jetpack-scan-page). Read composer.json to find
		// the actual name; fall back to the directory-name convention when the
		// composer.json can't be read.
		$relative      = substr( $plugin, strlen( $packages ) );
		$slash_pos     = strpos( $relative, '/' );
		$package_dir   = false === $slash_pos ? $relative : substr( $relative, 0, $slash_pos );
		$sub_path      = false === $slash_pos ? '' : substr( $relative, $slash_pos );
		$composer_name = jetpack_docker_resolve_composer_name( $packages . $package_dir )
			?? 'automattic/jetpack-' . $package_dir;

		$suffix1     = '/jetpack_vendor/' . $composer_name . $sub_path;
		$suffix2     = '/vendor/' . $composer_name . $sub_path;
		$real_plugin = realpath( $plugin );
		if ( false !== $real_plugin ) {
			foreach ( $wp_plugin_paths as $dir ) {
				if ( realpath( $dir . $suffix1 ) === $real_plugin ) {
					return plugins_url( $path, $dir . $suffix1 );
				}
				if ( realpath( $dir . $suffix2 ) === $real_plugin ) {
					return plugins_url( $path, $dir . $suffix2 );
				}
			}
		}
	}

	return $url;
}
add_filter( 'plugins_url', __NAMESPACE__ . '\jetpack_docker_plugins_url', 1, 3 );

/**
 * Resolve a monorepo package's composer name from its composer.json.
 *
 * Cached per-request so a single page load doesn't re-read the same composer.json
 * for every URL the package generates.
 *
 * @param string $package_dir Absolute path to the package directory.
 * @return string|null The composer name (e.g., "automattic/jetpack-scan-page"),
 *                     or null if composer.json is missing/unreadable/malformed.
 */
function jetpack_docker_resolve_composer_name( $package_dir ) {
	static $cache = array();
	if ( array_key_exists( $package_dir, $cache ) ) {
		return $cache[ $package_dir ];
	}

	$name          = null;
	$composer_path = $package_dir . '/composer.json';
	if ( is_readable( $composer_path ) ) {
		$contents = json_decode( file_get_contents( $composer_path ), true );
		if ( ! empty( $contents['name'] ) && is_string( $contents['name'] ) ) {
			$name = $contents['name'];
		}
	}

	$cache[ $package_dir ] = $name;
	return $name;
}
