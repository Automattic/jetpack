<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';


// POST /sites/%s/plugins/new
new Jetpack_JSON_API_Plugins_New_v1_2_Endpoint(
	array(
		'description'          => 'Install a plugin to a Jetpack site by uploading a zip file',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:new',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/new',
		'path_labels'          => array(
			'$site' => '(int|string) Site ID or domain',
		),
		'request_format'       => array(
			'zip' => '(zip) Plugin package zip file. multipart/form-data encoded. ',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_v1_2_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/new'
	)
);

class Jetpack_JSON_API_Plugins_New_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_New_Endpoint {
}
