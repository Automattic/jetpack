<?php

new WPCOM_JSON_API_List_Invites_Endpoint( array(
	'description' => 'List the invites of a site.',
	'group'       => '__do_not_document',
	'stat'        => 'invites:list',

	'method'      => 'GET',
	'path'        => '/sites/%s/invites',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'   => '(int=25) Limit the total number of invites to be returned.',
		'offset'   => '(int=0) The first n invites to be skipped in the returned array.',
		'status'   => array(
			'pending' => 'Return only pending invites.',
			'all'     => 'Return all invites, pending and accepted, that have not been deleted.',
		)
	),

	'response_format' => array(
		'found'   => '(int) The total number of invites found that match the request (ignoring limits and offsets).',
		'invites' => '(array) Array of invites.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/invites',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
) );

class WPCOM_JSON_API_List_Invites_Endpoint extends WPCOM_JSON_API_Endpoint {
	var $blog_id;
	var $is_wpcom;

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! is_multisite() ) {
			return new WP_Error( 'forbidden', 'To query invites, site must be on a multisite installation.', 403 );
		}

		if ( ! current_user_can( 'promote_users' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to promote users on this blog.', 401 );
		}

		$this->blog_id  = $blog_id;
		$this->args     = $this->query_args();
		$this->is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$this->found    = $this->get_found();

		return array(
			'found'   => $this->found,
			'invites' => $this->get_invites(),
		);
	}

	/**
	 * Returns the total number of invites, ignoring limits and offsets.
	 * @return int
	 */
	function get_found() {
		global $wpdb, $wpcom_invite_users;

		$total = 0;
		if ( $this->is_wpcom ) {
			$total = $wpcom_invite_users->count_blog_invitiations( $this->blog_id, null, 'pending' == $this->args['status'] );
		} else {
			$total = $invites = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT count( option_id ) FROM $wpdb->options WHERE option_name LIKE %s",
					'new_user_%'
				)
			);
		}

		return intval( $total );
	}

	/**
	 * Returns the invitations for a given site.
	 * @return array
	 */
	function get_invites() {
		global $wpdb, $wpcom_invite_users;

		$invites = array();
		if ( $this->is_wpcom ) {
			$invites = $wpcom_invite_users->get_blog_invitations(
				$this->blog_id,
				null,
				array(
					'offset'       => intval( $this->args['offset'] ),
					'per_page'     => intval( $this->args['number'] ),
					'pending_only' => ( 'pending' == $this->args['status'] ),
				)
			);
		} else {
			$invites = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_id DESC LIMIT %d, %d",
					'new_user_%',
					intval( $this->args['offset'] ),
					intval( $this->args['number'] )
				)
			);
		}

		return empty( $invites ) ? array() : array_map( array( $this, 'build_invite' ), $invites );
	}

	/**
	 * Given an invite, returns an array with expected shape.
	 * @param  array $invite
	 * @return array
	 */
	function build_invite( $invite ) {
		$invite_key = $this->is_wpcom ? $invite->invite_slug : $invite->option_name;
		$invite = $this->is_wpcom ? (array) $invite : (array) unserialize( $invite->option_value );

		return array(
			'invite_key' => $invite_key,
			'role'       => $this->is_wpcom ? $invite['meta']['role'] : $invite['role'],
			'user'       => $this->get_user( $invite ),
		);
	}

	/**
	 * Given an invite, returns a user object using the get_author() method in class.json-api-endpoints.php.
	 * @param  array $invite
	 * @return array|string
	 */
	function get_user( $invite ) {
		if ( ! $this->is_wpcom ) {
			return $this->get_author( $invite['user_id'] );
		}

		$user = get_user_by( 'login', $invite['meta']['sent_to'] );

		// If a user did not exist, mock a user to pass to get_author()
		$no_user = false === $user;
		if( $no_user ) {
			$user = new stdClass();
			$user->comment_author = '';
			$user->comment_author_url = '';
			$user->comment_author_email = $invite['meta']['sent_to'];
		}

		return $this->get_author( $user, $no_user );
	}
}
