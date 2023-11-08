<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Modules;

/**
 * This class is used to get and update Jetpack_Social_Settings.
 * Currently supported features:
 *		- Social Image Generator
 *		- Auto Conversion
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_social_settings';

	/**
	 * Array with the settings.
	 *
	 * @var array $settings
	 */
	public $settings;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->settings = $this->get_settings();

		if ( ! isset( $this->settings[ 'socialImageGeneratorSettings' ] ) ) {
			update_option( self::OPTION_NAME, $this->migrate_old_options( $this->settings ) );
		}
	}

	/**
	 * Migrate old options to the new settings. Previously SIG settings were stored in the
	 * jetpack_social_image_generator_settings option. Now they are stored in the jetpack_social_settings
	 * together with the auto conversion settings.
	 *
	 * @return array
	 */
	private function migrate_old_options() {
		$auto_conversion_settings = get_option( 'jetpack_social_settings' );
		$sig_settings             = get_option( 'jetpack_social_image_generator_settings' );

		if ( empty( $auto_conversion_settings ) || ! is_array( $auto_conversion_settings ) ) {
			$auto_conversion_settings = array(
				'image' => true,
			);
		}

		if ( empty( $sig_settings ) || ! is_array( $sig_settings ) ) {
			$sig_settings = array(
				'enabled'  => false,
				'defaults' => array(
					'template' => Templates::DEFAULT_TEMPLATE,
				)
			);
		}
		
		return array(
			'autoConversionSettings' => $auto_conversion_settings,
			'socialImageGeneratorSettings' => $sig_settings,
		);
	}

	/**
	 * Get the current settings.
	 *
	 * @return array
	 */
	public function get_settings() {
		$settings = get_option( self::OPTION_NAME );
		return $settings;
	}

	public function update_settings( $settings) {
		$this->settings = $settings;
		return update_option( self::OPTION_NAME, $settings );
	}

	public function update_auto_conversion_settings( $new_settings ) {
		$settings                 = $this->get_settings();
		$auto_conversion_settings = array_replace_recursive( $settings['autoConversionSettings'], $new_settings );

		$settings['autoConversionSettings'] = $auto_conversion_settings;
		return $this->update_settings( $settings );
	}

	public function update_social_image_generator_settings( $new_settings ) {
		$settings     = $this->get_settings();
		$sig_settings = array_replace_recursive( $settings['socialImageGeneratorSettings'], $new_settings );

		$settings['socialImageGeneratorSettings'] = $sig_settings;
		return $this->update_settings( $settings );
	}

	/**
	 * Check if SIG is available.
	 *
	 * @return bool True if SIG is available, false otherwise.
	 */
	public function is_sig_available() {
		global $publicize;

		if ( ! $publicize ) {
			return false;
		}

		return $publicize->has_social_image_generator_feature();
	}

	/**
	 * Check if the auto conversion feature is available.
	 *
	 * @param string $type Whether video or image.

	 * @return bool True if available, false otherwise.
	 */
	public function is_auto_conversion_available( $type = 'image' ) {
		global $publicize;

		if ( ! $publicize ) {
			return false;
		}

		return $publicize->has_social_auto_conversion_feature( $type );
	}
}
