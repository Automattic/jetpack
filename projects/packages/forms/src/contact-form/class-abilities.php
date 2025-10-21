<?php
/**
 * Jetpack Forms Abilities API Integration
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Handles registration of Jetpack Forms abilities with the Abilities API.
 */
class Abilities {

	/**
	 * Initialize abilities registration.
	 */
	public static function init() {
		if ( function_exists( 'wp_register_ability' ) ) {
			add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
			add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ), 1 );
		}
	}

	/**
	 * Register the Jetpack Forms ability category.
	 */
	public static function register_category() {
		if ( function_exists( 'wp_register_ability_category' ) ) {
			wp_register_ability_category(
				'jetpack-forms',
				array(
					'label'       => __( 'Jetpack Forms', 'jetpack-forms' ),
					'description' => __( 'Abilities related to Jetpack Forms functionality.', 'jetpack-forms' ),
				)
			);
		}
	}

	/**
	 * Register all Jetpack Forms abilities.
	 */
	public static function register_abilities() {
		wp_register_ability(
			'jetpack/list-form-responses',
			array(
				'label'               => __( 'List Form Responses', 'jetpack-forms' ),
				'description'         => __( 'Retrieve form responses from a specific site.', 'jetpack-forms' ),
				'category'            => 'jetpack-forms',
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'blog_id'  => array(
							'type'        => 'string',
							'description' => 'Site ID (numeric) or site URL to get form responses from. Defaults to current site if not specified.',
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 20,
							'minimum' => 1,
							'maximum' => 100,
						),
					),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'responses' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'id'      => array( 'type' => 'integer' ),
									'form'    => array( 'type' => 'string' ),
									'author'  => array( 'type' => 'string' ),
									'date'    => array( 'type' => 'string' ),
									'content' => array( 'type' => 'string' ),
								),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_list_responses' ),
				'permission_callback' => array( __CLASS__, 'check_permission' ),
			)
		);
	}

	/**
	 * Execute the list-form-responses ability.
	 *
	 * @param array $input Input parameters including blog_id.
	 * @return array|\WP_Error List of form responses or error.
	 */
	public static function execute_list_responses( $input ) {
		$per_page = isset( $input['per_page'] ) ? $input['per_page'] : 20;

		$blog_id = self::resolve_site_identifier( isset( $input['blog_id'] ) ? $input['blog_id'] : get_current_blog_id() );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		switch_to_blog( $blog_id );

		$query = new \WP_Query(
			array(
				'post_type'        => 'feedback',
				'post_status'      => 'publish',
				'post_parent__not' => 0,
				'posts_per_page'   => $per_page,
				'orderby'          => 'date',
				'order'            => 'DESC',
			)
		);

		$responses = array();

		foreach ( $query->posts as $post ) {
			$parent = get_post( $post->post_parent );

			$responses[] = array(
				'id'      => $post->ID,
				'form'    => $parent ? $parent->post_title : '',
				'author'  => $post->post_author,
				'date'    => $post->post_date,
				'content' => $post->post_content,
			);
		}

		restore_current_blog();
		return array(
			'responses' => $responses,
		);
	}

	/**
	 * Resolve site identifier to blog ID.
	 *
	 * @param string|int $site_identifier Site ID or URL.
	 * @return int|\WP_Error Blog ID or error.
	 */
	private static function resolve_site_identifier( $site_identifier ) {
		if ( empty( $site_identifier ) ) {
			return new \WP_Error(
				'missing_site_identifier',
				__( 'No site identifier provided. Please provide a site ID or URL in the blog_id parameter.', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Filter to resolve a site URL to a blog ID.
		 *
		 * Allows implementations to provide custom site URL resolution logic.
		 *
		 * @param int|WP_Error|null $blog_id        The resolved blog ID, WP_Error, or null if not resolved.
		 * @param string            $site_identifier The original site identifier.
		 * @return int|WP_Error The resolved blog ID or WP_Error if not resolved.
		 */
		$site_identifier = apply_filters( 'jetpack_forms_resolve_site_url', null, $site_identifier );

		return (int) $site_identifier;
	}

	/**
	 * Check permission for listing form responses.
	 *
	 * Checks if the user has access to the target site specified in blog_id parameter.
	 *
	 * @param array $input Input parameters including blog_id.
	 * @return bool|\WP_Error True if user has permission, WP_Error if not.
	 */
	public static function check_permission( $input ) {
		$current_user = wp_get_current_user();
		if ( ! $current_user->ID ) {
			return new \WP_Error(
				'not_logged_in',
				__( 'You must be logged in to access form responses.', 'jetpack-forms' )
			);
		}

		$blog_id = self::resolve_site_identifier( isset( $input['blog_id'] ) ? $input['blog_id'] : get_current_blog_id() );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can_for_site( $blog_id, 'edit_pages' ) ) {
			return new \WP_Error(
				'insufficient_permissions',
				sprintf(
					/* translators: %s: blog ID */
					__( 'You do not have permission to access form responses on site %s. You need the "read" capability (member access).', 'jetpack-forms' ),
					$blog_id
				)
			);
		}

		return true;
	}
}
