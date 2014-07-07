<?php

/**
 * Base class for Jetpack Endpoints, has the validate_call helper function.
 */
abstract class Jetpack_JSON_API_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Switches to the blog and checks current user capabilities.
	 * @return bool|WP_Error a WP_Error object or true if things are good.
	 */
	protected function validate_call( $_blog_id, $capability, $check_full_write = false ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $_blog_id ) );
		if ( is_wp_error( $blog_id ) )
			return $blog_id;

		if ( ! current_user_can( $capability ) || ( $check_full_write && ! Jetpack_Options::get_option( 'json_api_full_write' ) ) ) {
			return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog', 'jetpack' ), $capability ), 403 );
		}
		return true;
	}

}

// THEMES

/**
 * Base class for working with themes, has useful helper functions.
 */
abstract class Jetpack_JSON_API_Themes_Endpoint extends Jetpack_JSON_API_Endpoint {


	/**
	 * Format a theme for the public API
	 * @param  object $theme WP_Theme object
	 * @return array Named array of theme info used by the API
	 */
	protected function format_theme( $theme ) {

		$fields = array(
			'name'        => 'Name',
			'description' => 'Description',
			'tags'        => 'Tags',
			'version'     => 'Version'
		);

		$formatted_theme = array(
			'id'          => $theme->get_stylesheet(),
			'screenshot'  => jetpack_photon_url( $theme->get_screenshot() )
		);

		foreach( $fields as $key => $field )
			$formatted_theme[ $key ] = $theme->get( $field );

		return $formatted_theme;
	}

	/**
	 * Checks the query_args our collection endpoint was passed to ensure that it's in the proper bounds.
	 * @return bool|WP_Error a WP_Error object if the args are out of bounds, true if things are good.
	 */
	protected function check_query_args() {
		$args = $this->query_args();
		if ( $args['offset'] < 0 )
			return new WP_Error( 'invalid_offset', 'Offset must be greater than or equal to 0', 400 );
		if ( $args['limit'] < 0 )
			return new WP_Error( 'invalid_limit', 'Limit must be greater than or equal to 0', 400 );
		return true;
	}

	/**
	 * Format a list of themes for public display, using the supplied offset and limit args
	 * @uses   WPCOM_JSON_API_Endpoint::query_args()
	 * @param  array $themes List of WP_Theme objects
	 * @return array         Public API theme objects
	 */
	protected function format_themes( $themes ) {
		// ditch keys
		$themes = array_values( $themes );
		// do offset & limit - we've already returned a 400 error if they're bad numbers
		$args = $this->query_args();

		if ( $args['offset'] )
			$themes = array_slice( $themes, $args['offset'] );
		if ( $args['limit'] )
			$themes = array_slice( $themes, 0, $args['limit'] );

		return array_map( array( $this, 'format_theme' ), $themes );
	}
}

class Jetpack_JSON_API_Active_Theme_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET  /sites/%s/themes/mine => current theme
	// POST /sites/%s/themes/mine => switch theme
	public function callback( $path = '', $blog_id = 0  ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'switch_themes' ) ) ) {
			return $error;
		}

		if ( 'POST' === $this->api->method )
			return $this->switch_theme();
		else
			return $this->get_current_theme();
	}

	protected function switch_theme() {
		$args = $this->input();

		if ( ! isset( $args['theme'] ) || empty( $args['theme'] ) ) {
			return new WP_Error( 'missing_theme', 'You are required to specify a theme to switch to', 400 );
		}

		$theme_slug = $args['theme'];

		if ( ! $theme_slug ) {
			return new WP_Error( 'theme_not_found', 'theme is empty', 404 );
		}

		$theme = wp_get_theme( $theme_slug );

		if ( ! $theme->exists() ) {
			return new WP_Error( 'theme_not_found', 'The specified theme was not found', 404 );
		}

		switch_theme( $theme_slug );

		return $this->get_current_theme();
	}

	protected function get_current_theme() {
		return $this->format_theme( wp_get_theme() );
	}
}

new Jetpack_JSON_API_Active_Theme_Endpoint( array(
	'description'     => 'Get the active theme of your blog',
	'group'           => 'themes',
	'stat'            => 'themes:1:mine',
	'method'          => 'GET',
	'path'            => '/sites/%s/themes/mine',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'id'           => '(string) The theme\'s ID.</code>.',
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

new Jetpack_JSON_API_Active_Theme_Endpoint( array(
	'description'     => 'Change the active theme of your blog',
	'group'           => 'themes',
	'stat'            => 'themes:1:mine:update',
	'method'          => 'POST',
	'path'            => '/sites/%s/themes/mine',
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

class Jetpack_JSON_API_List_Themes_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	/**
	 * Enables preview URLs
	 * @var boolean
	 */
	protected $show_preview_urls = true;

	// /sites/%s/themes
	public function callback( $path = '', $blog_id = 0 ) {
		$check = $this->check_query_args();
		if ( is_wp_error( $check ) )
			return $check;

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
			return $error;
		}

		$args = $this->query_args();
		$themes = wp_get_themes( array(
			'sort' => $args['sort']
		) );

		$response = array();
		foreach( $this->response_format as $key => $val ) {
			switch ( $key ) {
				case 'found':
					$response[ $key ] = count( $themes );
					break;
				case 'themes':
					$response[ $key ] = $this->format_themes( $themes );
					break;
			}
		}
		return $response;
	}
}

new Jetpack_JSON_API_List_Themes_Endpoint( array(
	'description'     => 'Get WordPress.com Themes allowed on your blog',
	'group'           => '__do_not_document',
	'stat'            => 'themes:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/themes',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'query_parameters' => array(
		'sort'   => '(string=trending) Sort themes by trending, newest, or popular',
		'limit'  => '(int=0) Limit the number of themes returned. 0 for no limits.',
		'offset' => '(int=0) 0-indexed offset. Useful for pagination.'
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

// PLUGINS

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $network_wide = false;

	static $_response_format	= array(
		'id'          => '(string)  The plugin\'s ID',
		'active'      => '(boolean) The plugin status.',
		'update'      => '(array)   The plugin update info.',
		'Name'        => '(string)  The name of the plugin.',
		'PluginURI'   => '(string)  Link to the plugin\'s web site.',
		'Version'     => '(string)  The plugin version number.',
		'Description' => '(string)  Description of what the plugin does and/or notes from the author',
		'Author'      => '(string)  The author\'s name',
		'AuthorURI'   => '(string)  The authors web site address',
		'Network'     => '(boolean) Whether the plugin can only be activated network wide.',
	);

	protected static function format_plugin( $plugin_file, $plugin_data ) {
		$plugin = array();
		$plugin['id']     = urlencode( rtrim( $plugin_file, ".php" ) );
		$plugin['active'] = Jetpack::is_plugin_active( $plugin_file );
		$current = get_site_transient( 'update_plugins' );
		$plugin['update'] = ( isset( $current->response[ $plugin_file ] ) ) ? $current->response[ $plugin_file ] : array();
		return array_merge( $plugin, $plugin_data );
	}

	protected static function get_plugin( $plugin_file ) {
		$installed_plugins = get_plugins();
		if ( ! isset( $installed_plugins[ $plugin_file] ) )
			return new WP_Error( 'unknown_plugin', __( 'Plugin not found' ) );
		return self::format_plugin( $plugin_file, $installed_plugins[ $plugin_file] );
	}

	protected function validate_plugin( $plugin_file ) {
		if ( is_wp_error( $error = validate_plugin( $plugin_file ) ) ) {
			return new WP_Error( 'unknown_plugin', $error->get_error_messages(), 404 );
		}

		$args = $this->input();

		if ( isset( $args['network_wide'] ) && $args['network_wide'] ) {
			$this->network_wide = true;
		}

		if ( $this->network_wide && ! current_user_can( 'manage_network_plugins' ) ) {
			return new WP_Error( 'unauthorized', 'This user is not authorized to manage plugins network wide', 403 );
		}
	}

}


class Jetpack_JSON_API_Activate_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s/activate => activate_plugin
	public function callback( $path = '', $blog_id = 0, $plugin_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'activate_plugins' ) ) ) {
			return $error;
		}

		$plugin_file = urldecode( $plugin_slug ) . '.php';

		if ( is_wp_error( $error = $this->validate_plugin( $plugin_file ) ) ) {
			return $error;
		}
		return $this->activate_plugin( $plugin_file );
	}

	protected function activate_plugin( $plugin_file ) {

		if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $plugin_file ) ) || is_plugin_active_for_network( $plugin_file ) ) {
			return new WP_Error( 'plugin_active', 'The Plugin is already active', 404 );
		}

		$result = activate_plugin( $plugin_file, '', $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 404 );
		}

		$success = Jetpack::is_plugin_active( $plugin_file );
		if ( $success &&  $this->network_wide ) {
			$success &= is_plugin_active_for_network( $plugin_file );
		}

		if ( ! $success ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 404 );
		}

		$result = self::get_plugin( $plugin_file );
		return $result;
	}

}

new Jetpack_JSON_API_Activate_Plugin_Endpoint( array(
	'description'     => 'Activate a Plugin on your Jetpack Site',
	'group'           => 'manage',
	'stat'            => 'plugins:1:activate',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins/%s/activate/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin' => '(string) The plugin file name',
	),
	'query_parameters' => array(
		'network_wide' => '(bool) Do action network wide (default value: false)'
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'plugin' => 'hello'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/activate'
) );

class Jetpack_JSON_API_Deactivate_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s/deactivate => deactivate_plugin
	public function callback( $path = '', $blog_id = 0, $plugin_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'activate_plugins' ) ) ) {
			return $error;
		}

		$plugin_file = urldecode( $plugin_slug ) . '.php';

		if ( is_wp_error( $error = $this->validate_plugin( $plugin_file ) ) ) {
			return $error;
		}
		return $this->deactivate_plugin( $plugin_file );
	}

	protected function deactivate_plugin( $plugin_file ) {

		if ( ! Jetpack::is_plugin_active( $plugin_file ) ) {
			return new WP_Error( 'plugin_active', 'The Plugin is already deactivated', 404 );
		}

		$result = deactivate_plugins( $plugin_file, false, $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 404 );
		}

		$success = ! Jetpack::is_plugin_active( $plugin_file );
		if ( $success &&  $this->network_wide ) {
			$success &= ! is_plugin_active_for_network( $plugin_file );
		}

		if ( ! $success ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 404 );
		}

		$result = self::get_plugin( $plugin_file );
		return $result;
	}

}

new Jetpack_JSON_API_Deactivate_Plugin_Endpoint( array(
	'description'     => 'Deactivate a Plugin on your Jetpack Site',
	'group'           => 'manage',
	'stat'            => 'plugins:1:deactivate',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins/%s/deactivate/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin' => '(string) The plugin file name',
	),
	'query_parameters' => array(
		'network_wide' => '(bool) Do action network wide (default value: false)'
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'plugin' => 'hello'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/deactivate'
) );

class Jetpack_JSON_API_List_Plugins_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// /sites/%s/plugins
	public function callback( $path = '', $_blog_id = 0 ) {
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'update_plugins' ) ) ) {
			return $error;
		}

		$installed_plugins = get_plugins();

		$response = array();

		$response[ 'found' ] = count( $installed_plugins );

		foreach ( $installed_plugins as $plugin_file => $plugin_data ) {
			$response['plugins'][] = self::format_plugin( $plugin_file, $plugin_data );
		}

		return $response;
	}
}

new Jetpack_JSON_API_List_Plugins_Endpoint( array(
	'description'     => 'Get installed Plugins on your blog',
	'group'           => 'manage',
	'stat'            => 'plugins:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins',
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

/**
 * Base class for working with Jetpack Modules.
 */
abstract class Jetpack_JSON_API_Jetpack_Modules_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $network_wide = false;

	protected static function format_module( $module_slug ) {
		$module_data = Jetpack::get_module( $module_slug );
		$module = array();
		$module['id']     = $module_slug;
		$module['active'] = Jetpack::is_module_active( $module_slug );

		return array_merge( $module, $module_data );
	}

	protected static function get_module( $module_slug ) {
		if ( ! Jetpack::is_module( $module_slug ) )
			return new WP_Error( 'unknown_jetpack_module', __( 'Module not found'. $module_slug ) );
		return self::format_module( $module_slug );
	}
}


class Jetpack_JSON_API_Activate_Module_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// POST  /sites/%s/jetpack/modules/%s/activate => activate_module
	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'jetpack_manage_modules' ) ) ) {
			return $error;
		}
		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error( 'unknown_jetpack_module', __( 'Module not found' . $module_slug ) );
		}
		return $this->activate_module( $module_slug );
	}

	protected function activate_module( $module_slug ) {

		if ( Jetpack::is_module_active( $module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_active', 'The Module is already active', 404 );
		}

		$result = Jetpack::activate_module( $module_slug, false, false );

		// TODO return WP_Error instead of bool in order to forward the error message.
		if ( false === $result ) {
			return new WP_Error( 'activation_error', 'There was an error while activating the module ' . $module_slug, 404 );
		}

		if ( ! Jetpack::is_module_active( $module_slug ) ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 404 );
		}

		$response['module'] = self::get_module( $module_slug );
		return $response;
	}

}

new Jetpack_JSON_API_Activate_Module_Endpoint( array(
	'description'     => 'Activate a Jetpack Module on your Jetpack Site',
	'group'           => 'manage',
	'stat'            => 'jetpack-modules:1:activate',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules/%s/activate/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'response_format' => array(
		'module' => '(object) The module object.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'module' => 'stats'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules/stats/activate'
) );

class Jetpack_JSON_API_Deactivate_Module_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// POST  /sites/%s/jetpack/modules/%s/deactivate => deactivate_module
	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'jetpack_manage_modules' ) ) ) {
			return $error;
		}
		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error( 'unknown_jetpack_module', __( 'Module not found' . $module_slug ) );
		}
		return $this->deactivate_module( $module_slug );
	}

	protected function deactivate_module( $module_slug ) {

		if ( ! Jetpack::is_module_active( $module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_deactivated', 'The Jetpack Module is already deactivated', 404 );
		}

		$result = Jetpack::deactivate_module( $module_slug );

		if ( false === $result ) {
			return new WP_Error( 'deactivation_error', 'There was an error while deactivating the module ' . $module_slug, 404 );
		}

		if ( Jetpack::is_module_active( $module_slug ) ) {
			return new WP_Error( 'deactivation_error', 'There was an error while deactivating the module ' . $module_slug, 404 );
		}

		$response['module'] = self::get_module( $module_slug );
		return $response;
	}

}

new Jetpack_JSON_API_Deactivate_Module_Endpoint( array(
	'description'     => 'Deactivate a Jetpack Module on Site',
	'group'           => 'manage',
	'stat'            => 'jetpack-modules:1:deactivate',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules/%s/deactivate/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'response_format' => array(
		'module' => '(object) The module object.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'module' => 'stats'
		)
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules/stats/deactivate'
) );

class Jetpack_JSON_API_List_Modules_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {

	// /sites/%s/jetpack/modules
	public function callback( $path = '', $_blog_id = 0 ) {

		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'jetpack_manage_modules' ) ) ) {
			return $error;
		}

		$modules = Jetpack::get_available_modules();

		$response = array();
		$response[ 'found' ] = count( $modules );

		foreach ( $modules as $module_slug ) {
			$response['modules'][] = self::format_module( $module_slug );
		}

		return $response;
	}
}

new Jetpack_JSON_API_List_Modules_Endpoint( array(
	'description'     => 'Get the list of available Jetpack modules on your site',
	'group'           => 'manage',
	'stat'            => 'jetpack-modules:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules',
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

class Jetpack_JSON_API_GET_Update_Data extends Jetpack_JSON_API_Endpoint {

	// GET /sites/%s/updates
	public function callback( $path = '', $_blog_id = 0 ) {
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'manage_options' ) ) ) {
			return $error;
		}
		$update_data = wp_get_update_data();
		if ( !  isset( $update_data['counts'] ) ) {
			return new WP_Error( 'get_update_data_error', 'There was an error while getting the update data for this site', 404 );
		}
		return $update_data['counts'];
	}
}

new Jetpack_JSON_API_GET_Update_Data( array(
	'description'     => 'Get counts for available updates',
	'group'           => 'manage',
	'stat'            => 'core-updates:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/updates',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'plugins'      => '(int) The total number of plugins updates.',
		'themes'       => '(int) The total number of themes updates.',
		'wordpress'    => '(int) The total number of core updates.',
		'translations' => '(int) The total number of translation updates.',
		'total'        => '(int) The total number of updates.',
	),
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/updates'
) );

class Jetpack_JSON_API_Update_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// GET  /sites/%s/plugins/%s/update => upgrade_plugin
	public function callback( $path = '', $blog_id = 0, $plugin_slug = '' ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_plugins', true ) ) ) {
			return $error;
		}

		$plugin_file = urldecode( $plugin_slug ) . '.php';

		if ( is_wp_error( $error = $this->validate_plugin( $plugin_file ) ) ) {
			return $error;
		}
		return $this->upgrade_plugin( $plugin_file );
	}

	protected function upgrade_plugin( $plugin_file ) {

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// clear cache
		wp_clean_plugins_cache();
		wp_update_plugins(); // Check for Plugin updates

		$skin = new Automatic_Upgrader_Skin();
		// The Automatic_Upgrader_Skin skin shouldn't output anything.
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->init();

		// unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );

		$result = $upgrader->upgrade( $plugin_file );

		if ( ! $result ) {
			return new WP_Error( 'plugin_up_to_date', 'The Plugin is already up to date', 404 );
		}
		if ( is_wp_error( $result) ) {
			return $result;
		}

		return self::get_plugin( $plugin_file );
	}

}

new Jetpack_JSON_API_Update_Plugin_Endpoint( array(
	'description'     => 'Update a Plugin on your Jetpack Site',
	'group'           => 'manage',
	'stat'            => 'plugins:1:update',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins/%s/update/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$plugin' => '(string) The plugin file name',
	),
	'response_format' => Jetpack_JSON_API_Plugins_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/plugins/hello/update'
) );