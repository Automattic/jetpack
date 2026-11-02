<?php
/**
 * Plugins that bring social replies back to the site.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Suggests ATmosphere to sites sharing to Bluesky, and ActivityPub to sites sharing to Mastodon.
 */
class Companion_Plugins {

	/**
	 * User option holding the slugs of the plugins whose notice the user dismissed on this site.
	 */
	const DISMISSED_OPTION = 'jetpack_social_dismissed_companion_plugins';

	/**
	 * The plugins, by WordPress.org slug.
	 *
	 * @var array<string, array{file: string, version_constant: string, requires_php: string}>
	 */
	const PLUGINS = array(
		'atmosphere'  => array(
			'file'             => 'atmosphere/atmosphere.php',
			'version_constant' => 'ATMOSPHERE_VERSION',
			'requires_php'     => '8.2',
		),
		'activitypub' => array(
			'file'             => 'activitypub/activitypub.php',
			'version_constant' => 'ACTIVITYPUB_PLUGIN_VERSION',
			'requires_php'     => '7.4',
		),
	);

	/**
	 * How the current user can turn on each plugin they should be offered.
	 *
	 * `install` or `activate` go through core's plugins REST API, `enable` turns ActivityPub on for a
	 * WordPress.com Simple site, and `marketplace` installs from WordPress.com.
	 *
	 * @return array<string, string> Action, by plugin slug.
	 */
	public static function get_script_data(): array {
		$is_simple = ( new Host() )->is_wpcom_simple();
		$dismissed = self::get_dismissed();
		$actions   = array();

		foreach ( self::PLUGINS as $slug => $plugin ) {
			// An active plugin defines its version constant as it loads, however it got there (network, WordPress.com bundle).
			if ( in_array( $slug, $dismissed, true ) || defined( $plugin['version_constant'] ) ) {
				continue;
			}

			$action = $is_simple ? self::get_simple_action( $slug ) : self::get_plugin_action( $plugin );

			if ( null !== $action ) {
				$actions[ $slug ] = $action;
			}
		}

		return $actions;
	}

	/**
	 * How the current user can turn a plugin on through core, mirroring the checks core's `wp/v2/plugins` route makes.
	 *
	 * On WoA, wpcomsh denies the primitive capabilities on plans that cannot install plugins, but not `activate_plugin`.
	 *
	 * @param array{file: string, requires_php: string} $plugin The plugin.
	 * @return string|null `install`, `activate`, or null when the user cannot or the site's PHP is too old.
	 */
	private static function get_plugin_action( array $plugin ): ?string {
		// Core would refuse it, with an error that does not say why.
		if ( ! is_php_version_compatible( $plugin['requires_php'] ) ) {
			return null;
		}

		$file = $plugin['file'];

		if ( file_exists( WP_PLUGIN_DIR . '/' . $file ) ) {
			return current_user_can( 'activate_plugins' ) && current_user_can( 'activate_plugin', $file ) ? 'activate' : null;
		}

		return current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ) ? 'install' : null;
	}

	/**
	 * How the current user can turn a plugin on from a WordPress.com Simple site.
	 *
	 * @param string $slug The plugin slug.
	 * @return string|null `enable`, `marketplace`, or null when the site cannot get the plugin.
	 */
	private static function get_simple_action( string $slug ): ?string {
		if ( ! current_user_can( 'manage_options' ) ) {
			return null;
		}

		// Simple runs ActivityPub for every site and turns it on per site, through `wpcom/v2/activitypub/status`.
		if ( 'activitypub' === $slug ) {
			return 'enable';
		}

		// Installing from WordPress.com moves the site to WoA first, which only plans with plugins allow.
		return Current_Plan::supports( 'install-plugins' ) ? 'marketplace' : null;
	}

	/**
	 * The slugs of the plugins whose notice the current user dismissed on this site.
	 *
	 * @return string[]
	 */
	public static function get_dismissed(): array {
		$dismissed = get_user_option( self::DISMISSED_OPTION );

		return is_array( $dismissed ) ? $dismissed : array();
	}

	/**
	 * Hide a plugin's notice from the current user on this site, in every place it shows.
	 *
	 * @param string $slug The plugin slug, one of `PLUGINS`.
	 */
	public static function dismiss( string $slug ): void {
		$dismissed = self::get_dismissed();

		if ( ! in_array( $slug, $dismissed, true ) ) {
			$dismissed[] = $slug;
			update_user_option( get_current_user_id(), self::DISMISSED_OPTION, $dismissed );
		}
	}
}
