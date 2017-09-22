<?php

new Jetpack_JSON_API_Plugins_List_v1_2_Endpoint(
	array(
		'description'          => 'Get installed Plugins on your blog',
		'min_version'          => '1.2',
		'method'               => 'GET',
		'path'                 => '/sites/%s/plugins',
		'stat'                 => 'plugins',
		'path_labels'          => array(
			'$site' => '(int|string) The site ID, The site domain'
		),
		'response_format'      => array(
			'plugins' => '(array) An array of plugin objects.',
		),
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins'
	)
);
error_log('LOADED' );
class Jetpack_JSON_API_Plugins_List_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_v1_2_Endpoint {

	protected $needed_capabilities = 'activate_plugins';

	public function validate_input( $plugin ) {
		error_log('V1.2 VALIDATE PLUGINS>>' );
		wp_update_plugins();
		$this->plugins = array_keys( get_plugins() );

		return true;
	}
}