<?php
/**
 * VideoPress abilities registration.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Abilities;

use Automattic\Jetpack\VideoPress\Data;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers VideoPress management abilities.
 */
class VideoPress_Abilities extends Registrar {
	/**
	 * Initializes registration for sites in the VideoPress pilot.
	 *
	 * @return void
	 */
	public static function init() {
		if ( get_option( 'videopress_abilities_enabled', false ) ) {
			parent::init();
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'videopress';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => 'VideoPress',
			'description' => __( 'Abilities provided by VideoPress.', 'jetpack-videopress-pkg' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		$properties = array();
		foreach ( array(
			'videopress_videos_private_for_site',
			'videopress_auto_subtitles_disabled',
			'videopress_player_preload_disabled',
			'videopress_inline_player_enabled',
			'videopress_share_menu_disabled',
			'site_is_private',
		) as $setting ) {
			$properties[ $setting ] = array( 'type' => 'boolean' );
		}
		$properties['site_type'] = array(
			'type' => 'string',
			'enum' => array( 'jetpack', 'atomic', 'simple' ),
		);

		return array(
			'videopress/get-settings' => array(
				'label'               => __( 'Get VideoPress settings', 'jetpack-videopress-pkg' ),
				'description'         => __( 'Return effective VideoPress site settings and host type. This does not change settings or require an active VideoPress module.', 'jetpack-videopress-pkg' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'                 => 'object',
					'properties'           => $properties,
					'required'             => array_keys( $properties ),
					'additionalProperties' => false,
				),
				'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
				'execute_callback'    => array( __CLASS__, 'get_settings' ),
				'meta'                => array(
					'show_in_rest' => true,
					'mcp'          => array( 'public' => true ),
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
				),
			),
		);
	}

	/**
	 * Checks the same capability as the settings REST endpoints.
	 *
	 * @return bool Whether the user can inspect settings.
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns effective settings without exposing connection credentials.
	 *
	 * @param array|null $input Unused zero-argument input.
	 * @return array|\WP_Error Settings or a permission error.
	 */
	public static function get_settings( $input = null ) {
		unset( $input );
		if ( ! self::can_manage_settings() ) {
			return new \WP_Error(
				'videopress_forbidden',
				__( 'You are not allowed to view VideoPress settings.', 'jetpack-videopress-pkg' ),
				array( 'status' => 403 )
			);
		}

		return Data::get_videopress_settings();
	}
}
