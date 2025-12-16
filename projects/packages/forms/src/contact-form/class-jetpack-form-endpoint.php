<?php
/**
 * Jetpack_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * REST endpoint for the jetpack_form custom post type.
 */
class Jetpack_Form_Endpoint extends \WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( Contact_Form::POST_TYPE );
	}

	/**
	 * Checks if a given request has access to get items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new \WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to view forms.', 'jetpack-forms' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to create items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->create_posts ) ) {
			return new \WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create forms.', 'jetpack-forms' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::create_item_permissions_check( $request );
	}

	/**
	 * Checks if a jetpack-form can be read.
	 *
	 * @param \WP_Post $post Post object that backs the block.
	 * @return bool Whether the pattern can be read.
	 */
	public function check_read_permission( $post ) {
		// By default the read_post capability is mapped to edit_posts.
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}
}
