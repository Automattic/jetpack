<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\User;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * Enhanced User Sites Ability Class
 *
 * Provides advanced user sites management with filtering, search, and metrics
 */
class UserSitesAbility implements AbilityInterface {
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
			'label'               => 'User Sites',
			'description'         => 'User sites management with filtering, search, and metrics',
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
				'page'            => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'default'     => 1,
					'description' => 'Page number for pagination',
				),
				'per_page'        => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 100,
					'default'     => 10,
					'description' => 'Number of sites per page',
				),
				'filters'         => array(
					'type'       => 'object',
					'properties' => array(
						'search'            => array(
							'type'        => 'string',
							'description' => 'Search in site names and URLs',
						),
						'status'            => array(
							'type'        => 'string',
							'enum'        => array( 'active', 'suspended', 'archived' ),
							'description' => 'Filter by site status',
						),
						'is_private'        => array(
							'type'        => 'boolean',
							'description' => 'Filter by privacy setting',
						),
						'has_custom_domain' => array(
							'type'        => 'boolean',
							'description' => 'Filter by custom domain presence',
						),
					),
				),
				'sort'            => array(
					'type'       => 'object',
					'properties' => array(
						'field' => array(
							'type'        => 'string',
							'enum'        => array( 'name', 'url', 'created', 'updated' ),
							'default'     => 'updated',
							'description' => 'Field to sort by',
						),
						'order' => array(
							'type'        => 'string',
							'enum'        => array( 'asc', 'desc' ),
							'default'     => 'desc',
							'description' => 'Sort order',
						),
					),
				),
				'include_metrics' => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include site metrics in response',
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
			'properties' => array(
				'success'    => array( 'type' => 'boolean' ),
				'sites'      => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'blog_id'           => array( 'type' => 'integer' ),
							'site_url'          => array( 'type' => 'string' ),
							'blogname'          => array( 'type' => 'string' ),
							'description'       => array( 'type' => 'string' ),
							'domain'            => array( 'type' => 'string' ),
							'path'              => array( 'type' => 'string' ),
							'is_private'        => array( 'type' => 'boolean' ),
							'has_custom_domain' => array( 'type' => 'boolean' ),
							'status'            => array( 'type' => 'string' ),
							'created_date'      => array( 'type' => 'string' ),
							'last_updated'      => array( 'type' => 'string' ),
							'language'          => array( 'type' => 'string' ),
							'site_id'           => array( 'type' => 'integer' ),
							'metrics'           => array(
								'type'       => 'object',
								'properties' => array(
									'monthly_views'      => array( 'type' => 'integer' ),
									'total_posts'        => array( 'type' => 'integer' ),
									'total_pages'        => array( 'type' => 'integer' ),
									'total_comments'     => array( 'type' => 'integer' ),
									'total_media'        => array( 'type' => 'integer' ),
									'storage_used_mb'    => array( 'type' => 'number' ),
									'storage_used_bytes' => array( 'type' => 'integer' ),
									'storage_limit_mb'   => array( 'type' => 'number' ),
									'storage_usage_percent' => array( 'type' => 'number' ),
									'theme_name'         => array( 'type' => 'string' ),
									'active_plugins'     => array( 'type' => 'integer' ),
									'health_status'      => array( 'type' => 'string' ),
									'health_issues'      => array(
										'type'  => 'array',
										'items' => array( 'type' => 'string' ),
									),
								),
							),
						),
					),
				),
				'pagination' => array(
					'type'       => 'object',
					'properties' => array(
						'total_sites'  => array( 'type' => 'integer' ),
						'total_pages'  => array( 'type' => 'integer' ),
						'current_page' => array( 'type' => 'integer' ),
						'per_page'     => array( 'type' => 'integer' ),
					),
				),
				'summary'    => array(
					'type'       => 'object',
					'properties' => array(
						'total_sites'    => array( 'type' => 'integer' ),
						'active_sites'   => array( 'type' => 'integer' ),
						'private_sites'  => array( 'type' => 'integer' ),
						'custom_domains' => array( 'type' => 'integer' ),
					),
				),
			),
		);
	}
}
