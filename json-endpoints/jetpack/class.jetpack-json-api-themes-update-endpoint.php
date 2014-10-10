<?php

class Jetpack_JSON_API_Themes_Update_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST /sites/%s/themes/%s/update
	// POST /sites/%s/themes/update

	public function callback( $path = '', $blog_id = 0, $theme = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_input( $theme ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_themes() ) ) {
			return new WP_Error( 'unknown_theme', $error->get_error_messages() , 404 );
		}

		if ( is_wp_error( $result = $this->update_themes() ) ) {
			return $result;
		}

		if ( 1 === count( $this->themes ) ) {
			$theme        = $result['updated'][0];
			$theme['log'] = $result['log'];
			return $theme;
		}

		return $result;
	}

	function update_themes() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_update_themes();


		$skin      = new Automatic_Upgrader_Skin();
		$upgrader  = new Theme_Upgrader( $skin );

		$results   = $upgrader->bulk_upgrade( $this->themes );
		$log       = $upgrader->skin->get_upgrade_messages();

		$updated   = array();
		$errors    = array();

		foreach ( $results as $path => $result ) {
			if ( is_array( $result ) ) {
				$updated[ $path ] = $this->format_theme( wp_get_theme( $path ) );
			} else {
				$errors[] = $path;
			}
		}

		if ( 0 === count( $updated ) && 1 === count( $this->themes ) ) {
			return new WP_Error( 'update_fail', $log, 400 );
		}

		return array(
			'updated' => $updated,
			'errors'  => $errors,
			'log'     => $log
		);
	}
}
