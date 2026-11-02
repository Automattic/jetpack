<?php
/**
 * Plugins that bring social replies back to the site.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Suggests ATmosphere to sites sharing to Bluesky, and ActivityPub to sites sharing to Mastodon.
 */
class Companion_Plugins {

	/**
	 * User meta holding the slugs of the plugins whose notice the user dismissed.
	 */
	const DISMISSED_META_KEY = 'jetpack_social_dismissed_companion_plugins';

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
	 * The plugins the current user should be offered, with what the UI needs to install or activate them.
	 *
	 * @return list<array{slug: string, plugin: string, service: string, is_installed: bool, settings_url: string}>
	 */
	public static function get_script_data(): array {
		// Simple sites cannot install plugins.
		if ( ( new Host() )->is_wpcom_simple() ) {
			return array();
		}

		$dismissed = self::get_dismissed();
		$plugins   = array();

		foreach ( self::PLUGINS as $slug => $plugin ) {
			if ( in_array( $slug, $dismissed, true ) || self::is_active( $slug ) ) {
				continue;
			}

			$is_installed = file_exists( WP_PLUGIN_DIR . '/' . $plugin['file'] );

			// Mirrors the checks core's `wp/v2/plugins` route makes before it installs or activates.
			$can_act = $is_installed
				? current_user_can( 'activate_plugin', $plugin['file'] )
				: current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' );

			if ( ! $can_act ) {
				continue;
			}

			$plugins[] = array(
				'slug'         => $slug,
				// Core's REST plugin ID: the file path without `.php`.
				'plugin'       => substr( $plugin['file'], 0, -4 ),
				'service'      => $plugin['service'],
				'is_installed' => $is_installed,
				'settings_url' => admin_url( $plugin['settings_page'] ),
			);
		}

		return $plugins;
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

		$active_plugins = (array) get_option( 'active_plugins', array() );
		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) ) );
		}

		return in_array( self::PLUGINS[ $slug ]['file'], $active_plugins, true );
	}

	/**
	 * The slugs of the plugins whose notice the current user dismissed.
	 *
	 * @return string[]
	 */
	public static function get_dismissed(): array {
		$dismissed = get_user_meta( get_current_user_id(), self::DISMISSED_META_KEY, true );

		return is_array( $dismissed ) ? array_values( array_intersect( $dismissed, array_keys( self::PLUGINS ) ) ) : array();
	}

	/**
	 * Hide a plugin's notice from the current user, everywhere.
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
			update_user_meta( get_current_user_id(), self::DISMISSED_META_KEY, $dismissed );
		}

		return true;
	}
}
