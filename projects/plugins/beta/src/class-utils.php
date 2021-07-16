<?php
/**
 * Utilities class file for the Jetpack Beta plugin.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

/**
 * Utilities class file for the Jetpack Beta plugin.
 */
class Utils {

	/**
	 * Normalize a branch name.
	 *
	 * @param string $branch Branch name.
	 * @return string Normalized branch name.
	 */
	public static function normalize_branch_name( $branch ) {
		return preg_replace( '#^\.|[/\p{Cc}\p{Cn}\p{Co}\p{Cs}]#u', '_', $branch );
	}

	/**
	 * Builds URL to the admin area for the current site and specified query param.
	 *
	 * @param array $query Query string data.
	 */
	public static function admin_url( $query = array() ) {
		$query = array_merge( array( 'page' => 'jetpack-beta' ), $query );

		// If it's multisite, and a plugin is specified, and the plugin is network-activated,
		// link to the network URL instead of the regular one.
		if ( is_multisite() && isset( $query['plugin'] ) ) {
			$prefix = $query['plugin'] . '/';
			$l      = strlen( $prefix );
			foreach ( Plugin::get_plugin_file_map() as $nondev => $dev ) {
				if ( substr( $nondev, 0, $l ) !== $prefix ) {
					continue;
				}
				if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
					require_once ABSPATH . '/wp-admin/includes/plugin.php';
				}
				if ( is_plugin_active_for_network( $nondev ) || is_plugin_active_for_network( $dev ) ) {
					return network_admin_url( 'admin.php?' . http_build_query( $query ) );
				}
				break;
			}
		}

		return admin_url( 'admin.php?' . http_build_query( $query ) );
	}

	/**
	 * List options to sync.
	 */
	public static function options_to_sync() {
		return array(
			'jp_beta_autoupdate',
			'jp_beta_email_notifications',
		);
	}

	/**
	 * Get WP Option: jp_beta_autoupdate
	 */
	public static function is_set_to_autoupdate() {
		return get_option( 'jp_beta_autoupdate', false );
	}

	/**
	 * Get WP Option: jp_beta_email_notifications
	 */
	public static function is_set_to_email_notifications() {
		return get_option( 'jp_beta_email_notifications', true );
	}

	/**
	 * Helper function used to fetch remote data from WordPress.org, GitHub, and betadownload.jetpack.me
	 *
	 * @param string $url       - Url being fetched.
	 * @param string $transient - Transient name (manifest|org_data|github_commits_).
	 * @param bool   $bypass    - Whether to bypass cached response.
	 */
	public static function get_remote_data( $url, $transient, $bypass = false ) {
		$prefix = 'jetpack_beta_';
		$cache  = get_site_transient( $prefix . $transient );
		if ( $cache && ! $bypass ) {
			return $cache;
		}

		$remote_manifest = wp_remote_get( $url );

		if ( is_wp_error( $remote_manifest ) ) {
			return false;
		}

		$cache = json_decode( wp_remote_retrieve_body( $remote_manifest ) );
		set_site_transient( $prefix . $transient, $cache, MINUTE_IN_SECONDS * 15 );

		return $cache;
	}

	/**
	 * Delete set transients, e.g. when plugin is deactivated.
	 */
	public static function delete_all_transiants() {
		global $wpdb;

		// Multisite uses wp_sitemeta for transients. Non-multisite uses wp_options.
		if ( is_multisite() ) {
			$sql        = "SELECT meta_key AS n FROM {$wpdb->sitemeta} WHERE meta_key LIKE %s AND site_id = %d";
			$extra_vals = array( get_current_network_id() );
		} else {
			$sql        = "SELECT option_name AS n FROM {$wpdb->options} WHERE option_name LIKE %s";
			$extra_vals = array();
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$results = $wpdb->get_results( $wpdb->prepare( $sql, $wpdb->esc_like( '_site_transient_jetpack_beta_' ) . '%', ...$extra_vals ) );
		foreach ( $results as $row ) {
			delete_site_transient( substr( $row->n, 16 ) );
		}
	}

	/**
	 * Test whether the Beta Tester has been used.
	 *
	 * In other words, if any -dev version has been downloaded yet.
	 *
	 * @return bool
	 */
	public static function has_been_used() {
		foreach ( Plugin::get_plugin_file_map() as $dev ) {
			if ( file_exists( WP_PLUGIN_DIR . "/$dev" ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Lists plugins needing an update.
	 *
	 * @param bool $include_stable Set true to include stable versions.
	 * @return object[] Keys are plugin files, values are the plugin objects.
	 */
	public static function plugins_needing_update( $include_stable = false ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/update.php';

		// Determine the plugins needing updating.
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins();
		ob_end_clean();
		$updates = get_plugin_updates();

		// See if any of our plugins are to be updated.
		$our_plugins = Plugin::get_plugin_file_map();
		if ( $include_stable ) {
			$our_plugins += array_flip( $our_plugins );
		}
		$our_plugins[] = JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php';

		return array_intersect_key( $updates, array_flip( $our_plugins ) );
	}

	/**
	 * Rendering markdown for testing instructions.
	 *
	 * @param Plugin $plugin Plugin being processed.
	 * @param string $content Markdown content to render.
	 * @return string HTML.
	 */
	public static function render_markdown( Plugin $plugin, $content ) {
		return ParsedownExt::instance()
			->setPRLinkFormat( "https://github.com/{$plugin->repo()}/pull/%d" )
			->text( $content );
	}

}
