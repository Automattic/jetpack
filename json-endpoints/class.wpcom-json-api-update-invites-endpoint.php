<?php
class WPCOM_JSON_API_Update_Invites_Endpoint extends WPCOM_JSON_API_Endpoint {
	public $blog_id;
	public $invite_id;
	public $is_wpcom;
	public $invite;

	function callback( $path = '', $blog_id = 0, $invite_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! is_multisite() ) {
			return new WP_Error( 'forbidden', 'To modify invites, site must be on a multisite installation.', 403 );
		}

		if ( ! current_user_can( 'promote_users' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to promote users on this blog.', 401 );
		}

		$this->blog_id   = $blog_id;
		$this->invite_id = $invite_id;
		$this->is_wpcom  = defined( 'IS_WPCOM' ) && IS_WPCOM;

		$invite = $this->get_invite();
		if ( false === $invite ) {
			return new WP_Error( 'unknown_invite', 'Requested invite was not found.', 404 );
		}

		$this->invite = $invite;

		$returnValue = false;
		if ( $this->api->ends_with( $this->path, '/delete' ) ) {
			$returnValue = array(
				'invite_key' => $invite_id,
				'deleted'    => $this->delete_invite(),
			);
		} else if ( $this->api->ends_with( $this->path, '/resend' ) ) {
			$returnValue = array(
				'result' => $this->is_wpcom ? $this->resend_wpcom_invite() : $this->resend_self_hosted_invite()
			);
		}

		return $returnValue;
	}

	/**
	 * Returns an invite if found or false if not found.
	 *
	 * @return bool|object
	 */
	function get_invite() {
		global $wpdb, $wpcom_invite_users;

		$invite = false;
		if ( $this->is_wpcom ) {
			$invite = $wpcom_invite_users->get_invitation( $this->invite_id );
		} else {
			$query = $wpdb->prepare( "SELECT * FROM $wpdb->options WHERE option_name = %s LIMIT 1", $this->invite_id );
			$invite = $wpdb->get_results( $query );

			$invite = empty( $invite ) ? false : $invite;
		}

		return $invite;
	}

	/**
	 * Deletes an invitation.
	 *
	 * @return bool Whether the invite was deleted successfully.
	 */
	function delete_invite() {
		global $wpdb, $wpcom_invite_users;

		if ( $this->is_wpcom ) {
			return (bool) $wpcom_invite_users->delete_invitation( $this->invite_id );
		} else {
			$query = $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name = %s", $this->invite_id );
			return 0 < $wpdb->query( $query );
		}
	}

	/**
	 * Sends an invitation email to a user to join a self-hosted site.
	 *
	 * This method duplicates the invitation email functionality that is present
	 * in wp-admin/user-new.php. Ideally, we should factor out the functionality
	 * in wp-admin/user-new.php that actually invites a user and sends the invite
	 * from the data validation checks that expect $_POST and $_REQUEST.
	 *
	 * @return bool Whether the email was sent successfully.
	 */
	function resend_self_hosted_invite() {
		$invite = (array) unserialize( $this->invite[0]->option_value );
		$roles = get_editable_roles();
		$role = $roles[ $invite['role'] ];
		$newuser_key = str_replace( 'new_user_', '', $this->invite_id );

		/* translators: 1: Site title 2: Site URL 3: Role name 4: URL to accept invitation */
		$message = __( 'Hi,

You\'ve been invited to join \'%1$s\' at
%2$s with the role of %3$s.

Please click the following link to confirm the invite:
%4$s', 'jetpack' );

		return wp_mail(
			$invite['email'],
			sprintf( __( '[%s] Joining confirmation', 'jetpack' ), wp_specialchars_decode( get_option( 'blogname' ) ) ),
			sprintf(
				$message,
				get_option( 'blogname' ),
				home_url(),
				wp_specialchars_decode( translate_user_role( $role['name'] ) ),
				home_url( "/newbloguser/$newuser_key/" )
			)
		);
	}

	/**
	 * Sends an invitation email to a user to join a WordPress.com site.
	 *
	 * @return bool Whether the invitation was sent successfully.
	 */
	function resend_wpcom_invite() {
		global $wpcom_invite_users;

		$wpcom_invite_users->update_invitation( $this->invite->invite_slug, array( 'invite_date' => gmdate( 'Y-m-d H:i:s' ) ) );

		if ( 'follower' == $this->invite->meta['role'] && ! is_private_blog() ) {
			$wpcom_invite_users->invite_followers( $this->invite->meta['sent_to'] );
		} else {
			$wpcom_invite_users->send_invitation( $this->invite->invite_slug );
		}

		return true;
	}
}
