<?php
/**
 * Dismissed notices handler class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

/**
 * This class is used to register the dismissed notices option.
 */
class Dismissed_Notices {

	const DISMISSED_NOTICES_OPTION = 'jetpack_social_dismissed_notices';

	/**
	 * Register the settings.
	 */
	public function register() {
		register_setting(
			'general',
			self::DISMISSED_NOTICES_OPTION,
			array(
				'type'         => 'object',
				'default'      => array(),
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'notice'            => array(
								'description' => __( 'Name of the notice to dismiss', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
								'enum'        => array( 'instagram', 'advanced-upgrade-nudge-admin', 'advanced-upgrade-nudge-editor', 'auto-conversion-editor-notice' ),
								'required'    => true,
							),
							'reappearance_time' => array(
								'description' => __( 'Time when the notice should reappear', 'jetpack-publicize-pkg' ),
								'type'        => 'integer',
								'default'     => 0,
							),
						),
					),
				),
			)
		);

		add_filter( 'rest_pre_update_setting', array( $this, 'update_dismissed_notices' ), 10, 3 );
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
	public function update_dismissed_notices( $updated, $name, $value ) {
		if ( self::DISMISSED_NOTICES_OPTION !== $name ) {
			return $updated;
		}

		$notice            = $value['notice'];
		$reappearance_time = $value['reappearance_time'];
		$dismissed_notices = get_option( self::DISMISSED_NOTICES_OPTION );

		if ( ! is_array( $dismissed_notices ) ) {
			$dismissed_notices = array();
		}

		$dismissed_notices[ $notice ] = $reappearance_time;
		return update_option( self::DISMISSED_NOTICES_OPTION, $dismissed_notices );
	}

	/**
	 * Get the dismissed notices.
	 *
	 * @return array
	 */
	public static function get_dismissed_notices() {
		return get_option( self::DISMISSED_NOTICES_OPTION, array() );
	}
}
