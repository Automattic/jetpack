<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities\User;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * User Achievements Ability Class
 *
 * Provides read-only access to user achievements, badges, and milestones
 */
class UserAchievementsAbility implements AbilityInterface {
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
			'label'               => 'User Achievements',
			'description'         => 'View user achievements, badges, milestones, and gamification progress (read-only)',
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
				'action'           => array(
					'type'        => 'string',
					'enum'        => array( 'list', 'get_progress', 'get_stats', 'get_trophy_case', 'get_feats' ),
					'default'     => 'list',
					'description' => 'Achievement action to perform',
				),
				'achievement_type' => array(
					'type'        => 'string',
					'enum'        => array( 'all', 'achievements', 'feats' ),
					'default'     => 'all',
					'description' => 'Type of achievements to retrieve',
				),
				'limit'            => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'default'     => 20,
					'description' => 'Number of items to return',
				),
				'blog_id'          => array(
					'type'        => 'integer',
					'description' => 'Site-specific achievements (optional)',
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
				'success'      => array( 'type' => 'boolean' ),
				'achievements' => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'          => array( 'type' => 'integer' ),
							'name'        => array( 'type' => 'string' ),
							'badge_type'  => array( 'type' => 'string' ),
							'level'       => array( 'type' => 'integer' ),
							'achieved_at' => array( 'type' => 'string' ),
							'blog_id'     => array( 'type' => 'integer' ),
							'description' => array( 'type' => 'string' ),
						),
					),
				),
				'feats'        => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'          => array( 'type' => 'integer' ),
							'name'        => array( 'type' => 'string' ),
							'level'       => array( 'type' => 'integer' ),
							'best_level'  => array( 'type' => 'integer' ),
							'achieved_at' => array( 'type' => 'string' ),
							'blog_id'     => array( 'type' => 'integer' ),
						),
					),
				),
				'progress'     => array(
					'type'       => 'object',
					'properties' => array(
						'total_achievements' => array( 'type' => 'integer' ),
						'total_feats'        => array( 'type' => 'integer' ),
						'highest_level'      => array( 'type' => 'integer' ),
						'recent_activity'    => array( 'type' => 'array' ),
					),
				),
				'trophy_case'  => array(
					'type'       => 'object',
					'properties' => array(
						'featured_badges' => array( 'type' => 'array' ),
						'badge_count'     => array( 'type' => 'integer' ),
						'showcase'        => array( 'type' => 'array' ),
					),
				),
			),
		);
	}
}
