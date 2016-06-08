<?php


require_once dirname( __FILE__ ) . '/class.json-api-site-base.php';

abstract class Abstract_Jetpack_Site extends SAL_Site {
	abstract protected function get_constant( $name );

	abstract protected function current_theme_supports( $feature_name );

	abstract protected function get_theme_support( $feature_name );

	abstract protected function get_jetpack_version();

	abstract protected function get_updates();

	abstract protected function main_network_site();

	abstract protected function wp_version();

	abstract protected function max_upload_size();

	abstract protected function is_main_network();

	abstract protected function is_multi_site();

	abstract protected function is_version_controlled();

	abstract protected function file_system_write_access();

	function before_render() {
	}

	function after_render( &$response ) {
		// Add the updates only make them visible if the user has manage options permission and the site is the main site of the network
		if ( current_user_can( 'manage_options' ) && $this->is_main_site( $response ) ) {
			$jetpack_update = $this->get_updates();
			if ( ! empty( $jetpack_update ) ) {
				// In previous version of Jetpack 3.4, 3.5, 3.6 we synced the wp_version into to jetpack_updates
				unset( $jetpack_update['wp_version'] );
				// In previous version of Jetpack 3.4, 3.5, 3.6 we synced the site_is_version_controlled into to jetpack_updates
				unset( $jetpack_update['site_is_version_controlled'] );

				$response['updates'] = $jetpack_update;
			}
		}
	}

	function after_render_options( &$options ) {

		$options['jetpack_version'] = $this->get_jetpack_version();

		if ( $main_network_site = $this->main_network_site() ) {
			$options['main_network_site'] = (string) rtrim( $main_network_site, '/' );
		}

		if ( is_array( $active_modules = Jetpack_Options::get_option( 'active_modules' ) ) ) {
			$options['active_modules'] = (array) array_values( $active_modules );
		}

		$options['software_version'] = (string) $this->wp_version();
		$options['max_upload_size']  = $this->max_upload_size();

		// Sites have to prove that they are not main_network site.
		// If the sync happends right then we should be able to see that we are not dealing with a network site
		$options['is_multi_network'] = (bool) $this->is_main_network();
		$options['is_multi_site']    = (bool) $this->is_multi_site();

		$file_mod_disabled_reasons = array_keys( array_filter( array(
			'automatic_updater_disabled'      => (bool) $this->get_constant( 'AUTOMATIC_UPDATER_DISABLED' ),
			// WP AUTO UPDATE CORE defaults to minor, '1' if true and '0' if set to false.
			'wp_auto_update_core_disabled'    => ! ( (bool)  $this->get_constant( 'WP_AUTO_UPDATE_CORE' ) ),
			'is_version_controlled'           => (bool) $this->is_version_controlled(),
			// By default we assume that site does have system write access if the value is not set yet.
			'has_no_file_system_write_access' => ! (bool) $this->file_system_write_access(),
			'disallow_file_mods'              => (bool)  $this->get_constant( 'DISALLOW_FILE_MODS' ),
		) ) );

		$options['file_mod_disabled'] = empty( $file_mod_disabled_reasons ) ? false : $file_mod_disabled_reasons;
	}

	function get_jetpack_modules() {
		if ( is_user_member_of_blog() ) {
			return array_values( Jetpack_Options::get_option( 'active_modules', array() ) );
		}

		return null;
	}

	function is_vip() {
		return false; // this may change for VIP Go sites, which sync using Jetpack
	}

	function is_multisite() {
		return (bool) is_multisite();
	}

	function is_single_user_site() {
		return (bool) Jetpack::is_single_user_site();
	}

	function featured_images_enabled() {
		return $this->current_theme_supports( 'post-thumbnails' );
	}

	function get_post_formats() {
		// deprecated - see separate endpoint. get a list of supported post formats
		$all_formats = get_post_format_strings();
		$supported   = $this->get_theme_support( 'post-formats' );

		$supported_formats = array();

		if ( isset( $supported[0] ) ) {
			foreach ( $supported[0] as $format ) {
				$supported_formats[ $format ] = $all_formats[ $format ];
			}
		}

		return $supported_formats;
	}

	/**
	 * Private methods
	 **/

	private function is_main_site( $response ) {
		if ( isset( $response['options']->main_network_site, $response['options']->unmapped_url ) ) {
			$main_network_site_url = set_url_scheme( $response['options']->main_network_site, 'http' );
			$unmapped_url          = set_url_scheme( $response['options']->unmapped_url, 'http' );
			if ( $unmapped_url === $main_network_site_url ) {
				return true;
			}
		}

		return false;
	}
}
