<?php

$json_jetpack_endpoints_dir = dirname( __FILE__ ) . '/';

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-endpoint.php' );

// THEMES
require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-themes-endpoint.php' );
require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-themes-active-endpoint.php' );

new Jetpack_JSON_API_Themes_Active_Endpoint( array(
	'description'     => 'Get the active theme of your blog',
	'stat'            => 'themes:mine',
	'method'          => 'GET',
	'path'            => '/sites/%s/themes/mine',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'id'           => '(string) The theme\'s ID.',
		'screenshot'   => '(string) A theme screenshot URL',
		'name'         => '(string) The name of the theme.',
		'description'  => '(string) A description of the theme.',
		'tags'         => '(array) Tags indicating styles and features of the theme.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes/mine'
) );

new Jetpack_JSON_API_Themes_Active_Endpoint( array(
	'description'     => 'Change the active theme of your blog',
	'method'          => 'POST',
	'path'            => '/sites/%s/themes/mine',
	'stat'            => 'themes:mine',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'query_parameters' => array(
		'context' => false
	),
	'request_format' => array(
		'theme'   => '(string) The ID of the theme that should be activated'
	),
	'response_format' => array(
		'id'           => '(string) The theme\'s ID.',
		'screenshot'   => '(string) A theme screenshot URL',
		'name'         => '(string) The name of the theme.',
		'description'  => '(string) A description of the theme.',
		'tags'         => '(array) Tags indicating styles and features of the theme.'
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'theme' => 'twentytwelve'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes/mine'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-themes-list-endpoint.php' );

new Jetpack_JSON_API_Themes_List_Endpoint( array(
	'description'     => 'Get WordPress.com Themes allowed on your blog',
	'group'           => '__do_not_document',
	'stat'            => 'themes',
	'method'          => 'GET',
	'path'            => '/sites/%s/themes',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'found'  => '(int) The total number of themes found.',
		'themes' => '(array) An array of theme objects.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-themes-update-endpoint.php' );

new Jetpack_JSON_API_Themes_Update_Endpoint( array(
	'description'     => 'Update Themes on a Jetpack blog',
	'method'          => 'POST',
	'path'            => '/sites/%s/themes/update',
	'stat'            => 'themes:update',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'request_format' => array(
		'themes'   => '(array) The list of themes to update',
	),
	'response_format' => array(
		'updated' => '(array) An array of updated theme stylesheets.',
		'errors'  => '(array) An array of not updated stylesheets.',
		'log'     => '(array:safehtml) An array of log strings.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes'
) );

new Jetpack_JSON_API_Themes_Update_Endpoint( array(
	'description'     => 'Update Themes on a Jetpack blog',
	'method'          => 'POST',
	'path'            => '/sites/%s/themes/%s/update',
	'stat'            => 'themes:1:update',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$theme' => '(string) The theme stylesheet',
	),
	'request_format' => array(
		'themes'   => '(array) The list of themes to update',
	),
	'response_format' => array(
		'updated' => '(array) An array of updated theme stylesheets.',
		'errors'  => '(array) An array of not updated stylesheets.',
		'log'     => '(array:safehtml) An array of log strings.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/themes'
) );

// PLUGINS

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-plugins-endpoint.php' );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-plugins-get-endpoint.php' );

new Jetpack_JSON_API_Plugins_Get_Endpoint( array(
	'description'     => 'Get the Plugin data.',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins/%s/',
	'stat'            => 'plugins:1',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin'   => '(string) The plugin ID',
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello-dolly%20hello'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-plugins-modify-endpoint.php' );

new Jetpack_JSON_API_Plugins_Modify_Endpoint( array(
	'description'     => 'Activate/Deactivate a Plugin on your Jetpack Site',
	'method'          => 'POST',
	'path'            => '/sites/%s/plugins/%s/',
	'stat'            => 'plugins:1',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin'   => '(string) The plugin ID',
	),
	'request_format' => array(
		'active'   => '(bool) The module activation status',
		'network_wide' => '(bool) Do action network wide (default value: false)'
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'active' => true,
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello-dolly%20hello'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-plugins-update-endpoint.php' );

new Jetpack_JSON_API_Plugins_Update_Endpoint( array(
	'description'     => 'Update a Plugin on your Jetpack Site',
	'method'          => 'POST',
	'path'            => '/sites/%s/plugins/%s/update/',
	'stat'            => 'plugins:1:update',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin'   => '(string) The plugin ID',
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/update'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-plugins-list-endpoint.php' );

new Jetpack_JSON_API_Plugins_List_Endpoint( array(
	'description'     => 'Get installed Plugins on your blog',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins',
	'stat'            => 'plugins',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'found'  => '(int) The total number of plugins found.',
		'plugins' => '(array) An array of plugin objects.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins'
) );

// Jetpack Modules

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-modules-endpoint.php' );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-modules-get-endpoint.php' );

new Jetpack_JSON_API_Modules_Get_Endpoint( array(
	'description'     => 'Get the info about a Jetpack Module on your Jetpack Site',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules/%s/',
	'stat'            => 'jetpack:modules:1',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'response_format' => Jetpack_JSON_API_Modules_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules/stats'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-modules-modify-endpoint.php' );

new Jetpack_JSON_API_Modules_Modify_Endpoint( array(
	'description'     => 'Modify the status of a Jetpack Module on your Jetpack Site',
	'method'          => 'POST',
	'path'            => '/sites/%s/jetpack/modules/%s/',
	'stat'            => 'jetpack:modules:1',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'request_format' => array(
		'active'   => '(bool) The module activation status',
	),
	'response_format' => Jetpack_JSON_API_Modules_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'active' => true,
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules/stats'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-modules-list-endpoint.php' );

new Jetpack_JSON_API_Modules_List_Endpoint( array(
	'description'     => 'Get the list of available Jetpack modules on your site',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules',
	'stat'            => 'jetpack:modules',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'found'  => '(int) The total number of modules found.',
		'modules' => '(array) An array of module objects.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules'
) );

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-updates-status-endpoint.php' );

new Jetpack_JSON_API_Updates_Status( array(
	'description'     => 'Get counts for available updates',
	'method'          => 'GET',
	'path'            => '/sites/%s/updates',
	'stat'            => 'updates',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'plugins'      => '(int) The total number of plugins updates.',
		'themes'       => '(int) The total number of themes updates.',
		'wordpress'    => '(int) The total number of core updates.',
		'translations' => '(int) The total number of translation updates.',
		'total'        => '(int) The total number of updates.',
		'wp_version'   => '(safehtml) The wp_version string.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/updates'
) );


// Jetpack Extras

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-check-capabilities-endpoint.php' );

new Jetpack_JSON_API_Check_Capabilities_Endpoint( array(
	'description'     => 'Check if the current user has a certain capability over a Jetpack site',
	'method'          => 'GET',
	'path'            => '/sites/%s/me/capability',
	'stat'            => 'me:capabulity',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => '(bool) True if the user has the queried capability.',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'capability' => 'A single capability or an array of capabilities'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/me/capability'
) );


// CORE

require_once( $json_jetpack_endpoints_dir . 'class.jetpack-json-api-core-update-endpoint.php' );

new Jetpack_JSON_API_Core_Update_Endpoint( array(
	'description'     => 'Update WordPress installation on a Jetpack blog',
	'method'          => 'POST',
	'path'            => '/sites/%s/core/update',
	'stat'            => 'core:update',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'request_format' => array(
		'version'   => '(string) The core version to update',
	),
	'response_format' => array(
		'version' => '(string) The core version after the upgrade has run.',
		'log'     => '(array:safehtml) An array of log strings.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/core/update'
) );
