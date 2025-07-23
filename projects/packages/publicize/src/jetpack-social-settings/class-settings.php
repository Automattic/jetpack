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
 *      - UTM Settings
 *      - Social Notes
 *
 * @phan-constructor-used-for-side-effects
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

	const UTM_SETTINGS = 'utm_settings';

	const DEFAULT_UTM_SETTINGS = array(
		'enabled' => false,
	);

	const NOTES_CONFIG = 'notes_config';

	const DEFAULT_NOTES_CONFIG = array(
		'append_link' => true,
	);

	// Legacy named options.
	const JETPACK_SOCIAL_NOTE_CPT_ENABLED   = 'jetpack-social-note';
	const JETPACK_SOCIAL_SHOW_PRICING_PAGE  = 'jetpack-social_show_pricing_page';
	const NOTES_FLUSH_REWRITE_RULES_FLUSHED = 'jetpack_social_rewrite_rules_flushed';

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
	 * Whether the actions have been hooked into.
	 *
	 * @var bool
	 */
	protected static $actions_hooked_in = false;

	/**
	 * Constructor.
	 */
	public function __construct() {

		if ( ! self::$actions_hooked_in ) {
			add_action( 'rest_api_init', array( $this, 'register_settings' ) );
			add_action( 'admin_init', array( $this, 'register_settings' ) );

			self::$actions_hooked_in = true;
		}
	}

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
							'enabled'          => array(
								'type' => 'boolean',
							),
							'template'         => array(
								'type' => 'string',
							),
							'default_image_id' => array(
								'type' => 'number',
							),
						),
					),
				),
			)
		);

		register_setting(
			'jetpack_social',
			self::OPTION_PREFIX . self::UTM_SETTINGS,
			array(
				'type'         => 'boolean',
				'default'      => array(
					'enabled' => false,
				),
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
			self::JETPACK_SOCIAL_SHOW_PRICING_PAGE,
			array(
				'type'         => 'boolean',
				'default'      => true,
				'show_in_rest' => array(
					'schema' => array(
						'type' => 'boolean',
					),
				),
			)
		);

		register_setting(
			'jetpack_social',
			self::JETPACK_SOCIAL_NOTE_CPT_ENABLED,
			array(
				'type'         => 'boolean',
				'default'      => false,
				'show_in_rest' => array(
					'schema' => array(
						'type' => 'boolean',
					),
				),
			)
		);

		register_setting(
			'jetpack_social',
			self::OPTION_PREFIX . self::NOTES_CONFIG,
			array(
				'type'         => 'object',
				'default'      => self::DEFAULT_NOTES_CONFIG,
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'context'    => array( 'view', 'edit' ),
						'properties' => array(
							'append_link' => array(
								'type' => 'boolean',
							),
							'link_format' => array(
								'type' => 'string',
								'enum' => array( 'full_url', 'shortlink', 'permashortcitation' ),
							),
						),
					),
				),
			)
		);

		add_filter( 'rest_pre_update_setting', array( $this, 'update_settings' ), 10, 3 );
	}

	/**
	 * Get the image generator settings.
	 *
	 * @return array
	 */
	public function get_image_generator_settings() {
		return get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS, self::DEFAULT_IMAGE_GENERATOR_SETTINGS );
	}

	/**
	 * Get if the UTM params is enabled.
	 *
	 * @return array
	 */
	public function get_utm_settings() {
		return get_option( self::OPTION_PREFIX . self::UTM_SETTINGS, self::DEFAULT_UTM_SETTINGS );
	}

	/**
	 * Get the social notes config.
	 *
	 * @return array The social notes config.
	 */
	public function get_social_notes_config() {
		return get_option( self::OPTION_PREFIX . self::NOTES_CONFIG, self::DEFAULT_NOTES_CONFIG );
	}

	/**
	 * Check if the pricing page should be displayed.
	 *
	 * @return bool
	 */
	public static function should_show_pricing_page() {
		return (bool) get_option( self::JETPACK_SOCIAL_SHOW_PRICING_PAGE, true );
	}

	/**
	 * Get if the social notes feature is enabled.
	 *
	 * @return bool
	 */
	public function is_social_notes_enabled() {
		return (bool) get_option( self::JETPACK_SOCIAL_NOTE_CPT_ENABLED, false );
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
			'socialImageGeneratorSettings' => $this->get_image_generator_settings(),
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
	 * Deprecated method, stub left here to avoid fatal.
	 *
	 * @deprecated 0.62.0
	 */
	public function get_initial_state() {
		return array();
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

		// Social Image Generator.
		if ( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS === $name ) {
			return $this->update_social_image_generator_settings( $value );
		}

		// UTM Settings.
		if ( self::OPTION_PREFIX . self::UTM_SETTINGS === $name ) {
			$current_utm_settings = $this->get_utm_settings();

			if ( empty( $current_utm_settings ) || ! is_array( $current_utm_settings ) ) {
				$current_utm_settings = self::DEFAULT_UTM_SETTINGS;
			}

			return update_option( self::OPTION_PREFIX . self::UTM_SETTINGS, array_replace_recursive( $current_utm_settings, $value ) );
		}

		// Social Notes.
		if ( self::JETPACK_SOCIAL_NOTE_CPT_ENABLED === $name ) {
			// Delete this option, so the rules get flushed in maybe_flush_rewrite_rules when the CPT is registered.
			delete_option( self::NOTES_FLUSH_REWRITE_RULES_FLUSHED );
			return update_option( self::JETPACK_SOCIAL_NOTE_CPT_ENABLED, (bool) $value );
		}
		if ( self::OPTION_PREFIX . self::NOTES_CONFIG === $name ) {
			$old_config = $this->get_social_notes_config();
			$new_config = array_merge( $old_config, $value );
			return update_option( self::OPTION_PREFIX . self::NOTES_CONFIG, $new_config );
		}

		if ( self::JETPACK_SOCIAL_SHOW_PRICING_PAGE === $name ) {
			return update_option( self::JETPACK_SOCIAL_SHOW_PRICING_PAGE, (int) $value );
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

	/**
	 * Get the default image ID.
	 *
	 * @return int
	 */
	public function sig_get_default_image_id() {
		$this->migrate_old_option();
		$sig_settings = get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS );
		if ( empty( $sig_settings ) || ! is_array( $sig_settings ) ) {
			return 0;
		}

		if ( isset( $sig_settings['default_image_id'] ) ) {
			return $sig_settings['default_image_id'];
		}

		return 0;
	}
}
