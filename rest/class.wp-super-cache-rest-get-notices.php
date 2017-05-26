<?php

class WP_Super_Cache_Rest_Get_Notices extends WP_REST_Controller {

	/**
	 * Get any notices that might be visible.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$notices = array();

		$this->add_rewrite_notice( $notices );
		$this->add_cache_disabled_notice( $notices );
		$this->add_compression_notice( $notices );

		return rest_ensure_response( $notices );
	}

	/**
	 * @param array $notices
	 */
	protected function add_cache_disabled_notice( & $notices ) {
		global $wp_cache_config_file;

		if ( ! is_writeable_ACLSafe( $wp_cache_config_file ) ) {
			$notices['cache_disabled'] = array(
				'type' => 'warning',
				'message' => __(
					'Read Only Mode. Configuration cannot be changed.',
					'wp-super-cache'
				),
			);
		}
	}

	/**
	 * @param array $notices
	 */
	protected function add_compression_notice( & $notices ) {
		if ( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$notices['compression_disabled'] = array(
				'type' => 'warning',
				'message' => __(
					'Compression disabled by a site administrator.',
					'wp-super-cache'
				),
			);
		} elseif ( false == function_exists( 'gzencode' ) ) {
			$notices['compression_disabled'] = array(
				'type' => 'warning',
				'message' => __(
					'Warning! Compression is disabled as gzencode() function was not found.',
					'wp-super-cache'
				),
			);
		}
	}

	/**
	 * @param array $notices
	 */
	protected function add_rewrite_notice( & $notices ) {
		global $home_path, $wp_cache_config_file;

		include( $wp_cache_config_file );

		// Return if the rewrite caching is disabled.
		if ( ! $cache_enabled || ! $super_cache_enabled || ! $wp_cache_mod_rewrite ) {
			return;
		}

		include_once( ABSPATH . 'wp-admin/includes/misc.php' );
		include_once( ABSPATH . 'wp-admin/includes/file.php' );
		$scrules = implode( "\n", $this->extract_from_markers( $home_path . '.htaccess', 'WPSuperCache' ) );
		extract( wpsc_get_htaccess_info() );

		if ( $scrules != $rules ) {
			$notices[ 'mod_rewrite_rules' ] = array(
				'type' => 'warning',
				'message' => __(
					'The rewrite rules required by this plugin have changed or are missing. Cache files will still be served by PHP.',
					'wp-super-cache'
				),
			);
		}
		$got_rewrite = apache_mod_loaded( 'mod_rewrite', true );
		if ( $wp_cache_mod_rewrite && false == apply_filters( 'got_rewrite', $got_rewrite ) ) {
			$notices['mod_rewrite_missing'] = array(
				'type' => 'warning',
				'message' => __(
					'The mod_rewrite module has not been detected. Cache files will still be served by PHP.',
					'wp-super-cache'
				),
			);
		}

		if ( !is_writeable_ACLSafe( $home_path . ".htaccess" ) ) {
			$notices[ 'htaccess_ro' ] = array(
				'type' => 'warning',
				'message' => __(
					'The .htaccess file is readonly and cannot be updated. Cache files will still be served by PHP.',
					'wp-super-cache'
				),
			);
		}
	}

	/**
	 * Copied from the wp-admin/misc.php file, which is not loaded in this context.
	 *
	 * @param string $filename
	 * @param string $marker
	 * @return array
	 */
	protected function extract_from_markers( $filename, $marker ) {
		$result = array ();

		if ( ! file_exists( $filename ) ) {
			return $result;
		}

		if ( $markerdata = explode( "\n", implode( '', file( $filename ) ) ) ) {
			$state = false;
			foreach ( $markerdata as $markerline ) {
				if ( strpos( $markerline, '# END ' . $marker ) !== false ) {
					$state = false;
				}

				if ( $state ) {
					$result[] = $markerline;
				}

				if ( strpos( $markerline, '# BEGIN ' . $marker ) !== false) {
					$state = true;
				}
			}
		}

		return $result;
	}
}
