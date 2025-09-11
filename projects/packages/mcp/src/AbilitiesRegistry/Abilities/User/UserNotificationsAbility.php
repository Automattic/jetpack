<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities\User;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Notifications Ability Class
 *
 * Provides read-only access to user notification preferences and settings
 */
class UserNotificationsAbility implements AbilityInterface {
	use AbilityTrait;

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		wp_register_ability(
			$this->get_ability_name(),
			$this->get_config()
		);
	}

	/**
	 * Get the ability configuration array.
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array {
		return array(
			'label'               => 'User Notifications',
			'description'         => 'Manage user notification preferences across email, push, timeline, and other channels (read-only)',
			'input_schema'        => $this->get_input_schema(),
			'output_schema'       => $this->get_output_schema(),
			'execute_callback'    => array( $this, 'execute' ),
			'permission_callback' => array( $this, 'check_permission' ),
		);
	}

	/**
	 * Get the input schema for the ability.
	 *
	 * @return array The input schema.
	 */
	private function get_input_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'action'       => array(
					'type'        => 'string',
					'enum'        => array( 'list', 'get_settings', 'get_devices', 'test_delivery' ),
					'default'     => 'list',
					'description' => 'Action to perform',
				),
				'channel'      => array(
					'type'        => 'string',
					'enum'        => array( 'email', 'timeline', 'push', 'all' ),
					'description' => 'Notification channel to query',
				),
				'blog_id'      => array(
					'type'        => 'integer',
					'description' => 'Site-specific settings (optional)',
				),
				'setting_type' => array(
					'type'        => 'string',
					'enum'        => array( 'blogs', 'other', 'wpcom' ),
					'description' => 'Type of notification settings',
				),
				'device_id'    => array(
					'type'        => 'string',
					'description' => 'Device ID for push notifications',
				),
			),
			'required'   => array( 'action' ),
		);
	}

	/**
	 * Get the output schema for the ability.
	 *
	 * @return array The output schema.
	 */
	private function get_output_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success'               => array( 'type' => 'boolean' ),
				'notification_settings' => array(
					'type'       => 'object',
					'properties' => array(
						'blogs' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'blog_id'   => array( 'type' => 'integer' ),
									'blog_name' => array( 'type' => 'string' ),
									'settings'  => array( 'type' => 'object' ),
								),
							),
						),
						'other' => array(
							'type'       => 'object',
							'properties' => array(
								'comment_like'  => array( 'type' => 'boolean' ),
								'comment_reply' => array( 'type' => 'boolean' ),
							),
						),
						'wpcom' => array(
							'type'       => 'object',
							'properties' => array(
								'marketing' => array( 'type' => 'boolean' ),
								'research'  => array( 'type' => 'boolean' ),
								'community' => array( 'type' => 'boolean' ),
								'digest'    => array( 'type' => 'boolean' ),
								'news'      => array( 'type' => 'boolean' ),
								'reports'   => array( 'type' => 'boolean' ),
							),
						),
					),
				),
				'devices'               => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'device_id'   => array( 'type' => 'string' ),
							'device_name' => array( 'type' => 'string' ),
							'device_type' => array( 'type' => 'string' ),
							'enabled'     => array( 'type' => 'boolean' ),
							'last_seen'   => array( 'type' => 'string' ),
						),
					),
				),
				'summary'               => array(
					'type'       => 'object',
					'properties' => array(
						'total_sites'         => array( 'type' => 'integer' ),
						'email_enabled_sites' => array( 'type' => 'integer' ),
						'push_devices'        => array( 'type' => 'integer' ),
						'wpcom_notifications' => array( 'type' => 'integer' ),
					),
				),
			),
		);
	}
}
