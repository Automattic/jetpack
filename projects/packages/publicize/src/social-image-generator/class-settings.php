<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

/**
 * This class is used to get and update SIG-specific global settings.
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_social_image_generator_settings';

	/**
	 * A whitelist of valid settings.
	 *
	 * @var array
	 */
	const VALID_SETTINGS = array(
		'enabled',
		'defaults',
	);

	/**
	 * A whitelist of valid defaults.
	 *
	 * @var array
	 */
	const VALID_DEFAULTS = array(
		'template',
	);

	/**
	 * A list of all available templates.
	 *
	 * @var array
	 */
	const TEMPLATES = array( 'dois', 'edge', 'fullscreen', 'highway' );

	/**
	 * Array with SIG's settings.
	 *
	 * @var array $settings
	 */
	public $settings;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->settings = $this->get_settings();
	}

	/**
	 * Get all current SIG settings.
	 *
	 * @return array
	 */
	public function get_settings() {
		$settings = get_option( self::OPTION_NAME );

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return array();
		}

		return $settings;
	}

	/**
	 * Validate an array of defaults and make sure all settings are allowed.
	 *
	 * @param array $defaults Array of defaults to validate.
	 * @return array Array of validated defaults.
	 */
	private function validate_defaults( $defaults ) {
		if ( ! is_array( $defaults ) ) {
			return array();
		}

		// Strip out any keys that are not allowed.
		$defaults = array_filter(
			$defaults,
			function ( $key ) {
				return in_array( $key, self::VALID_DEFAULTS, true );
			},
			ARRAY_FILTER_USE_KEY
		);

		// Sanitize the values for each key.
		$values = array_map(
			function ( $key, $value ) {
				switch ( $key ) {
					case 'template':
						return in_array( $value, self::TEMPLATES, true ) ? $value : $this->get_default_template();
				}
			},
			array_keys( $defaults ),
			$defaults
		);

		return array_combine( array_keys( $defaults ), $values );
	}

	/**
	 * Update a SIG setting.
	 *
	 * @param string $key The key to update.
	 * @param mixed  $value The value to set for the key.
	 * @return bool True if the value was updated, false otherwise.
	 */
	private function update_setting( $key, $value ) {
		if ( ! in_array( $key, self::VALID_SETTINGS, true ) ) {
			return false;
		}

		switch ( $key ) {
			case 'enabled':
				$value = (bool) $value;
				break;
			case 'defaults':
				$value = self::validate_defaults( $value );
				break;
		}

		$settings = array_replace_recursive( self::get_settings(), array( $key => $value ) );

		return update_option( self::OPTION_NAME, $settings );
	}

	/**
	 * Check if SIG is enabled.
	 *
	 * @return bool True if SIG is enabled, false otherwise.
	 */
	public function is_enabled() {
		return ! empty( $this->settings['enabled'] );
	}

	/**
	 * Enable or disable SIG.
	 *
	 * @param bool $value True to enable SIG, false to disable.
	 * @return bool True if the setting was updated successfully, false otherwise.
	 */
	public function set_enabled( $value ) {
		return $this->update_setting( 'enabled', (bool) $value );
	}

	/**
	 * Get an array of all current defaults.
	 *
	 * @return array
	 */
	private function get_defaults() {
		return isset( $this->settings['defaults'] ) ? $this->settings['defaults'] : array();
	}

	/**
	 * Get the current default template.
	 *
	 * @return string
	 */
	public function get_default_template() {
		$defaults = $this->get_defaults();

		return isset( $defaults['template'] ) ? $defaults['template'] : '';
	}

	/**
	 * Set a new default template.
	 *
	 * @param string $template Name of the template.
	 * @return bool True if the setting was updated successfully, false otherwise.
	 */
	public function set_default_template( $template ) {
		return self::update_setting( 'defaults', array_merge( $this->get_defaults(), array( 'template' => $template ) ) );
	}
}
