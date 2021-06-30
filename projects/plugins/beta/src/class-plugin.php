<?php
/**
 * The Plugin class handles all the stuff that varies between different plugins.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use InvalidArgumentException;

/**
 * The Plugin class handles all the stuff that varies between different plugins.
 */
class Plugin {

	/**
	 * Class instances.
	 *
	 * @var Plugin[]
	 */
	protected static $instances = null;

	/**
	 * Plugin file map.
	 *
	 * @var string[]
	 */
	protected static $file_map = null;

	/**
	 * WordPress plugin slug.
	 *
	 * @var string
	 */
	protected $slug;

	/**
	 * Plugin name (for display).
	 *
	 * @var string
	 */
	protected $name;

	/**
	 * Plugin file name.
	 *
	 * @var string
	 */
	protected $plugin_file;

	/**
	 * GitHub source repo slug.
	 *
	 * @var string
	 */
	protected $repo;

	/**
	 * GitHub mirror repo slug.
	 *
	 * @var string
	 */
	protected $mirror;

	/**
	 * Manifest URL.
	 *
	 * @var string
	 */
	protected $manifest_url;

	/**
	 * Manifest data.
	 *
	 * @var object|null
	 */
	protected $manifest_data = null;

	/**
	 * WordPress.org data.
	 *
	 * @var object|null
	 */
	protected $wporg_data = null;

	/**
	 * Installer.
	 *
	 * @var PluginInstaller|null
	 */
	protected $installer = null;

	/**
	 * Get instances for all known plugins.
	 *
	 * @param bool $no_cache Set true to bypass the transients cache.
	 * @return Plugin[]
	 * @throws PluginDataException If the plugin data cannot be fetched or is invalid.
	 */
	public static function get_all_plugins( $no_cache = false ) {
		if ( null === self::$instances ) {
			$data = Utils::get_remote_data( JETPACK_BETA_PLUGINS_URL, 'plugins_json', $no_cache );
			if ( ! is_object( $data ) ) {
				throw new PluginDataException( __( 'Failed to download list of plugins. Check your Internet connection.', 'jetpack-beta' ) );
			}

			$plugins = array();
			foreach ( $data as $slug => $info ) {
				try {
					$plugins[ $slug ] = new self( $slug, (array) $info );
				} catch ( InvalidArgumentException $ex ) {
					throw new PluginDataException(
						// translators: %1$s: Plugin slug. %2$s: Error message.
						sprintf( __( 'Invalid data for plugin %1$s: %2$s', 'jetpack-beta' ), $slug, $ex->getMessage() ),
						0,
						$ex
					);
				}
			}
			self::$instances = $plugins;

			// Save the list of plugins to an option, so that we don't have to potentially hit the network
			// on every request if we only want the list of plugin files (since transients aren't guaranteed last even 1 second).
			$map = array();
			foreach ( $plugins as $plugin ) {
				$plugin_file             = $plugin->plugin_file();
				$dev_plugin_file         = $plugin->dev_plugin_file();
				$map[ $plugin_file ]     = $dev_plugin_file;
				$map[ $dev_plugin_file ] = $plugin_file;
			}
			ksort( $map );
			update_option( 'jetpack_beta_plugin_file_map', $map );
			self::$file_map = $map;
		}

		return self::$instances;
	}

	/**
	 * Get an instance by slug.
	 *
	 * @param string $slug WordPress plugin slug.
	 * @param bool   $no_cache Set true to bypass the transients cache.
	 * @return Plugin|null
	 * @throws PluginDataException If the plugin data cannot be fetched or is invalid.
	 */
	public static function get_plugin( $slug, $no_cache = false ) {
		$plugins = self::get_all_plugins( $no_cache );
		return isset( $plugins[ $slug ] ) ? $plugins[ $slug ] : null;
	}

	/**
	 * Get a map of plugin files.
	 *
	 * @return string[] Map from dev to non-dev plugin files, and vice versa.
	 * @throws PluginDataException If the plugin data cannot be fetched or is invalid.
	 */
	public static function get_plugin_file_map() {
		if ( null === self::$file_map ) {
			self::$file_map = get_option( 'jetpack_beta_plugin_file_map', null );
			if ( null === self::$file_map ) {
				self::get_all_plugins();
			}
		}
		return self::$file_map;
	}

	/**
	 * Constructor.
	 *
	 * @param string $slug WordPress plugin slug.
	 * @param array  $config Configuration data.
	 * @throws InvalidArgumentException If config is invalid.
	 */
	public function __construct( $slug, array $config ) {
		$this->slug = $slug;
		foreach ( array(
			'name'         => array( $this, 'is_nonempty_string' ),
			'plugin_file'  => array( $this, 'is_nonempty_string' ),
			'repo'         => array( $this, 'is_repo' ),
			'mirror'       => array( $this, 'is_repo' ),
			'manifest_url' => array( $this, 'is_valid_url' ),
		) as $k => $validator ) {
			if ( ! isset( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Missing configuration field $k" );
			}
			if ( ! $validator( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Configuration field $k is not valid" );
			}
			$this->{$k} = $config[ $k ];
		}
	}

	/**
	 * Validate as a non-empty string.
	 *
	 * @param string $v Value.
	 * @return bool
	 */
	protected function is_nonempty_string( $v ) {
		return is_string( $v ) && '' !== $v;
	}

	/**
	 * Validate as a GitHub repo slug.
	 *
	 * @param string $v Value.
	 * @return bool
	 */
	protected function is_repo( $v ) {
		return (bool) preg_match( '!^[a-zA-Z0-9][a-zA-Z0-9-]*/[a-zA-Z0-9.-]+$!', $v );
	}

	/**
	 * Validate as a valid URL.
	 *
	 * @param string $v Value.
	 * @return bool
	 */
	protected function is_valid_url( &$v ) {
		$v = filter_var( $v, FILTER_VALIDATE_URL, FILTER_FLAG_PATH_REQUIRED );
		return $v && substr( $v, 0, 8 ) === 'https://';
	}

	/**
	 * Get the name of the plugin.
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Get the plugin slug.
	 *
	 * @return string
	 */
	public function plugin_slug() {
		return $this->slug;
	}

	/**
	 * Get the dev plugin slug.
	 *
	 * @return string
	 */
	public function dev_plugin_slug() {
		return "{$this->slug}-dev";
	}

	/**
	 * Get the plugin file name.
	 *
	 * @return string
	 */
	public function plugin_file() {
		return $this->plugin_slug() . '/' . $this->plugin_file;
	}

	/**
	 * Get the dev plugin file name.
	 *
	 * @return string
	 */
	public function dev_plugin_file() {
		return $this->dev_plugin_slug() . '/' . $this->plugin_file;
	}

	/**
	 * Get the manifest data (i.e. branches) for the plugin.
	 *
	 * @param bool $no_cache Set true to bypass the transients cache.
	 * @return object
	 * @throws PluginDataException If the plugin manifest cannot be fetched or is invalid.
	 */
	public function get_manifest( $no_cache = false ) {
		if ( null === $this->manifest_data ) {
			$data = Utils::get_remote_data( $this->manifest_url, "manifest_$this->slug", $no_cache );
			if ( ! is_object( $data ) ) {
				throw new PluginDataException(
					// translators: %s: Plugin slug.
					sprintf( __( 'Failed to download manifest for plugin \'%s\'. Check your Internet connection.', 'jetpack-beta' ), $this->slug )
				);
			}
			$this->manifest_data = $data;
		}
		return $this->manifest_data;
	}

	/**
	 * Get the WordPress.org plugin data for the plugin.
	 *
	 * @param bool $no_cache Set true to bypass the transients cache.
	 * @return object
	 * @throws PluginDataException If the data cannot be fetched or is invalid.
	 */
	public function get_wporg_data( $no_cache = false ) {
		if ( null === $this->wporg_data ) {
			$url  = sprintf( 'https://api.wordpress.org/plugins/info/1.0/%s.json', $this->slug );
			$data = Utils::get_remote_data( $url, "wporg_data_$this->slug", $no_cache );
			if ( ! is_object( $data ) ) {
				throw new PluginDataException(
					// translators: %s: Plugin slug.
					sprintf( __( 'Failed to download WordPress.org data for plugin \'%s\'. Check your Internet connection.', 'jetpack-beta' ), $this->slug )
				);
			}
			$this->wporg_data = $data;
		}
		return $this->wporg_data;
	}

	/**
	 * Get the information for the installed dev version of the plugin.
	 *
	 * @return object|null
	 */
	public function dev_info() {
		$file = WP_PLUGIN_DIR . "/{$this->dev_plugin_slug()}/.jpbeta.json";
		if ( ! file_exists( $file ) ) {
			return null;
		}

		// Initialize the WP_Filesystem API.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		if ( ! WP_Filesystem( $creds ) ) {
			return new WP_Error( 'fs_api_error', __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) );
		}
		global $wp_filesystem;
		$info = json_decode( $wp_filesystem->get_contents( $file ) );
		return is_object( $info ) ? $info : null;
	}

	/**
	 * Get the PluginInstaller for this plugin.
	 *
	 * @return PluginInstaller
	 */
	public function installer() {
		if ( ! $this->installer ) {
			$this->installer = new PluginInstaller( $this );
		}
		return $this->installer;
	}

}
