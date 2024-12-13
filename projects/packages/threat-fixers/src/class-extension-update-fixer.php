<?php
/**
 * Extension Threat Fixer Class
 *
 * @package automattic/jetpack-threat-fixers
 */

namespace Automattic\Jetpack\Threat_Fixers;

use Plugin_Upgrader;
use Plugin_Upgrader_Skin;
use Theme_Upgrader;
use Theme_Upgrader_Skin;
use WP_Error;

/**
 * Extension Update Fixer Class
 */
abstract class Extension_Update_Fixer {
	/**
	 * The type of extension, either 'themes' or 'plugins'.
	 *
	 * @var string
	 */
	private $extension_type;

	/**
	 * The slug of extension, i.e. "jetpack" or "twentytwentyfive".
	 *
	 * @var string
	 */
	private $extension_slug;

	/**
	 * The fixed version to install. If null, the latest version will be installed.
	 *
	 * @var string|null
	 */
	private $target_version = null;

	/**
	 * Upgrader instance.
	 * May be null if initialization fails.
	 *
	 * @var Theme_Upgrader|Plugin_Upgrader|null
	 */
	private $upgrader = null;

	/**
	 * Extension Update Fixer Constructor.
	 *
	 * @param string  $extension_type The type of extension, either "themes" or "plugins".
	 * @param string  $extension_slug The slug of extension, i.e. "jetpack" or "twentytwenty".
	 * @param ?string $target_version The fixed version to install.
	 *
	 * @throws \InvalidArgumentException If the arguments are invalid.
	 *
	 * @return void
	 */
	public function __construct( $extension_type, $extension_slug, $target_version = null ) {
		if ( in_array( $extension_type, array( 'themes', 'plugins' ), true ) ) {
			$this->extension_type = $extension_type;
		} else {
			throw new \InvalidArgumentException( 'Invalid extension type.' );
		}

		if ( ! empty( $extension_slug ) && is_string( $extension_slug ) ) {
			$this->extension_slug = $extension_slug;
		} else {
			throw new \InvalidArgumentException( 'Invalid extension slug.' );
		}

		if ( empty( $target_version ) || is_string( $target_version ) ) {
			$this->target_version = $target_version;
		} else {
			throw new \InvalidArgumentException( 'Invalid target version.' );
		}
	}

	/**
	 * Initialize the fixer's WP_Upgrader instance.
	 *
	 * @throws \InvalidArgumentException If the extension type is invalid.
	 *
	 * @return Theme_Upgrader|Plugin_Upgrader Upgrader instance.
	 */
	protected function get_upgrader() {
		if ( $this->upgrader ) {
			return $this->upgrader;
		}

		if ( ! class_exists( '\WP_Upgrader' ) ) {
			if ( file_exists( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' ) ) {
				include ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			}
		}

		if ( ! class_exists( '\WP_Upgrader_Skin' ) ) {
			if ( file_exists( ABSPATH . 'wp-admin/includes/class-wp-upgrader-skin.php' ) ) {
				include ABSPATH . 'wp-admin/includes/class-wp-upgrader-skin.php';
			}
		}

		switch ( $this->extension_type ) {
			case 'themes':
				$this->upgrader = new Theme_Upgrader( new Theme_Upgrader_Skin() );
				return $this->upgrader;
			case 'plugins':
				$this->upgrader = new Plugin_Upgrader( new Plugin_Upgrader_Skin() );
				return $this->upgrader;
			default:
				throw new \InvalidArgumentException( 'Invalid extension type.' );
		}
	}

	/**
	 * Get extension data from the WordPress.org API.
	 *
	 * @return object|WP_Error The extension data on success, WP_Error on failure.
	 */
	public function get_extension_api_data() {
		switch ( $this->extension_type ) {
			case 'themes':
				return themes_api( 'theme_information', array( 'slug' => $this->extension_slug ) );
			case 'plugins':
				return plugins_api( 'plugin_information', array( 'slug' => $this->extension_slug ) );
			default:
				return new WP_Error( 'invalid_extension_type', 'Invalid extension type.' );
		}
	}

	/**
	 * Get extension download link.
	 *
	 * @return string|WP_Error The download link on success, WP_Error on failure.
	 */
	public function get_download_link_from_wporg() {
		// Fetch theme installation information from the WordPress.org API.
		$api_data = $this->get_extension_api_data();
		if ( is_wp_error( $api_data ) ) {
			return $api_data;
		}

		// If no version is specified, use the latest version.
		$version = $this->target_version ?? $api_data->version;

		// Get the base download link.
		$download_link = strstr( $api_data->download_link, $api_data->slug, true );
		// Append the specific version.
		$download_link = $download_link . $api_data->slug . '.' . $version . '.zip';
		// WordPress.org requires HTTPS.
		$download_link = str_replace( 'http://', 'https://', $download_link );

		// Ensure the requested version exists.
		$response      = wp_remote_head( $download_link );
		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== (int) $response_code ) {
			return is_wp_error( $response )
					? $response
					: new WP_Error( $response_code, sprintf( 'HTTP code %d', $response_code ) );
		}

		return $download_link;
	}

	/**
	 * Run the fixer by installing the fixed version of the extension.
	 *
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public function run() {
		// Get the link to download the extension zip from WordPress.org.
		$download_link = $this->get_download_link_from_wporg();

		if ( is_wp_error( $download_link ) ) {
			return $download_link;
		}

		// Install the updated extension.
		$result = $this->get_upgrader()->install( $download_link );

		// Handle the result.
		if ( is_wp_error( $result ) ) {
			$key = $result->get_error_code();
			if ( in_array( $key, array( 'plugins_api_failed', 'themes_api_failed' ), true ) && ! empty( $result->error_data[ $key ] ) && in_array( $result->error_data[ $key ], array( 'N;', 'b:0;' ), true ) ) {
				return new WP_Error( 'plugin_not_found', "Couldn't find '{$this->extension_slug}' in the WordPress.org {$this->extension_type} directory." );
			}
			return new WP_Error( 'error', "{$this->extension_slug}: " . $result->get_error_message() );
		}

		return true;
	}
}
