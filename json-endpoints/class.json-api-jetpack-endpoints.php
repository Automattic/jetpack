<?php

include JETPACK__PLUGIN_DIR . '/modules/module-info.php';

/**
 * Base class for Jetpack Endpoints, has the validate_call helper function.
 */
abstract class Jetpack_JSON_API_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Switches to the blog and checks current user capabilities.
	 * @return bool|WP_Error a WP_Error object or true if things are good.
	 */
	protected function validate_call( $_blog_id, $capability, $check_full_management = true ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $_blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( is_wp_error( $error = $this->check_capability( $capability ) ) ) {
			return $error;
		}

		if ( $check_full_management && ! Jetpack_Options::get_option( 'json_api_full_management' ) ) {
			return new WP_Error( 'unauthorized_full_access', sprintf( __( 'Full management mode is off for this site.' , 'jetpack' ), $capability ), 403 );
		}
		return true;
	}

	/**
	 * @param $capability
	 *
	 * @return bool|WP_Error
	 */
	protected function check_capability( $capability ) {
		if ( is_array( $capability ) ) {
			// the idea is that the we can pass in an array of capabilitie that the user needs to have before we allowing them to do something
			$capabilities = ( isset( $capability['capabilities'] ) ? $capability['capabilities'] : $capability );

			// We can pass in the number of conditions we must pass by default it is all.
			$must_pass = ( isset( $capability['must_pass'] ) && is_int( $capability['must_pass'] ) ? $capability['must_pass'] : count( $capabilities ) );

			$failed = array(); // store the failed capabilities
			$passed = 0; //

			foreach ( $capabilities as $cap ) {
				if ( current_user_can( $cap ) ) {
					$passed ++;
				} else {
					$failed[] = $cap;
				}
			}
			// Check that must have conditions is less then
			if ( $passed < $must_pass ) {
				return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), implode( ', ', $failed ), 403 ) );
			}

		} else {
			if ( !current_user_can( $capability ) ) {
				return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), $capability ), 403 );
			}
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
			'screenshot'  => jetpack_photon_url( $theme->get_screenshot(), array(), 'network_path' )
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
			return new WP_Error( 'invalid_offset', __( 'Offset must be greater than or equal to 0.', 'jetpack' ), 400 );
		if ( $args['limit'] < 0 )
			return new WP_Error( 'invalid_limit', __( 'Limit must be greater than or equal to 0.', 'jetpack' ), 400 );
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

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'switch_themes', true ) ) ) {
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
			return new WP_Error( 'missing_theme', __( 'You are required to specify a theme to switch to.', 'jetpack' ), 400 );
		}

		$theme_slug = $args['theme'];

		if ( ! $theme_slug ) {
			return new WP_Error( 'theme_not_found', __( 'Theme is empty.', 'jetpack' ), 404 );
		}

		$theme = wp_get_theme( $theme_slug );

		if ( ! $theme->exists() ) {
			return new WP_Error( 'theme_not_found', __( 'The specified theme was not found.', 'jetpack' ), 404 );
		}

		if ( ! $theme->is_allowed() ) {
			return new WP_Error( 'theme_not_found', __( 'You are not allowed to switch to this theme', 'jetpack' ), 403 );
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

new Jetpack_JSON_API_Active_Theme_Endpoint( array(
	'description'     => 'Change the active theme of your blog',
	'group'           => 'themes',
	'stat'            => 'themes:mine:POST',
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

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes', false ) ) ) {
			return $error;
		}

		$themes = wp_get_themes( array( 'allowed' => true ) );

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

// PLUGINS

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $network_wide = false;
	protected $plugin;

	protected $action;
	protected $needed_capabilities;

	static $_response_format	= array(
		'id'          => '(string)  The plugin\'s ID',
		'active'      => '(boolean) The plugin status.',
		'update'      => '(object)  The plugin update info.',
		'name'        => '(string)  The name of the plugin.',
		'plugin_url'  => '(url)  Link to the plugin\'s web site.',
		'version'     => '(string)  The plugin version number.',
		'description' => '(safehtml)  Description of what the plugin does and/or notes from the author',
		'author'      => '(string)  The author\'s name',
		'author_url'  => '(url)  The authors web site address',
		'network'     => '(boolean) Whether the plugin can only be activated network wide.',
	);

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities, true ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_network_wide() ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_plugin( $plugin ) ) ) {
			return $error;
		}

		if ( ! empty( $this->action ) ) {
			if ( is_wp_error( $error = call_user_func( array( $this, $this->action ) ) ) ) {
				return $error;
			}
		}

		return self::get_plugin( $this->plugin );
	}

	protected static function format_plugin( $plugin_file, $plugin_data ) {
		$plugin = array();
		$plugin['id']     = preg_replace("/(.+)\.php$/", "$1", urlencode( $plugin_file ) );
		$plugin['active'] = Jetpack::is_plugin_active( $plugin_file );

		$current          = get_site_transient( 'update_plugins' );
		$plugin['update'] = ( isset( $current->response[ $plugin_file ] ) ) ? $current->response[ $plugin_file ] : null;

		$plugin['name']        = $plugin_data['Name'];
		$plugin['plugin_url']  = $plugin_data['PluginURI'];
		$plugin['version']     = $plugin_data['Version'];
		$plugin['description'] = $plugin_data['Description'];
		$plugin['author']      = $plugin_data['Author'];
		$plugin['author_url']  = $plugin_data['AuthorURI'];
		$plugin['network']     = $plugin_data['Network'];

		return $plugin;
	}

	protected function get_plugin() {
		$installed_plugins = get_plugins();
		if ( ! isset( $installed_plugins[ $this->plugin ] ) )
			return new WP_Error( 'unknown_plugin', __( 'Plugin not found.', 'jetpack' ), 404 );
		return self::format_plugin( $this->plugin, $installed_plugins[ $this->plugin ] );
	}

	protected function validate_network_wide() {
		$args = $this->input();

		if ( isset( $args['network_wide'] ) && $args['network_wide'] ) {
			$this->network_wide = true;
		}

		if ( $this->network_wide && ! current_user_can( 'manage_network_plugins' ) ) {
			return new WP_Error( 'unauthorized', __( 'This user is not authorized to manage plugins network wide.', 'jetpack' ), 403 );
		}

		return true;
	}

	protected function validate_plugin( $plugin ) {

		if ( ! isset( $plugin) || empty( $plugin ) ) {
			return new WP_Error( 'missing_plugin', __( 'You are required to specify a plugin to activate.', 'jetpack' ), 400 );
		}

		$this->plugin = urldecode( $plugin ) . '.php';

		if ( is_wp_error( $error = validate_plugin( $this->plugin ) ) ) {
			return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
		}

		return true;
	}

}

class Jetpack_JSON_API_Get_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// GET  /sites/%s/plugins/%s
	protected $needed_capabilities = 'activate_plugins';
}

new Jetpack_JSON_API_Get_Plugin_Endpoint( array(
	'description'     => 'Get the Plugin data.',
	'group'           => 'plugins',
	'stat'            => 'plugins:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/plugins/%s/',
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


class Jetpack_JSON_API_Modify_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST  /sites/%s/plugins/%s
	protected $needed_capabilities = 'activate_plugins';

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
		$args = $this->input();
		if ( isset( $args[ 'active' ] ) ) {
			$this->action = $args[ 'active' ] ? 'activate_plugin' : 'deactivate_plugin';
		}
		return parent::callback( $path, $blog_id, $plugin );
	}

	protected function activate_plugin() {
		if ( ( ! $this->network_wide && Jetpack::is_plugin_active( $this->plugin ) ) || is_plugin_active_for_network( $this->plugin ) ) {
			return new WP_Error( 'plugin_already_active', __( 'The Plugin is already active.', 'jetpack' ), 400 );
		}

		$result = activate_plugin( $this->plugin, '', $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 500 );
		}

		$success = Jetpack::is_plugin_active( $this->plugin );
		if ( $success &&  $this->network_wide ) {
			$success &= is_plugin_active_for_network( $this->plugin );
		}

		if ( ! $success ) {
			return new WP_Error( 'activation_error', $result->get_error_messages(), 500 );
		}

		return true;
	}

	protected function deactivate_plugin() {

		if ( ! Jetpack::is_plugin_active( $this->plugin ) ) {
			return new WP_Error( 'plugin_already_deactivated', __( 'The Plugin is already deactivated.', 'jetpack' ), 400 );
		}

		$result = deactivate_plugins( $this->plugin, false, $this->network_wide );

		if ( is_wp_error( $result ) ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 500 );
		}

		$success = ! Jetpack::is_plugin_active( $this->plugin );
		if ( $success &&  $this->network_wide ) {
			$success &= ! is_plugin_active_for_network( $this->plugin );
		}

		if ( ! $success ) {
			return new WP_Error( 'deactivation_error', $result->get_error_messages(), 500 );
		}

		return true;
	}
}

new Jetpack_JSON_API_Modify_Plugin_Endpoint( array(
	'description'     => 'Modify a Plugin on your Jetpack Site',
	'group'           => 'plugins',
	'stat'            => 'plugins:1',
	'method'          => 'POST',
	'path'            => '/sites/%s/plugins/%s/',
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

class Jetpack_JSON_API_Update_Plugin_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// POST /sites/%s/plugins/update => upgrade_plugin
	protected $action = 'upgrade_plugin';
	protected $needed_capabilities = 'update_plugins';

	protected function upgrade_plugin() {

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// clear cache
		wp_clean_plugins_cache();
		ob_start();
		wp_update_plugins(); // Check for Plugin updates
		ob_end_clean();

		$skin = new Automatic_Upgrader_Skin();
		// The Automatic_Upgrader_Skin skin shouldn't output anything.
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->init();

		// unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_themes' );

		ob_start();
		$result = $upgrader->upgrade( $this->plugin );
		$output = ob_get_contents();
		ob_end_clean();

		if ( false === $result ) {
			return new WP_Error( 'plugin_up_to_date', __( 'The Plugin is already up to date.', 'jetpack' ), 400 );
		}
		if ( empty( $result ) && ! empty( $output ) ) {
			return new WP_Error( 'unknown_error', __( 'There was an error while trying to upgrade.', 'jetpack' ), 500 );
		}
		if ( is_wp_error( $result) ) {
			return $result;
		}

		return true;
	}

}

new Jetpack_JSON_API_Update_Plugin_Endpoint( array(
	'description'     => 'Update a Plugin on your Jetpack Site',
	'group'           => 'plugins',
	'stat'            => 'plugins:1:update',
	'method'          => 'POST',
	'path'            => '/sites/%s/plugins/%s/update/',
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

class Jetpack_JSON_API_List_Plugins_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// GET /sites/%s/plugins
	public function callback( $path = '', $_blog_id = 0 ) {
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'activate_plugins', false ) ) ) {
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
	'group'           => 'plugins',
	'stat'            => 'plugins',
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

	protected $module_slug;
	protected $action;

	static $_response_format = array(
		'id'          => '(string)   The module\'s ID',
		'active'      => '(boolean)  The module\'s status.',
		'name'        => '(string)   The module\'s name.',
		'description' => '(safehtml) The module\'s description.',
		'sort'        => '(int)      The module\'s display order.',
		'introduced'  => '(string)   The Jetpack version when the module was introduced.',
		'changed'     => '(string)   The Jetpack version when the module was changed.',
		'free'        => '(boolean)  The module\'s Free or Paid status.',
		'module_tags' => '(array)    The module\'s tags.'
	);

	protected static function format_module( $module_slug ) {
		$module_data = Jetpack::get_module( $module_slug );


		$module = array();
		$module['id']                = $module_slug;
		$module['active']            = Jetpack::is_module_active( $module_slug );
		$module['name']              = $module_data['name'];
		$module['short_description'] = $module_data['description'];
		$module['sort']              = $module_data['sort'];
		$module['introduced']        = $module_data['introduced'];
		$module['changed']           = $module_data['changed'];
		$module['free']              = $module_data['free'];
		$module['module_tags']       = $module_data['module_tags'];

		// Fetch the HTML formatted long description
		ob_start();
		if ( Jetpack::is_active() && has_action( 'jetpack_module_more_info_connected_' . $module_slug ) ) {
			do_action( 'jetpack_module_more_info_connected_' . $module_slug );
		} else {
			do_action( 'jetpack_module_more_info_' . $module_slug );
		}
		$module['description']  = ob_get_clean();

		return $module;
	}

	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'jetpack_manage_modules', true ) ) ) {
			return $error;
		}
		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error( 'unknown_jetpack_module', sprintf( __( 'Module not found: `%s`.', 'jetpack' ), $module_slug ), 404 );
		}

		$this->module_slug = $module_slug;

		if ( ! empty( $this->action ) &&  is_wp_error( $error = call_user_func( array( $this, $this->action ) ) ) ) {
			return $error;
		}

		return self::get_module( $module_slug );
	}

	protected static function get_module( $module_slug ) {
		if ( ! Jetpack::is_module( $module_slug ) )
			return new WP_Error( 'unknown_jetpack_module', sprintf( __( 'Module not found: `%s`.', 'jetpack' ), $module_slug ), 404 );
		return self::format_module( $module_slug );
	}
}

class Jetpack_JSON_API_Get_Module_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// GET  /sites/%s/jetpack/modules/%s
	protected $action;
}

new Jetpack_JSON_API_Get_Module_Endpoint( array(
	'description'     => 'Modify the status of a Jetpack Module on your Jetpack Site',
	'group'           => 'jetpack',
	'stat'            => 'jetpack:modules:1',
	'method'          => 'GET',
	'path'            => '/sites/%s/jetpack/modules/%s/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'response_format' => Jetpack_JSON_API_Jetpack_Modules_Endpoint::$_response_format,
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.org/jetpack/modules/stats'
) );

class Jetpack_JSON_API_Modify_Module_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// POST  /sites/%s/jetpack/modules/%s/activate

	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		$args = $this->input();
		if ( isset( $args[ 'active' ] ) ) {
			$this->action = $args[ 'active' ] ? 'activate_module' : 'deactivate_module';
		}
		return parent::callback( $path, $blog_id, $module_slug );
	}

	protected function activate_module() {

		if ( Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_active', __( 'The Module is already active.', 'jetpack' ), 400 );
		}

		$result = Jetpack::activate_module( $this->module_slug, false, false );

		// TODO return WP_Error instead of bool in order to forward the error message.
		if ( false === $result || ! Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'activation_error', sprintf( __( 'There was an error while activating the module `%s`.', 'jetpack' ), $this->module_slug ), 500 );
		}

		return true;
	}

	protected function deactivate_module() {

		if ( ! Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'jetpack_module_already_deactivated', __( 'The Jetpack Module is already deactivated.', 'jetpack' ), 400 );
		}

		$result = Jetpack::deactivate_module( $this->module_slug );

		if ( false === $result || Jetpack::is_module_active( $this->module_slug ) ) {
			return new WP_Error( 'deactivation_error', sprintf( __( 'There was an error while deactivating the module `%s`.', 'jetpack' ), $this->module_slug ), 500 );
		}

		return true;
	}

}

new Jetpack_JSON_API_Modify_Module_Endpoint( array(
	'description'     => 'Modify the status of a Jetpack Module on your Jetpack Site',
	'group'           => 'jetpack',
	'stat'            => 'jetpack:modules:1',
	'method'          => 'POST',
	'path'            => '/sites/%s/jetpack/modules/%s/',
	'path_labels' => array(
		'$site'   => '(int|string) The site ID, The site domain',
		'$module' => '(string) The module name',
	),
	'request_format' => array(
		'active'   => '(bool) The module activation status',
	),
	'response_format' => Jetpack_JSON_API_Jetpack_Modules_Endpoint::$_response_format,
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

class Jetpack_JSON_API_List_Modules_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// GET /sites/%s/jetpack/modules
	public function callback( $path = '', $_blog_id = 0 ) {

		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'jetpack_manage_modules', false ) ) ) {
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
	'group'           => 'jetpack',
	'stat'            => 'jetpack:modules',
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

		$error = $this->validate_call( $_blog_id, array(
													'must_pass'    => 1, // must meet at least one condition
													'capabilities' => array(
														'update_plugins',
														'update_themes',
														'update_core'
													)
												  ), false );

		if ( is_wp_error( $error ) ) {
			return $error;
		}
		$update_data = wp_get_update_data();
		if ( !  isset( $update_data['counts'] ) ) {
			return new WP_Error( 'get_update_data_error', __( 'There was an error while getting the update data for this site.', 'jetpack' ), 500 );
		}
		return $update_data['counts'];
	}
}

new Jetpack_JSON_API_GET_Update_Data( array(
	'description'     => 'Get counts for available updates',
	'group'           => 'jetpack',
	'stat'            => 'updates',
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


// Jetpack Extras


class Jetpack_Check_Capabilities_Endpoint extends Jetpack_JSON_API_Jetpack_Modules_Endpoint {
	// GET /sites/%s/me/capability
	public function callback( $path = '', $_blog_id = 0 ) {
		// Check minimum capability and blog membership first
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'read', false ) ) ) {
			return $error;
		}

		$args = $this->input();

		if ( ! isset( $args['capability'] ) || empty( $args['capability'] ) ) {
			return new WP_Error( 'missing_capability', __( 'You are required to specify a capability to check.', 'jetpack' ), 400 );
		}

		$capability = $args['capability'];
		if ( is_array( $capability ) ) {
			$results = array_map( 'current_user_can', $capability );
			return array_combine( $capability, $results );
		} else {
			return current_user_can( $capability );
		}
	}
}

new Jetpack_Check_Capabilities_Endpoint( array(
	'description'     => 'Check if the current user has a certain capability over a Jetpack site',
	'group'           => 'jetpack',
	'stat'            => 'jetpack:me:capability',
	'method'          => 'GET',
	'path'            => '/sites/%s/me/capability',
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
