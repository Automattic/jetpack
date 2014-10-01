<?php

class Jetpack_JSON_API_Themes_Update_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST /sites/%s/themes/%s/update
	// POST /sites/%s/themes/update

	protected $themes = array();

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

	protected function validate_themes() {
		foreach ( $this->themes as $theme ) {
			if ( is_wp_error( $error = wp_get_theme( $theme )->errors() ) ) {
				return $error;
			}
		}
		return true;
	}

	protected function validate_input( $theme ) {

		if ( ! isset( $theme ) || empty( $theme ) ) {
			$args = $this->input();

			if ( ! $args['themes'] || empty( $args['themes'] ) ) {
				return new WP_Error( 'missing_theme', __( 'You are required to specify a theme to update.', 'jetpack' ), 400 );
			}
			if ( is_array( $args['themes'] ) ) {
				$this->themes = $args['themes'];
			} else {
				$this->themes[] = $theme;
			}
		} else {
			$this->themes[] = urldecode( $theme );
		}

		return true;
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
