<?php
class WPCOM_JSON_API_Update_User_Endpoint extends WPCOM_JSON_API_Endpoint {

	function callback( $path = '', $blog_id = 0, $user_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( wpcom_get_blog_owner( $blog_id ) == $user_id ) {
				return new WP_Error( 'forbidden', 'A site owner can not be removed through this endpoint.', 403 );
			}
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_or_remove_user( $user_id );
		}

		return false;
	}

	/**
	 * Checks if a user exists by checking to see if a WP_User object exists for a user ID.
	 * @param  int $user_id
	 * @return bool
	 */
	function user_exists( $user_id ) {
		$user = get_user_by( 'id', $user_id );

		return false != $user && is_a( $user, 'WP_User' );
	}

	/**
	 * Validates user input and then decides whether to remove or delete a user.
	 * @param  int $user_id
	 * @return array|WP_Error
	 */
	function delete_or_remove_user( $user_id ) {
		if ( 0 == $user_id ) {
			return new WP_Error( 'invalid_input', 'A valid user ID must be specified.', 400 );
		}

		if ( get_current_user_id() == $user_id ) {
			return new WP_Error( 'invalid_input', 'User can not remove or delete self through this endpoint.', 400 );
		}

		if ( ! $this->user_exists( $user_id ) ) {
			return new WP_Error( 'invalid_input', 'A user does not exist with that ID.', 400 );
		}

		return is_multisite() ? $this->remove_user( $user_id ) : $this->delete_user( $user_id );
	}

	/**
	 * Removes a user from the current site.
	 * @param  int $user_id
	 * @return array|WP_Error
	 */
	function remove_user( $user_id ) {
		if ( ! current_user_can( 'remove_users' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot remove users for specified site.', 403 );
		}

		if ( ! is_user_member_of_blog( $user_id, get_current_blog_id() ) ) {
			return new WP_Error( 'invalid_input', 'User is not a member of the specified site.', 400 );
		}

		return array(
			'success' => remove_user_from_blog( $user_id, get_current_blog_id() )
		);
	}

	/**
	 * Deletes a user and optionally reassigns posts to another user.
	 * @param  int $user_id
	 * @return array|WP_Error
	 */
	function delete_user( $user_id ) {
		if ( ! current_user_can( 'delete_users' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot delete users for specified site.', 403 );
		}

		$input = (array) $this->input();

		if ( isset( $input['reassign'] ) ) {
			if ( $user_id == $input['reassign'] ) {
				return new WP_Error( 'invalid_input', 'Can not reassign posts to user being deleted.', 400 );
			}

			if ( ! $this->user_exists( $input['reassign'] ) ) {
				return new WP_Error( 'invalid_input', 'User specified in reassign argument is not a member of the specified site.', 400 );
			}
		}

		return array(
			'success' => wp_delete_user( $user_id, intval( $input['reassign'] ) ),
		);
	}
}
