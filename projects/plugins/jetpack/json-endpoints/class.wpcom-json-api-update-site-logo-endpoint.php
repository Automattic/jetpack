<?php

new WPCOM_JSON_API_Update_Site_Logo_Endpoint( array (
	'description'      => 'Set site logo settings',
	'group'            => '__do_not_document',
	'stat'             => 'sites:1:logo',
	'method'           => 'POST',
	'min_version'      => '1.1',
	'path'             => '/sites/%s/logo',
	'path_labels'      => array(
		'$site' => '(string) Site ID or domain.',
	),
	'request_format'  => array(
		'id' => '(int) The ID of the logo post',
		'url' => '(string) The URL of the logo post',
	),
	'response_format'  => array(
		'id' => '(int) The ID of the logo post',
		'url' => '(string) The URL of the logo post',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/logo',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
		'body' => array(
			'id' => 12345,
			'url' => 'https://s.w.org/about/images/logos/codeispoetry-rgb.png',
		),
	),
	'example_response' => '
	{
		"id": 12345,
		"url": "https:\/\/s.w.org\/about\/images\/logos\/codeispoetry-rgb.png"
	}'
) );

new WPCOM_JSON_API_Update_Site_Logo_Endpoint( array (
	'description'      => 'Delete site logo settings',
	'group'            => '__do_not_document',
	'stat'             => 'sites:1:logo:delete',
	'method'           => 'POST',
	'min_version'      => '1.1',
	'path'             => '/sites/%s/logo/delete',
	'path_labels'      => array(
		'$site' => '(string) Site ID or domain.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/logo/delete',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );

class WPCOM_JSON_API_Update_Site_Logo_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $site_id = 0 ) {
		// Switch to the given blog.
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error( 'unauthorized', 'User is not authorized to access logo settings', 403 );
		}

		if ( strpos( $path, '/delete' ) ) {
			delete_option( 'site_logo' );
			return array();
		}

		$args = $this->input();
		$logo_settings = $this->get_current_settings();
		if ( empty( $args ) || ! is_array( $args ) ) {
			return $logo_settings;
		}

		if ( isset( $args['id'] ) ) {
			$logo_settings['id'] = (int) $args['id'];
		}
		if ( isset( $args['url'] ) ) {
			$logo_settings['url'] = $args['url'];
		}
		if ( isset( $args['url'] ) || isset( $args['id'] ) ) {
			update_option( 'site_logo', $logo_settings );
		}

		return $this->get_current_settings();
	}

	function get_current_settings() {
		remove_action( 'option_site_logo', 'jetpack_site_logo_block_compat' );
		$logo_settings = get_option( 'site_logo' );
		add_action( 'option_site_logo', 'jetpack_site_logo_block_compat' );
		if ( ! is_array( $logo_settings ) ) {
			$logo_settings = array();
		}
		return $logo_settings;
	}
}

