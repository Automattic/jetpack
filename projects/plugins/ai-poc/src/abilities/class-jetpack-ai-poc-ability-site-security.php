<?php
/**
 * Site Security Ability for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Ability_Site_Security
 *
 * Toggles Account Protection and Downtime Monitor modules.
 */
class Jetpack_AI_POC_Ability_Site_Security {

	/**
	 * Execute the site security ability.
	 *
	 * This method is called by the WordPress Abilities API.
	 * Input has already been validated against the input_schema.
	 *
	 * @param array $input Input parameters from the Abilities API (contains 'action' key).
	 * @return array|WP_Error Result matching the output schema, or WP_Error on failure.
	 */
	public static function execute( $input ) {
		$action = isset( $input['action'] ) ? $input['action'] : 'enable';

		// Input validation is already done by Abilities API, but add safety check.
		if ( ! in_array( $action, array( 'enable', 'disable' ), true ) ) {
			return new WP_Error(
				'invalid_action',
				__( 'Invalid action. Use "enable" or "disable".', 'jetpack-ai-poc' )
			);
		}

		$modules_status  = array();
		$overall_success = true;
		$messages        = array();

		// Toggle Account Protection module.
		$account_protection_result = self::toggle_module( 'account-protection', $action );
		if ( is_wp_error( $account_protection_result ) ) {
			$overall_success                      = false;
			$modules_status['account-protection'] = false;
			$messages[]                           = $account_protection_result->get_error_message();
		} else {
			$modules_status['account-protection'] = ( 'enable' === $action );
		}

		// Toggle Monitor module (Downtime Monitor).
		$monitor_result = self::toggle_module( 'monitor', $action );
		if ( is_wp_error( $monitor_result ) ) {
			$overall_success           = false;
			$modules_status['monitor'] = false;
			$messages[]                = $monitor_result->get_error_message();
		} else {
			$modules_status['monitor'] = ( 'enable' === $action );
		}

		if ( ! $overall_success ) {
			return new WP_Error(
				'module_toggle_failed',
				implode( '. ', $messages )
			);
		}

		return array(
			'success' => true,
			'message' => sprintf(
				/* translators: %s: action performed (enabled or disabled) */
				__( 'Successfully %s security modules', 'jetpack-ai-poc' ),
				'enable' === $action ? __( 'enabled', 'jetpack-ai-poc' ) : __( 'disabled', 'jetpack-ai-poc' )
			),
			'modules' => $modules_status,
		);
	}

	/**
	 * Toggle a Jetpack module.
	 *
	 * @param string $module Module slug.
	 * @param string $action Action to perform ('enable' or 'disable').
	 * @return true|WP_Error True on success, WP_Error on failure.
	 */
	private static function toggle_module( $module, $action ) {
		// Check if Jetpack is available.
		if ( ! class_exists( 'Jetpack' ) ) {
			return new WP_Error(
				'jetpack_not_available',
				sprintf(
					/* translators: %s: module name */
					__( 'Cannot toggle module %s: Jetpack is not available', 'jetpack-ai-poc' ),
					$module
				)
			);
		}

		try {
			if ( 'enable' === $action ) {
				$result = Jetpack::activate_module( $module, false, false );

				if ( is_wp_error( $result ) ) {
					return $result;
				}

				return true;
			} else {
				$result = Jetpack::deactivate_module( $module );

				if ( is_wp_error( $result ) ) {
					return $result;
				}

				return true;
			}
		} catch ( Exception $e ) {
			return new WP_Error(
				'module_toggle_exception',
				sprintf(
					/* translators: 1: module name, 2: error message */
					__( 'Error toggling module %1$s: %2$s', 'jetpack-ai-poc' ),
					$module,
					$e->getMessage()
				)
			);
		}
	}

	/**
	 * Get current status of security modules.
	 *
	 * @return array Status of modules.
	 */
	public static function get_status() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return array(
				'success' => false,
				'message' => 'Jetpack is not available',
			);
		}

		return array(
			'success' => true,
			'data'    => array(
				'account_protection' => array(
					'module'  => 'account-protection',
					'enabled' => Jetpack::is_module_active( 'account-protection' ),
				),
				'downtime_monitor'   => array(
					'module'  => 'monitor',
					'enabled' => Jetpack::is_module_active( 'monitor' ),
				),
			),
		);
	}
}
