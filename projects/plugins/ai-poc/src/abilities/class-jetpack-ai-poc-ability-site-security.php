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
	 * @param array $args Arguments (action: 'enable' or 'disable').
	 * @return array Result with success status and data.
	 */
	public static function execute( $args = array() ) {
		$action = isset( $args['action'] ) ? $args['action'] : 'enable';

		// Validate action
		if ( ! in_array( $action, array( 'enable', 'disable' ), true ) ) {
			return array(
				'success' => false,
				'message' => 'Invalid action. Use "enable" or "disable".',
			);
		}

		$results = array();
		$overall_success = true;

		// Toggle Account Protection module
		$account_protection_result = self::toggle_module( 'account-protection', $action );
		$results['account_protection'] = $account_protection_result;
		if ( ! $account_protection_result['success'] ) {
			$overall_success = false;
		}

		// Toggle Downtime Monitor module
		$downtime_monitor_result = self::toggle_module( 'monitor', $action );
		$results['downtime_monitor'] = $downtime_monitor_result;
		if ( ! $downtime_monitor_result['success'] ) {
			$overall_success = false;
		}

		return array(
			'success' => $overall_success,
			'message' => $overall_success
				? sprintf( 'Successfully %sd site security modules', $action )
				: 'Some modules failed to toggle',
			'data'    => $results,
		);
	}

	/**
	 * Toggle a Jetpack module.
	 *
	 * @param string $module Module slug.
	 * @param string $action Action to perform ('enable' or 'disable').
	 * @return array Result with success status.
	 */
	private static function toggle_module( $module, $action ) {
		// Check if Jetpack is available
		if ( ! class_exists( 'Jetpack' ) ) {
			return array(
				'success' => false,
				'message' => 'Jetpack is not available',
				'module'  => $module,
			);
		}

		try {
			if ( 'enable' === $action ) {
				$result = Jetpack::activate_module( $module, false, false );

				if ( is_wp_error( $result ) ) {
					return array(
						'success' => false,
						'message' => $result->get_error_message(),
						'module'  => $module,
					);
				}

				return array(
					'success' => true,
					'message' => sprintf( 'Module %s enabled successfully', $module ),
					'module'  => $module,
					'status'  => 'enabled',
				);
			} else {
				$result = Jetpack::deactivate_module( $module );

				if ( is_wp_error( $result ) ) {
					return array(
						'success' => false,
						'message' => $result->get_error_message(),
						'module'  => $module,
					);
				}

				return array(
					'success' => true,
					'message' => sprintf( 'Module %s disabled successfully', $module ),
					'module'  => $module,
					'status'  => 'disabled',
				);
			}
		} catch ( Exception $e ) {
			return array(
				'success' => false,
				'message' => 'Error toggling module: ' . $e->getMessage(),
				'module'  => $module,
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
