<?php
/**
 * Plugins that bring social replies back to the site.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status;
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
	 * @var array<string, array{file: string, version_constant: string, service: string, settings_page: string}>
	 */
	const PLUGINS = array(
		'atmosphere'  => array(
			'file'             => 'atmosphere/atmosphere.php',
			'version_constant' => 'ATMOSPHERE_VERSION',
			'service'          => 'bluesky',
			'settings_page'    => 'options-general.php?page=atmosphere',
		),
		'activitypub' => array(
			'file'             => 'activitypub/activitypub.php',
			'version_constant' => 'ACTIVITYPUB_PLUGIN_VERSION',
			'service'          => 'mastodon',
			'settings_page'    => 'options-general.php?page=activitypub',
		),
	);

	/**
	 * The plugins the current user should be offered, with how to turn each one on.
	 *
	 * The action is `install` or `activate` through core's plugins REST API, `enable` for ActivityPub on
	 * WordPress.com Simple, or `marketplace` to install from WordPress.com.
	 *
	 * @return list<array{slug: string, plugin: string, service: string, action: string, install_url: string, settings_url: string}>
	 */
	public static function get_script_data(): array {
		$is_simple = ( new Host() )->is_wpcom_simple();
		$dismissed = self::get_dismissed();
		$plugins   = array();

		foreach ( self::PLUGINS as $slug => $plugin ) {
			if ( in_array( $slug, $dismissed, true ) || self::is_active( $slug ) ) {
				continue;
			}

			$action = $is_simple ? self::get_simple_action( $slug ) : self::get_plugin_action( $plugin['file'] );

			if ( null === $action ) {
				continue;
			}

			$plugins[] = array(
				'slug'         => $slug,
				// Core's REST plugin ID: the file path without `.php`.
				'plugin'       => substr( $plugin['file'], 0, -4 ),
				'service'      => $plugin['service'],
				'action'       => $action,
				'install_url'  => 'marketplace' === $action
					? 'https://wordpress.com/plugins/' . $slug . '/' . ( new Status() )->get_site_suffix()
					: '',
				'settings_url' => admin_url( $plugin['settings_page'] ),
			);
		}

		return $plugins;
	}

	/**
	 * How the current user can turn a plugin on through core, mirroring the checks core's `wp/v2/plugins` route makes.
	 *
	 * On WoA, wpcomsh denies the primitive capabilities on plans that cannot install plugins, but not `activate_plugin`.
	 *
	 * @param string $file The plugin file.
	 * @return string|null `install`, `activate`, or null when the user cannot.
	 */
	private static function get_plugin_action( string $file ): ?string {
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
	 * Whether a plugin is active, including network-wide and loaded some other way.
	 *
	 * @param string $slug The plugin slug.
	 * @return bool
	 */
	public static function is_active( string $slug ): bool {
		if ( ! isset( self::PLUGINS[ $slug ] ) ) {
			return false;
		}

		if ( defined( self::PLUGINS[ $slug ]['version_constant'] ) ) {
			return true;
		}

		if ( 'activitypub' === $slug && function_exists( 'wpcom_activitypub_is_active' ) ) {
			return wpcom_activitypub_is_active();
		}

		$active_plugins = (array) get_option( 'active_plugins', array() );
		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
		}

		return in_array( self::PLUGINS[ $slug ]['file'], $active_plugins, true );
	}

	/**
	 * The slugs of the plugins whose notice the current user dismissed on this site.
	 *
	 * @return string[]
	 */
	public static function get_dismissed(): array {
		$dismissed = get_user_option( self::DISMISSED_OPTION );

		return is_array( $dismissed ) ? array_values( array_intersect( $dismissed, array_keys( self::PLUGINS ) ) ) : array();
	}

	/**
	 * Hide a plugin's notice from the current user on this site, in every place it shows.
	 *
	 * @param string $slug The plugin slug.
	 * @return bool Whether the slug is a known plugin.
	 */
	public static function dismiss( string $slug ): bool {
		if ( ! isset( self::PLUGINS[ $slug ] ) ) {
			return false;
		}

		$dismissed = self::get_dismissed();

		if ( ! in_array( $slug, $dismissed, true ) ) {
			$dismissed[] = $slug;
			update_user_option( get_current_user_id(), self::DISMISSED_OPTION, $dismissed );
		}

		return true;
	}
}
