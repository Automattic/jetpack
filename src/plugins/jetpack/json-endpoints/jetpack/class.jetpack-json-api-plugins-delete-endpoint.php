<?php
// POST /sites/%s/plugins/%s/delete
new Jetpack_JSON_API_Plugins_Delete_Endpoint(
	array(
		'description'          => 'Delete/Uninstall a plugin from your jetpack blog',
		'group'                => '__do_not_document',
		'stat'                 => 'plugins:1:delete',
		'min_version'          => '1',
		'max_version'          => '1.1',
		'method'               => 'POST',
		'path'                 => '/sites/%s/plugins/%s/delete',
		'path_labels'          => array(
			'$site'   => '(int|string) The site ID, The site domain',
			'$plugin' => '(int|string) The plugin slug to delete',
		),
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/akismet%2Fakismet/delete'
	)
);
// v1.2
new Jetpack_JSON_API_Plugins_Delete_Endpoint(
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
		'response_format'      => Jetpack_JSON_API_Plugins_Endpoint::$_response_format_v1_2,
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN'
			),
		),
		'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/example.wordpress.org/plugins/akismet%2Fakismet/delete'
	)
);

class Jetpack_JSON_API_Plugins_Delete_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_plugins';
	protected $action = 'delete';

	protected function delete() {

		foreach ( $this->plugins as $plugin ) {

			if ( Jetpack::is_plugin_active( $plugin ) ) {
				$error = $this->log[ $plugin ][] = __( 'You cannot delete a plugin while it is active on the main site.', 'jetpack' );
				continue;
			}

			$result = delete_plugins( array( $plugin ) );
			if ( is_wp_error( $result ) ) {
				$error = $this->log[ $plugin ][] = $result->get_error_message();
			} else {
				$this->log[ $plugin ][] = 'Plugin deleted';
			}
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return new WP_Error( 'delete_plugin_error', $error, 400 );
		}

		return true;
	}

}
