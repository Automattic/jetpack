<?php
/**
 * Plugins Library
 *
 * Helper functions for installing and activating plugins.
 *
 * Used by the REST API
 *
 * @autounit api plugins
 */

include_once( 'class.jetpack-automatic-install-skin.php' );

class Jetpack_Plugins {

	/**
	 * Install a plugin.
	 *
	 * @since 5.8.0
	 *
	 * @param string $slug Plugin slug.
	 *
	 * @return bool|WP_Error True if installation succeeded, error object otherwise.
	 */
	public static function install_plugin( $slug ) {
		if ( is_multisite() && ! current_user_can( 'manage_network' ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to install plugins on this site.', 'jetpack' ) );
		}

		$skin     = new Jetpack_Automatic_Install_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$zip_url  = self::generate_wordpress_org_plugin_download_link( $slug );

		$result = $upgrader->install( $zip_url );

		if ( is_wp_error( $result ) ) {
		  return $result;
		}

		$plugin     = Jetpack_Plugins::get_plugin_id_by_slug( $slug );
		$error_code = 'install_error';
		if ( ! $plugin ) {
		  $error = __( 'There was an error installing your plugin', 'jetpack' );
		}

		if ( ! $result ) {
		  $error_code                         = $upgrader->skin->get_main_error_code();
		  $message                            = $upgrader->skin->get_main_error_message();
		  $error = $message ? $message : __( 'An unknown error occurred during installation', 'jetpack' );
		}

		if ( ! empty( $error ) ) {
			if ( 'download_failed' === $error_code ) {
				// For backwards compatibility: versions prior to 3.9 would return no_package instead of download_failed.
				$error_code = 'no_package';
			}

			return new WP_Error( $error_code, $error, 400 );
		}

		return (array) $upgrader->skin->get_upgrade_messages();
	}

	 protected static function generate_wordpress_org_plugin_download_link( $plugin_slug ) {
		return "https://downloads.wordpress.org/plugin/$plugin_slug.latest-stable.zip";
	 }

	 public static function get_plugin_id_by_slug( $slug ) {
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$plugins = apply_filters( 'all_plugins', get_plugins() );
		if ( ! is_array( $plugins ) ) {
			return false;
		}
		foreach ( $plugins as $plugin_file => $plugin_data ) {
			if ( self::get_slug_from_file_path( $plugin_file ) === $slug ) {
				return $plugin_file;
			}
		}

		return false;
	}

	protected static function get_slug_from_file_path( $plugin_file ) {
		// Similar to get_plugin_slug() method.
		$slug = dirname( $plugin_file );
		if ( '.' === $slug ) {
			$slug = preg_replace( "/(.+)\.php$/", "$1", $plugin_file );
		}

		return $slug;
	}
}
