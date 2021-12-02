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
		// Look through available monorepo plugins until we find one with the plugin symlink.
		$suffix      = '/vendor/automattic/jetpack-' . substr( $plugin, strlen( $packages ) );
		$real_plugin = realpath( $plugin );
		if ( false !== $real_plugin ) {
			foreach ( $wp_plugin_paths as $dir ) {
				if ( realpath( $dir . $suffix ) === $real_plugin ) {
					return plugins_url( $path, $dir . $suffix );
				}
			}
		}
	}

	return $url;
}
add_filter( 'plugins_url', __NAMESPACE__ . '\jetpack_docker_plugins_url', 1, 3 );
