<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities\User;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Profile Ability Class
 *
 * Provides read-only access to user profile information
 */
class UserProfileAbility implements AbilityInterface {
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
			'label'               => 'User Profile Information',
			'description'         => 'Get comprehensive WordPress.com user profile information including basic profile, preferences, account details, social data, and activity metrics (read-only)',
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
				'fields'              => array(
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'description' => 'Specific fields to retrieve (optional)',
				),
				'include_preferences' => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include user preferences and settings',
				),
				'include_stats'       => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include basic account statistics',
				),
				'include_account'     => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include account and subscription information',
				),
				'include_social'      => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include social and community engagement data',
				),
				'include_activity'    => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include activity and engagement metrics',
				),
			),
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
			'required'   => array( 'success', 'profile' ),
			'properties' => array(
				'success'     => array( 'type' => 'boolean' ),
				'profile'     => array(
					'type'       => 'object',
					'required'   => array( 'id', 'username', 'email' ),
					'properties' => array(
						'id'           => array( 'type' => 'integer' ),
						'username'     => array( 'type' => 'string' ),
						'email'        => array( 'type' => 'string' ),
						'display_name' => array( 'type' => 'string' ),
						'first_name'   => array( 'type' => 'string' ),
						'last_name'    => array( 'type' => 'string' ),
						'description'  => array( 'type' => 'string' ),
						'url'          => array( 'type' => 'string' ),
						'avatar_url'   => array( 'type' => 'string' ),
						'locale'       => array( 'type' => 'string' ),
						'timezone'     => array( 'type' => 'string' ),
						'date_format'  => array( 'type' => 'string' ),
						'time_format'  => array( 'type' => 'string' ),
						'registered'   => array( 'type' => 'string' ),
						'capabilities' => array( 'type' => 'array' ),
					),
				),
				'preferences' => array(
					'type'       => 'object',
					'properties' => array(
						'language'         => array( 'type' => 'string' ),
						'color_scheme'     => array( 'type' => 'string' ),
						'admin_interface'  => array( 'type' => 'string' ),
						'notifications'    => array( 'type' => 'object' ),
						'privacy_settings' => array( 'type' => 'object' ),
					),
				),
				'stats'       => array(
					'type'       => 'object',
					'properties' => array(
						'total_sites'    => array( 'type' => 'integer' ),
						'total_posts'    => array( 'type' => 'integer' ),
						'total_pages'    => array( 'type' => 'integer' ),
						'total_comments' => array( 'type' => 'integer' ),
						'member_since'   => array( 'type' => 'string' ),
						'last_active'    => array( 'type' => 'string' ),
					),
				),
				'account'     => array(
					'type'       => 'object',
					'properties' => array(
						'plan'               => array( 'type' => 'object' ),
						'subscriptions'      => array( 'type' => 'array' ),
						'storage'            => array( 'type' => 'object' ),
						'bandwidth'          => array( 'type' => 'object' ),
						'is_paying_customer' => array( 'type' => 'boolean' ),
					),
				),
				'social'      => array(
					'type'       => 'object',
					'properties' => array(
						'following_count'      => array( 'type' => 'integer' ),
						'followers_count'      => array( 'type' => 'integer' ),
						'reader_subscriptions' => array( 'type' => 'integer' ),
						'likes_given'          => array( 'type' => 'integer' ),
						'comments_made'        => array( 'type' => 'integer' ),
					),
				),
				'activity'    => array(
					'type'       => 'object',
					'properties' => array(
						'most_active_site'     => array( 'type' => 'object' ),
						'publishing_frequency' => array( 'type' => 'string' ),
						'total_views'          => array( 'type' => 'integer' ),
						'total_visitors'       => array( 'type' => 'integer' ),
						'recent_activity'      => array( 'type' => 'array' ),
					),
				),
			),
		);
	}
}
