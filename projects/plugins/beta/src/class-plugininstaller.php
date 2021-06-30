<?php
/**
 * Plugin installer class file for the Jetpack Beta plugin.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

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
			$fs_info = $this->plugin->dev_info();
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
	 * Update the plugin.
	 *
	 * @param string $source Source of installation: "stable", "master", "rc", "pr", or "release".
	 * @param string $id When `$source` is "pr", the PR branch name. When "release", the version.
	 * @return null|WP_Error
	 * @throws InvalidArgumentException If `$source` is invalid.
	 */
	public function update( $source, $id ) {
		// Load the info array and identify if it's "dev" or "stable".
		$ret = $this->get_which_and_info( $source, $id );
		if ( is_wp_error( $ret ) ) {
			return $ret;
		}
		list( $which, $info ) = $ret;

		// Download and install.
		$ret = $this->install( $which, $info );
		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		return null;
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
				if ( ! isset( $wporg_data->download_url ) ) {
					return new WP_Error(
						// translators: %s: Plugin slug.
						sprintf( __( 'No stable download URL is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
					);
				}
				$info   = (object) array(
					'download_url' => $wporg_data->download_url,
					'version'      => $wporg_data->version,
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
						// translators: %s: Plugin slug. Also, "master" is the branch name and should not be translated.
						sprintf( __( 'No master build is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
					);
				}
				$info = $manifest->master;
				break;

			case 'pr':
				$which    = 'dev';
				$manifest = $this->plugin->get_manifest();
				$branch   = Utils::normalize_branch( $id );
				if ( ! isset( $manifest->pr->{$branch}->download_url ) ) {
					return new WP_Error(
						// translators: %1$s: Branch name. %2$s: Plugin slug.
						sprintf( __( 'No build is available for branch %1$s of %2$s.', 'jetpack-beta' ), $id, $this->plugin->plugin_slug() )
					);
				}
				$info = $manifest->pr->{$branch};
				$id   = $branch;
				break;

			case 'rc':
				$which    = 'dev';
				$manifest = $this->plugin->get_manifest();
				if ( isset( $manifest->rc->download_url ) ) {
					$info = $manifest->rc;
					break;
				}
				// Possible alternative manifest layout?
				if ( isset( $manifest->rc->{$id}->download_url ) ) {
					$info = $manifest->rc->{$id};
					break;
				}
				return new WP_Error(
					// translators: %s: Plugin slug.
					sprintf( __( 'No release candidate build is available for %s.', 'jetpack-beta' ), $this->plugin->plugin_slug() )
				);

			case 'release':
				$which      = 'stable';
				$wporg_data = $this->plugin->get_wporg_data();
				if ( ! isset( $wporg_data->versions->{$id} ) ) {
					return new WP_Error(
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
			// translators: %1$s: download url, %2$s: error message.
			return new WP_Error( sprintf( __( 'Error Downloading: <a href="%1$s">%1$s</a> - Error: %2$s', 'jetpack-beta' ), $info->download_url, $temp_path->get_error_message() ) );
		}

		// Init the WP_Filesystem API.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		if ( ! WP_Filesystem( $creds ) ) {
			return new WP_Error( __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) );
		}

		// Unzip the downloaded plugin.
		global $wp_filesystem;
		$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
		$result      = unzip_file( $temp_path, $plugin_path );
		if ( is_wp_error( $result ) ) {
			// translators: %1$s: error message.
			return new WP_Error( sprintf( __( 'Error Unziping file: Error: %1$s', 'jetpack-beta' ), $result->get_error_message() ) );
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
	 * Actions: shutdown
	 */
	public static function clear_autoloader_plugin_cache() {
		delete_transient( 'jetpack_autoloader_plugin_paths' );
	}
}
