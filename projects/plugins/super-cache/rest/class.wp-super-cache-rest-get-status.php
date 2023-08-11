<?php

class WP_Super_Cache_Rest_Get_Status extends WP_REST_Controller {

	/**
	 * Get any status that might be visible.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$status = array();

		include_once( ABSPATH . 'wp-admin/includes/file.php' ); // get_home_path()
		include_once( ABSPATH . 'wp-admin/includes/misc.php' ); // extract_from_markers()
		$this->add_rewrite_status( $status );
		$this->add_cache_disabled_status( $status );
		$this->add_compression_status( $status );
		$this->add_php_mod_rewrite_status( $status );
		$this->add_preload_status( $status );

		if ( empty( $status ) ) {
			return rest_ensure_response( new stdclass() );
		} else {
			return rest_ensure_response( $status );
		}
	}

	/**
	 * @param array $status
	 */
	protected function add_preload_status( & $status ) {
		global $wp_cache_config_file;

		include( $wp_cache_config_file );

		if ( false == $cache_enabled ) {
			$status[ 'preload_disabled_cache_off' ] = true;
		}
		if ( false == $super_cache_enabled ) {
			$status[ 'preload_disabled_supercache_off' ] = true;
		}
		if ( true === defined( 'DISABLESUPERCACHEPRELOADING' ) ) {
			$status[ 'preload_disabled_by_admin' ] = true;
		}
	}

	/**
	 * @param array $status
	 */
	protected function add_php_mod_rewrite_status( & $status ) {
		global $wp_cache_config_file;

		include( $wp_cache_config_file );

		if ( $cache_enabled && !$wp_cache_mod_rewrite ) {
			$scrules = trim( implode( "\n", extract_from_markers( trailingslashit( get_home_path() ) . '.htaccess', 'WPSuperCache' ) ) );
			if ( $scrules != '' ) {
				$status[ 'php_mod_rewrite' ] = true;
			}
		}
	}

	/**
	 * @param array $status
	 */
	protected function add_cache_disabled_status( & $status ) {
		global $wp_cache_config_file;

		if ( ! is_writeable_ACLSafe( $wp_cache_config_file ) ) {
			$status['cache_disabled'] = true;
		}
	}

	/**
	 * @param array $status
	 */
	protected function add_compression_status( & $status ) {
		if ( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$status['compression_disabled_by_admin'] = true;
		} elseif ( false == function_exists( 'gzencode' ) ) {
			$status['compression_disabled_no_gzencode'] = true;
		}
	}

	/**
	 * @param array $status
	 */
	protected function add_rewrite_status( & $status ) {
		global $home_path, $wp_cache_config_file;

		include( $wp_cache_config_file );

		// Return if the rewrite caching is disabled.
		if ( ! $cache_enabled || ! $super_cache_enabled || ! $wp_cache_mod_rewrite ) {
			return;
		}

		$scrules = implode( "\n", extract_from_markers( $home_path . '.htaccess', 'WPSuperCache' ) );
		extract( wpsc_get_htaccess_info() );

		if ( $scrules != $rules ) {
			$status[ 'mod_rewrite_rules' ] = true;
		}
		$got_rewrite = apache_mod_loaded( 'mod_rewrite', true );
		if ( $wp_cache_mod_rewrite && false == apply_filters( 'got_rewrite', $got_rewrite ) ) {
			$status[ 'mod_rewrite_missing' ] = true;
		}

		if ( !is_writeable_ACLSafe( $home_path . ".htaccess" ) ) {
			$status[ 'htaccess_ro' ] = true;
		}
	}
}
