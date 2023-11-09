<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;

/**
 * This class is used to get and update Jetpack_Social_Settings.
 * Currently supported features:
 *      - Social Image Generator
 *      - Auto Conversion
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_PREFIX            = 'jetpack_social_';
	const AUTOCONVERT_IMAGES       = 'autoconvert_images';
	const IMAGE_GENERATOR_SETTINGS = 'image_generator_settings';

	/**
	 * Array with the settings.
	 *
	 * @var array $settings
	 */
	public $settings;

	/**
	 * Migrate old options to the new settings. Previously SIG settings were stored in the
	 * jetpack_social_image_generator_settings option. Now they are stored in the jetpack_social_settings
	 * together with the auto conversion settings.
	 *
	 * TODO: Work out if this is possible on plugin upgrade
	 *
	 * @return array
	 */
	private function migrate_old_option() {
		$auto_conversion_settings = get_option( 'jetpack_social_settings' );
		if ( empty( $auto_conversion_settings['image'] ) ) {
			return;
		}

		$this->update_auto_conversion_settings( $auto_conversion_settings['image'] );
		delete_option( 'jetpack_social_settings' );
	}

	public function register_settings() {
		register_setting(
			'general',
			self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES,
			array(
				'default'      => true,
				'show_in_rest' => true,
				'type'         => 'boolean',
			)
		);

		register_setting(
			'general',
			self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS,
			array(
				'type'         => 'object',
				'default'      => array(
					'enabled'  => false,
					'template' => Templates::DEFAULT_TEMPLATE,
				),
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'enabled'  => array(
								'type' => 'boolean',
							),
							'template' => array(
								'type' => 'string',
							),
						),
					),
				),
			)
		);

		add_filter( 'rest_pre_update_setting', array( $this, 'update_settings' ), 10, 3 );
	}

	/**
	 * Get the current settings.
	 *
	 * @return array
	 */
	public function get_settings() {
		$this->migrate_old_option();
		$settings = array(
			'autoConversionSettings'       => get_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES ),
			'socialImageGeneratorSettings' => get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS ),
		);
		return $settings;
	}

	public function update_settings( $updated, $name, $value ) {
		if ( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES === $name ) {
			return $this->update_auto_conversion_settings( $value );
		}

		if ( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS === $name ) {
			return $this->update_social_image_generator_settings( $value );
		}
		return $updated;
	}

	public function update_auto_conversion_setting( $new_setting ) {
		$this->migrate_old_option();
		return update_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, $new_setting );
	}

	public function update_social_image_generator_settings( $new_settings ) {
		$settings     = $this->get_settings();
		$sig_settings = array_replace_recursive( $settings['socialImageGeneratorSettings'], $new_settings );

		return update_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, $sig_settings );
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
