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
			'jetpack_social',
			self::DISMISSED_NOTICES_OPTION,
			array(
				'type'         => 'object',
				'default'      => array(),
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'auto-conversion-editor-notice' => array( 'type' => 'number' ),
							'advanced-upgrade-nudge-admin' => array( 'type' => 'number' ),
							'advanced-upgrade-nudge-editor' => array( 'type' => 'number' ),
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

		$notice            = key( $value );
		$reappearance_time = $value[ $notice ];
		$dismissed_notices = self::get_dismissed_notices();

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
