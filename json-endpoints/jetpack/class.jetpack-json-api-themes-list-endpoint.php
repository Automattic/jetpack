<?php

class Jetpack_JSON_API_Themes_List_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	/**
	 * Enables preview URLs
	 * @var boolean
	 */
	protected $show_preview_urls = true;

	// /sites/%s/themes
	public function callback( $path = '', $blog_id = 0 ) {
		$check = $this->check_query_args();
		if ( is_wp_error( $check ) )
			return $check;

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes', false ) ) ) {
			return $error;
		}

		$themes = wp_get_themes( array( 'allowed' => true ) );

		$response = array();
		foreach( $this->response_format as $key => $val ) {
			switch ( $key ) {
				case 'found':
					$response[ $key ] = count( $themes );
					break;
				case 'themes':
					$response[ $key ] = $this->format_themes( $themes );
					break;
			}
		}
		return $response;
	}
}
