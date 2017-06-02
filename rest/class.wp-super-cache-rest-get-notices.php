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

		include_once( ABSPATH . 'wp-admin/includes/file.php' ); // get_home_path()
		include_once( ABSPATH . 'wp-admin/includes/misc.php' ); // extract_from_markers()
		$this->add_rewrite_notice( $notices );
		$this->add_cache_disabled_notice( $notices );
		$this->add_compression_notice( $notices );
		$this->add_php_mod_rewrite_notice( $notices );

		if ( empty( $notices ) ) {
			return "{}";
		} else {
			return rest_ensure_response( $notices );
		}
	}

	/**
	 * @param array $notices
	 */
	protected function add_php_mod_rewrite_notice( & $notices ) {
		global $cache_enabled, $wp_cache_mod_rewrite;

		if ( $cache_enabled && !$wp_cache_mod_rewrite ) {
			$scrules = trim( implode( "\n", extract_from_markers( trailingslashit( get_home_path() ) . '.htaccess', 'WPSuperCache' ) ) );
			if ( $scrules != '' ) {
				$notices[ 'php_mod_rewrite' ] = array(
					'type' => 'warning',
					'message' => __(
						'Notice: PHP caching enabled but Supercache mod_rewrite rules detected. Cached files will be served using those rules. If your site is working ok, please ignore this message.  Otherwise, you can edit the .htaccess file in the root of your install and remove the SuperCache rules.',
						'wp-super-cache'
					),
				);
			}
		}
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

		$scrules = implode( "\n", extract_from_markers( $home_path . '.htaccess', 'WPSuperCache' ) );
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
				'message' => sprintf( __(
					'The .htaccess file is readonly and cannot be updated. Cache files will still be served by PHP. See <a href="%s">Changing File Permissions</a> on WordPress.org for help on fixing this.',
					'wp-super-cache'
				), 'https://codex.wordpress.org/Changing_File_Permissions' ),
			);
		}
	}
}
