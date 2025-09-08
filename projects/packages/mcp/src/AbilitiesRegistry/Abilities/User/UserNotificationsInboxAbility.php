<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Notifications Inbox Ability Class
 *
 * Provides read-only access to user's notification inbox and messages
 */
class UserNotificationsInboxAbility implements AbilityInterface {
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
			'label'               => 'User Notifications Inbox',
			'description'         => 'View user notification messages, alerts, and inbox activity (read-only)',
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
				'action'      => array(
					'type'        => 'string',
					'enum'        => array( 'list', 'get_summary' ),
					'default'     => 'list',
					'description' => 'Notification action to perform',
				),
				'limit'       => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'default'     => 20,
					'description' => 'Number of notifications to return',
				),
				'unread_only' => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Return only unread notifications',
				),
				'type'        => array(
					'type'        => 'string',
					'enum'        => array( 'like', 'follow', 'comment', 'mention', 'achievement', 'store_order', 'reblog', 'trophy' ),
					'description' => 'Filter by notification type',
				),
				'since'       => array(
					'type'        => 'integer',
					'description' => 'Get notifications after this timestamp',
				),
				'before'      => array(
					'type'        => 'integer',
					'description' => 'Get notifications before this timestamp',
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
				'success'       => array( 'type' => 'boolean' ),
				'notifications' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'        => array( 'type' => 'integer' ),
							'user_id'   => array( 'type' => 'integer' ),
							'user_name' => array(
								'type'        => 'string',
								'description' => 'Name of the user who triggered the notification (e.g., who liked, followed, commented)',
							),
							'unread'    => array( 'type' => 'boolean' ),
							'mute'      => array( 'type' => 'boolean' ),
							'type'      => array( 'type' => 'string' ),
							'noticon'   => array( 'type' => 'string' ),
							'timestamp' => array( 'type' => 'integer' ),
							'time_iso'  => array( 'type' => 'string' ),
							'subject'   => array(
								'type'       => 'object',
								'properties' => array(
									'text' => array( 'type' => 'string' ),
									'html' => array( 'type' => 'string' ),
									'icon' => array( 'type' => 'string' ),
								),
							),
							'body'      => array(
								'type'       => 'object',
								'properties' => array(
									'text' => array( 'type' => 'string' ),
									'html' => array( 'type' => 'string' ),
								),
							),
							'meta'      => array(
								'type'       => 'object',
								'properties' => array(
									'blog_id'    => array( 'type' => 'integer' ),
									'blog_name'  => array( 'type' => 'string' ),
									'blog_url'   => array( 'type' => 'string' ),
									'post_id'    => array( 'type' => 'integer' ),
									'post_title' => array( 'type' => 'string' ),
									'post_url'   => array( 'type' => 'string' ),
								),
							),
						),
					),
				),
				'summary'       => array(
					'type'       => 'object',
					'properties' => array(
						'total_notifications' => array( 'type' => 'integer' ),
						'unread_count'        => array( 'type' => 'integer' ),
						'latest_timestamp'    => array( 'type' => 'integer' ),
						'types_breakdown'     => array( 'type' => 'object' ),
					),
				),
				'total'         => array( 'type' => 'integer' ),
				'has_more'      => array( 'type' => 'boolean' ),
			),
		);
	}
}
