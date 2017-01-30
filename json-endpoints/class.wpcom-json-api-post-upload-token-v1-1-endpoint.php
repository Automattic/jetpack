<?php

class WPCOM_JSON_API_Post_Upload_Token_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! $this->api->is_jetpack_authorized_for_site( $blog_id ) &&
		     ! is_user_logged_in() &&
		     ! $this->is_blog_in_network( $blog_id ) ) {
			return new WP_Error( 'Unauthorized', __( 'You must be logged-in to get an upload token' ), 401 );
		}

		require_once ABSPATH . 'wp-content/mu-plugins/jetpack-loader.php';
		$jetpack_token = Jetpack_Data::get_access_token_by_blog_id_user_id( $blog_id, JETPACK__ANY_USER_TOKEN );

		// Loading this here, so that it is only loaded when it is used.
		require_once ABSPATH . 'wp-content/mu-plugins/jetpack/class.jetpack-server-upload-token.php';
		$token = Jetpack_Server_Upload_Token::create_token( $blog_id, $jetpack_token );

		$response = array(
			'upload_token'   => $token['hash'],
			'upload_blog_id' => $token['blog_id'],
		);

		return (object) $response;
	}

	/**
	 * Check to see that the given blog id exists within the Authenticated Jetpack blogs network.
	 *
	 * Note: This feels like an insane hack to do this, however as long as Jetpack is using a WPCOM
	 * blog to back VideoPress, then we need something like this to allow the Jetpack token to
	 * allow the user to request access for another blog. Essentially what this does is take the
	 * blog that Jetpack is running on and check to see if the given blog id belongs to any of the
	 * users of Jetpack blog. This is incredibly hacky, however I cannot find another way to do
	 * this, since the current method to get the Jetpack blog relies on a logged in user, which we
	 * do not have in this context. :sadpanda: -- dbtlr
	 *
	 * @param int $blog_id
	 * 
	 * @return bool
	 */
	protected function is_blog_in_network( $blog_id ) {

		if ( ! $this->api->token_details ) {
			return false;
		}

		$token_details = (object) $this->api->token_details;

		if ( $token_details->auth !== 'jetpack' ) {
			return false;
		}

		if ( $token_details->access !== 'blog' ) {
			return false;
		}

		$token_blog_id = (int) $token_details->blog_id;

		$users = get_users( array( 'blog_id' => $token_blog_id ) );

		// Including this here, so that it is only loaded when it is actually used.
		require_once ABSPATH . '/wp-content/mu-plugins/videopress/jetpack.php';

		foreach ( $users as $user ) {
			$blogs = get_blogs_of_user( $user->id );
	
			foreach ( $blogs as $blog ) {
				if ( ! Jetpack_VideoPress_Server::is_blog_valid( $blog->userblog_id, $user ) ) {
					continue;
				}
	
				if ( $blog->userblog_id === $blog_id ) {
					return true;
				}
			}
		}

		return false;
	}
}
