<?php
/**
 * Jetpack_Form class - Custom Post Type for managing forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Handles the jetpack_form custom post type registration and management.
 *
 * This class provides a centralized form management system where forms are
 * stored as custom post types instead of being embedded in post content.
 */
class Jetpack_Form {

	/**
	 * The custom post type name.
	 *
	 * @var string
	 */
	const POST_TYPE = 'jetpack_form';

	/**
	 * Meta key for form settings.
	 *
	 * @var string
	 */
	const META_SETTINGS = '_jetpack_form_settings';

	/**
	 * Meta key for form integrations.
	 *
	 * @var string
	 */
	const META_INTEGRATIONS = '_jetpack_form_integrations';

	/**
	 * Meta key for form version.
	 *
	 * @var string
	 */
	const META_VERSION = '_jetpack_form_version';

	/**
	 * Meta key for cached response count.
	 *
	 * @var string
	 */
	const META_RESPONSE_COUNT = '_jetpack_form_response_count';

	/**
	 * Current schema version.
	 *
	 * @var int
	 */
	const SCHEMA_VERSION = 1;

	/**
	 * Singleton instance.
	 *
	 * @var Jetpack_Form|null
	 */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return Jetpack_Form
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor - sets up hooks.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( $this, 'save_form_meta' ), 10, 2 );
		add_filter( 'rest_' . self::POST_TYPE . '_query', array( $this, 'filter_rest_query' ), 10, 2 );
	}

	/**
	 * Register the jetpack_form custom post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'                  => _x( 'Forms', 'Post type general name', 'jetpack-forms' ),
			'singular_name'         => _x( 'Form', 'Post type singular name', 'jetpack-forms' ),
			'menu_name'             => _x( 'Forms', 'Admin Menu text', 'jetpack-forms' ),
			'name_admin_bar'        => _x( 'Form', 'Add New on Toolbar', 'jetpack-forms' ),
			'add_new'               => __( 'Add New', 'jetpack-forms' ),
			'add_new_item'          => __( 'Add New Form', 'jetpack-forms' ),
			'new_item'              => __( 'New Form', 'jetpack-forms' ),
			'edit_item'             => __( 'Edit Form', 'jetpack-forms' ),
			'view_item'             => __( 'View Form', 'jetpack-forms' ),
			'all_items'             => __( 'All Forms', 'jetpack-forms' ),
			'search_items'          => __( 'Search Forms', 'jetpack-forms' ),
			'parent_item_colon'     => __( 'Parent Forms:', 'jetpack-forms' ),
			'not_found'             => __( 'No forms found.', 'jetpack-forms' ),
			'not_found_in_trash'    => __( 'No forms found in Trash.', 'jetpack-forms' ),
			'featured_image'        => __( 'Form featured image', 'jetpack-forms' ),
			'set_featured_image'    => __( 'Set form featured image', 'jetpack-forms' ),
			'remove_featured_image' => __( 'Remove form featured image', 'jetpack-forms' ),
			'use_featured_image'    => __( 'Use as form featured image', 'jetpack-forms' ),
			'archives'              => __( 'Form archives', 'jetpack-forms' ),
			'insert_into_item'      => __( 'Insert into form', 'jetpack-forms' ),
			'uploaded_to_this_item' => __( 'Uploaded to this form', 'jetpack-forms' ),
			'filter_items_list'     => __( 'Filter forms list', 'jetpack-forms' ),
			'items_list_navigation' => __( 'Forms list navigation', 'jetpack-forms' ),
			'items_list'            => __( 'Forms list', 'jetpack-forms' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'show_in_rest'       => true,
			'rest_base'          => 'jetpack-forms',
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'jetpack-form' ),
			'capability_type'    => 'page',
			'capabilities'       => array(
				'edit_post'          => 'edit_pages',
				'read_post'          => 'read',
				'delete_post'        => 'delete_pages',
				'edit_posts'         => 'edit_pages',
				'edit_others_posts'  => 'edit_others_pages',
				'publish_posts'      => 'publish_pages',
				'read_private_posts' => 'read_private_pages',
			),
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => 25,
			'menu_icon'          => 'dashicons-feedback',
			'supports'           => array( 'title', 'editor', 'revisions', 'custom-fields' ),
			'template'           => array(
				array( 'jetpack/contact-form' ),
			),
			'template_lock'      => 'all',
		);

		/**
		 * Filters the arguments used to register the jetpack_form post type.
		 *
		 * @since 1.0.0
		 *
		 * @param array $args Arguments passed to register_post_type().
		 */
		$args = apply_filters( 'jetpack_form_post_type_args', $args );

		register_post_type( self::POST_TYPE, $args );

		// Register meta fields for REST API
		$this->register_meta_fields();
	}

	/**
	 * Register meta fields for REST API access.
	 */
	private function register_meta_fields() {
		$meta_fields = array(
			self::META_SETTINGS       => array(
				'type'         => 'object',
				'description'  => __( 'Form settings including subject, recipients, and notifications.', 'jetpack-forms' ),
				'single'       => true,
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'subject'                => array( 'type' => 'string' ),
							'to'                     => array( 'type' => 'string' ),
							'customThankyou'         => array( 'type' => 'string' ),
							'customThankyouHeading'  => array( 'type' => 'string' ),
							'customThankyouMessage'  => array( 'type' => 'string' ),
							'customThankyouRedirect' => array( 'type' => 'string' ),
							'confirmationType'       => array( 'type' => 'string' ),
							'saveResponses'          => array( 'type' => 'boolean' ),
							'emailNotifications'     => array( 'type' => 'boolean' ),
							'formNotifications'      => array( 'type' => 'boolean' ),
							'notificationRecipients' => array(
								'type'  => 'array',
								'items' => array( 'type' => 'integer' ),
							),
						),
					),
				),
			),
			self::META_INTEGRATIONS   => array(
				'type'         => 'object',
				'description'  => __( 'Third-party integrations like CRM, Mailpoet, Salesforce.', 'jetpack-forms' ),
				'single'       => true,
				'show_in_rest' => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'jetpackCRM'    => array( 'type' => 'boolean' ),
							'salesforceData' => array(
								'type'       => 'object',
								'properties' => array(
									'organizationId' => array( 'type' => 'string' ),
								),
							),
							'mailpoet'       => array(
								'type'       => 'object',
								'properties' => array(
									'listId'   => array( 'type' => 'integer' ),
									'listName' => array( 'type' => 'string' ),
								),
							),
							'hostingerReach' => array(
								'type'       => 'object',
								'properties' => array(
									'groupName' => array( 'type' => 'string' ),
								),
							),
						),
					),
				),
			),
			self::META_VERSION        => array(
				'type'         => 'integer',
				'description'  => __( 'Schema version for migrations.', 'jetpack-forms' ),
				'single'       => true,
				'show_in_rest' => true,
				'default'      => self::SCHEMA_VERSION,
			),
			self::META_RESPONSE_COUNT => array(
				'type'         => 'integer',
				'description'  => __( 'Cached count of form responses.', 'jetpack-forms' ),
				'single'       => true,
				'show_in_rest' => true,
				'default'      => 0,
			),
		);

		foreach ( $meta_fields as $meta_key => $args ) {
			register_post_meta( self::POST_TYPE, $meta_key, $args );
		}
	}

	/**
	 * Save form meta when the post is saved.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function save_form_meta( $post_id, $post ) {
		// Skip autosaves and revisions
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		// Verify user capabilities
		if ( ! current_user_can( 'edit_page', $post_id ) ) {
			return;
		}

		// Set version if not already set
		$version = get_post_meta( $post_id, self::META_VERSION, true );
		if ( empty( $version ) ) {
			update_post_meta( $post_id, self::META_VERSION, self::SCHEMA_VERSION );
		}

		/**
		 * Fires after form meta is saved.
		 *
		 * @since 1.0.0
		 *
		 * @param int      $post_id Post ID.
		 * @param \WP_Post $post    Post object.
		 */
		do_action( 'jetpack_form_saved', $post_id, $post );
	}

	/**
	 * Filter REST API queries for jetpack_form.
	 *
	 * @param array            $args    Query arguments.
	 * @param \WP_REST_Request $request REST request object.
	 * @return array Modified query arguments.
	 */
	public function filter_rest_query( $args, $request ) {
		// Allow filtering by response count, usage, etc.
		// This can be extended as needed

		/**
		 * Filters the query arguments for jetpack_form REST API requests.
		 *
		 * @since 1.0.0
		 *
		 * @param array            $args    Query arguments.
		 * @param \WP_REST_Request $request REST request object.
		 */
		return apply_filters( 'jetpack_form_rest_query', $args, $request );
	}

	/**
	 * Get a form by ID.
	 *
	 * @param int $form_id Form post ID.
	 * @return \WP_Post|null Post object or null if not found.
	 */
	public static function get_form( $form_id ) {
		$post = get_post( $form_id );

		if ( ! $post || self::POST_TYPE !== $post->post_type ) {
			return null;
		}

		return $post;
	}

	/**
	 * Get form settings from meta.
	 *
	 * @param int $form_id Form post ID.
	 * @return array Form settings.
	 */
	public static function get_form_settings( $form_id ) {
		$settings = get_post_meta( $form_id, self::META_SETTINGS, true );
		return is_array( $settings ) ? $settings : array();
	}

	/**
	 * Update form settings.
	 *
	 * @param int   $form_id  Form post ID.
	 * @param array $settings Form settings to save.
	 * @return bool True on success, false on failure.
	 */
	public static function update_form_settings( $form_id, $settings ) {
		if ( ! self::get_form( $form_id ) ) {
			return false;
		}

		return update_post_meta( $form_id, self::META_SETTINGS, $settings );
	}

	/**
	 * Get form integrations from meta.
	 *
	 * @param int $form_id Form post ID.
	 * @return array Form integrations.
	 */
	public static function get_form_integrations( $form_id ) {
		$integrations = get_post_meta( $form_id, self::META_INTEGRATIONS, true );
		return is_array( $integrations ) ? $integrations : array();
	}

	/**
	 * Update form integrations.
	 *
	 * @param int   $form_id      Form post ID.
	 * @param array $integrations Form integrations to save.
	 * @return bool True on success, false on failure.
	 */
	public static function update_form_integrations( $form_id, $integrations ) {
		if ( ! self::get_form( $form_id ) ) {
			return false;
		}

		return update_post_meta( $form_id, self::META_INTEGRATIONS, $integrations );
	}

	/**
	 * Get response count for a form.
	 *
	 * @param int  $form_id Form post ID.
	 * @param bool $refresh Whether to refresh the cached count.
	 * @return int Number of responses.
	 */
	public static function get_response_count( $form_id, $refresh = false ) {
		if ( ! $refresh ) {
			$cached_count = get_post_meta( $form_id, self::META_RESPONSE_COUNT, true );
			if ( '' !== $cached_count ) {
				return (int) $cached_count;
			}
		}

		// Query actual count from feedback posts
		$query = new \WP_Query(
			array(
				'post_type'      => Feedback::POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_query'     => array(
					array(
						'key'   => '_jetpack_form_id',
						'value' => $form_id,
					),
				),
			)
		);

		$count = $query->found_posts;

		// Update cache
		update_post_meta( $form_id, self::META_RESPONSE_COUNT, $count );

		return $count;
	}

	/**
	 * Increment response count for a form.
	 *
	 * @param int $form_id Form post ID.
	 */
	public static function increment_response_count( $form_id ) {
		$count = (int) get_post_meta( $form_id, self::META_RESPONSE_COUNT, true );
		update_post_meta( $form_id, self::META_RESPONSE_COUNT, $count + 1 );
	}

	/**
	 * Get all forms with optional filters.
	 *
	 * @param array $args Query arguments.
	 * @return array Array of WP_Post objects.
	 */
	public static function get_forms( $args = array() ) {
		$defaults = array(
			'post_type'      => self::POST_TYPE,
			'post_status'    => array( 'publish', 'draft' ),
			'posts_per_page' => -1,
			'orderby'        => 'modified',
			'order'          => 'DESC',
		);

		$args = wp_parse_args( $args, $defaults );

		$query = new \WP_Query( $args );
		return $query->posts;
	}

	/**
	 * Delete a form and optionally its responses.
	 *
	 * @param int  $form_id         Form post ID.
	 * @param bool $delete_responses Whether to also delete form responses.
	 * @return bool True on success, false on failure.
	 */
	public static function delete_form( $form_id, $delete_responses = false ) {
		if ( ! self::get_form( $form_id ) ) {
			return false;
		}

		if ( $delete_responses ) {
			// Delete all responses for this form
			$responses = get_posts(
				array(
					'post_type'      => Feedback::POST_TYPE,
					'posts_per_page' => -1,
					'fields'         => 'ids',
					'meta_query'     => array(
						array(
							'key'   => '_jetpack_form_id',
							'value' => $form_id,
						),
					),
				)
			);

			foreach ( $responses as $response_id ) {
				wp_delete_post( $response_id, true );
			}
		}

		$result = wp_delete_post( $form_id, true );
		return false !== $result;
	}

	/**
	 * Duplicate a form.
	 *
	 * @param int    $form_id  Form post ID to duplicate.
	 * @param string $new_title Optional. Title for the duplicated form.
	 * @return int|false New form ID on success, false on failure.
	 */
	public static function duplicate_form( $form_id, $new_title = '' ) {
		$original_post = self::get_form( $form_id );

		if ( ! $original_post ) {
			return false;
		}

		if ( empty( $new_title ) ) {
			/* translators: %s: original form title */
			$new_title = sprintf( __( '%s (Copy)', 'jetpack-forms' ), $original_post->post_title );
		}

		// Create new post
		$new_post_id = wp_insert_post(
			array(
				'post_type'    => self::POST_TYPE,
				'post_title'   => $new_title,
				'post_content' => $original_post->post_content,
				'post_status'  => 'draft',
				'post_author'  => get_current_user_id(),
			)
		);

		if ( is_wp_error( $new_post_id ) ) {
			return false;
		}

		// Copy meta data
		$settings     = self::get_form_settings( $form_id );
		$integrations = self::get_form_integrations( $form_id );

		if ( ! empty( $settings ) ) {
			self::update_form_settings( $new_post_id, $settings );
		}

		if ( ! empty( $integrations ) ) {
			self::update_form_integrations( $new_post_id, $integrations );
		}

		update_post_meta( $new_post_id, self::META_VERSION, self::SCHEMA_VERSION );

		/**
		 * Fires after a form is duplicated.
		 *
		 * @since 1.0.0
		 *
		 * @param int $new_post_id New form post ID.
		 * @param int $form_id     Original form post ID.
		 */
		do_action( 'jetpack_form_duplicated', $new_post_id, $form_id );

		return $new_post_id;
	}
}
