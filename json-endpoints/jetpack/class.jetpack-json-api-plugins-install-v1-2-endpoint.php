<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';
// POST /sites/%s/plugins/%s/install
new Jetpack_JSON_API_Plugins_Install_v1_2_Endpoint(
	array(
		'description'          => 'Install a plugin to your jetpack blog',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:1:install',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/install',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(int|string) The plugin slug to install',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_v1_2_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/akismet/install'
	)
);

class Jetpack_JSON_API_Plugins_Install_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_Install_Endpoint {
}
