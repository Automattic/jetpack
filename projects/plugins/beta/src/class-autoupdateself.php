<?php
/**
 * Allow the Jetpack Beta plugin to autoupdate itself.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Composer\Semver\Comparator as Semver;
use WP_Error;

/**
 * Allow the Jetpack Beta plugin to autoupdate itself.
 *
 * This registers some hooks in its constructor to point WordPress's plugin
 * upgrader to the GitHub repository for the plugin, as this plugin isn't in
 * the WordPress Plugin Directory to be updated normally.
 */
class AutoupdateSelf {

	/**
	 * Singleton class instance.
	 *
	 * @var static
	 */
	private static $instance = null;

	/**
	 * Configuration.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * Main Instance
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->config = array(
			'plugin_file'        => JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php',
			'slug'               => JPBETA__PLUGIN_FOLDER,
			'proper_folder_name' => JPBETA__PLUGIN_FOLDER,
			'api_url'            => 'https://api.github.com/repos/Automattic/jetpack-beta',
			'github_url'         => 'https://github.com/Automattic/jetpack-beta',
			'requires'           => '4.7',
			'tested'             => '4.7',
		);

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'api_check' ) );
		add_filter( 'plugins_api', array( $this, 'get_plugin_info' ), 10, 3 );
		add_filter( 'upgrader_source_selection', array( $this, 'upgrader_source_selection' ), 10, 3 );
	}

	/**
	 * Set update arguments in `$this->config`.
	 */
	private function set_update_args() {
		$plugin_data    = get_plugin_data( WP_PLUGIN_DIR . '/' . $this->config['plugin_file'] );
		$github_data    = $this->get_github_data();
		$tagged_version = $this->get_latest_prerelease();

		$this->config['plugin_name']  = $plugin_data['Name'];
		$this->config['version']      = $plugin_data['Version'];
		$this->config['author']       = $plugin_data['Author'];
		$this->config['homepage']     = $plugin_data['PluginURI'];
		$this->config['new_version']  = ltrim( $tagged_version, 'v' );
		$this->config['last_updated'] = empty( $github_data->updated_at ) ? false : gmdate( 'Y-m-d', strtotime( $github_data->updated_at ) );
		$this->config['description']  = empty( $github_data->description ) ? false : $github_data->description;
		$this->config['zip_url']      = 'https://github.com/Automattic/jetpack-beta/zipball/' . $tagged_version;
	}

	/**
	 * Check for latest pre-release plugin every six hours and update.
	 *
	 * @return string|false Prerelease version, or false on failure.
	 */
	private function get_latest_prerelease() {
		$tagged_version = get_site_transient( 'jetpack_beta_latest_tag' );
		if ( $this->overrule_transients() || ! $tagged_version ) {
			$raw_response = wp_remote_get( trailingslashit( $this->config['api_url'] ) . 'releases' );
			if ( is_wp_error( $raw_response ) ) {
				return false;
			}
			$releases       = json_decode( $raw_response['body'] );
			$tagged_version = false;
			if ( is_array( $releases ) ) {
				foreach ( $releases as $release ) {
					// Since 2.2, so that we don't have to maker the Jetpack Beta 2.0.3 as prerelease.
					if ( ! $release->prerelease ) {
						$tagged_version = $release->tag_name;
						break;
					}
				}
			}
			// Refresh every 6 hours.
			if ( $tagged_version ) {
				set_site_transient( 'jetpack_beta_latest_tag', $tagged_version, 60 * 60 * 6 );
			}
		}
		return $tagged_version;
	}

	/**
	 * Whether to override transients to force update.
	 *
	 * @return bool
	 */
	private function overrule_transients() {
		return ( defined( 'Jetpack_Beta_FORCE_UPDATE' ) && Jetpack_Beta_FORCE_UPDATE );
	}

	/**
	 * Get update data from Github.
	 *
	 * @return object|false Data from GitHub's API, or false on error.
	 */
	private function get_github_data() {
		$github_data = get_site_transient( 'jetpack_beta_autoupdate_github_data' );
		if ( $this->overrule_transients() || ! $github_data ) {
			$github_data = wp_remote_get( $this->config['api_url'] );
			if ( is_wp_error( $github_data ) ) {
				return false;
			}
			$github_data = json_decode( $github_data['body'] );
			// Refresh every 6 hours.
			set_site_transient( 'jetpack_beta_autoupdate_github_data', $github_data, 60 * 60 * 6 );
		}
		return $github_data;
	}

	/**
	 * Check if there's a newer version.
	 *
	 * @return bool
	 */
	public function has_newer_version() {
		if ( ! isset( $this->config['new_version'] ) ) {
			$this->set_update_args();
		}

		return Semver::greaterThan( $this->config['new_version'], $this->config['version'] );
	}

	/**
	 * Filter: Check the latest transient data and update if necessary.
	 *
	 * Filter for `pre_set_site_transient_update_plugins`.
	 *
	 * We need to somehow inject ourself into the list of plugins needing update
	 * when an update is available. This is the way: catch the setting of the relevant
	 * transient and add ourself in.
	 *
	 * @todo Consider switching to the `update_plugins_${hostmane}` hook introduced in WP 5.8.
	 *
	 * @param object $transient The transient we're checking.
	 * @return object $transient
	 */
	public function api_check( $transient ) {
		// Check if the transient contains the 'checked' information.
		// If not, just return its value without hacking it.
		if ( ! isset( $transient->no_update ) ) {
			return $transient;
		}
		// Get the latest version.
		delete_site_transient( 'jetpack_beta_latest_tag' );

		if ( $this->has_newer_version() ) {
			$transient->response[ $this->config['plugin_file'] ] = (object) array(
				'plugin'      => $this->config['slug'],
				'new_version' => $this->config['new_version'],
				'slug'        => $this->config['slug'],
				'url'         => $this->config['github_url'],
				'package'     => $this->config['zip_url'],
			);
		}
		return $transient;
	}

	/**
	 * Filter: Get latest plugin information.
	 *
	 * Filter for `plugins_api`.
	 *
	 * As the plugin isn't in the WordPress Plugin Directory, we need to fake
	 * up a record for it so the upgrader will know how to upgrade it.
	 *
	 * @param false|object|array $result Result from plugins_api.
	 * @param string             $action The type of information being requested from the Plugin Installation API.
	 * @param object             $args Plugin API arguments.
	 * @return false|object|array $result
	 */
	public function get_plugin_info( $result, $action, $args ) {
		// Check if this is a 'plugin_information' request for this plugin.
		if ( 'plugin_information' !== $action || $args->slug !== $this->config['slug'] ) {
			return $result;
		}

		// Update tags.
		$this->set_update_args();
		return (object) array(
			'slug'          => $this->config['slug'],
			'plugin'        => $this->config['slug'],
			'name'          => $this->config['plugin_name'],
			'plugin_name'   => $this->config['plugin_name'],
			'version'       => $this->config['new_version'],
			'author'        => $this->config['author'],
			'homepage'      => $this->config['homepage'],
			'requires'      => $this->config['requires'],
			'tested'        => $this->config['tested'],
			'downloaded'    => 0,
			'last_updated'  => $this->config['last_updated'],
			'sections'      => array( 'description' => $this->config['description'] ),
			'download_link' => $this->config['zip_url'],
		);
	}

	/**
	 * Filter: Updates the source file location for the upgrade package.
	 *
	 * Filter for `upgrader_source_selection`.
	 *
	 * The download from GitHub will produce a directory named like "Automattic-jetpack-beta-xxxxxxx".
	 * We need to correct that so it will overwrite the current instance of the plugin.
	 *
	 * @param string $source File source location. Something like "/path/to/workdir/Automattic-jetpack-beta-xxxxxxx/".
	 * @param string $remote_source Remote file source location. Something like "/path/to/workdir/".
	 * @return string $source
	 */
	public function upgrader_source_selection( $source, $remote_source ) {
		global $wp_filesystem;
		if ( strstr( $source, '/Automattic-jetpack-beta-' ) ) {
			$corrected_source = trailingslashit( $remote_source ) . trailingslashit( $this->config['proper_folder_name'] );
			if ( $wp_filesystem->move( $source, $corrected_source, true ) ) {
				return $corrected_source;
			} else {
				return new WP_Error();
			}
		}
		return $source;
	}
}
