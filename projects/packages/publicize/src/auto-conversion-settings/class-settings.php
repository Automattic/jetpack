<?php
/**
 * Settings class.
 * Flagged to be removed after deprecation.
 *
 * @deprecated 0.38.3
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Auto_Conversion;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as Jetpack_Social_Settings;

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
		$new_settings = ( new Jetpack_Social_Settings() )->get_settings();

		return array(
			'image' => $new_settings['autoConversionSettings']['enabled'],
		);
	}

	/**
	 * Check if the auto conversion feature is available.
	 *
	 * @param string $type Whether video or image.
	 * @return bool True if available, false otherwise.
	 */
	public function is_available( $type ) {
		return ( new Jetpack_Social_Settings() )->is_auto_conversion_available( $type );
	}

	/**
	 * Check if the auto conversion feature is enabled.
	 *
	 * @param string $type Whether video or image.
	 *
	 * @return bool True if the feature is enabled, false otherwise.
	 */
	public function is_enabled( $type ) {
		if ( 'image' === $type ) {
			$new_settings = ( new Jetpack_Social_Settings() )->get_settings();
			return $new_settings['autoConversionSettings']['enabled'];
		}
	}
}
