<?php
/**
 * Plugin installer class file for the Jetpack Beta plugin.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Composer\Semver\Comparator as Semver;
use InvalidArgumentException;
use WP_Error;

/**
 * Plugin installer class.
 */
class PluginInstaller {

	/**
	 * The Plugin to work with.
	 *
	 * @var Plugin
	 */
	private $plugin;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin The Plugin to work with.
	 */
	public function __construct( Plugin $plugin ) {
		$this->plugin = $plugin;
	}

	/**
	 * Get the information for the installed dev version of the plugin.
	 *
	 * @return object|null
	 */
	public function dev_info() {
		$file = WP_PLUGIN_DIR . "/{$this->plugin->dev_plugin_slug()}/.jpbeta.json";
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
			$from = $this->plugin->dev_plugin_file();
			$to   = $this->plugin->plugin_file();
		} elseif ( 'dev' === $which ) {
			$from = $this->plugin->plugin_file();
			$to   = $this->plugin->dev_plugin_file();
		} else {
			throw new InvalidArgumentException( __METHOD__ . ': $which must be "stable" or "dev".' );
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
	 * Install & activate the plugin for the given branch.
	 *
	 * @param string $source Source of installation: "stable", "master", "rc", "pr", or "release".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return null|WP_Error
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	public function install_and_activate( $source, $id ) {
		// Cleanup after previous version of the beta plugin.
		if ( $this->plugin->plugin_slug() === 'jetpack' && file_exists( WP_PLUGIN_DIR . '/jetpack-pressable-beta' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
			if ( ! WP_Filesystem( $creds ) ) {
				// Any problems and we exit.
				return new WP_error( 'Filesystem Problem' );
			}
			global $wp_filesystem;
			if ( ! $wp_filesystem ) {
				return new WP_error( '$wp_filesystem is not global' );
			}

			$working_dir = WP_PLUGIN_DIR . '/jetpack-pressable-beta';
			// Delete the folder `JETPACK_BETA_PLUGIN_FOLDER`.
			if ( $wp_filesystem->is_dir( $working_dir ) ) {
				$wp_filesystem->delete( $working_dir, true );
			}
			// Deactivate the plugin.
			deactivate_plugins( 'jetpack-pressable-beta/jetpack.php' );
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
			$file = WP_PLUGIN_DIR . '/' . $this->plugin->plugin_file();
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
	 * @param string $source Source of installation: "stable", "master", "rc", "pr", or "release".
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
	 * @return null|object
	 */
	public function dev_upgrader_response() {
		$dev_info = $this->dev_info();
		if ( ! $dev_info ) {
			// We can't know how to upgrade if there's no info.
			return array( null, null );
		}
		$manifest = $this->plugin->get_manifest( true );
		$slug     = $this->plugin->dev_plugin_slug();
		$info     = null;

		if ( 'pr' === $dev_info->source && ! isset( $manifest->pr->{$dev_info->id} ) && isset( $manifest->master ) ) {
			// It's a PR that is gone. Update to master.
			list( , $info ) = $this->get_which_and_info( 'master', '' );
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
		$file = WP_PLUGIN_DIR . '/' . $this->plugin->dev_plugin_file();
		if ( ! file_exists( $file ) ) {
			return $default;
		}
		$tmp = get_plugin_data( $file, false, false );

		// Read the plugin's to-test.md, or our generic testing tips should that not exist.
		$file = WP_PLUGIN_DIR . '/' . $this->plugin->dev_plugin_slug() . '/to-test.md';
		if ( ! file_exists( $file ) ) {
			$file = __DIR__ . '/../docs/testing/testing-tips.md';
		}
		WP_Filesystem();
		global $wp_filesystem;
		$content = Utils::render_markdown( $this->plugin, $wp_filesystem->get_contents( $file ) );

		$slug = $this->plugin->dev_plugin_slug();
		$name = "{$this->plugin->get_name()} | {$this->dev_pretty_version()}";
		return (object) array(
			'slug'          => $slug,
			'plugin'        => $slug,
			'name'          => $name,
			'plugin_name'   => $name,
			'version'       => $dev_info->version,
			'author'        => $tmp['Author'],
			'homepage'      => $this->plugin->beta_homepage_url(),
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
		$file = WP_PLUGIN_DIR . '/' . $this->plugin->plugin_file();
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
			$file = WP_PLUGIN_DIR . '/' . $this->plugin->dev_plugin_file();
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
			case 'master':
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
	 * @param string $source Source of installation: "stable", "master", "rc", "pr", or "release".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return array|WP_Error ( $which, $info )
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	private function get_which_and_info( $source, $id ) {
		// Get the info based on the source.
		switch ( $source ) {
			case 'stable':
				$which      = 'stable';
				$wporg_data = $this->plugin->get_wporg_data();
				if ( ! isset( $wporg_data->download_link ) ) {
					return new WP_Error(
						'stable_url_missing',
						// translators: %s: Plugin slug.
						sprintf( __( 'No stable download URL is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
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

			case 'master':
				$id       = '';
				$which    = 'dev';
				$manifest = $this->plugin->get_manifest();
				if ( ! isset( $manifest->master->download_url ) ) {
					return new WP_Error(
						'master_missing',
						// translators: %s: Plugin slug. Also, "master" is the branch name and should not be translated.
						sprintf( __( 'No master build is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
					);
				}
				$info             = $manifest->master;
				$info->plugin_url = sprintf( 'https://github.com/%s', $this->plugin->mirror_repo() );
				break;

			case 'pr':
				$which    = 'dev';
				$manifest = $this->plugin->get_manifest();
				$branch   = Utils::normalize_branch_name( $id );
				if ( ! isset( $manifest->pr->{$branch}->download_url ) ) {
					return new WP_Error(
						'branch_missing',
						// translators: %1$s: Branch name. %2$s: Plugin slug.
						sprintf( __( 'No build is available for branch %1$s of %2$s.', 'jetpack-beta' ), $id, $this->plugin->plugin_slug() )
					);
				}
				$info             = $manifest->pr->{$branch};
				$info->plugin_url = sprintf( 'https://github.com/%s/pull/%d', $this->plugin->repo(), $info->pr );
				$id               = $branch;
				break;

			case 'rc':
				$which    = 'dev';
				$manifest = $this->plugin->get_manifest();
				if ( isset( $manifest->rc->download_url ) ) {
					$info             = $manifest->rc;
					$info->plugin_url = sprintf( 'https://github.com/%s/tree/%s', $this->plugin->mirror_repo(), $info->branch );
					break;
				}
				return new WP_Error(
					'rc_missing',
					// translators: %s: Plugin slug.
					sprintf( __( 'No release candidate build is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
				);

			case 'release':
				$which      = 'stable';
				$wporg_data = $this->plugin->get_wporg_data();
				if ( ! isset( $wporg_data->versions->{$id} ) ) {
					return new WP_Error(
						'release_missing',
						// translators: %1$s: Version number. %2$s: Plugin slug.
						sprintf( __( 'Version %1$s does not exist for %2$s.', 'jetpack-beta' ), $id, $this->plugin->plugin_slug() )
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
		// Download the required version of the plugin.
		$temp_path = download_url( $info->download_url );
		if ( is_wp_error( $temp_path ) ) {
			return new WP_Error(
				'download_error',
				// translators: %1$s: download url, %2$s: error message.
				sprintf( __( 'Error Downloading: <a href="%1$s">%1$s</a> - Error: %2$s', 'jetpack-beta' ), $info->download_url, $temp_path->get_error_message() )
			);
		}

		// Init the WP_Filesystem API.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		if ( ! WP_Filesystem( $creds ) ) {
			return new WP_Error( 'fs_api_error', __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) );
		}

		// Unzip the downloaded plugin.
		global $wp_filesystem;
		$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
		$result      = unzip_file( $temp_path, $plugin_path );
		if ( is_wp_error( $result ) ) {
			// translators: %1$s: error message.
			return new WP_Error( 'unzip_error', sprintf( __( 'Error Unziping file: Error: %1$s', 'jetpack-beta' ), $result->get_error_message() ) );
		}

		// Record the source info, if it's a dev version.
		if ( 'dev' === $which ) {
			$wp_filesystem->put_contents( "$plugin_path/{$this->plugin->dev_plugin_slug()}/.jpbeta.json", wp_json_encode( $info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
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
