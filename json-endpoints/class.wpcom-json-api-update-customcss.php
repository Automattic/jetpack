<?php
/**
 * Custom Css update endpoint
 *
 * https://public-api.wordpress.com/rest/v1.1/sites/$site/customcss/
 */

class WPCOM_JSON_API_Update_CustomCss_Endpoint extends WPCOM_JSON_API_Endpoint {
	/**
	 * API callback.
	 */
	function callback( $path = '', $blog_id = 0 ) {
		// Switch to the given blog.
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error( 'unauthorized', 'User is not authorized to access custom css', 403 );
		}

		$args = $this->input();
		if ( empty( $args ) || ! is_array( $args ) ) {
			return new WP_Error( 'no_data', 'No data was provided.', 400 );
		}
		$save_args = array(
			'css' => $args['css'],
			'preprocessor' => $args['preprocessor'],
			'add_to_existing' => $args['add_to_existing'],
		);
		Jetpack_Custom_CSS::save( $save_args );

		$current = array(
			'css' => Jetpack_Custom_CSS::get_css(),
			'preprocessor' => Jetpack_Custom_CSS::get_preprocessor_key(),
			'add_to_existing' => ! Jetpack_Custom_CSS::skip_stylesheet(),
		);

		$defaults = array(
			'css' => '',
			'preprocessor' => '',
			'add_to_existing' => true,
		);
		return wp_parse_args( $current, $defaults );
	}
}



