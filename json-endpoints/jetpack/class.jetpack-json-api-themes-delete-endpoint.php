<?php

class Jetpack_JSON_API_Themes_Delete_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_themes';
	protected $action              = 'delete';

	protected function delete() {

		foreach( $this->themes as $theme ) {

			// Don't delete an active child theme
			if ( is_child_theme() && $theme == get_stylesheet() )  {
				$error = $this->log[ $theme ]['error'] = 'You cannot delete a theme while it is active on the main site.';
				continue;
			}

			if( $theme == get_template() ) {
				$error = $this->log[ $theme ]['error'] = 'You cannot delete a theme while it is active on the main site.';
				continue;
			}

			$result = delete_theme( $theme );

			if ( is_wp_error( $result ) ) {
				$error = $this->log[ $theme ]['error'] = $result->get_error_messages;
			} else {
				$this->log[ $theme ][] = 'Theme deleted';
			}

		}

		if( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'delete_theme_error', $error, 400 );
		}

		return true;
	}

}
