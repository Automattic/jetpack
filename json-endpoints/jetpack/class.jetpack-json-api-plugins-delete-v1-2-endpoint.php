<?php
// POST /sites/%s/plugins/%s/delete
new Jetpack_JSON_API_Plugins_Delete_v1_2_Endpoint(
	array(
		'description'          => 'Delete/Uninstall a plugin from your jetpack blog',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:1:delete',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/delete',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(int|string) The plugin slug to delete',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_v1_2_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/akismet%2Fakismet/delete'
	)
);

class Jetpack_JSON_API_Plugins_Delete_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_Delete_Endpoint {}
