<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/**
 * Cache settings class.
 * Settings are stored in a file in the boost-cache directory.
 */
class Boost_Cache_Settings {
	private static $instance = null;
	private $settings        = array();
	private $config_file_path;
	private $config_file;

	/**
	 * An uninitialized config holds these settings.
	 *
	 * @var array
	 */
	private $default_settings = array(
		'enabled'         => false,
		'bypass_patterns' => array(),
		'logging'         => false,
	);

	private function __construct() {
		$this->config_file_path = WP_CONTENT_DIR . '/boost-cache/';
		$this->config_file      = $this->config_file_path . 'config.php';
	}

	/**
	 * Gets the instance of the class.
	 *
	 * @return Boost_Cache_Settings The instance of the class.
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new Boost_Cache_Settings();
			self::$instance->init_settings();
		}

		return self::$instance;
	}

	/**
	 * Ensure a settings file exists, if one isn't there already.
	 *
	 * @return Boost_Cache_Error|bool - True if it was changed, or a Boost_Cache_Error on failure, false if it was already created.
	 */
	public function create_settings_file() {
		if ( file_exists( $this->config_file ) ) {
			return false;
		}

		if ( ! file_exists( $this->config_file_path ) ) {
			if ( ! Filesystem_Utils::create_directory( $this->config_file_path ) ) {
				return new Boost_Cache_Error( 'failed-settings-write', 'Failed to create settings directory at ' . $this->config_file_path );
			}
		}

		$write_result = $this->set( $this->default_settings );
		if ( $write_result instanceof Boost_Cache_Error ) {
			return $write_result;
		}

		return true;
	}

	/**
	 * If an error occurs while reading the options, it will be impossible to ever log this to the Boost Cache logs.
	 * So, if WP_DEBUG is enabled write it to the error_log instead.
	 *
	 * @param string $message - The message to log.
	 */
	private function log_init_error( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}

	/**
	 * Load the settings from the config file, if available. Falls back to defaults if not.
	 */
	private function init_settings() {
		$this->settings = $this->default_settings;

		// If no settings file exists yet, don't try to create one until we are writing a value.
		if ( ! file_exists( $this->config_file ) ) {
			return;
		}

		$lines = @file( $this->config_file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( empty( $lines ) || count( $lines ) < 4 ) {
			$this->log_init_error( 'Invalid config file at ' . $this->config_file );
			return;
		}

		$file_settings = null;
		foreach ( $lines as $line ) {
			if ( strpos( $line, '{' ) !== false ) {
				$file_settings = json_decode( $line, true );
				break;
			}
		}

		if ( ! is_array( $file_settings ) ) {
			$this->log_init_error( 'Invalid config file at ' . $this->config_file );
			return false;
		}

		$this->settings = $file_settings;
	}

	/**
	 * Returns the value of the given setting.
	 *
	 * @param string $setting - The setting to get.
	 * @return mixed - The value of the setting, or the default if the setting does not exist.
	 */
	public function get( $setting, $default = false ) {
		if ( ! isset( $this->settings[ $setting ] ) ) {
			return $default;
		}

		return $this->settings[ $setting ];
	}

	/**
	 * Returns true if the cache is enabled.
	 *
	 * @return bool
	 */
	public function get_enabled() {
		return $this->get( 'enabled', false );
	}

	/**
	 * Returns an array of URLs that should not be cached.
	 *
	 * @return array
	 */
	public function get_bypass_patterns() {
		return $this->get( 'bypass_patterns', array() );
	}

	/**
	 * Returns whether logging is enabled or not.
	 *
	 * @return bool
	 */
	public function get_logging() {
		return $this->get( 'logging', false );
	}

	/**
	 * Sets the given settings, and saves them to the config file.
	 *
	 * @param array $settings - The settings to set in a key => value associative
	 * array. This will be merged with the existing settings.
	 * Example:
	 * $result = $this->set( array( 'enabled' => true ) );
	 *
	 * @return Boost_Cache_Error|true - true if the settings were saved, Boost_Cache_Error otherwise.
	 */
	public function set( $settings ) {
		// If the settings file does not exist, attempt to create one.
		if ( ! file_exists( $this->config_file_path ) ) {
			$result = $this->create_settings_file();
			if ( $result instanceof Boost_Cache_Error ) {
				return $result;
			}
		}

		if ( ! is_writable( $this->config_file_path ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			$error = new Boost_Cache_Error( 'failed-settings-write', 'Could not write to the config file at ' . $this->config_file_path );
			Logger::debug( $error->get_error_message() );
			return $error;
		}

		$this->settings = array_merge( $this->settings, $settings );

		$contents = "<?php die();\n/*\n * Configuration data for Jetpack Boost Cache. Do not edit.\n" . json_encode( $this->settings ) . "\n */"; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		$result   = Filesystem_Utils::write_to_file( $this->config_file, $contents );
		if ( $result instanceof Boost_Cache_Error ) {
			Logger::debug( $result->get_error_message() );
			return new Boost_Cache_Error( 'failed-settings-write', 'Failed to write settings file: ' . $result->get_error_message() );
		}

		return true;
	}
}
