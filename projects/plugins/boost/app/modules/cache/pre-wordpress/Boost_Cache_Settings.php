<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress;

/*
 * Cache settings class.
 * Settings are stored in a file in the boost-cache directory.
 */
class Boost_Cache_Settings {
	private static $instance = null;
	private $settings        = array();
	private $last_error      = '';
	private $config_file_path;
	private $config_file;

	private function __construct() {
		$this->config_file_path = WP_CONTENT_DIR . '/boost-cache/';
		$this->config_file      = $this->config_file_path . 'config.php';
		$this->init_settings();
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

	/*
	 * Load the settings from the config file, if available.
	 */
	private function init_settings() {

		if ( ! file_exists( $this->config_file_path ) ) {
			mkdir( $this->config_file_path, 0755, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		}

		if ( ! file_exists( $this->config_file ) ) {
			if ( ! $this->set( array( 'enabled' => false ) ) ) {
				return false;
			}
		}

		$lines = file( $this->config_file );
		if ( count( $lines ) < 4 ) {
			$this->last_error = 'Invalid config file';
			return false;
		}

		$settings = null;
		foreach ( $lines as $line ) {
			if ( strpos( $line, '{' ) !== false ) {
				$settings = json_decode( $line, true );
				break;
			}
		}
		if ( ! is_array( $settings ) ) {
			$this->last_error = 'Invalid config file';
			return false;
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
			$this->last_error = 'Setting not found';
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
	public function get_excluded_urls() {
		return $this->get( 'excluded_urls', array() );
	}

	/*
	 * Sets the given settings, and saves them to the config file.
	 * @param array $settings - The settings to set in a key => value associative
	 * array. This will be merged with the existing settings.
	 * Example:
	 * $result = $this->set( array( 'enabled' => true ) );
	 *
	 * @return bool - true if the settings were saved, false otherwise. Call get_last_error() to get the error message.
	 */
	public function set( $settings ) {
		if ( ! is_writable( $this->config_file_path ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			$this->last_error = 'Config file is not writable';
			return false;
		}

		$this->settings = array_merge( $this->settings, $settings );

		$contents = "<?php die();\n/*\n * Configuration data for Jetpack Boost Cache. Do not edit.\n" . json_encode( $this->settings ) . "\n */"; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		$result   = Boost_Cache_Utils::write_to_file( $this->config_file, $contents );
		if ( is_wp_error( $result ) ) {
			$this->last_error = $result->get_error_message();
			return false;
		} else {
			return true;
		}
	}

	/*
	 * Returns the last error message generated by get() or set().
	 * This is required because WP_Error may not be available.
	 *
	 * @return string
	 */
	public function get_last_error() {
		return $this->last_error;
	}

	/*
	 * Resets the last error message.
	 * Once you get the last_error, it should be reset, or it will be returned again.
	 */
	public function reset_last_error() {
		$this->last_error = '';
	}
}
