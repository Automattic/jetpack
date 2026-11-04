<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Update site users API endpoint.
 *
 * Endpoint: /sites/%s/users/%d/delete
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

new WPCOM_JSON_API_Update_User_Endpoint(
	array(
		'description'          => 'Deletes or removes a user of a site.',
		'group'                => 'users',
		'stat'                 => 'users:delete',

		'method'               => 'POST',
		'path'                 => '/sites/%s/users/%d/delete',
		'path_labels'          => array(
			'$site'    => '(int|string) The site ID or domain.',
			'$user_ID' => '(int) The user\'s ID',
		),

		'request_format'       => array(
			'reassign'       => '(int) An optional id of a user to reassign posts to.',
			// Core uses reassign=false here, but older versions of this endpoint turn that into user 0 and reject it.
			// They drop unknown keys, so callers can send delete_content before every site has updated.
			'delete_content' => '(bool) Delete the user\'s content instead of reassigning it. On single sites, one of this or reassign is required when the user owns content.',
		),

		'response_format'      => array(
			'success' => '(bool) Was the deletion of user successful?',
		),

		'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/users/1/delete',
		'example_request_data' => array(
			'headers' => array(
				'authorization' => 'Bearer YOUR_API_TOKEN',
			),
		),

		'example_response'     => '
	{
		"success": true
	}',
	)
);

/**
 * Update site users API class.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_JSON_API_Update_User_Endpoint extends WPCOM_JSON_API_Endpoint {
	/**
	 * Update site users API callback.
	 *
	 * @param string $path API path.
	 * @param int    $blog_id Blog ID.
	 * @param int    $user_id User ID.
	 */
	public function callback( $path = '', $blog_id = 0, $user_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( (int) wpcom_get_blog_owner( $blog_id ) === (int) $user_id ) {
				return new WP_Error( 'forbidden', 'A site owner cannot be removed through this endpoint.', 403 );
			}
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_or_remove_user( $user_id );
		}

		return false;
	}

	/**
	 * Checks if a user exists by checking to see if a WP_User object exists for a user ID.
	 *
	 * @param  int $user_id User ID.
	 * @return bool
	 */
	public function user_exists( $user_id ) {
		$user = get_user_by( 'id', $user_id );

		return false !== $user && is_a( $user, 'WP_User' );
	}

	/**
	 * Whether a user owns content, using the same check as wp-admin/users.php.
	 *
	 * @param  int $user_id User ID.
	 * @return bool
	 */
	protected function user_has_content( $user_id ) {
		global $wpdb;

		/** This filter is documented in wp-admin/users.php */
		if ( apply_filters( 'users_have_additional_content', false, array( $user_id ) ) ) {
			return true;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_author = %d LIMIT 1", $user_id ) )
			|| $wpdb->get_var( $wpdb->prepare( "SELECT link_id FROM {$wpdb->links} WHERE link_owner = %d LIMIT 1", $user_id ) );
		// phpcs:enable
	}

	/**
	 * Return the domain name of a subscription.
	 *
	 * @param  Store_Subscription $subscription Subscription object.
	 * @return string
	 */
	protected function get_subscription_domain_name( $subscription ) {
		return $subscription->meta;
	}

	/**
	 * Get a list of the domains owned by the given user.
	 *
	 * @param  int $user_id User ID.
	 * @return array
	 */
	protected function domain_subscriptions_for_site_owned_by_user( $user_id ) {
		$subscriptions = WPCOM_Store::get_subscriptions( get_current_blog_id(), $user_id, domains::get_domain_products() );

		$domains = array_unique( array_map( array( $this, 'get_subscription_domain_name' ), $subscriptions ) );

		return array_values( $domains );
	}

	/**
	 * Validates user input and then decides whether to remove or delete a user.
	 *
	 * @param  int $user_id User ID.
	 * @return array|WP_Error
	 */
	public function delete_or_remove_user( $user_id ) {
		if ( 0 === (int) $user_id ) {
			return new WP_Error( 'invalid_input', 'A valid user ID must be specified.', 400 );
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$domains = $this->domain_subscriptions_for_site_owned_by_user( $user_id );
			if ( ! empty( $domains ) ) {
				$error = new WP_Error( 'user_owns_domain_subscription', implode( ', ', $domains ) );
				$error->add_data( $domains, 'additional_data' );
				return $error;
			}

			$active_user_subscriptions = WPCOM_Store::get_user_subscriptions( $user_id, get_current_blog_id() );
			if ( ! empty( $active_user_subscriptions ) ) {
				$product_names = array_values( wp_list_pluck( $active_user_subscriptions, 'product_name' ) );
				$error         = new WP_Error( 'user_has_active_subscriptions', 'User has active subscriptions' );
				$error->add_data( $product_names, 'additional_data' );
				return $error;
			}
		}

		if ( ! $this->user_exists( $user_id ) ) {
			return new WP_Error( 'invalid_input', 'A user does not exist with that ID.', 400 );
		}

		return is_multisite() ? $this->remove_user( $user_id ) : $this->delete_user( $user_id );
	}

	/**
	 * Removes a user from the current site.
	 *
	 * @param  int $user_id User ID.
	 * @return array|WP_Error
	 */
	public function remove_user( $user_id ) {
		// Skip the check if the user is removing themselves.
		if ( ! current_user_can( 'remove_users' ) && get_current_user_id() !== (int) $user_id ) {
			return new WP_Error( 'unauthorized', 'User cannot remove users for specified site.', 403 );
		}

		if ( ! is_user_member_of_blog( $user_id, get_current_blog_id() ) ) {
			return new WP_Error( 'invalid_input', 'User is not a member of the specified site.', 400 );
		}

		return array(
			'success' => remove_user_from_blog( $user_id, get_current_blog_id() ),
		);
	}

	/**
	 * Deletes a user, reassigning or deleting their content as the caller asks.
	 *
	 * @param  int $user_id User ID.
	 * @return array|WP_Error
	 */
	public function delete_user( $user_id ) {
		// Skip the check if the user is deleting themselves.
		if ( ! current_user_can( 'delete_users' ) && get_current_user_id() !== (int) $user_id ) {
			return new WP_Error( 'unauthorized', 'User cannot delete users for specified site.', 403 );
		}

		$input          = (array) $this->input();
		$reassign       = isset( $input['reassign'] ) ? (int) $input['reassign'] : null;
		$delete_content = ! empty( $input['delete_content'] );

		if ( $reassign !== null ) {
			if ( (int) $user_id === $reassign ) {
				return new WP_Error( 'invalid_input', 'Cannot reassign posts to user being deleted.', 400 );
			}

			if ( ! $this->user_exists( $reassign ) ) {
				return new WP_Error( 'invalid_input', 'User specified in reassign argument is not a member of the specified site.', 400 );
			}
		} elseif ( ! $delete_content && $this->user_has_content( $user_id ) ) {
			return new WP_Error( 'reassign_required', 'This user owns content. Set reassign to attribute it to another user, or delete_content to delete it.', 400 );
		}

		$success = $reassign !== null ? wp_delete_user( $user_id, $reassign ) : wp_delete_user( $user_id );

		return array(
			'success' => $success,
		);
	}
}
