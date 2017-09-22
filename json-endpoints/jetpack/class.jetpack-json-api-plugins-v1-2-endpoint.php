<?php

/**
 * Base class for working with plugins.
 */
abstract class Jetpack_JSON_API_Plugins_v1_2_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	protected $plugins = array();
	protected $network_wide = false;
	protected $bulk = true;
	protected $log;

	static $_response_format = array(
		'slug'            => '(safehtml)  The plugin\'s .org slug',
		'active'          => '(boolean) The plugin status.',
		'update'          => '(object)  The plugin update info.',
		'name'            => '((safehtml)  The plugin\'s ID',
		'display_name'    => '(safehtml)  The name of the plugin.',
		'plugin_url'      => '(url)  Link to the plugin\'s web site.',
		'version'         => '(safehtml)  The plugin version number.',
		'description'     => '(safehtml)  Description of what the plugin does and/or notes from the author',
		'author'          => '(safehtml)  The author\'s name',
		'author_url'      => '(url)  The authors web site address',
		'network'         => '(boolean) Whether the plugin can only be activated network wide.',
		'autoupdate'      => '(boolean) Whether the plugin is automatically updated',
		'autoupdate_translation' => '(boolean) Whether the plugin is automatically updating translations',
		'log'             => '(array:safehtml) An array of update log strings.',
		'uninstallable'   => '(boolean) Whether the plugin is unistallable.',
		'action_links'    => '(array) An array of action links that the plugin uses.',
	);

	public function format_plugin( $plugin_file, $plugin_data ) {
		$plugin = array();
		$plugin['slug']            = Jetpack_Autoupdate::get_plugin_slug( $plugin_file );
		$plugin['active']          = Jetpack::is_plugin_active( $plugin_file );
		$plugin['name']            = preg_replace("/(.+)\.php$/", "$1", $plugin_file );
		$plugin['display_name']	   = $plugin_data['Name'];
		$plugin['plugin_url']      = $plugin_data['PluginURI'];
		$plugin['version']         = $plugin_data['Version'];
		$plugin['description']     = $plugin_data['Description'];
		$plugin['author']          = $plugin_data['Author'];
		$plugin['author_url']      = $plugin_data['AuthorURI'];
		$plugin['network']         = $plugin_data['Network'];
		$plugin['update']          = $this->get_plugin_updates( $plugin_file );
		$plugin['action_links']    = $this->get_plugin_action_links( $plugin_file );

		$autoupdate = in_array( $plugin_file, Jetpack_Options::get_option( 'autoupdate_plugins', array() ) );
		$plugin['autoupdate']      = $autoupdate;

		$autoupdate_translation = in_array( $plugin_file, Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() ) );
		$plugin['autoupdate_translation'] = $autoupdate || $autoupdate_translation || Jetpack_Options::get_option( 'autoupdate_translations', false );

		$plugin['uninstallable']   = is_uninstallable_plugin( $plugin_file );

		if ( ! empty ( $this->log[ $plugin_file ] ) ) {
			$plugin['log'] = $this->log[ $plugin_file ];
		}
		return $plugin;
	}
}