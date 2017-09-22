<?php
new Jetpack_JSON_API_Plugins_Modify_v1_2_Endpoint(
	array(
		'description'          => 'Activate/Deactivate a Plugin on your Jetpack Site, or set automatic updates',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s',
		'stat'                 => 'plugins:1:modify',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(string) The plugin ID',
		),
		'request_format'       => array(
			'action'       => '(string) Possible values are \'update\'',
			'autoupdate'   => '(bool) Whether or not to automatically update the plugin',
			'active'       => '(bool) Activate or deactivate the plugin',
			'network_wide' => '(bool) Do action network wide (default value: false)',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_v1_2_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
			'body'    => array(
				'action' => 'update',
			)
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/hello-dolly%20hello'
	)
);

new Jetpack_JSON_API_Plugins_Modify_v1_2_Endpoint(
	array(
		'description'          => 'Activate/Deactivate a list of plugins on your Jetpack Site, or set automatic updates',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins',
		'stat'                 => 'plugins:modify',
		'path_labels'          => array(
			'$site' => '(int|string) The site ID, The site domain',
		),
		'request_format'       => array(
			'action'       => '(string) Possible values are \'update\'',
			'autoupdate'   => '(bool) Whether or not to automatically update the plugin',
			'active'       => '(bool) Activate or deactivate the plugin',
			'network_wide' => '(bool) Do action network wide (default value: false)',
			'plugins'      => '(array) A list of plugin ids to modify',
		),
		'response_format'      => array(
			'plugins'     => '(array:plugin) An array of plugin objects.',
			'updated'     => '(array) A list of plugin ids that were updated. Only present if action is update.',
			'not_updated' => '(array) A list of plugin ids that were not updated. Only present if action is update.',
			'log'         => '(array) Update log. Only present if action is update.',
		),
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
			'body'    => array(
				'active'  => true,
				'plugins' => array(
					'jetpack/jetpack',
					'akismet/akismet',
				),
			)
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins'
	)
);

new Jetpack_JSON_API_Plugins_Modify_v1_2_Endpoint(
	array(
		'description'          => 'Update a Plugin on your Jetpack Site',
		'min_version'          => '1.2',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/update/',
		'stat'                 => 'plugins:1:update',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(string) The plugin ID',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_v1_2_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/hello-dolly%20hello/update'
	)
);

class Jetpack_JSON_API_Plugins_Modify_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_Modify_Endpoint {
}
