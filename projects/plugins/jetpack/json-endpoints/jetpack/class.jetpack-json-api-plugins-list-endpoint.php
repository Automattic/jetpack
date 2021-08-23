<?php

new Jetpack_JSON_API_Plugins_List_Endpoint(
	array(
		'description'             => 'Get installed Plugins on your blog',
		'method'                  => 'GET',
		'path'                    => '/sites/%s/plugins',
		'stat'                    => 'plugins',
		'min_version'             => '1',
		'max_version'             => '1.1',
		'path_labels'             => array(
			'$site' => '(int|string) The site ID, The site domain',
		),
		'allow_jetpack_site_auth' => true,
		'response_format'         => array(
			'plugins' => '(plugin) An array of plugin objects.',
		),
		'example_request_data'    => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),
		'example_request'         => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins',
	)
);
// No v1.2 versions since they are .com only
class Jetpack_JSON_API_Plugins_List_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// GET /sites/%s/plugins
	protected $needed_capabilities = 'activate_plugins';
	public function validate_input( $plugin ) {
		wp_update_plugins();
		$this->plugins = array_keys( get_plugins() );
		return true;
	}
}


