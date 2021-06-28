<?php
/**
 * Utilities class file for the Jetpack Beta plugin.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

/**
 * Utilities class file for the Jetpack Beta plugin.
 */
class Utils {

	/**
	 * WP Options string: jetpack_beta_active
	 *
	 * @var string
	 */
	protected static $option = 'jetpack_beta_active';

	/**
	 * WP Options string: jetpack_beta_dev_currently_installed
	 *
	 * @var string
	 */
	protected static $option_dev_installed = 'jetpack_beta_dev_currently_installed';

	/**
	 * WP Options string: jp_beta_autoupdate
	 *
	 * @var string
	 */
	protected static $option_autoupdate = 'jp_beta_autoupdate';

	/**
	 * WP Options string: jp_beta_email_notifications
	 *
	 * @var string
	 */
	protected static $option_email_notif = 'jp_beta_email_notifications';

	/**
	 * Checks if passed plugin matches JP or JP Dev paths.
	 *
	 * @param string $plugin - A plugin path.
	 */
	public static function is_jetpack_plugin( $plugin ) {
		return in_array( $plugin, array( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE ), true );
	}

	/**
	 * Returns active Jetpack plugin file partial path string (jetpack/jetpack.php|jetpack-dev/jetpack.php).
	 */
	public static function get_plugin_file() {
		return self::get_plugin_slug() . '/jetpack.php';
	}

	/**
	 * Returns active plugin slug string (jetpack|jetpack-dev).
	 */
	public static function get_plugin_slug() {
		$installed = self::get_branch_and_section();
		if ( empty( $installed ) || 'stable' === $installed[1] || 'tags' === $installed[1] ) {
			return 'jetpack';
		}
		return JETPACK_DEV_PLUGIN_SLUG;
	}

	/**
	 * Builds URL to the admin area for the current site and specified query param.
	 *
	 * @param string $query - Path relative to the admin URL.
	 */
	public static function admin_url( $query = '?page=jetpack-beta' ) {
		return self::is_network_active()
			? network_admin_url( 'admin.php' . $query )
			: admin_url( 'admin.php' . $query );
	}

	/**
	 * Determine if JP dev version should be updated.
	 */
	public static function should_update_dev_version() {
		return version_compare( self::get_new_jetpack_version( true ), self::get_jetpack_plugin_version( true ), '>' );
	}

	/**
	 * Build plugin update data response for dev plugin.
	 */
	public static function get_jepack_dev_update_response() {
		return (object) array(
			'id'          => JETPACK_DEV_PLUGIN_SLUG,
			'plugin'      => JETPACK_DEV_PLUGIN_SLUG,
			'new_version' => self::get_new_jetpack_version( true ),
			'slug'        => JETPACK_DEV_PLUGIN_SLUG,
			'url'         => self::get_url_dev(),
			'package'     => self::get_install_url_dev(),
		);
	}

	/**
	 * Build plugin update data response for JP dev master.
	 */
	public static function get_jepack_dev_master_update_response() {
		$response = self::get_jepack_dev_update_response();

		$master_manifest       = self::get_manifest_data( 'master', 'master' );
		$response->new_version = $master_manifest->version;
		$response->url         = self::get_url( 'master', 'master' );
		$response->package     = $master_manifest->download_url;
		return $response;
	}

	/**
	 * Get the active JP or JP Dev plugin version.
	 *
	 * @param bool $is_dev_version - If dev plugin version is being queried.
	 *
	 * @return string|0 Plugin version.
	 */
	public static function get_jetpack_plugin_version( $is_dev_version = false ) {
		if ( $is_dev_version ) {
			$info = self::get_jetpack_plugin_info_dev();
		} else {
			$info = self::get_jetpack_plugin_info();
		}

		return isset( $info['Version'] ) ? $info['Version'] : 0;
	}

	/**
	 * Get WP Option: jetpack_beta_active
	 */
	public static function get_option() {
		return get_option( self::$option );
	}

	/**
	 * Get WP Option: jetpack_beta_dev_currently_installed
	 */
	public static function get_dev_installed() {
		return get_option( self::$option_dev_installed );
	}

	/**
	 * Get active Jetpack branch/section.
	 */
	public static function get_branch_and_section() {
		$option = (array) self::get_option();
		if ( false === $option[0] ) {
			// See if the Jetpack plugin is enabled.
			if ( ! function_exists( 'is_plugin_active' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			if ( is_plugin_active( JETPACK_PLUGIN_FILE ) ) {
				return array( 'stable', 'stable' );
			}
			return array( false, false );
		}
		// Branch and section.
		return $option;
	}

	/**
	 * Check if Jetpack version is 'stable' version.
	 */
	public static function is_on_stable() {
		$branch_and_section = self::get_branch_and_section();
		if ( empty( $branch_and_section[0] ) || 'stable' === $branch_and_section[0] ) {
			return true;
		}
		return false;
	}

	/**
	 * Check if Jetpack active version is a tag version.
	 */
	public static function is_on_tag() {
		$option = (array) self::get_option();
		if ( isset( $option[1] ) && 'tags' === $option[1] ) {
			return true;
		}
		return false;
	}

	/**
	 * Get active Jetpack Dev branch/section.
	 */
	public static function get_branch_and_section_dev() {
		$option = (array) self::get_dev_installed();
		if ( false !== $option[0] && isset( $option[1] ) ) {
			return array( $option[0], $option[1] );
		}
		if ( is_plugin_active( JETPACK_DEV_PLUGIN_FILE ) ) {
			return array( 'stable', 'stable' );
		}
		return array( false, false );
	}

	/**
	 * Massage JP plugin version string.
	 *
	 * @param bool $is_dev_version - If JP Dev version is being queried.
	 */
	public static function get_jetpack_plugin_pretty_version( $is_dev_version = false ) {
		if ( $is_dev_version ) {
			list( $branch, $section ) = self::get_branch_and_section_dev();
		} else {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( ! $section ) {
			return '';
		}

		if ( 'master' === $section ) {
			return 'Bleeding Edge';
		}

		if ( 'stable' === $section ) {
			return 'Latest Stable';
		}

		if ( 'tags' === $section ) {
			return sprintf(
				// translators: %1$s: a tagged Jetpack plugin version.
				__( 'Public release (<a href="https://plugins.trac.wordpress.org/browser/jetpack/tags/%1$s" target="_blank" rel="noopener noreferrer">available on WordPress.org</a>)', 'jetpack-beta' ),
				esc_attr( $branch )
			);
		}

		if ( 'rc' === $section ) {
			return 'Release Candidate';
		}

		if ( 'pr' === $section ) {
			$branch = str_replace( '-', ' ', $branch );
			return 'Feature Branch: ' . str_replace( '_', ' / ', $branch );
		}

		return self::get_jetpack_plugin_version();
	}

	/**
	 * Fetch latest Jetpack version.
	 *
	 * @param bool $is_dev_version - If JP Dev version is being queried.
	 */
	public static function get_new_jetpack_version( $is_dev_version = false ) {
		$manifest = self::get_beta_manifest();
		if ( $is_dev_version ) {
			list( $branch, $section ) = self::get_branch_and_section_dev();
		} else {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'master' === $section && isset( $manifest->{$section}->version ) ) {
			return $manifest->{$section}->version;
		}

		if ( 'rc' === $section && isset( $manifest->{$section}->version ) ) {
			return $manifest->{$section}->version;
		}

		if ( isset( $manifest->{$section} ) &&
		isset( $manifest->{$section}->{$branch} ) &&
		isset( $manifest->{$section}->{$branch}->version )
		) {
			return $manifest->{$section}->{$branch}->version;
		}
		return 0;
	}

	/**
	 * Get JP Dev plugin repo URL.
	 */
	public static function get_url_dev() {
		list( $branch, $section ) = self::get_branch_and_section_dev();
		return self::get_url( $branch, $section );
	}

	/**
	 * Get JP plugin repo URL.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_url( $branch = null, $section = null ) {
		if ( is_null( $section ) ) {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'master' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/master-build';
		}

		if ( 'rc' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/' . $section . '-build';
		}

		if ( 'pr' === $section ) {
			$manifest = self::get_beta_manifest();
			return isset( $manifest->{$section}->{$branch}->pr )
			? JETPACK_GITHUB_URL . '/pull/' . $manifest->{$section}->{$branch}->pr
			: JETPACK_DEFAULT_URL;
		}
		return JETPACK_DEFAULT_URL;
	}

	/**
	 * Get install URL for JP dev.
	 */
	public static function get_install_url_dev() {
		list( $branch, $section ) = self::get_branch_and_section_dev();
		return self::get_install_url( $branch, $section );
	}

	/**
	 * Get install URL for JP.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_install_url( $branch = null, $section = null ) {
		if ( is_null( $section ) ) {
			list( $branch, $section ) = self::get_branch_and_section();
		}

		if ( 'stable' === $section ) {
			$org_data = self::get_org_data();
			return $org_data->download_link;
		} elseif ( 'tags' === $section ) {
			$org_data = self::get_org_data();
			return $org_data->versions->{$branch} ? $org_data->versions->{$branch} : false;
		}
		$manifest = self::get_beta_manifest( true );

		if ( 'master' === $section && isset( $manifest->{$section}->download_url ) ) {
			return $manifest->{$section}->download_url;
		}

		if ( 'rc' === $section ) {
			if ( isset( $manifest->{$section}->download_url ) ) {
				return $manifest->{$section}->download_url;
			}
			$branches = array_keys( (array) $manifest->{$section} );
			foreach ( $branches as $branch ) {
				if ( isset( $manifest->{$section}->{$branch}->download_url ) ) {
					return $manifest->{$section}->{$branch}->download_url;
				}
			}
			return null;
		}

		if ( isset( $manifest->{$section}->{$branch}->download_url ) ) {
			return $manifest->{$section}->{$branch}->download_url;
		}
		return null;
	}

	/**
	 * Get stable JP version plugin data.
	 */
	public static function get_jetpack_plugin_info_stable() {
		return self::get_jetpack_plugin_info( JETPACK_PLUGIN_FILE );
	}

	/**
	 * Get dev JP version plugin data.
	 */
	public static function get_jetpack_plugin_info_dev() {
		return self::get_jetpack_plugin_info( JETPACK_DEV_PLUGIN_FILE );
	}

	/**
	 * Get JP plugin data.
	 *
	 * @param mixed $plugin_file - JP or JP Dev plugin path.
	 */
	public static function get_jetpack_plugin_info( $plugin_file = null ) {

		if ( is_null( $plugin_file ) ) {
			$plugin_file = self::get_plugin_file();
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugin_file_path = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_file;

		if ( file_exists( $plugin_file_path ) ) {
			return get_plugin_data( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $plugin_file );
		}

		return null;
	}

	/**
	 * Fetch the Jetpack beta manifest.
	 *
	 * @param bool $force_refresh - Whether to bypass cached response.
	 */
	public static function get_beta_manifest( $force_refresh = false ) {
		return self::get_remote_data( JETPACK_BETA_MANIFEST_URL, 'manifest', $force_refresh );
	}

	/**
	 * Fetch WordPress.org Jetpack plugin info.
	 */
	public static function get_org_data() {
		return self::get_remote_data( JETPACK_ORG_API_URL, 'org_data' );
	}

	/**
	 * Helper function used to fetch remote data from WordPress.org, GitHub, and betadownload.jetpack.me
	 *
	 * @param string $url       - Url being fetched.
	 * @param string $transient - Transient name (manifest|org_data|github_commits_).
	 * @param bool   $bypass    - Whether to bypass cached response.
	 */
	public static function get_remote_data( $url, $transient, $bypass = false ) {
		$prefix = 'jetpack_beta_';
		$cache  = get_site_transient( $prefix . $transient );
		if ( $cache && ! $bypass ) {
			return $cache;
		}

		$remote_manifest = wp_remote_get( $url );

		if ( is_wp_error( $remote_manifest ) ) {
			return false;
		}

		$cache = json_decode( wp_remote_retrieve_body( $remote_manifest ) );
		set_site_transient( $prefix . $transient, $cache, MINUTE_IN_SECONDS * 15 );

		return $cache;
	}

	/**
	 * Delete set transients when plugin is deactivated.
	 */
	public static function delete_all_transiants() {
		$prefix = 'jetpack_beta_';

		delete_site_transient( $prefix . 'org_data' );
		delete_site_transient( $prefix . 'manifest' );

		delete_site_transient( AutoupdateSelf::TRANSIENT_NAME );

	}

	/**
	 * Install & activate JP for the given branch/section.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function install_and_activate( $branch, $section ) {
		// Cleanup previous version of the beta plugin.
		if ( file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack-pressable-beta' ) ) {
			// Delete the Jetpack dev plugin.
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

			$working_dir = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack-pressable-beta';
			// Delete the folder `JETPACK_BETA_PLUGIN_FOLDER`.
			if ( $wp_filesystem->is_dir( $working_dir ) ) {
				$wp_filesystem->delete( $working_dir, true );
			}
			// Deactivate the plugin.
			self::replace_active_plugin( 'jetpack-pressable-beta/jetpack.php' );
		}

		if ( 'stable' === $section &&
		file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_PLUGIN_FILE ) ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );
			self::update_option( $branch, $section );
			return;
		}

		if ( self::get_branch_and_section_dev() === array( $branch, $section )
		&& file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . JETPACK_DEV_PLUGIN_FILE ) ) {
			self::replace_active_plugin( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE, true );
			self::update_option( $branch, $section );
			return;
		}

		self::proceed_to_install_and_activate(
			self::get_install_url( $branch, $section ),
			self::get_plugin_slug( $section ),
			$section
		);
		self::update_option( $branch, $section );
	}

	/**
	 * Update to the latest version.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function update_plugin( $branch, $section ) {
		self::proceed_to_install(
			self::get_install_url( $branch, $section ),
			self::get_plugin_slug( $section ),
			$section
		);

		if ( 'stable' !== $section ) {
			update_option( self::$option_dev_installed, array( $branch, $section, self::get_manifest_data( $branch, $section ) ) );
		}
	}

	/**
	 * Helper function to update installed version option.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function update_option( $branch, $section ) {
		if ( 'stable' !== $section ) {
			update_option( self::$option_dev_installed, array( $branch, $section, self::get_manifest_data( $branch, $section ) ) );
		}
		update_option( self::$option, array( $branch, $section ) );
	}

	/**
	 * Return manifest info for specififed branch/section.
	 *
	 * @param string $branch  - Branch.
	 * @param string $section - Section.
	 */
	public static function get_manifest_data( $branch, $section ) {
		$installed             = get_option( self::$option_dev_installed );
		$current_manifest_data = isset( $installed[2] ) ? $installed[2] : false;

		$manifest_data = self::get_beta_manifest();

		if ( ! isset( $manifest_data->{$section} ) ) {
			return $current_manifest_data;
		}

		if ( 'master' === $section ) {
			return $manifest_data->{$section};
		}

		if ( 'rc' === $section ) {
			return $manifest_data->{$section};
		}

		if ( isset( $manifest_data->{$section}->{$branch} ) ) {
			return $manifest_data->{$section}->{$branch};
		}

		return $current_manifest_data;
	}

	/**
	 * Install specified plugin version.
	 *
	 * @param string $url           - Url for plugin version.
	 * @param string $plugin_folder - Path JP or JP Dev plugin folder.
	 * @param string $section       - Section.
	 */
	public static function proceed_to_install_and_activate( $url, $plugin_folder, $section ) {
		self::proceed_to_install( $url, $plugin_folder, $section );

		if ( 'stable' === $section || 'tags' === $section ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );
		} else {
			self::replace_active_plugin( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE, true );
		}
	}

	/**
	 * Download plugin files.
	 *
	 * @param string $url           - Url for plugin version.
	 * @param string $plugin_folder - Path JP or JP Dev plugin folder.
	 * @param string $section       - Section.
	 */
	public static function proceed_to_install( $url, $plugin_folder, $section ) {
		$temp_path = download_url( $url );

		if ( is_wp_error( $temp_path ) ) {
			// translators: %1$s: download url, %2$s: error message.
			wp_die( wp_kses_post( sprintf( __( 'Error Downloading: <a href="%1$s">%1$s</a> - Error: %2$s', 'jetpack-beta' ), $url, $temp_path->get_error_message() ) ) );
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		/* initialize the API */
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			wp_die( esc_html( __( 'Jetpack Beta: No File System access', 'jetpack-beta' ) ) );
		}

		global $wp_filesystem;
		if ( 'stable' === $section || 'tags' === $section ) {
			$plugin_path = WP_PLUGIN_DIR;
		} else {
			$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
		}

		$result = unzip_file( $temp_path, $plugin_path );

		if ( is_wp_error( $result ) ) {
			// translators: %1$s: error message.
			wp_die( esc_html( sprintf( __( 'Error Unziping file: Error: %1$s', 'jetpack-beta' ), $result->get_error_message() ) ) );
		}
	}

	/**
	 * Check if plugin is network activated.
	 */
	public static function is_network_active() {
		if ( ! is_multisite() ) {
			return false;
		}

		if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
			return false;
		}

		if ( is_plugin_active_for_network( JETPACK_PLUGIN_FILE ) || is_plugin_active_for_network( JETPACK_DEV_PLUGIN_FILE ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Swap plugin files.
	 *
	 * @param string $current_plugin      - Current plugin path.
	 * @param string $replace_with_plugin - Plugin path to replace with.
	 * @param bool   $force_activate      - Whether to force activate plguin.
	 */
	public static function replace_active_plugin( $current_plugin, $replace_with_plugin = null, $force_activate = false ) {
		// The autoloader sets the cache in a shutdown hook. Clear it after the autoloader sets it.
		add_action( 'shutdown', array( self::class, 'clear_autoloader_plugin_cache' ), 99 );

		if ( self::is_network_active() ) {
			$new_active_plugins     = array();
			$network_active_plugins = get_site_option( 'active_sitewide_plugins' );
			foreach ( $network_active_plugins as $plugin => $date ) {
				$key                        = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
				$new_active_plugins[ $key ] = $date;
			}
			update_site_option( 'active_sitewide_plugins', $new_active_plugins );
			return;
		}

		$active_plugins     = (array) get_option( 'active_plugins', array() );
		$new_active_plugins = array();

		if ( empty( $replace_with_plugin ) ) {
			$new_active_plugins = array_diff( $active_plugins, array( $current_plugin ) );
		} else {
			foreach ( $active_plugins as $plugin ) {
				$new_active_plugins[] = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
			}
		}

		if ( $force_activate && ! in_array( $replace_with_plugin, $new_active_plugins, true ) ) {
			$new_active_plugins[] = $replace_with_plugin;
		}
		update_option( 'active_plugins', $new_active_plugins );
	}

	/**
	 * Check if `stable` should be updated.
	 *
	 * @return bool
	 */
	public static function should_update_stable_version() {
		// Pressable Jetpack version is manage via Pressable.
		if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
			return false;
		}

		// Check if running in a docker instance.
		if ( defined( 'JETPACK_DOCKER_ENV' ) && JETPACK_DOCKER_ENV ) {
			return false;
		}

		// Check if we are Jetpack plugin is installed via git.
		if ( file_exists( WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'jetpack/.git' ) ) {
			return false;
		}

		// Check if running a tag directly from svn.
		if ( self::is_on_tag() ) {
			return false;
		}

		$updates = get_site_transient( 'update_plugins' );

		if ( isset( $updates->response, $updates->response[ JETPACK_PLUGIN_FILE ] ) ) {
			return true;
		}
		$org_data    = self::get_org_data();
		$plugin_data = self::get_jetpack_plugin_info_stable();

		return ( isset( $plugin_data['Version'], $org_data->version )
			&& $org_data->version !== $plugin_data['Version'] );
	}

	/**
	 * Here we are checking if the DEV branch that we are currenly on is not something that is available in the manifest
	 * Meaning that the DEV branch was merged into master and so we need to update it.
	 *
	 * @return bool
	 */
	public static function should_update_dev_to_master() {
		list( $branch, $section ) = self::get_branch_and_section_dev();

		if ( false === $branch || 'master' === $section || 'rc' === $section || 'tags' === $section ) {
			return false;
		}
		$manifest = self::get_beta_manifest();
		return ! isset( $manifest->{$section}->{$branch} );
	}

	/**
	 * Get WP Option: jp_beta_autoupdate
	 */
	public static function is_set_to_autoupdate() {
		return get_option( self::$option_autoupdate, false );
	}

	/**
	 * Get WP Option: jp_beta_email_notifications
	 */
	public static function is_set_to_email_notifications() {
		return get_option( self::$option_email_notif, true );
	}

	/**
	 * Get "What changed" info for display.
	 *
	 * @return string|false
	 */
	public static function what_changed() {
		$commit = self::get_version_commit();
		if ( $commit ) {
			$html        = '';
			$commit_data = self::get_commit_data_from_github( $commit );
			if ( isset( $commit_data->commit->message ) ) {
				$html .= sprintf(
					__( "\n %1\$s \n\n[Commit](%2\$s)", 'jetpack-beta' ),
					esc_html( $commit_data->commit->message ),
					esc_url( $commit_data->html_url )
				);
				"\n\n";
			}
			if ( ! empty( $commit_data->files ) ) {
				$html .= "\n\n";
				// translators: %d: number of files changed.
				$html .= sprintf( _n( '%d file changed ', '%d files changed', count( $commit_data->files ), 'jetpack-beta' ) );
				$html .= "\n";
				foreach ( $commit_data->files as $file ) {
					$added_deleted_changed = array();
					if ( $file->additions ) {
						$added_deleted_changed[] = '+' . $file->additions;
					}
					if ( $file->deletions ) {
						$added_deleted_changed[] = '-' . $file->deletions;
					}
					$html .= sprintf( "- %s ... (%s %s) \n", esc_html( $file->filename ), esc_html( $file->status ), implode( ' ', $added_deleted_changed ) );
				}
				$html .= "\n\n";
			}
			if ( ! empty( $html ) ) {
				return $html;
			}
		}
		return false;
	}

	/**
	 * Get version commit if available.
	 *
	 * @return string|false
	 */
	public static function get_version_commit() {
		$split_version = explode( '-', self::get_jetpack_plugin_version() );
		if ( isset( $split_version[3] ) ) {
			return $split_version[3];
		}
		return false;
	}

	/**
	 * Fetch commit data from GitHub.
	 *
	 * @param string $commit - The commit to fetch.
	 */
	public static function get_commit_data_from_github( $commit ) {
		return self::get_remote_data( JETPACK_GITHUB_API_URL . 'commits/' . $commit, 'github_commits_' . $commit );
	}

	/**
	 * Checks if a dir is empty.
	 *
	 * @param [type] $dir The absolute directory path to check.
	 * @return boolean
	 */
	public static function is_dir_empty( $dir ) {
		return ( count( scandir( $dir ) ) === 2 );
	}

	/**
	 * Clears the autoloader transient.
	 */
	public static function clear_autoloader_plugin_cache() {
		delete_transient( 'jetpack_autoloader_plugin_paths' );
	}
}
