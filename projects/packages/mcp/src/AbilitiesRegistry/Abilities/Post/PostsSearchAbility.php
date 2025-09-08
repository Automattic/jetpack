<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\Post;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * Posts Search Ability Class
 *
 * Handles searching for posts with various filters including site switching,
 * content search, categories, tags, post types, and pagination.
 */
class PostsSearchAbility implements AbilityInterface {
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
			'label'               => 'Posts Search',
			'description'         => 'Search for posts with various filters including site switching, content search, categories, tags, post types, and pagination. Automatically excludes confidential posts.',
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
				'wpcom_site'     => array(
					'type'        => 'string',
					'description' => 'Site ID (numeric) or site URL to search posts from. If not provided, uses the current site',
				),
				'search'         => array(
					'type'        => 'string',
					'description' => 'The search query to find posts by title, content, or excerpt',
				),
				'post_type'      => array(
					'type'        => 'string',
					'description' => 'Post type to search (post, page, etc.). Defaults to "post"',
					'default'     => 'post',
					'enum'        => array( 'post', 'page', 'attachment', 'any' ),
				),
				'posts_per_page' => array(
					'type'        => 'integer',
					'description' => 'Number of posts to return. Defaults to 10, maximum 50',
					'default'     => 10,
					'minimum'     => 1,
					'maximum'     => 50,
				),
				'paged'          => array(
					'type'        => 'integer',
					'description' => 'Page number for pagination. Defaults to 1',
					'default'     => 1,
					'minimum'     => 1,
				),
				'order'          => array(
					'type'        => 'string',
					'enum'        => array( 'ASC', 'DESC' ),
					'description' => 'Sort order. Defaults to DESC',
					'default'     => 'DESC',
				),
				'orderby'        => array(
					'type'        => 'string',
					'enum'        => array( 'date', 'title', 'menu_order', 'modified', 'ID', 'relevance' ),
					'description' => 'Sort posts by this field. Defaults to date',
					'default'     => 'date',
				),
				'category'       => array(
					'type'        => 'string',
					'description' => 'Category slug or ID to filter posts',
				),
				'tag'            => array(
					'type'        => 'string',
					'description' => 'Tag slug or ID to filter posts',
				),
				'post_status'    => array(
					'type'        => 'string',
					'enum'        => array( 'publish', 'private', 'draft', 'pending', 'future' ),
					'description' => 'Post status to filter by. Defaults to publish',
					'default'     => 'publish',
				),
				'author'         => array(
					'type'        => 'integer',
					'description' => 'Author ID to filter posts by',
				),
				'meta_key'       => array(
					'type'        => 'string',
					'description' => 'Custom field key to filter by',
				),
				'meta_value'     => array(
					'type'        => 'string',
					'description' => 'Custom field value to filter by',
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
				'posts'        => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'ID'            => array( 'type' => 'integer' ),
							'post_title'    => array( 'type' => 'string' ),
							'post_content'  => array( 'type' => 'string' ),
							'post_excerpt'  => array( 'type' => 'string' ),
							'post_status'   => array( 'type' => 'string' ),
							'post_type'     => array( 'type' => 'string' ),
							'post_date'     => array( 'type' => 'string' ),
							'post_modified' => array( 'type' => 'string' ),
							'permalink'     => array( 'type' => 'string' ),
							'author'        => array(
								'type'       => 'object',
								'properties' => array(
									'ID'           => array( 'type' => 'integer' ),
									'display_name' => array( 'type' => 'string' ),
								),
							),
							'categories'    => array( 'type' => 'array' ),
							'tags'          => array( 'type' => 'array' ),
						),
					),
				),
				'found_posts'  => array( 'type' => 'integer' ),
				'max_pages'    => array( 'type' => 'integer' ),
				'current_page' => array( 'type' => 'integer' ),
				'site_info'    => array(
					'type'       => 'object',
					'properties' => array(
						'blog_id'   => array( 'type' => 'integer' ),
						'site_name' => array( 'type' => 'string' ),
						'site_url'  => array( 'type' => 'string' ),
					),
				),
			),
		);
	}
}
