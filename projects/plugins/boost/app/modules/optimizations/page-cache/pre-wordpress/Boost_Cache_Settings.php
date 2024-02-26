<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/*
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
	 */
	private $default_settings = array(
		'enabled'    => true,
		'exceptions' => array(),
		'logging'    => false,
	);

	private function __construct() {
		$this->config_file_path = WP_CONTENT_DIR . '/boost-cache/';
		$this->config_file      = $this->config_file_path . 'config.php';
		try {
			$this->init_settings();
		} catch ( \Exception $exception ) {
			// Log to default error log as Logger is not available yet.
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( $exception->getMessage() );
		}
	}

	/**
	 * Gets the instance of the class.
	 *
	 * @return Boost_Cache_Settings The instance of the class.
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new Boost_Cache_Settings();
		}

		return self::$instance;
	}

	/**
	 * Load the settings from the config file, if available.
	 *
	 * @throws \Exception
	 */
	private function init_settings() {

		if ( ! file_exists( $this->config_file_path ) ) {
			mkdir( $this->config_file_path, 0755, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		}

		if ( ! file_exists( $this->config_file ) ) {
			if ( ! $this->set( $this->default_settings ) ) {
				return false;
			}
		}

		$lines = file( $this->config_file );
		if ( count( $lines ) < 4 ) {
			throw new \Exception( 'Invalid boost-cache config file' );
		}

		$settings = null;
		foreach ( $lines as $line ) {
			if ( strpos( $line, '{' ) !== false ) {
				$settings = json_decode( $line, true );
				break;
			}
		}
		if ( ! is_array( $settings ) ) {
			throw new \Exception( 'Invalid boost-cache config file' );
		}
		$this->settings = $settings;
	}

	/*
	 * Returns the value of the given setting.
	 *
	 * @param string $setting - The setting to get.
	 * @return mixed - The value of the setting, or false if the setting does not exist. Call get_last_error() to get the error message.
	 */
	public function get( $setting, $default = false ) {
		if ( ! isset( $this->settings[ $setting ] ) ) {
			Logger::debug( 'Setting not found: ' . $setting );
			return $default;
		}
		return $this->settings[ $setting ];
	}

	/*
	 * Returns true if the cache is enabled.
	 *
	 * @return bool
	 */
	public function get_enabled() {
		return $this->get( 'enabled', false );
	}

	/*
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
	 * @return void
	 * @throws \Exception
	 */
	public function set( $settings ) {
		if ( ! is_writable( $this->config_file_path ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			throw new \Exception( 'Config file is not writable' );
		}

		$this->settings = array_merge( $this->settings, $settings );

		$contents = "<?php die();\n/*\n * Configuration data for Jetpack Boost Cache. Do not edit.\n" . json_encode( $this->settings ) . "\n */"; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		Filesystem_Utils::write_to_file( $this->config_file, $contents );
	}
}
