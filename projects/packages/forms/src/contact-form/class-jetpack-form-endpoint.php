<?php
/**
 * Jetpack_Form_Endpoint class - REST API endpoints for jetpack_form CPT.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Handles REST API endpoints for jetpack_form custom post type operations.
 */
class Jetpack_Form_Endpoint {

	/**
	 * Singleton instance.
	 *
	 * @var Jetpack_Form_Endpoint|null
	 */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return Jetpack_Form_Endpoint
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		// Create form from block
		register_rest_route(
			'jetpack-forms/v1',
			'/forms/create-from-block',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_form_from_block' ),
				'permission_callback' => array( $this, 'can_edit_forms' ),
				'args'                => array(
					'title'        => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
					'blocks'       => array(
						'required' => false,
						'type'     => 'string',
						'default'  => '',
					),
					'settings'     => array(
						'required' => false,
						'type'     => 'object',
						'default'  => array(),
					),
					'integrations' => array(
						'required' => false,
						'type'     => 'object',
						'default'  => array(),
					),
				),
			)
		);

		// Update form blocks
		register_rest_route(
			'jetpack-forms/v1',
			'/forms/(?P<id>\d+)/blocks',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_form_blocks' ),
				'permission_callback' => array( $this, 'can_edit_form' ),
				'args'                => array(
					'id'     => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'blocks' => array(
						'required' => true,
						'type'     => 'string',
					),
				),
			)
		);

		// Sync form settings
		register_rest_route(
			'jetpack-forms/v1',
			'/forms/(?P<id>\d+)/sync',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'sync_form_settings' ),
				'permission_callback' => array( $this, 'can_edit_form' ),
				'args'                => array(
					'id'           => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'settings'     => array(
						'required' => false,
						'type'     => 'object',
						'default'  => array(),
					),
					'integrations' => array(
						'required' => false,
						'type'     => 'object',
						'default'  => array(),
					),
				),
			)
		);
	}

	/**
	 * Check if current user can edit forms.
	 *
	 * @return bool
	 */
	public function can_edit_forms() {
		return current_user_can( 'edit_pages' );
	}

	/**
	 * Check if current user can edit a specific form.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function can_edit_form( $request ) {
		$form_id = $request->get_param( 'id' );
		return current_user_can( 'edit_post', $form_id );
	}

	/**
	 * Create a new jetpack_form post from block data.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_form_from_block( $request ) {
		$title        = $request->get_param( 'title' );
		$blocks       = $request->get_param( 'blocks' );
		$settings     = $request->get_param( 'settings' );
		$integrations = $request->get_param( 'integrations' );

		// Generate a default title if none provided
		if ( empty( $title ) ) {
			$title = sprintf(
				/* translators: %s: date and time */
				__( 'Form created on %s', 'jetpack-forms' ),
				current_time( 'Y-m-d H:i:s' )
			);
		}

		// Create the post
		$post_id = wp_insert_post(
			array(
				'post_type'    => Jetpack_Form::POST_TYPE,
				'post_title'   => $title,
				'post_content' => $blocks,
				'post_status'  => 'publish',
				'post_author'  => get_current_user_id(),
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return new WP_Error(
				'form_creation_failed',
				__( 'Failed to create form.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		// Save settings and integrations
		if ( ! empty( $settings ) ) {
			Jetpack_Form::update_form_settings( $post_id, $settings );
		}

		if ( ! empty( $integrations ) ) {
			Jetpack_Form::update_form_integrations( $post_id, $integrations );
		}

		/**
		 * Fires after a form is created from a block.
		 *
		 * @since 1.0.0
		 *
		 * @param int   $post_id Post ID of the created form.
		 * @param array $request Request parameters.
		 */
		do_action( 'jetpack_form_created_from_block', $post_id, $request->get_params() );

		return new WP_REST_Response(
			array(
				'success' => true,
				'form_id' => $post_id,
				'message' => __( 'Form created successfully.', 'jetpack-forms' ),
			),
			201
		);
	}

	/**
	 * Update form blocks content.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_form_blocks( $request ) {
		$form_id = $request->get_param( 'id' );
		$blocks  = $request->get_param( 'blocks' );

		$form = Jetpack_Form::get_form( $form_id );
		if ( ! $form ) {
			return new WP_Error(
				'form_not_found',
				__( 'Form not found.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		// Update the post content
		$result = wp_update_post(
			array(
				'ID'           => $form_id,
				'post_content' => $blocks,
			)
		);

		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'form_update_failed',
				__( 'Failed to update form blocks.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		/**
		 * Fires after form blocks are updated.
		 *
		 * @since 1.0.0
		 *
		 * @param int    $form_id Form post ID.
		 * @param string $blocks  Updated blocks content.
		 */
		do_action( 'jetpack_form_blocks_updated', $form_id, $blocks );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Form blocks updated successfully.', 'jetpack-forms' ),
			),
			200
		);
	}

	/**
	 * Sync form settings and integrations from block attributes.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function sync_form_settings( $request ) {
		$form_id      = $request->get_param( 'id' );
		$settings     = $request->get_param( 'settings' );
		$integrations = $request->get_param( 'integrations' );

		$form = Jetpack_Form::get_form( $form_id );
		if ( ! $form ) {
			return new WP_Error(
				'form_not_found',
				__( 'Form not found.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		$updated = false;

		// Update settings if provided
		if ( ! empty( $settings ) && is_array( $settings ) ) {
			Jetpack_Form::update_form_settings( $form_id, $settings );
			$updated = true;
		}

		// Update integrations if provided
		if ( ! empty( $integrations ) && is_array( $integrations ) ) {
			Jetpack_Form::update_form_integrations( $form_id, $integrations );
			$updated = true;
		}

		if ( ! $updated ) {
			return new WP_Error(
				'no_data_provided',
				__( 'No settings or integrations data provided.', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		/**
		 * Fires after form settings are synced.
		 *
		 * @since 1.0.0
		 *
		 * @param int   $form_id      Form post ID.
		 * @param array $settings     Updated settings.
		 * @param array $integrations Updated integrations.
		 */
		do_action( 'jetpack_form_settings_synced', $form_id, $settings, $integrations );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Form settings synced successfully.', 'jetpack-forms' ),
			),
			200
		);
	}
}
