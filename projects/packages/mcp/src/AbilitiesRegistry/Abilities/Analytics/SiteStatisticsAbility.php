<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities\Analytics;

use Automattic\Jetpack\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\Jetpack\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * Site Statistics Ability Class
 *
 * Provides comprehensive site statistics and analytics data including views, visitors,
 * content metrics, top posts, referrers, and performance insights for WordPress.com sites.
 */
class SiteStatisticsAbility implements AbilityInterface {
	use AbilityTrait;

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		// @phan-suppress-next-line PhanUndeclaredFunction
		// @phan-suppress-next-line PhanUndeclaredFunction
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
			'label'               => 'Site Statistics and Analytics',
			'description'         => 'Get comprehensive site statistics including views, visitors, top content, referrers, geographic data, device breakdown, and performance metrics for WordPress.com hosted sites. Requires a specific site ID or URL - use the user-sites ability first to get available sites if needed.',
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
				'wpcom_site'          => array(
					'type'        => 'string',
					'description' => 'WordPress.com site ID or URL to get statistics for.',
				),
				'period'              => array(
					'type'        => 'string',
					'enum'        => array( 'day', 'week', 'month', 'year' ),
					'default'     => 'day',
					'description' => 'Time period for statistics (day, week, month, year)',
				),
				'num_periods'         => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 365,
					'default'     => 30,
					'description' => 'Number of periods to include (e.g., last 30 days)',
				),
				'include_views'       => array(
					'type'        => 'boolean',
					'default'     => true,
					'description' => 'Include views and visitors data',
				),
				'include_top_content' => array(
					'type'        => 'boolean',
					'default'     => true,
					'description' => 'Include top posts and pages',
				),
				'include_referrers'   => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include top referrers data',
				),
				'include_geographic'  => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include geographic data (countries, cities)',
				),
				'include_devices'     => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include device and browser breakdown',
				),
				'include_all_time'    => array(
					'type'        => 'boolean',
					'default'     => false,
					'description' => 'Include all-time statistics',
				),
				'max_items'           => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'maximum'     => 50,
					'default'     => 10,
					'description' => 'Maximum number of items to return for lists (top posts, referrers, etc.)',
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
			'required'   => array( 'success', 'site_info', 'period_stats' ),
			'properties' => array(
				'success'      => array( 'type' => 'boolean' ),
				'site_info'    => array(
					'type'       => 'object',
					'required'   => array( 'blog_id', 'site_url', 'site_name' ),
					'properties' => array(
						'blog_id'   => array( 'type' => 'integer' ),
						'site_url'  => array( 'type' => 'string' ),
						'site_name' => array( 'type' => 'string' ),
					),
				),
				'period_stats' => array(
					'type'       => 'object',
					'properties' => array(
						'period'      => array( 'type' => 'string' ),
						'num_periods' => array( 'type' => 'integer' ),
						'start_date'  => array( 'type' => 'string' ),
						'end_date'    => array( 'type' => 'string' ),
					),
				),
				'views_data'   => array(
					'type'       => 'object',
					'properties' => array(
						'total_views'    => array( 'type' => 'integer' ),
						'total_visitors' => array( 'type' => 'integer' ),
						'daily_average'  => array( 'type' => 'number' ),
						'trend'          => array( 'type' => 'string' ),
						'daily_data'     => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'date'     => array( 'type' => 'string' ),
									'views'    => array( 'type' => 'integer' ),
									'visitors' => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'top_content'  => array(
					'type'       => 'object',
					'properties' => array(
						'top_posts' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'title'   => array( 'type' => 'string' ),
									'url'     => array( 'type' => 'string' ),
									'views'   => array( 'type' => 'integer' ),
									'post_id' => array( 'type' => 'integer' ),
								),
							),
						),
						'top_pages' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'title' => array( 'type' => 'string' ),
									'url'   => array( 'type' => 'string' ),
									'views' => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'referrers'    => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'referrer' => array( 'type' => 'string' ),
							'views'    => array( 'type' => 'integer' ),
						),
					),
				),
				'geographic'   => array(
					'type'       => 'object',
					'properties' => array(
						'top_countries' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'country' => array( 'type' => 'string' ),
									'views'   => array( 'type' => 'integer' ),
								),
							),
						),
						'top_cities'    => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'city'    => array( 'type' => 'string' ),
									'country' => array( 'type' => 'string' ),
									'views'   => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'devices'      => array(
					'type'       => 'object',
					'properties' => array(
						'device_types' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'device' => array( 'type' => 'string' ),
									'views'  => array( 'type' => 'integer' ),
								),
							),
						),
						'browsers'     => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'browser' => array( 'type' => 'string' ),
									'views'   => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'all_time'     => array(
					'type'       => 'object',
					'properties' => array(
						'total_views'     => array( 'type' => 'integer' ),
						'total_visitors'  => array( 'type' => 'integer' ),
						'total_posts'     => array( 'type' => 'integer' ),
						'total_comments'  => array( 'type' => 'integer' ),
						'first_post_date' => array( 'type' => 'string' ),
						'site_age_days'   => array( 'type' => 'integer' ),
					),
				),
			),
		);
	}
}
