<?php
/**
 * Jetpack Social Settings Abilities Registration.
 *
 * Registers Jetpack Social plugin settings abilities with the WordPress
 * Abilities API so AI agents can read and update the site-wide auto-share,
 * share-message, and image-generator defaults through the standard
 * `wp-abilities/v1` REST surface.
 *
 * Connection management abilities live in the publicize package
 * (`Automattic\Jetpack\Publicize\Abilities\Publicize_Abilities`); this class
 * only exposes the plugin's settings surface so the two registrations stay
 * decoupled and the Social plugin owns the user-facing settings catalog.
 *
 * @package automattic/jetpack-social-plugin
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions for older-WP compatibility runs.

namespace Automattic\Jetpack\Social\Abilities;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as Social_Settings;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_Social;
use WP_Error;

/**
 * Registers Jetpack Social plugin settings abilities.
 *
 * Exposes a small, agent-friendly settings surface:
 *
 * - `jetpack-social/get-settings`    — read the current site-wide Social
 *   plugin settings (auto-share toggle, share message template, image
 *   generator defaults, UTM defaults, social notes toggle).
 * - `jetpack-social/update-settings` — update one or more fields; idempotent
 *   when the desired state already matches.
 *
 * Storage is delegated to the publicize package's `Settings` class (which
 * owns the persisted options) and to `Automattic\Jetpack\Modules` (which
 * owns the publicize module on/off switch). The plugin keeps responsibility
 * for the public settings catalog.
 */
class Social_Settings_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-social';
	const ERROR_PREFIX  = 'jetpack_social_';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack Social" is a product name and should not be translated.
			'label'       => 'Jetpack Social',
			'description' => __( 'Abilities for reading and updating Jetpack Social plugin settings.', 'jetpack-social' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		$settings_schema = array(
			'type'       => 'object',
			'properties' => array(
				'auto_share_enabled'       => array(
					'type'        => 'boolean',
					'description' => __( 'Whether auto-sharing (the Publicize module) is enabled.', 'jetpack-social' ),
				),
				'share_message_template'   => array(
					'type'        => 'string',
					'description' => __( 'Site-wide default share message template. Supports {title}, {excerpt}, and {url} placeholders.', 'jetpack-social' ),
				),
				'image_generator_enabled'  => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the Social Image Generator is enabled by default for new posts.', 'jetpack-social' ),
				),
				'image_generator_template' => array(
					'type'        => array( 'string', 'null' ),
					'description' => __( 'The default Social Image Generator template slug. Null when the feature is not available.', 'jetpack-social' ),
				),
				'utm_enabled'              => array(
					'type'        => 'boolean',
					'description' => __( 'Whether UTM parameters are appended to shared links.', 'jetpack-social' ),
				),
				'social_notes_enabled'     => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the Social Notes short-form custom post type is enabled.', 'jetpack-social' ),
				),
				'supports'                 => array(
					'type'       => 'object',
					'properties' => array(
						'image_generator' => array( 'type' => 'boolean' ),
						'utm'             => array( 'type' => 'boolean' ),
						'social_notes'    => array( 'type' => 'boolean' ),
					),
				),
			),
		);

		$update_input_schema = array(
			'type'                 => 'object',
			'default'              => array(),
			'additionalProperties' => false,
			'properties'           => array(
				'auto_share_enabled'       => array(
					'type'        => 'boolean',
					'description' => __( 'Enable or disable the Publicize module (auto-sharing).', 'jetpack-social' ),
				),
				'share_message_template'   => array(
					'type'        => 'string',
					'description' => __( 'Site-wide default share message template. Empty string clears the template.', 'jetpack-social' ),
					'maxLength'   => Social_Settings::MESSAGE_TEMPLATE_MAX_LENGTH,
				),
				'image_generator_enabled'  => array(
					'type'        => 'boolean',
					'description' => __( 'Enable or disable the Social Image Generator by default.', 'jetpack-social' ),
				),
				'image_generator_template' => array(
					'type'        => 'string',
					'description' => __( 'Set the default Social Image Generator template slug.', 'jetpack-social' ),
				),
				'utm_enabled'              => array(
					'type'        => 'boolean',
					'description' => __( 'Enable or disable UTM parameters on shared links.', 'jetpack-social' ),
				),
				'social_notes_enabled'     => array(
					'type'        => 'boolean',
					'description' => __( 'Enable or disable the Social Notes custom post type.', 'jetpack-social' ),
				),
			),
		);

		$update_output_schema = array(
			'type'       => 'object',
			'properties' => array(
				'settings'       => $settings_schema,
				'changed'        => array(
					'type'        => 'boolean',
					'description' => __( 'True when at least one stored value was updated.', 'jetpack-social' ),
				),
				'changed_fields' => array(
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'description' => __( 'Keys whose stored value changed.', 'jetpack-social' ),
				),
			),
		);

		return array(
			'jetpack-social/get-settings'    => array(
				'label'               => __( 'Get Jetpack Social plugin settings', 'jetpack-social' ),
				'description'         => __(
					'Return the site-wide Jetpack Social settings: { auto_share_enabled, share_message_template, image_generator_enabled, image_generator_template, utm_enabled, social_notes_enabled, supports }. Read-only and idempotent. Requires the administrator capability (`manage_options`) — the same cap the plugin\'s REST settings controller enforces.',
					'jetpack-social'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'additionalProperties' => false,
					'properties'           => array(),
				),
				'output_schema'       => $settings_schema,
				'execute_callback'    => array( __CLASS__, 'get_settings' ),
				'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-social/update-settings' => array(
				'label'               => __( 'Update Jetpack Social plugin settings', 'jetpack-social' ),
				'description'         => __(
					'Update one or more Jetpack Social plugin settings. Accepts any subset of { auto_share_enabled, share_message_template, image_generator_enabled, image_generator_template, utm_enabled, social_notes_enabled }. Returns the resulting settings plus { changed, changed_fields }. Idempotent — when the desired values already match the stored values, returns changed=false. Requires the administrator capability (`manage_options`).',
					'jetpack-social'
				),
				'input_schema'        => $update_input_schema,
				'output_schema'       => $update_output_schema,
				'execute_callback'    => array( __CLASS__, 'update_settings' ),
				'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for both abilities.
	 *
	 * Mirrors `REST_Settings_Controller::require_admin_privilege_callback()` —
	 * only administrators can read or modify plugin-wide settings.
	 *
	 * @return bool
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: read the current settings.
	 *
	 * @return array
	 */
	public static function get_settings() {
		return self::build_settings_snapshot();
	}

	/**
	 * Execute: update one or more settings.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function update_settings( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Empty payload: no-op, but a valid call. Return current settings with changed=false.
		if ( empty( $input ) ) {
			return array(
				'settings'       => self::build_settings_snapshot(),
				'changed'        => false,
				'changed_fields' => array(),
			);
		}

		$before         = self::build_settings_snapshot();
		$changed_fields = array();

		foreach ( $input as $field => $value ) {
			switch ( $field ) {
				case 'auto_share_enabled':
					$desired = (bool) $value;
					if ( $desired === (bool) $before['auto_share_enabled'] ) {
						break;
					}
					$result = self::set_publicize_module_active( $desired );
					if ( is_wp_error( $result ) ) {
						return $result;
					}
					$changed_fields[] = $field;
					break;

				case 'share_message_template':
					$desired = Social_Settings::sanitize_message_template( $value );
					if ( $desired === (string) $before['share_message_template'] ) {
						break;
					}
					update_option(
						Social_Settings::OPTION_PREFIX . Social_Settings::MESSAGE_TEMPLATE,
						$desired
					);
					$changed_fields[] = $field;
					break;

				case 'image_generator_enabled':
					$desired = (bool) $value;
					if ( $desired === (bool) $before['image_generator_enabled'] ) {
						break;
					}
					$settings_instance = new Social_Settings();
					$settings_instance->update_social_image_generator_settings( array( 'enabled' => $desired ) );
					$changed_fields[] = $field;
					break;

				case 'image_generator_template':
					if ( ! is_string( $value ) ) {
						return new WP_Error(
							self::ERROR_PREFIX . 'invalid_image_generator_template',
							__( 'image_generator_template must be a string.', 'jetpack-social' ),
							array( 'status' => 400 )
						);
					}
					$desired = $value;
					if ( $desired === (string) $before['image_generator_template'] ) {
						break;
					}
					$settings_instance = new Social_Settings();
					$settings_instance->update_social_image_generator_settings( array( 'template' => $desired ) );
					$changed_fields[] = $field;
					break;

				case 'utm_enabled':
					$desired = (bool) $value;
					if ( $desired === (bool) $before['utm_enabled'] ) {
						break;
					}
					$current_utm = get_option(
						Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS,
						Social_Settings::DEFAULT_UTM_SETTINGS
					);
					if ( ! is_array( $current_utm ) ) {
						$current_utm = Social_Settings::DEFAULT_UTM_SETTINGS;
					}
					$current_utm['enabled'] = $desired;
					update_option( Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS, $current_utm );
					$changed_fields[] = $field;
					break;

				case 'social_notes_enabled':
					$desired = (bool) $value;
					if ( $desired === (bool) $before['social_notes_enabled'] ) {
						break;
					}
					// Mirror Settings::update_settings(): flush the rewrite-rules cache.
					delete_option( Social_Settings::NOTES_FLUSH_REWRITE_RULES_FLUSHED );
					update_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED, $desired );
					$changed_fields[] = $field;
					break;

				default:
					// additionalProperties:false in the schema prevents this in REST, but
					// guard for direct PHP callers.
					break;
			}
		}

		$after = self::build_settings_snapshot();

		return array(
			'settings'       => $after,
			'changed'        => ! empty( $changed_fields ),
			'changed_fields' => array_values( array_unique( $changed_fields ) ),
		);
	}

	/**
	 * Build the canonical snapshot returned by both abilities.
	 *
	 * @return array
	 */
	private static function build_settings_snapshot(): array {
		$settings_instance = new Social_Settings();

		$sig_settings     = $settings_instance->get_image_generator_settings();
		$utm_settings     = $settings_instance->get_utm_settings();
		$sig_enabled      = ! empty( $sig_settings['enabled'] );
		$sig_template     = isset( $sig_settings['template'] ) && is_string( $sig_settings['template'] )
			? $sig_settings['template']
			: null;
		$utm_enabled      = is_array( $utm_settings ) && ! empty( $utm_settings['enabled'] );
		$auto_share_on    = class_exists( Jetpack_Social::class )
			? Jetpack_Social::is_publicize_active()
			: ( new Modules() )->is_active( 'publicize' );
		$notes_enabled    = (bool) get_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED, false );
		$has_sig_feature  = $settings_instance->is_sig_available();
		$message_template = $settings_instance->get_message_template();

		return array(
			'auto_share_enabled'       => (bool) $auto_share_on,
			'share_message_template'   => $message_template,
			'image_generator_enabled'  => $sig_enabled,
			'image_generator_template' => $sig_template,
			'utm_enabled'              => $utm_enabled,
			'social_notes_enabled'     => $notes_enabled,
			'supports'                 => array(
				'image_generator' => (bool) $has_sig_feature,
				'utm'             => true,
				'social_notes'    => true,
			),
		);
	}

	/**
	 * Activate or deactivate the publicize module.
	 *
	 * Wraps `Modules::activate()` / `Modules::deactivate()` so the
	 * `auto_share_enabled` field maps to the plugin's auto-sharing master
	 * switch in one place.
	 *
	 * @param bool $enabled Desired state.
	 * @return true|WP_Error True on success; WP_Error if the modules layer rejects the change.
	 */
	private static function set_publicize_module_active( bool $enabled ) {
		$modules = new Modules();
		$slug    = class_exists( Jetpack_Social::class )
			? Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG
			: 'publicize';

		$result = $enabled
			? $modules->activate( $slug, false, false )
			: $modules->deactivate( $slug );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === $result ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'module_toggle_failed',
				$enabled
					? __( 'Failed to activate the Publicize module.', 'jetpack-social' )
					: __( 'Failed to deactivate the Publicize module.', 'jetpack-social' ),
				array( 'status' => 500 )
			);
		}

		return true;
	}
}
