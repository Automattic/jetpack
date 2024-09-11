<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Publicize\Publicize_Script_Data;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;

/**
 * This class is used to get and update Jetpack_Social_Settings.
 * Currently supported features:
 *      - Social Image Generator
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_PREFIX            = 'jetpack_social_';
	const IMAGE_GENERATOR_SETTINGS = 'image_generator_settings';

	const DEFAULT_IMAGE_GENERATOR_SETTINGS = array(
		'enabled'  => false,
		'template' => Templates::DEFAULT_TEMPLATE,
	);

	/**
	 * Feature flags. Each item has 3 keys because of the naming conventions:
	 * - flag_name: The name of the feature flag for the option check.
	 * - feature_name: The name of the feature that enables the feature. Will be checked with Current_Plan.
	 * - variable_name: The name of the variable that will be used in the front-end.
	 *
	 * @var array
	 */
	const FEATURE_FLAGS = array(
		array(
			'flag_name'     => 'editor_preview',
			'feature_name'  => 'editor-preview',
			'variable_name' => 'useEditorPreview',
		),
		array(
			'flag_name'     => 'share_status',
			'feature_name'  => 'share-status',
			'variable_name' => 'useShareStatus',
		),
	);

	/**
	 * Migrate old options to the new settings. Previously SIG settings were stored in the
	 * jetpack_social_image_generator_settings option. Now they are stored in the jetpack_social_settings.
	 *
	 * TODO: Work out if this is possible on plugin upgrade
	 *
	 * @return void
	 */
	private function migrate_old_option() {
		// Delete the old options if they exist.
		if ( get_option( 'jetpack_social_settings' ) ) {
			delete_option( 'jetpack_social_settings' );
		}
		if ( get_option( 'jetpack_social_autoconvert_images' ) ) {
			delete_option( 'jetpack_social_autoconvert_images' );
		}

		$sig_settings = get_option( 'jetpack_social_image_generator_settings' );
		// If the option is not set, we don't need to migrate.
		if ( false === $sig_settings ) {
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
			'socialImageGeneratorSettings' => get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, self::DEFAULT_IMAGE_GENERATOR_SETTINGS ),
		);

		// The feature cannot be enabled without Publicize.
		if ( ! ( new Modules() )->is_active( 'publicize' ) ) {
			$settings['socialImageGeneratorSettings']['enabled'] = false;
		}

		if ( $with_available ) {
			$settings['socialImageGeneratorSettings']['available'] = $this->is_sig_available();
		}

		return $settings;
	}

	/**
	 * Get the initial state.
	 */
	public function get_initial_state() {
		global $publicize;

		$settings = $this->get_settings( true );

		$settings['useAdminUiV1'] = false;
		$settings['featureFlags'] = array();

		$settings['is_publicize_enabled'] = false;
		$settings['hasPaidFeatures']      = false;

		$connection = new Manager();

		if ( ( new Modules() )->is_active( 'publicize' ) && $connection->has_connected_user() ) {
			$settings['useAdminUiV1']   = $publicize->use_admin_ui_v1();
			$settings['connectionData'] = array(
				'connections' => $publicize->get_all_connections_for_user(),
				'adminUrl'    => esc_url_raw( $publicize->publicize_connections_url( 'jetpack-social-connections-admin-page' ) ),
				'services'    => Publicize_Script_Data::get_supported_services(),
			);

			$settings['is_publicize_enabled'] = true;
			$settings['hasPaidFeatures']      = $publicize->has_paid_features();

			foreach ( self::FEATURE_FLAGS as $feature_flag ) {
				$settings['featureFlags'][ $feature_flag['variable_name'] ] = $publicize->has_feature_flag( $feature_flag['flag_name'], $feature_flag['feature_name'] );
			}
		} else {
			$settings['connectionData'] = array(
				'connections' => array(),
			);
		}

		$settings['connectionRefreshPath'] = ! empty( $settings['useAdminUiV1'] ) ? 'jetpack/v4/publicize/connections?test_connections=1' : '/jetpack/v4/publicize/connection-test-results';

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

		if ( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS === $name ) {
			return $this->update_social_image_generator_settings( $value );
		}
		return $updated;
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
