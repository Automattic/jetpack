<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Auto_Conversion;

use Automattic\Jetpack\Modules;

/**
 * This class is used to get and update Auto_Conversion_Settings.
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_social_settings';

	/**
	 * Array with auto conversion settings.
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
	 * Get the current auto conversion settings.
	 *
	 * @return array
	 */
	private function get_settings() {
		$settings = get_option( self::OPTION_NAME );

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return array();
		}

		return $settings;
	}

	/**
	 * Update setting.
	 *
	 * @param string $key The key to update.
	 * @param mixed  $value The value to set for the key.
	 * @return bool True if the value was updated, false otherwise.
	 */
	private function update_setting( $key, $value ) {
		$settings       = array_replace_recursive( $this->get_settings(), array( $key => $value ) );
		$this->settings = $settings;

		return update_option( self::OPTION_NAME, $settings );
	}

	/**
	 * Check if the auto conversion feature is available.
	 *
	 * @param string $type Whether video or image.

	 * @return bool True if available, false otherwise.
	 */
	public function is_available( $type ) {
		global $publicize;

		if ( ! $publicize ) {
			return false;
		}

		return $publicize->has_social_auto_conversion_feature( $type );
	}

	/**
	 * Check if the auto conversion feature is enabled.
	 *
	 * @param string $type Whether video or image.
	 *
	 * @return bool True if the feature is enabled, false otherwise.
	 */
	public function is_enabled( $type ) {
		// If the feature isn't available it should never be enabled.
		if ( ! $this->is_available( $type ) ) {
			return false;
		}

		// The feature cannot be enabled without Publicize.
		if ( ! ( new Modules() )->is_active( 'publicize' ) ) {
			return false;
		}

		if ( isset( $this->settings[ $type ] ) ) {
			return $this->settings[ $type ];
		}

		return false;
	}

	/**
	 * Enable or disable Auto Conversion.
	 *
	 * @param bool $key Whether video or image.
	 * @param bool $value True to enable auto-conversion settings, false to disable.
	 * @return bool True if the setting was updated successfully, false otherwise.
	 */
	public function set_enabled( $key, $value ) {
		return $this->update_setting( $key, (bool) $value );
	}
}
