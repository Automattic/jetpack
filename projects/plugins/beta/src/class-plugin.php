<?php
/**
 * The Plugin class handles all the stuff that varies between different plugins.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Composer\Semver\Comparator as Semver;
use InvalidArgumentException;
use Plugin_Upgrader;
use WP_Ajax_Upgrader_Skin;
use WP_Error;

/**
 * The Plugin class handles all the stuff that varies between different plugins.
 */
class Plugin {

	/**
	 * Regex for the loader added to a mu-plugin loader.
	 *
	 * @todo When we drop support for PHP <7.1.0, make this a private const.
	 * @var string
	 */
	private static $mu_loader_regex = '#^<\?php\s+/\* Load Jetpack Beta dev version: \*/\s+return require\s*(?:\(\s*)?__DIR__\s*.\s*(?:\x27[^\x27]*\x27|"[^"]*")(?:\s*\))?\s*;#';

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
	 * Beta homepage URL.
	 *
	 * @var string
	 */
	protected $beta_homepage_url;

	/**
	 * Bug report URL.
	 *
	 * @var string
	 */
	protected $bug_report_url;

	/**
	 * If the plugin is not published to the WordPress Plugin Repository.
	 *
	 * @var bool
	 */
	protected $unpublished = false;

	/**
	 * If the plugin is to be installed as a mu-plugin.
	 *
	 * @since 4.1.0
	 * @var bool
	 */
	protected $is_mu_plugin = false;

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
	 * Get instances for all known plugins.
	 *
	 * @param bool $bypass_cache Set true to bypass the transients cache.
	 *
	 * @return Plugin[]
	 * @throws PluginDataException If the plugin data cannot be fetched or is invalid.
	 */
	public static function get_all_plugins( $bypass_cache = false ) {
		if ( null === self::$instances ) {
			$data = Utils::get_remote_data( JETPACK_BETA_PLUGINS_URL, 'plugins_json', $bypass_cache );
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
				$plugin_file         = $plugin->plugin_file();
				$dev_plugin_file     = $plugin->dev_plugin_file();
				$map[ $plugin_file ] = $dev_plugin_file;
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
		return $plugins[ $slug ] ?? null;
	}

	/**
	 * Get a map of plugin files.
	 *
	 * @return string[] Map from dev to non-dev plugin files, and vice versa.
	 */
	public static function get_plugin_file_map() {
		if ( null === self::$file_map ) {
			self::$file_map = get_option( 'jetpack_beta_plugin_file_map', null );
			if ( null === self::$file_map ) {
				try {
					self::get_all_plugins();
				} catch ( PluginDataException $ex ) {
					return array();
				}
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
			'name'              => array( $this, 'is_nonempty_string' ),
			'plugin_file'       => array( $this, 'is_nonempty_string' ),
			'repo'              => array( $this, 'is_repo' ),
			'mirror'            => array( $this, 'is_repo' ),
			'manifest_url'      => array( $this, 'is_valid_url' ),
			'beta_homepage_url' => array( $this, 'is_valid_url' ),
			'bug_report_url'    => array( $this, 'is_valid_url' ),
		) as $k => $validator ) {
			if ( ! isset( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Missing configuration field $k" );
			}
			if ( ! $validator( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Configuration field $k is not valid" );
			}
			$this->{$k} = $config[ $k ];
		}

		$this->unpublished  = ! empty( $config['unpublished'] );
		$this->is_mu_plugin = ! empty( $config['is_mu_plugin'] );
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
		return $v && str_starts_with( $v, 'https://' );
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
	 * Get the GitHub slug for the plugin's repo.
	 *
	 * @return string
	 */
	public function repo() {
		return $this->repo;
	}

	/**
	 * Get the GitHub slug for the plugin's mirror repo.
	 *
	 * @return string
	 */
	public function mirror_repo() {
		return $this->mirror;
	}

	/**
	 * Get the Beta homepage URL.
	 *
	 * @return string
	 */
	public function beta_homepage_url() {
		return $this->beta_homepage_url;
	}

	/**
	 * Get the bug report URL.
	 *
	 * @return string
	 */
	public function bug_report_url() {
		return $this->bug_report_url;
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
	 * Get the plugin file path.
	 *
	 * @since 4.1.0
	 * @return string
	 */
	public function plugin_path() {
		return ( $this->is_mu_plugin ? WPMU_PLUGIN_DIR : WP_PLUGIN_DIR ) . '/' . $this->plugin_file();
	}

	/**
	 * Get the dev plugin file path.
	 *
	 * @since 4.1.0
	 * @return string
	 */
	public function dev_plugin_path() {
		return ( $this->is_mu_plugin ? WPMU_PLUGIN_DIR : WP_PLUGIN_DIR ) . '/' . $this->dev_plugin_file();
	}

	/**
	 * Is this a mu-plugin?
	 *
	 * @since 4.1.0
	 * @return bool
	 */
	public function is_mu_plugin() {
		return $this->is_mu_plugin;
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
			// Update old data.
			if ( ! isset( $data->trunk ) && isset( $data->master ) ) {
				$data->trunk = $data->master;
			}
			unset( $data->master );
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
		if ( $this->unpublished ) {
			return (object) array();
		}

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
		$file = dirname( $this->dev_plugin_path() ) . '/.jpbeta.json';
		if ( ! file_exists( $file ) ) {
			return null;
		}

		// Initialize the WP_Filesystem API.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, '', array() );
		if ( ! WP_Filesystem( $creds ) ) {
			return new WP_Error( 'fs_api_error', __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) );
		}
		global $wp_filesystem;
		$info = json_decode( $wp_filesystem->get_contents( $file ) );
		if ( is_object( $info ) && $info->source === 'master' ) {
			// Update old data.
			$info->source = 'trunk';
		}
		return is_object( $info ) ? $info : null;
	}

	/**
	 * Determine if the plugin is active. Works for mu-plugins.
	 *
	 * @since 4.1.0
	 * @param string $which Which version to make active: "stable" or "dev".
	 * @return bool Is active?
	 * @throws InvalidArgumentException If `$which` is invalid.
	 */
	public function is_active( $which ) {
		if ( $which === 'stable' ) {
			$path = $this->plugin_file();
		} elseif ( $which === 'dev' ) {
			$path = $this->dev_plugin_file();
		} else {
			throw new InvalidArgumentException( __METHOD__ . ': $which must be "stable" or "dev".' );
		}

		if ( ! $this->is_mu_plugin ) {
			return is_plugin_active( $path );
		}

		$file = WPMU_PLUGIN_DIR . '/' . $this->plugin_slug() . '-loader.php';
		if ( ! file_exists( $file ) ) {
			return false;
		}

		// If the loader snippet is present, dev is active. If not, assume stable is active (or there wouldn't be a loader).
		// That assumption ignores things like how the usual wpcomsh-loader.php checks for IS_ATOMIC, but there's not much we can do about that and it's unlikely to matter anyway.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Not a remote URL.
		return ( (bool) preg_match( self::$mu_loader_regex, (string) file_get_contents( $file ) ) ) === ( $which === 'dev' );
	}

	/**
	 * Swap the activation record for the plugin.
	 *
	 * @param string $which Which version to make active: "stable" or "dev".
	 * @param bool   $activate Call `activate_plugin()` if the plugin wasn't already active.
	 * @return null|WP_Error
	 * @throws InvalidArgumentException If `$which` is invalid.
	 */
	public function select_active( $which, $activate = false ) {
		// The autoloader sets the cache in a shutdown hook. Clear it after the autoloader sets it.
		add_action( 'shutdown', array( self::class, 'clear_autoloader_plugin_cache' ), 99 );

		if ( 'stable' === $which ) {
			$from = $this->dev_plugin_file();
			$to   = $this->plugin_file();
		} elseif ( 'dev' === $which ) {
			$from = $this->plugin_file();
			$to   = $this->dev_plugin_file();
		} else {
			throw new InvalidArgumentException( __METHOD__ . ': $which must be "stable" or "dev".' );
		}

		// If we're a mu-plugin, we have to fake it by manually adjusting the mu-plugin loader.
		if ( $this->is_mu_plugin ) {
			return $this->update_mu_plugin_loader( $which );
		}

		// If the target is already active, nothing to do.
		if ( is_plugin_active( $to ) ) {
			return null;
		}

		// If the target doesn't exist, just deactivate the source.
		if ( ! file_exists( WP_PLUGIN_DIR . '/' . $to ) ) {
			return deactivate_plugins( $from );
		}

		if ( is_plugin_active_for_network( $from ) ) {
			// Iterate and replace so as to preserve order.
			// I don't know if that's important, or just accidental behavior of the old code.
			$arr = array();
			foreach ( get_site_option( 'active_sitewide_plugins' ) as $file => $date ) {
				$arr[ $file === $from ? $to : $file ] = $date;
			}
			update_site_option( 'active_sitewide_plugins', $arr );
			return null;
		} elseif ( is_plugin_active( $from ) ) {
			$arr = get_option( 'active_plugins' );
			$i   = array_search( $from, $arr, true );
			if ( false !== $i ) {
				$arr[ $i ] = $to;
			}
			update_option( 'active_plugins', $arr );
			return null;
		} elseif ( $activate ) {
			return activate_plugin( $to );
		}
	}

	/**
	 * Update the <slug>-loader.php file to activate/deactivate a mu-plugin.
	 *
	 * @param string $which Which version to make active: "stable" or "dev".
	 * @return null|WP_Error
	 */
	private function update_mu_plugin_loader( $which ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, '', array() );
		if ( ! WP_Filesystem( $creds ) ) {
			// Any problems and we exit.
			return new WP_Error( 'fs_error', 'Filesystem Problem' );
		}
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			return new WP_Error( 'fs_error', 'global $wp_filesystem is not set' );
		}

		$dir = $wp_filesystem->find_folder( WPMU_PLUGIN_DIR );

		$file = $dir . '/' . $this->plugin_slug() . '-loader.php';
		if ( ! $wp_filesystem->exists( $file ) ) {
			if ( $which !== 'dev' || ! file_exists( $this->dev_plugin_path() ) ) {
				return null;
			}
			$tmp      = get_plugin_data( $this->dev_plugin_path(), false, false );
			$contents = "<?php\n/**\n * Loader generated by Jetpack Beta plugin\n\n";
			if ( ! empty( $tmp['Name'] ) ) {
				$value     = str_replace( '*/', '', $tmp['Name'] );
				$contents .= " * Plugin Name: $value\n";
			}
			if ( ! empty( $tmp['Description'] ) ) {
				$value     = str_replace( '*/', '', $tmp['Description'] );
				$contents .= " * Description: $value\n";
			}
			$contents .= " */\n";
		} else {
			$contents = $wp_filesystem->get_contents( $file );
			if ( $contents === false ) {
				return is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ? $wp_filesystem->errors : new WP_Error( 'fs_error', "Unknown error while reading {$this->plugin_slug()}-loader.php" );
			}
			if ( ! str_starts_with( $contents, '<?php' ) ) {
				return new WP_Error( 'bad_mu_loader', "Mu-plugin loader {$this->plugin_slug()}-loader.php is unparseable" );
			}
		}

		// Strip our loader snippet, then re-add it if necessary.
		$new_contents = preg_replace( self::$mu_loader_regex, '<?php', $contents );
		if ( $which === 'dev' && file_exists( $this->dev_plugin_path() ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export -- Used for escaping, not output.
			$new_contents = '<?php /* Load Jetpack Beta dev version: */ return require __DIR__ . ' . var_export( "/{$this->dev_plugin_file()}", true ) . ';' . substr( $new_contents, 5 );
		}

		// Write the file, or delete it if it's our auto-generated file and turns out to be empty.
		if ( preg_match( '#^<\?php\s*/\*\*\n \* Loader generated by Jetpack Beta plugin\n\n(?: \* Plugin Name: .*\n)?(?: \* Description: .*\n)? \*/\s*$#', $new_contents ) ) {
			$what = 'deleting';
			$ok   = $wp_filesystem->delete( $file );
		} elseif ( $contents !== $new_contents ) {
			$what = 'updating';
			$ok   = $wp_filesystem->put_contents( $file, $new_contents );
		} else {
			$what = 'nothing';
			$ok   = true;
		}
		if ( ! $ok ) {
			return is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->has_errors() ? $wp_filesystem->errors : new WP_Error( 'fs_error', "Unknown error while $what {$this->plugin_slug()}-loader.php" );
		}
		return null;
	}

	/**
	 * Install & activate the plugin for the given branch.
	 *
	 * @param string $source Source of installation: "stable", "trunk", "rc", "pr", "release", or "unknown".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return null|WP_Error
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	public function install_and_activate( $source, $id ) {
		// Cleanup after previous version of the beta plugin.
		if ( $this->plugin_slug() === 'jetpack' && file_exists( WP_PLUGIN_DIR . '/jetpack-pressable-beta' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, '', array() );
			if ( ! WP_Filesystem( $creds ) ) {
				// Any problems and we exit.
				return new WP_Error( 'fs_error', 'Filesystem Problem' );
			}
			global $wp_filesystem;
			if ( ! $wp_filesystem ) {
				return new WP_Error( 'fs_error', 'global $wp_filesystem is not set' );
			}

			$working_dir = WP_PLUGIN_DIR . '/jetpack-pressable-beta';
			// Delete the folder `JETPACK_BETA_PLUGIN_FOLDER`.
			if ( $wp_filesystem->is_dir( $working_dir ) ) {
				$wp_filesystem->delete( $working_dir, true );
			}
			// Deactivate the plugin.
			deactivate_plugins( 'jetpack-pressable-beta/jetpack.php' );
		}

		// If we're asked to install "unknown", that means the unknown stable version.
		if ( 'unknown' === $source ) {
			return $this->select_active( 'stable', true );
		}

		// Load the info array and identify if it's "dev" or "stable".
		$ret = $this->get_which_and_info( $source, $id );
		if ( is_wp_error( $ret ) ) {
			return $ret;
		}
		list( $which, $info ) = $ret;

		// Get info for the currently installed version. Return early if that version is what we need.
		if ( 'dev' === $which ) {
			$fs_info = $this->dev_info();
		} else {
			$file = $this->plugin_path();
			if ( file_exists( $file ) ) {
				$tmp     = get_plugin_data( $file, false, false );
				$fs_info = (object) array(
					'source'  => $info->source,
					'version' => $tmp['Version'],
				);
			} else {
				$fs_info = null;
			}
		}
		if ( $fs_info && $fs_info->source === $info->source && $fs_info->version === $info->version ) {
			return $this->select_active( $which, true );
		}

		// Download and install.
		$ret = $this->install( $which, $info );
		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// And activate it.
		return $this->select_active( $which, true );
	}

	/**
	 * Get branch info for a source and ID.
	 *
	 * @param string $source Source of installation: "stable", "trunk", "rc", "pr", or "release".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return object|WP_Error
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	public function source_info( $source, $id ) {
		// Load the info array and identify if it's "dev" or "stable".
		$ret = $this->get_which_and_info( $source, $id );
		if ( is_wp_error( $ret ) ) {
			return $ret;
		}
		list( $which, $info ) = $ret;

		$info->which          = $which;
		$info->pretty_version = $this->pretty_version( $info );

		return $info;
	}

	/**
	 * Get the WordPress upgrader response for the plugin, if any.
	 *
	 * @return array{null|object,null|object} Either the update info + null, or null + the current (no-update) info, or double nulls if no dev version is known at all.
	 */
	public function dev_upgrader_response() {
		$dev_info = $this->dev_info();
		if ( ! $dev_info ) {
			// We can't know how to upgrade if there's no info.
			return array( null, null );
		}
		$manifest = $this->get_manifest( true );
		$slug     = $this->dev_plugin_slug();
		$info     = null;

		if ( 'pr' === $dev_info->source && ! isset( $manifest->pr->{$dev_info->id} ) && isset( $manifest->trunk ) ) {
			// It's a PR that is gone. Update to trunk.
			list( , $info ) = $this->get_which_and_info( 'trunk', '' );
		} elseif ( 'pr' === $dev_info->source && isset( $manifest->pr->{$dev_info->id} ) &&
			Semver::greaterThan( $manifest->pr->{$dev_info->id}->version, $dev_info->version )
		) {
			// It's a PR that has been updated.
			list( , $info ) = $this->get_which_and_info( 'pr', $dev_info->id );
		} elseif ( 'rc' === $dev_info->source && isset( $manifest->rc->download_url ) &&
			Semver::greaterThan( $manifest->rc->version, $dev_info->version )
		) {
			// It's an RC that has a new version.
			list( , $info ) = $this->get_which_and_info( 'rc', '' );
		} elseif ( 'trunk' === $dev_info->source && isset( $manifest->trunk ) &&
			Semver::greaterThan( $manifest->trunk->version, $dev_info->version )
		) {
			// Trunk has been updated.
			list( , $info ) = $this->get_which_and_info( 'trunk', '' );
		}

		if ( $info ) {
			return array(
				(object) array(
					'id'          => $slug,
					'plugin'      => $slug,
					'slug'        => $slug,
					'new_version' => $info->version,
					'package'     => $info->download_url,
					'url'         => $info->plugin_url,
					'jpbeta_info' => $info,
				),
				null,
			);
		} else {
			return array(
				null,
				(object) array(
					'id'          => $slug,
					'plugin'      => $slug,
					'slug'        => $slug,
					'new_version' => $dev_info->version,
					'url'         => $dev_info->plugin_url,
					'package'     => $dev_info->download_url,
				),
			);
		}
	}

	/**
	 * Get a WordPress API response for the dev plugin, if any.
	 *
	 * @param false|object|array $default Default value, if we can't fake up a response.
	 * @return false|object|array
	 */
	public function dev_plugins_api_response( $default = false ) {
		$dev_info = $this->dev_info();
		if ( ! $dev_info ) {
			return $default;
		}
		$file = $this->dev_plugin_path();
		if ( ! file_exists( $file ) ) {
			return $default;
		}
		$tmp = get_plugin_data( $file, false, false );

		// Read the plugin's to-test.md, or our generic testing tips should that not exist.
		$file = dirname( $this->dev_plugin_path() ) . '/to-test.md';
		if ( ! file_exists( $file ) ) {
			$file = __DIR__ . '/../docs/testing/testing-tips.md';
		}
		WP_Filesystem();
		global $wp_filesystem;
		$content = Utils::render_markdown( $this, $wp_filesystem->get_contents( $file ) );

		$slug = $this->dev_plugin_slug();
		$name = "{$this->get_name()} | {$this->dev_pretty_version()}";
		return (object) array(
			'slug'          => $slug,
			'plugin'        => $slug,
			'name'          => $name,
			'plugin_name'   => $name,
			'version'       => $dev_info->version,
			'author'        => $tmp['Author'],
			'homepage'      => $this->beta_homepage_url(),
			'downloaded'    => false,
			'last_updated'  => date_create( $dev_info->update_date, timezone_open( 'UTC' ) )->format( 'Y-m-d g:i a \G\M\T' ),
			'sections'      => array( 'description' => $content ),
			'download_link' => $dev_info->download_url,
		);
	}

	/**
	 * Get a "pretty" version of the current stable plugin version.
	 *
	 * @return string|null
	 */
	public function stable_pretty_version() {
		$file = $this->plugin_path();
		if ( ! file_exists( $file ) ) {
			return null;
		}
		$tmp = get_plugin_data( $file, false, false );
		return $this->pretty_version(
			(object) array(
				'source'  => 'release',
				'version' => $tmp['Version'],
			)
		);
	}

	/**
	 * Get a "pretty" version of the current dev plugin version.
	 *
	 * @return string|null
	 */
	public function dev_pretty_version() {
		$dev_info = $this->dev_info();
		if ( ! $dev_info ) {
			$file = $this->dev_plugin_path();
			if ( file_exists( $file ) ) {
				$tmp = get_plugin_data( $file, false, false );
				return $tmp['Version'];
			}
			return null;
		}
		return $this->pretty_version( $dev_info );
	}

	/**
	 * Get a "pretty" version for the specified info object.
	 *
	 * @param object $info Info.
	 * @return string
	 */
	private function pretty_version( $info ) {
		switch ( $info->source ) {
			case 'trunk':
				return __( 'Bleeding Edge', 'jetpack-beta' );

			case 'rc':
				return __( 'Release Candidate', 'jetpack-beta' );

			case 'pr':
				return sprintf(
					// translators: %1$s: Branch name.
					__( 'Feature Branch: %1$s', 'jetpack-beta' ),
					$info->branch
				);

			case 'release':
				// translators: %s: Plugin version.
				return sprintf( __( 'Release version %s', 'jetpack-beta' ), $info->version );

			default:
				return $info->version;
		}
	}

	/**
	 * Get the "which" and info for the requested source and ID.
	 *
	 * @param string $source Source of installation: "stable", "trunk", "rc", "pr", or "release".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return array{string,object{source:string,id:string,download_url:string,version:string,plugin_url?:string,update_date?:string}}|WP_Error ( $which, $info )
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	private function get_which_and_info( $source, $id ) {
		// Get the info based on the source.
		switch ( $source ) {
			case 'stable':
				$which      = 'stable';
				$wporg_data = $this->get_wporg_data();
				if ( ! isset( $wporg_data->download_link ) ) {
					return new WP_Error(
						'stable_url_missing',
						// translators: %s: Plugin slug.
						sprintf( __( 'No stable download URL is available for %s.', 'jetpack-beta' ), $this->plugin_slug() )
					);
				}
				$info   = (object) array(
					'download_url' => $wporg_data->download_link,
					'version'      => $wporg_data->version,
					'update_date'  => date_create( $wporg_data->last_updated, timezone_open( 'UTC' ) )->format( 'Y-m-d H:i:s' ),
				);
				$source = 'release';
				$id     = $wporg_data->version;
				break;

			// Master case remains purely for back-compatibility (in case anyone has bookmarked URLs).
			case 'master':
			case 'trunk':
				$source   = 'trunk'; // Change source to trunk.
				$id       = '';
				$which    = 'dev';
				$manifest = $this->get_manifest();
				if ( ! isset( $manifest->trunk->download_url ) ) {
					return new WP_Error(
						'trunk_missing',
						// translators: %s: Plugin slug. Also, "trunk" is the branch name and should not be translated.
						sprintf( __( 'No trunk build is available for %s.', 'jetpack-beta' ), $this->plugin_slug() )
					);
				}
				$info             = $manifest->trunk;
				$info->plugin_url = sprintf( 'https://github.com/%s', $this->mirror_repo() );
				break;

			case 'pr':
				$which    = 'dev';
				$manifest = $this->get_manifest();
				$branch   = Utils::normalize_branch_name( $id );
				if ( ! isset( $manifest->pr->{$branch}->download_url ) ) {
					return new WP_Error(
						'branch_missing',
						// translators: %1$s: Branch name. %2$s: Plugin slug.
						sprintf( __( 'No build is available for branch %1$s of %2$s.', 'jetpack-beta' ), $id, $this->plugin_slug() )
					);
				}
				$info             = $manifest->pr->{$branch};
				$info->plugin_url = sprintf( 'https://github.com/%s/pull/%d', $this->repo(), $info->pr );
				$id               = $branch;
				break;

			case 'rc':
				$which    = 'dev';
				$manifest = $this->get_manifest();
				if ( ! isset( $manifest->rc->download_url ) ) {
					return new WP_Error(
						'rc_missing',
						// translators: %s: Plugin slug.
						sprintf( __( 'No release candidate build is available for %s.', 'jetpack-beta' ), $this->plugin_slug() )
					);
				}
				$info             = $manifest->rc;
				$info->plugin_url = sprintf( 'https://github.com/%s/tree/%s', $this->mirror_repo(), $info->branch );
				break;

			case 'release':
				$which      = 'stable';
				$wporg_data = $this->get_wporg_data();
				if ( ! isset( $wporg_data->versions->{$id} ) ) {
					return new WP_Error(
						'release_missing',
						// translators: %1$s: Version number. %2$s: Plugin slug.
						sprintf( __( 'Version %1$s does not exist for %2$s.', 'jetpack-beta' ), $id, $this->plugin_slug() )
					);
				}
				$info = (object) array(
					'download_url' => $wporg_data->versions->{$id},
					'version'      => $id,
				);
				break;

			default:
				throw new InvalidArgumentException( __METHOD__ . ': $source is invalid.' );
		}

		$info->source = $source;
		$info->id     = $id;

		return array( $which, $info );
	}

	/**
	 * Download and install the specified plugin.
	 *
	 * @param string $which "dev" or "stable".
	 * @param object $info Plugin info.
	 * @return null|WP_Error
	 */
	private function install( $which, $info ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$upgrader->init();

		// If this is a mu-plugin, overwrite the destination to put it into WPMU_PLUGIN_DIR.
		$mu_fixers = array();
		if ( $this->is_mu_plugin ) {
			$destination                           = WPMU_PLUGIN_DIR . '/' . ( $which === 'dev' ? $this->dev_plugin_slug() : $this->plugin_slug() );
			$mu_fixers['upgrader_package_options'] = static function ( $options ) use ( $destination ) {
				$options['destination'] = $destination;
				return $options;
			};

			// Also, WPMU_PLUGIN_DIR may not exist. Try to create it.
			// We hook upgrader_clear_destination instead of doing it directly so Plugin_Upgrader will already have set up $wp_filesystem for us.
			$mu_fixers['upgrader_clear_destination'] = static function ( $removed ) {
				global $wp_filesystem;
				$dir = $wp_filesystem->find_folder( WPMU_PLUGIN_DIR );
				if ( $dir && ! $wp_filesystem->exists( $dir ) ) {
					$wp_filesystem->mkdir( $dir, FS_CHMOD_DIR );
				}
				return $removed;
			};

			foreach ( $mu_fixers as $hook => $fixer ) {
				add_filter( $hook, $fixer );
			}
		}

		$result = $upgrader->install(
			$info->download_url,
			array(
				'overwrite_package' => true,
			)
		);

		foreach ( $mu_fixers as $hook => $fixer ) {
			remove_filter( $hook, $fixer );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$errors = $skin->get_errors();
		if ( is_wp_error( $errors ) && $errors->get_error_code() ) {
			return $errors;
		}
		if ( $result === false ) {
			return new WP_Error( 'install_error', __( 'There was an error installing your plugin.', 'jetpack-beta' ) );
		}

		// Record the source info, if it's a dev version.
		if ( 'dev' === $which ) {
			global $wp_filesystem; // Should have been set up by the upgrader already.
			$wp_filesystem->put_contents( dirname( $this->dev_plugin_path() ) . '/.jpbeta.json', wp_json_encode( $info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
		}

		return null;
	}

	/**
	 * Action: Clears the autoloader transient.
	 *
	 * Action for `shutdown`.
	 */
	public static function clear_autoloader_plugin_cache() {
		delete_transient( 'jetpack_autoloader_plugin_paths' );
	}
}
