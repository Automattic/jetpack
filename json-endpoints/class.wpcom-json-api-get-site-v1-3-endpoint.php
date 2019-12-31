<?php

new WPCOM_JSON_API_GET_Site_V1_3_Endpoint(
	array(
		'description'        => 'Get information about a site.',
		'group'              => 'sites',
		'stat'               => 'sites:X',
		'allowed_if_flagged' => true,
		'method'             => 'GET',
		'min_version'        => '1.3',
		'max_version'        => '1.3',
		'path'               => '/sites/%s',
		'path_labels'        => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'query_parameters'   => array(
			'context' => false,
		),
		'response_format'    => WPCOM_JSON_API_GET_Site_V1_3_Endpoint::$site_format,
		'example_request'    => 'https://public-api.wordpress.com/rest/v1.3/sites/en.blog.wordpress.com/',
	)
);

class WPCOM_JSON_API_GET_Site_V1_3_Endpoint extends WPCOM_JSON_API_GET_Site_V1_2_Endpoint {
	protected function render_option_keys( &$options_response_keys ) {

		$options = parent::render_option_keys( $options_response_keys );
		if ( array_key_exists( 'frame_nonce', $options ) ) {
			$site                   = $this->site;
			$options['frame_nonce'] = $site->get_frame_nonce();
		}

		return $options;
	}
}
