<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Modules;
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
	const OPTION_PREFIX = 'jetpack_social_';
	// cSpell:ignore AUTOCONVERT
	const AUTOCONVERT_IMAGES       = 'autoconvert_images';
	const IMAGE_GENERATOR_SETTINGS = 'image_generator_settings';

	const DEFAULT_IMAGE_GENERATOR_SETTINGS = array(
		'enabled'  => false,
		'template' => Templates::DEFAULT_TEMPLATE,
	);

	const DEFAULT_AUTOCONVERT_IMAGES_SETTINGS = array(
		'enabled' => true,
	);

	/**
	 * Migrate old options to the new settings. Previously SIG settings were stored in the
	 * jetpack_social_image_generator_settings option. Now they are stored in the jetpack_social_settings
	 * together with the auto conversion settings.
	 *
	 * TODO: Work out if this is possible on plugin upgrade
	 *
	 * @return void
	 */
	private function migrate_old_option() {
		// Migrating from the old option.
		$old_auto_conversion_settings = get_option( 'jetpack_social_settings' );
		if ( ! empty( $old_auto_conversion_settings ) ) {
			update_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES, array( 'enabled' => ! empty( $old_auto_conversion_settings['image'] ) ) );
			delete_option( 'jetpack_social_settings' );
		}
		// Checking if the new option is valid.
		$auto_conversion_settings = get_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES );
		// If the option is not set, we don't need to delete it.
		// If it is set, but it is not an array or it does not have the enabled key, we delete it.
		if ( false !== $auto_conversion_settings && ( ! is_array( $auto_conversion_settings ) || ! isset( $auto_conversion_settings['enabled'] ) ) ) {
			delete_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES );
		}

		$sig_settings = get_option( 'jetpack_social_image_generator_settings' );
		// If the option is not set, we don't need to migrate.
		if ( $sig_settings === false ) {
			return;
		}

		$enabled  = false;
		$template = Templates::DEFAULT_TEMPLATE;

		if ( isset( $sig_settings['defaults']['template'] ) ) {
			$template = $sig_settings['defaults']['template'];
		}

		if ( isset( $sig_settings['enabled'] ) ) {
			$enabled = $sig_settings['enabled'];
		}

		if ( ! isset( $sig_settings['template'] ) ) {
			update_option(
				self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS,
				array(
					'enabled'  => $enabled,
					'template' => $template,
				)
			);
		}
	}

	/**
	 * Register the settings.
	 *
	 * @return void
	 */
	public function register_settings() {
		register_setting(
			'jetpack_social',
			self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES,
			array(
				'default'      => array(
					'enabled' => true,
				),
				'type'         => 'object',
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'enabled' => array(
								'type' => 'boolean',
							),
						),
					),
				),
			)
		);

		register_setting(
			'jetpack_social',
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
	 * @param bool $with_available Whether to include the available status of the features.
	 *
	 * @return array
	 */
	public function get_settings( $with_available = false ) {
		$this->migrate_old_option();

		$settings = array(
			'autoConversionSettings'       => get_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES, self::DEFAULT_AUTOCONVERT_IMAGES_SETTINGS ),
			'socialImageGeneratorSettings' => get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, self::DEFAULT_IMAGE_GENERATOR_SETTINGS ),
		);

		// The feature cannot be enabled without Publicize.
		if ( ! ( new Modules() )->is_active( 'publicize' ) ) {
			$settings['autoConversionSettings']['enabled']       = false;
			$settings['socialImageGeneratorSettings']['enabled'] = false;
		}

		if ( $with_available ) {
			$settings['autoConversionSettings']['available']       = $this->is_auto_conversion_available();
			$settings['socialImageGeneratorSettings']['available'] = $this->is_sig_available();
		}

		return $settings;
	}

	/**
	 * Update the settings.
	 *
	 * @param bool   $updated The updated settings.
	 * @param string $name    The name of the setting.
	 * @param mixed  $value   The value of the setting.
	 *
	 * @return bool
	 */
	public function update_settings( $updated, $name, $value ) {
		if ( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES === $name ) {
			return $this->update_auto_conversion_setting( $value );
		}

		if ( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS === $name ) {
			return $this->update_social_image_generator_settings( $value );
		}
		return $updated;
	}

	/**
	 * Update the auto conversion settings.
	 *
	 * @param array $new_setting The new settings.
	 *
	 * @return bool
	 */
	public function update_auto_conversion_setting( $new_setting ) {
		$this->migrate_old_option();
		$auto_conversion_settings = get_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES );

		if ( empty( $auto_conversion_settings ) || ! is_array( $auto_conversion_settings ) ) {
			$auto_conversion_settings = self::DEFAULT_AUTOCONVERT_IMAGES_SETTINGS;
		}

		return update_option( self::OPTION_PREFIX . self::AUTOCONVERT_IMAGES, array_replace_recursive( $auto_conversion_settings, $new_setting ) );
	}

	/**
	 * Update the social image generator settings.
	 *
	 * @param array $new_setting The new settings.
	 *
	 * @return bool
	 */
	public function update_social_image_generator_settings( $new_setting ) {
		$this->migrate_old_option();
		$sig_settings = get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS );

		if ( empty( $sig_settings ) || ! is_array( $sig_settings ) ) {
			$sig_settings = self::DEFAULT_IMAGE_GENERATOR_SETTINGS;
		}

		return update_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, array_replace_recursive( $sig_settings, $new_setting ) );
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

	/**
	 * Get the default template.
	 *
	 * @return string
	 */
	public function sig_get_default_template() {
		$this->migrate_old_option();
		$sig_settings = get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS );
		if ( empty( $sig_settings ) || ! is_array( $sig_settings ) ) {
			$sig_settings = self::DEFAULT_IMAGE_GENERATOR_SETTINGS;
		}
		return $sig_settings['template'];
	}
}
