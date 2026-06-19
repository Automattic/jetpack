<?php
/**
 * Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Post_Media\Images;
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

	const OPEN_GRAPH_SETTINGS = 'open_graph_settings';

	const DEFAULT_OPEN_GRAPH_SETTINGS = array(
		'default_image_id' => 0,
	);

	const NOTES_CONFIG = 'notes_config';

	const DEFAULT_NOTES_CONFIG = array(
		'append_link' => true,
	);

	const MESSAGE_TEMPLATE = 'message_template';

	/**
	 * Default global message template.
	 */
	const DEFAULT_MESSAGE_TEMPLATE = "{title}\n\n{excerpt}\n\n{url}";

	/**
	 * Storage cap for message templates, in characters. Real-world templates are a few hundred characters at most.
	 */
	const MESSAGE_TEMPLATE_MAX_LENGTH = 8000;

	// Legacy named options.
	const JETPACK_SOCIAL_NOTE_CPT_ENABLED   = 'jetpack-social-note';
	const JETPACK_SOCIAL_SHOW_PRICING_PAGE  = 'jetpack-social_show_pricing_page';
	const NOTES_FLUSH_REWRITE_RULES_FLUSHED = 'jetpack_social_rewrite_rules_flushed';

	/**
	 * Whether the actions have been hooked into.
	 *
	 * @var bool
	 */
	protected static $actions_hooked_in = false;

	/**
	 * Whether the Open Graph filters have been hooked into.
	 *
	 * @var bool
	 */
	protected static $open_graph_filters_hooked_in = false;

	/**
	 * Constructor.
	 */
	public function __construct() {

		if ( ! self::$actions_hooked_in ) {
			add_action( 'rest_api_init', array( $this, 'register_settings' ) );
			add_action( 'admin_init', array( $this, 'register_settings' ) );

			self::$actions_hooked_in = true;
		}

		self::register_open_graph_filters();
	}

	/**
	 * Register Open Graph filters for the configured default social image.
	 *
	 * @return void
	 */
	public static function register_open_graph_filters() {
		if ( self::$open_graph_filters_hooked_in ) {
			return;
		}

		add_filter( 'jetpack_og_default_site_image', array( __CLASS__, 'filter_default_site_image' ), 10, 2 );
		add_filter( 'jetpack_open_graph_image_default', array( __CLASS__, 'filter_default_image_url' ) );
		add_filter( 'jetpack_open_graph_tags', array( __CLASS__, 'add_default_image_to_open_graph_tags' ), 13 );

		self::$open_graph_filters_hooked_in = true;
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
							'font'             => array(
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
			self::OPTION_PREFIX . self::OPEN_GRAPH_SETTINGS,
			array(
				'type'         => 'object',
				'default'      => self::DEFAULT_OPEN_GRAPH_SETTINGS,
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'context'    => array( 'view', 'edit' ),
						'properties' => array(
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

		register_setting(
			'jetpack_social',
			self::OPTION_PREFIX . self::MESSAGE_TEMPLATE,
			array(
				'type'              => 'string',
				'default'           => self::DEFAULT_MESSAGE_TEMPLATE,
				'sanitize_callback' => array( __CLASS__, 'sanitize_message_template' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'    => 'string',
						'context' => array( 'view', 'edit' ),
					),
				),
			)
		);

		add_filter( 'rest_pre_update_setting', array( $this, 'update_settings' ), 10, 3 );
	}

	/**
	 * Sanitize a user-authored message template string.
	 *
	 * @param mixed $value The raw setting input. Non-string values coerce to ''.
	 * @return string The sanitised template.
	 */
	public static function sanitize_message_template( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = sanitize_textarea_field( $value );

		if ( mb_strlen( $value, 'UTF-8' ) > self::MESSAGE_TEMPLATE_MAX_LENGTH ) {
			$value = mb_substr( $value, 0, self::MESSAGE_TEMPLATE_MAX_LENGTH, 'UTF-8' );
		}

		return $value;
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
	 * Get the Open Graph settings.
	 *
	 * @return array
	 */
	public function get_open_graph_settings() {
		return self::get_stored_open_graph_settings();
	}

	/**
	 * Get the stored Open Graph settings.
	 *
	 * @return array
	 */
	private static function get_stored_open_graph_settings() {
		$settings = get_option( self::OPTION_PREFIX . self::OPEN_GRAPH_SETTINGS, self::DEFAULT_OPEN_GRAPH_SETTINGS );

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return self::DEFAULT_OPEN_GRAPH_SETTINGS;
		}

		return array_replace_recursive( self::DEFAULT_OPEN_GRAPH_SETTINGS, $settings );
	}

	/**
	 * Get the global message template.
	 *
	 * @return string
	 */
	public function get_message_template() {
		return (string) get_option( self::OPTION_PREFIX . self::MESSAGE_TEMPLATE, self::DEFAULT_MESSAGE_TEMPLATE );
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
			'openGraphSettings'            => $this->get_open_graph_settings(),
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

		// Open Graph Settings.
		if ( self::OPTION_PREFIX . self::OPEN_GRAPH_SETTINGS === $name ) {
			return $this->update_open_graph_settings( $value );
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
	 * Update the Open Graph settings.
	 *
	 * @param mixed $new_setting The new settings.
	 *
	 * @return bool
	 */
	public function update_open_graph_settings( $new_setting ) {
		$open_graph_settings = $this->get_open_graph_settings();

		if ( ! is_array( $new_setting ) ) {
			$new_setting = array();
		}

		if ( array_key_exists( 'default_image_id', $new_setting ) ) {
			$new_setting['default_image_id'] = absint( $new_setting['default_image_id'] );
		}

		return update_option( self::OPTION_PREFIX . self::OPEN_GRAPH_SETTINGS, array_replace_recursive( $open_graph_settings, $new_setting ) );
	}

	/**
	 * Get the default Open Graph image ID.
	 *
	 * @return int
	 */
	public static function og_get_default_image_id() {
		$settings = self::get_stored_open_graph_settings();

		return absint( $settings['default_image_id'] );
	}

	/**
	 * Get the default Open Graph image.
	 *
	 * @return array The source ('src'), 'width', 'height', and source type of the image.
	 */
	public static function og_get_default_image() {
		$image_id = self::og_get_default_image_id();

		if ( ! $image_id ) {
			return array();
		}

		$image = wp_get_attachment_image_src( $image_id, 'full' );

		if ( empty( $image[0] ) ) {
			return array();
		}

		$default_image = array(
			'src'    => $image[0],
			'width'  => isset( $image[1] ) ? absint( $image[1] ) : 0,
			'height' => isset( $image[2] ) ? absint( $image[2] ) : 0,
			'type'   => 'jetpack_social_default_og_image',
		);

		$alt_text = Images::get_alt_text( $image_id );
		if ( ! empty( $alt_text ) ) {
			$default_image['alt_text'] = $alt_text;
		}

		return $default_image;
	}

	/**
	 * Filter the site's representative Open Graph image.
	 *
	 * @param array $custom_site_image The custom site image provided by filters.
	 * @param array $site_image        The site image picked by Jetpack.
	 *
	 * @return array
	 */
	public static function filter_default_site_image( $custom_site_image, $site_image ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! empty( $custom_site_image['src'] ) ) {
			return $custom_site_image;
		}

		$default_image = self::og_get_default_image();

		if ( empty( $default_image['src'] ) ) {
			return $custom_site_image;
		}

		return $default_image;
	}

	/**
	 * Filter the default Open Graph image URL.
	 *
	 * @param string $default_url The default image URL.
	 *
	 * @return string
	 */
	public static function filter_default_image_url( $default_url ) {
		$default_image = self::og_get_default_image();

		if ( empty( $default_image['src'] ) ) {
			return $default_url;
		}

		return $default_image['src'];
	}

	/**
	 * Add the default image to Open Graph tags when no image has been set yet.
	 *
	 * @param array $tags Current Open Graph tags.
	 *
	 * @return array
	 */
	public static function add_default_image_to_open_graph_tags( $tags ) {
		if ( ! empty( $tags['og:image'] ) ) {
			return $tags;
		}

		$default_image = self::og_get_default_image();

		if ( empty( $default_image['src'] ) ) {
			return $tags;
		}

		$tags['og:image'] = $default_image['src'];

		if ( ! empty( $default_image['width'] ) ) {
			$tags['og:image:width'] = $default_image['width'];
		}

		if ( ! empty( $default_image['height'] ) ) {
			$tags['og:image:height'] = $default_image['height'];
		}

		if ( ! empty( $default_image['alt_text'] ) ) {
			$tags['og:image:alt'] = $default_image['alt_text'];
		}

		return $tags;
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

	/**
	 * Get the default font.
	 *
	 * @return string
	 */
	public function sig_get_default_font() {
		$this->migrate_old_option();
		$sig_settings = get_option( self::OPTION_PREFIX . self::IMAGE_GENERATOR_SETTINGS );
		if ( empty( $sig_settings ) || ! is_array( $sig_settings ) ) {
			return '';
		}

		return $sig_settings['font'] ?? '';
	}
}
