<?php
/**
 * Marketplace Product Updates Provider
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Marketplace Product Updates
 *
 * This file hooks into the WordPress core's update API to provides new versions updates
 * related to the WPCOM Marketplace products.
 *
 * @package automattic/jetpack-mu-wpcom
 */
class Marketplace_Products_Updater {
	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'pre_set_site_transient_update_plugins', array( __CLASS__, 'transient_update_plugins' ), 100 );
		add_filter( 'pre_set_site_transient_update_themes', array( __CLASS__, 'transient_update_themes' ), 100 );
	}

	/**
	 * Fetch and process plugin updates.
	 *
	 * @param object $transient The update_plugins transient object.
	 *
	 * @return object The same or a modified version of the transient.
	 */
	public static function transient_update_plugins( $transient ) {
		$updates = self::fetch_updates( 'plugins' );

		foreach ( $updates as $remote_plugin_info ) {
			$filename = self::build_plugin_path( $remote_plugin_info['slug'] );

			$local_plugin_info = self::get_local_plugin_data( $filename );

			// Do not attempt to append update if plugin info not found. Maybe plugin does not exists on the site.
			if ( is_wp_error( $local_plugin_info ) ) {
				continue;
			}

			$update = (object) array(
				'slug'        => $remote_plugin_info['slug'],
				'plugin'      => $filename,
				'new_version' => $remote_plugin_info['version'],
				'package'     => $remote_plugin_info['download_link'],
			);

			if ( version_compare( $local_plugin_info['Version'], $update->new_version, '<' ) ) {
				$transient->response[ $update->plugin ] = $update;

				unset( $transient->no_update[ $filename ] );
			} else {
				// Clear package since we don't want to store download link under current version.
				$update->package = '';

				$transient->no_update[ $update->plugin ] = $update;

				unset( $transient->response[ $filename ] );
			}
		}

		return $transient;
	}

	/**
	 * Fetch and process themes updates.
	 *
	 * @param object $transient The update_themes transient object.
	 *
	 * @return object Updated transient object.
	 */
	public static function transient_update_themes( $transient ) {
		$updates = self::fetch_updates( 'themes' );

		foreach ( $updates as $remote_theme_info ) {
			$slug = $remote_theme_info['slug'];

			$local_theme_info = wp_get_theme( $slug );

			// Do not attempt to add update if theme info is not found. Maybe theme does not exists on the site.
			if ( ! $local_theme_info->exists() ) {
				continue;
			}

			$update = array(
				'theme'       => $slug,
				'package'     => $remote_theme_info['download_link'],
				'new_version' => $remote_theme_info['version'],
			);

			if ( version_compare( $local_theme_info->get( 'Version' ), $update['new_version'], '<' ) ) {
				$transient->response[ $slug ] = $update;
			} else {
				// Clear package since we don't want to store download link under current version.
				$update['package'] = '';

				$transient->no_update[ $slug ] = $update;
			}
		}

		return $transient;
	}

	/**
	 * Fetch the product updates from WPCOM servers.
	 *
	 * @param string $type The update type, mainly plugins or themes.
	 *
	 * @return array
	 */
	public static function fetch_updates( $type ) {
		if ( ! method_exists( 'Automattic\Jetpack\Connection\Client', 'wpcom_json_api_request_as_blog' ) ) {
			return array();
		}

		$cache_key = sprintf( '_wpcom_marketplace_%s_updates', $type );
		$updates   = get_transient( $cache_key );

		if ( false !== $updates ) {
			return $updates;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/marketplace/%s/updates', $type ),
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$updates = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $updates ) || ! array_key_exists( 'updates', $updates ) ) {
			return array();
		}

		set_transient( $cache_key, $updates['updates'], 12 * HOUR_IN_SECONDS );

		return $updates['updates'];
	}

	/**
	 * Build plugin path
	 *
	 * @param  mixed $slug the plugin slug.
	 *
	 * @return string
	 */
	public static function build_plugin_path( $slug ) {
		return sprintf( '%s/%s.php', $slug, $slug );
	}

	/**
	 * Get the local plugin data.
	 *
	 * @param  string $filename The plugin file path.
	 * @return string
	 */
	public static function get_local_plugin_data( $filename ) {
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return get_plugin_data( WP_PLUGIN_DIR . '/' . $filename );
	}
}
