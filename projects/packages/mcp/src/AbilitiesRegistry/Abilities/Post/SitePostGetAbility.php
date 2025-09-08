<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\Post;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * Site Post Get Ability Class
 *
 * Handles retrieving a single post by ID or URL within the current site.
 * Does not support site switching (for single site operations).
 * Includes comprehensive post data with optional comments.
 */
class SitePostGetAbility implements AbilityInterface {
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
			'label'               => 'Get Site Post',
			'description'         => 'Retrieve a single post by ID or URL within the current site. Includes comprehensive post data with optional comments.',
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
				'post_id'          => array(
					'type'        => 'integer',
					'description' => 'Post ID to retrieve. Either post_id or post_url must be provided',
					'minimum'     => 1,
				),
				'post_url'         => array(
					'type'        => 'string',
					'description' => 'Post URL to retrieve. Either post_id or post_url must be provided',
				),
				'include_comments' => array(
					'type'        => 'boolean',
					'description' => 'Include post comments in the response. Defaults to false',
					'default'     => false,
				),
			),
			'anyOf'      => array(
				array( 'required' => array( 'post_id' ) ),
				array( 'required' => array( 'post_url' ) ),
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
				'post'      => array(
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
						'comments'      => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'comment_ID'           => array( 'type' => 'integer' ),
									'comment_content'      => array( 'type' => 'string' ),
									'comment_author'       => array( 'type' => 'string' ),
									'comment_author_email' => array( 'type' => 'string' ),
									'comment_date'         => array( 'type' => 'string' ),
									'comment_approved'     => array( 'type' => 'string' ),
									'comment_parent'       => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
				'site_info' => array(
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
