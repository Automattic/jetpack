<?php
/**
 * Allow the Jetpack Beta plugin to autoupdate itself.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use WP_Error;

/**
 * Allow the Jetpack Beta plugin to autoupdate itself.
 */
class AutoupdateSelf {

	/**
	 * Singleton class instance.
	 *
	 * @var static
	 */
	protected static $instance = null;

	const TRANSIENT_NAME = 'JETPACK_BETA_LATEST_TAG';

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
	public function __construct() {
		if ( ! empty( self::$instance ) ) {
			return;
		}

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

	/** Set update arguments */
	public function set_update_args() {
		$plugin_data                  = $this->get_plugin_data();
		$this->config['plugin_name']  = $plugin_data['Name'];
		$this->config['version']      = $plugin_data['Version'];
		$this->config['author']       = $plugin_data['Author'];
		$this->config['homepage']     = $plugin_data['PluginURI'];
		$this->config['new_version']  = $this->get_latest_prerelease();
		$this->config['last_updated'] = $this->get_date();
		$this->config['description']  = $this->get_description();
		$this->config['zip_url']      = 'https://github.com/Automattic/jetpack-beta/zipball/' . $this->config['new_version'];
	}

	/** Check for latest pre-release plugin every six hours and update */
	public function get_latest_prerelease() {
		$tagged_version = get_site_transient( self::TRANSIENT_NAME );
		if ( $this->overrule_transients() || empty( $tagged_version ) ) {
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
			if ( ! empty( $tagged_version ) ) {
				set_site_transient( self::TRANSIENT_NAME, $tagged_version, 60 * 60 * 6 );
			}
		}
		return $tagged_version;
	}

	/** Override transients to force update */
	public function overrule_transients() {
		return ( defined( 'Jetpack_Beta_FORCE_UPDATE' ) && Jetpack_Beta_FORCE_UPDATE );
	}

	/** Get update data from Github */
	public function get_github_data() {
		if ( ! empty( $this->github_data ) ) {
			$github_data = $this->github_data;
		} else {
			$github_data = get_site_transient( md5( $this->config['slug'] ) . '_github_data' );
			if ( $this->overrule_transients() || ( ! isset( $github_data ) || ! $github_data || '' === $github_data ) ) {
				$github_data = wp_remote_get( $this->config['api_url'] );
				if ( is_wp_error( $github_data ) ) {
					return false;
				}
				$github_data = json_decode( $github_data['body'] );
				// Refresh every 6 hours.
				set_site_transient( md5( $this->config['slug'] ) . '_github_data', $github_data, 60 * 60 * 6 );
			}
			// Store the data in this class instance for future calls.
			$this->github_data = $github_data;
		}
		return $github_data;
	}

	/** Get date of update in GMT*/
	public function get_date() {
		$_date = $this->get_github_data();
		return ! empty( $_date->updated_at ) ? gmdate( 'Y-m-d', strtotime( $_date->updated_at ) ) : false;
	}

	/** Get latest update's description */
	public function get_description() {
		$_description = $this->get_github_data();
		return ! empty( $_description->description ) ? $_description->description : false;
	}

	/** Get plugin update data */
	public function get_plugin_data() {
		return get_plugin_data( WP_PLUGIN_DIR . '/' . $this->config['plugin_file'] );
	}

	/** Check if there's a newer version */
	public function has_never_version() {
		if ( ! isset( $this->config['new_version'] ) ) {
			$this->set_update_args();
		}
		return version_compare( $this->config['new_version'], $this->config['version'], '>' );

	}

	/**
	 * Check the latest transient data and update if necessary.
	 *
	 * @param string $transient - the transient we're checking.
	 */
	public function api_check( $transient ) {
		// Check if the transient contains the 'checked' information.
		// If not, just return its value without hacking it.
		if ( ! isset( $transient->no_update ) ) {
			return $transient;
		}
		// Get the latest version.
		delete_site_transient( self::TRANSIENT_NAME );

		if ( $this->has_never_version() ) {
			$response = (object) array(
				'plugin'      => $this->config['slug'],
				'new_version' => $this->config['new_version'],
				'slug'        => $this->config['slug'],
				'url'         => $this->config['github_url'],
				'package'     => $this->config['zip_url'],
			);
			// If response is false, don't alter the transient.
			if ( false !== $response ) {
				$transient->response[ $this->config['plugin_file'] ] = $response;
			}
		}
		return $transient;
	}

	/**
	 * Get latest plugin information
	 *
	 * @param string $false Result from plugins_api.
	 * @param string $action The type of information being requested from the Plugin Installation API.
	 * @param object $response The response from plugins_api.
	 */
	public function get_plugin_info( $false, $action, $response ) {
		// Check if this call API is for the right plugin.
		if ( ! isset( $response->slug ) || $response->slug !== $this->config['slug'] ) {
			return false;
		}
		// Update tags.
		$this->set_update_args();
		$response->slug          = $this->config['slug'];
		$response->plugin        = $this->config['slug'];
		$response->name          = $this->config['plugin_name'];
		$response->plugin_name   = $this->config['plugin_name'];
		$response->version       = $this->config['new_version'];
		$response->author        = $this->config['author'];
		$response->homepage      = $this->config['homepage'];
		$response->requires      = $this->config['requires'];
		$response->tested        = $this->config['tested'];
		$response->downloaded    = 0;
		$response->last_updated  = $this->config['last_updated'];
		$response->sections      = array( 'description' => $this->config['description'] );
		$response->download_link = $this->config['zip_url'];
		return $response;
	}

	/**
	 * Updates the source file location for the upgrade package.
	 *
	 * @param string $source - File source location..
	 * @param string $remote_source - Remote file source location.
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
