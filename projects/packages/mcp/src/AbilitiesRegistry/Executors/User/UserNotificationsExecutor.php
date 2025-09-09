<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\ValidationHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use Notification_Settings;
use WP_Error;

/**
 * User Notifications Executor Class
 *
 * Handles execution logic for user notifications ability
 */
class UserNotificationsExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the user notifications ability.
	 *
	 * @param array $input The input parameters.
	 * @return WP_Error|array The notifications data or error.
	 */
	public function execute( array $input = array() ) {
		try {
			$action = ValidationHelper::validate_action(
				$input['action'] ?? 'list',
				array( 'list', 'get_settings', 'get_devices', 'test_delivery' )
			);

			if ( is_wp_error( $action ) ) {
				return $action;
			}

			switch ( $action ) {
				case 'list':
					return $this->list_notification_settings( $input );
				case 'get_settings':
					return $this->get_notification_settings( $input );
				case 'get_devices':
					return $this->get_push_devices();
				case 'test_delivery':
					return $this->test_notification_delivery( $input );
				default:
					return $this->create_error( 'invalid_action', 'Invalid action specified' );
			}
		} catch ( Exception $e ) {
			return $this->create_error(
				'notifications_error',
				'An error occurred: ' . $e->getMessage(),
				500
			);
		}
	}

	/**
	 * Check permission for the user notifications ability.
	 *
	 * @param array $input The input parameters.
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

	/**
	 * List all notification settings
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Settings list or error.
	 */
	private function list_notification_settings( array $input ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $input is required for interface compatibility
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		// Get user sites for blog-specific settings.
		$user_sites = get_ordered_blogs_of_user( $current_user_id );
		if ( ! $user_sites ) {
			$user_sites = array();
		}

		// Get push notification devices.
		$devices = $this->get_user_push_devices( $current_user_id );

		// Initialize notification settings helper if available.
		if ( class_exists( 'Notification_Settings' ) ) {
			$notification_settings = new Notification_Settings();
			$user_attributes       = array();

			// Get all notification-related user attributes.
			$all_attributes = $notification_settings->get_user_attributes_for_notifications( $current_user_id );
			foreach ( $all_attributes as $attr ) {
				$user_attributes[ $attr ] = get_user_attribute( $current_user_id, $attr );
			}

			$settings = $notification_settings->get_settings( $user_sites, $devices, $user_attributes, null );
		} else {
			// Fallback to basic settings.
			$settings = $this->get_basic_notification_settings( $user_sites );
		}

		return array(
			'success'               => true,
			'notification_settings' => $settings,
			'devices'               => $devices,
			'summary'               => $this->generate_notifications_summary( $settings, $devices ),
		);
	}

	/**
	 * Get specific notification settings
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Settings or error.
	 */
	private function get_notification_settings( array $input ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$setting_type    = $input['setting_type'] ?? 'all';
		$blog_id         = $input['blog_id'] ?? null;

		$settings = array();

		if ( 'blogs' === $setting_type || 'all' === $setting_type ) {
			if ( $blog_id ) {
				$settings['blog_settings'] = $this->get_blog_notification_settings( $current_user_id, $blog_id );
			} else {
				$settings['blogs'] = $this->get_all_blog_notification_settings( $current_user_id );
			}
		}

		if ( 'other' === $setting_type || 'all' === $setting_type ) {
			$settings['other'] = $this->get_other_notification_settings( $current_user_id );
		}

		if ( 'wpcom' === $setting_type || 'all' === $setting_type ) {
			$settings['wpcom'] = $this->get_wpcom_notification_settings( $current_user_id );
		}

		return array(
			'success'  => true,
			'settings' => $settings,
		);
	}

	/**
	 * Get push notification devices
	 *
	 * @return WP_Error|array Devices list or error.
	 */
	private function get_push_devices() {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$current_user_id = $this->get_current_user_id();
		$devices         = $this->get_user_push_devices( $current_user_id );

		return array(
			'success' => true,
			'devices' => $devices,
			'total'   => count( $devices ),
		);
	}

	/**
	 * Test notification delivery (placeholder implementation)
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array Test results or error.
	 */
	private function test_notification_delivery( array $input ) {
		$user_error = $this->validate_user_logged_in();
		if ( $user_error ) {
			return $user_error;
		}

		$channel   = $input['channel'] ?? 'email';
		$device_id = $input['device_id'] ?? null;

		// This is a placeholder implementation
		// In a real environment, this would send a test notification.
		$test_result = array(
			'channel'   => $channel,
			'status'    => 'success',
			'message'   => 'Test notification would be sent',
			'timestamp' => gmdate( 'c' ),
		);

		if ( 'push' === $channel && $device_id ) {
			$test_result['device_id'] = $device_id;
		}

		return array(
			'success'     => true,
			'test_result' => $test_result,
		);
	}

	/**
	 * Get user push devices (placeholder implementation)
	 *
	 * @param int $user_id User ID.
	 * @return array Push devices.
	 */
	private function get_user_push_devices( int $user_id ): array {
		if ( class_exists( 'Notification_Settings' ) ) {
			$notification_settings = new Notification_Settings();
			$devices               = $notification_settings->get_mobile_push_tokens_of_user( $user_id );

			return array_map(
				function ( $device ) {
					return array(
						'device_id'   => $device->device_uuid ?? $device->id ?? '',
						'device_name' => $device->device_name ?? 'Unknown Device',
						'device_type' => $device->device_family ?? 'mobile',
						'enabled'     => true,
						'last_seen'   => $device->created ?? '',
					);
				},
				$devices
			);
		}

		// Fallback placeholder data.
		return array();
	}

	/**
	 * Get basic notification settings (fallback)
	 *
	 * @param array $user_sites User sites.
	 * @return array Basic settings.
	 */
	private function get_basic_notification_settings( array $user_sites ): array {
		$settings = array(
			'blogs' => array(),
			'other' => array(
				'comment_like'  => true,
				'comment_reply' => true,
			),
			'wpcom' => array(
				'marketing' => true,
				'research'  => true,
				'community' => true,
				'digest'    => true,
				'news'      => true,
				'reports'   => true,
			),
		);

		// Add blog settings.
		foreach ( $user_sites as $site ) {
			$settings['blogs'][] = array(
				'blog_id'   => (int) $site->userblog_id,
				'blog_name' => $site->blogname,
				'settings'  => array(
					'new_comment'  => true,
					'comment_like' => true,
					'post_like'    => true,
					'follow'       => true,
					'achievement'  => true,
					'mentions'     => true,
				),
			);
		}

		return $settings;
	}

	/**
	 * Get blog-specific notification settings
	 *
	 * @param int $user_id User ID.
	 * @param int $blog_id Blog ID.
	 * @return array Blog settings.
	 */
	private function get_blog_notification_settings( int $user_id, int $blog_id ): array {
		// Placeholder implementation.
		return array(
			'blog_id'  => $blog_id,
			'settings' => array(
				'new_comment'  => true,
				'comment_like' => true,
				'post_like'    => true,
				'follow'       => true,
				'achievement'  => true,
				'mentions'     => true,
			),
		);
	}

	/**
	 * Get all blog notification settings
	 *
	 * @param int $user_id User ID.
	 * @return array All blog settings.
	 */
	private function get_all_blog_notification_settings( int $user_id ): array {
		$user_sites    = get_ordered_blogs_of_user( $user_id );
		$blog_settings = array();

		if ( $user_sites ) {
			foreach ( $user_sites as $site ) {
				$blog_settings[] = $this->get_blog_notification_settings( $user_id, $site->userblog_id );
			}
		}

		return $blog_settings;
	}

	/**
	 * Get other notification settings
	 *
	 * @param int $user_id User ID.
	 * @return array Other settings.
	 */
	private function get_other_notification_settings( int $user_id ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user_id will be used in future implementation
		return array(
			'comment_like'  => true,
			'comment_reply' => true,
		);
	}

	/**
	 * Get WPCOM notification settings
	 *
	 * @param int $user_id User ID.
	 * @return array WPCOM settings.
	 */
	private function get_wpcom_notification_settings( int $user_id ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $user_id will be used in future implementation
		return array(
			'marketing'  => true,
			'research'   => true,
			'community'  => true,
			'digest'     => true,
			'news'       => true,
			'reports'    => true,
			'affiliates' => true,
			'promotion'  => true,
		);
	}

	/**
	 * Generate notifications summary
	 *
	 * @param array $settings Notification settings.
	 * @param array $devices  Push devices.
	 * @return array Summary data.
	 */
	private function generate_notifications_summary( array $settings, array $devices ): array {
		$total_sites         = isset( $settings['blogs'] ) ? count( $settings['blogs'] ) : 0;
		$email_enabled_sites = $total_sites; // Simplified assumption.
		$push_devices        = count( $devices );
		$wpcom_notifications = isset( $settings['wpcom'] ) ? count( array_filter( $settings['wpcom'] ) ) : 0;

		return array(
			'total_sites'         => $total_sites,
			'email_enabled_sites' => $email_enabled_sites,
			'push_devices'        => $push_devices,
			'wpcom_notifications' => $wpcom_notifications,
		);
	}
}
