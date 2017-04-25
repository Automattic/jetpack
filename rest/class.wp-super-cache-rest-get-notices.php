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
		$this->add_writable_notice( $notices );

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
	protected function add_writable_notice( & $notices ) {
		if ( is_writeable_ACLSafe( ABSPATH ) ) {
			$notices['cache_writable'] = array(
				'type' => 'warning',
				'message' => sprintf( __(
					'%s is writable. Please make it readonly after your page is generated as this is a security risk.',
					'wp-super-cache'
				), ABSPATH )
			);
		}
	}

	/**
	 * @param array $notices
	 */
	protected function add_rewrite_notice( & $notices ) {
		global $wp_cache_mod_rewrite, $cache_enabled, $home_path, $super_cache_enabled;

		// Return if the rewrite caching is disabled.
		if ( ! $cache_enabled || ! $super_cache_enabled || ! $wp_cache_mod_rewrite ) {
			return;
		}

		$scrules = implode( "\n", $this->extract_from_markers( $home_path . '.htaccess', 'WPSuperCache' ) );

		if ( $scrules == '' ) {
			$notices['mod_rewrite'] = array(
				'type' => 'warning',
				'message' => __(
					'The rewrite rules required by this plugin have changed or are missing. ',
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