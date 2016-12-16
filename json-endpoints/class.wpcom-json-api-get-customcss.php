<?php
/**
 * Custom Css endpoint
 *
 * https://public-api.wordpress.com/rest/v1.1/sites/$site/customcss/
 */

class WPCOM_JSON_API_Get_CustomCss_Endpoint extends WPCOM_JSON_API_Endpoint {
	/**
	 * API callback.
	 */
	function callback( $path = '', $blog_id = 0 ) {
		// Switch to the given blog.
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = array(
			'css' => Jetpack_Custom_CSS::get_css(),
			'preprocessor' => Jetpack_Custom_CSS::get_preprocessor_key(),
			'add_to_existing' => ! Jetpack_Custom_CSS::skip_stylesheet(),
		);

		$defaults = array(
			'css' => '',
			'preprocessor' => '',
			'add_to_existing' => true,
		);
		return wp_parse_args( $args, $defaults );
	}
}


