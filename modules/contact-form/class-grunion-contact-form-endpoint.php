<?php

/*
 * Plugin Name: Feedback CPT Permissions over-ride
 */

if ( class_exists( 'WP_REST_Posts_Controller' ) ) {

	class Grunion_Contact_Form_Endpoint extends WP_REST_Posts_Controller {
		/**
		 * Check whether a given request has proper authoriztion to view feedback items.
		 *
		 * @param  WP_REST_Request $request Full details about the request.
		 * @return WP_Error|boolean
		 */
		public function get_items_permissions_check( $request ) {
			if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
				return new WP_Error(
					'rest_cannot_view',
					__( 'Sorry, you cannot view this resource.' ),
					array( 'status' => 401 )
				);
			}

			return true;
		}

		/**
		 * Check whether a given request has proper authoriztion to view feedback item.
		 *
		 * @param  WP_REST_Request $request Full details about the request.
		 * @return WP_Error|boolean
		 */
		public function get_item_permissions_check( $request ) {
			if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
				return new WP_Error(
					'rest_cannot_view',
					__( 'Sorry, you cannot view this resource.' ),
					array( 'status' => 401 )
				);
			}

			return true;
		}

	}

}
