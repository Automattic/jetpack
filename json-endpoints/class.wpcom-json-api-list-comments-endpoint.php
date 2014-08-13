<?php

// @todo permissions
class WPCOM_JSON_API_List_Comments_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	var $date_range = array();

	var $response_format = array(
		'found'    => '(int) The total number of comments found that match the request (ignoring limits, offsets, and pagination).',
		'comments' => '(array:comment) An array of comment objects.',
	);

	function __construct( $args ) {
		parent::__construct( $args );
		$this->query = array_merge( $this->query, array(
			'number'   => '(int=20) The number of comments to return.  Limit: 100.',
			'offset'   => '(int=0) 0-indexed offset.',
			'page'     => '(int) Return the Nth 1-indexed page of comments.  Takes precedence over the <code>offset</code> parameter.',
			'order'    => array(
				'DESC' => 'Return comments in descending order from newest to oldest.',
				'ASC'  => 'Return comments in ascending order from oldest to newest.',
			),
			'after'    => '(ISO 8601 datetime) Return comments dated on or after the specified datetime.',
			'before'   => '(ISO 8601 datetime) Return comments dated on or before the specified datetime.',
			'type'     => array(
				'any'       => 'Return all comments regardless of type.',
				'comment'   => 'Return only regular comments.',
				'trackback' => 'Return only trackbacks.',
				'pingback'  => 'Return only pingbacks.',
				'pings'     => 'Return both trackbacks and pingbacks.',
			),
			'status'   => array(
				'approved'   => 'Return only approved comments.',
				'unapproved' => 'Return only comments in the moderation queue.',
				'spam'       => 'Return only comments marked as spam.',
				'trash'      => 'Return only comments in the trash.',
				'all'        => 'Return comments of all statuses.',
			),
		) );
	}

	// /sites/%s/comments/            -> $blog_id
	// /sites/%s/posts/%d/replies/    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/ -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		if ( false !== strpos( $path, '/posts/' ) ) {
			// We're looking for comments of a particular post
			$post_id = $object_id;
			$comment_id = 0;
		} else {
			// We're looking for comments for the whole blog, or replies to a single comment
			$comment_id = $object_id;
			$post_id = 0;
		}

		// We can't efficiently get the number of replies to a single comment
		$count = false;
		$found = -1;

		if ( !$comment_id ) {
			// We can get comment counts for the whole site or for a single post, but only for certain queries
			if ( 'any' === $args['type'] && !isset( $args['after'] ) && !isset( $args['before'] ) ) {
				$count = wp_count_comments( $post_id );
			}
		}

		switch ( $args['status'] ) {
		case 'approved' :
			$status = 'approve';
			if ( $count ) {
				$found = $count->approved;
			}
			break;
		default :
			if ( !current_user_can( 'moderate_comments' ) ) {
				return new WP_Error( 'unauthorized', 'User cannot read non-approved comments', 403 );
			}
			if ( 'unapproved' === $args['status'] ) {
				$status = 'hold';
				$count_status = 'moderated';
			} elseif ( 'all' === $args['status'] ) {
				$status = 'all';
				$count_status = 'total_comments';
			} else {
				$status = $count_status = $args['status'];
			}
			if ( $count ) {
				$found = $count->$count_status;
			}
		}

		$query = array(
			'number' => $args['number'],
			'order'  => $args['order'],
			'type'   => 'any' === $args['type'] ? false : $args['type'],
			'status' => $status,
		);

		if ( $post_id ) {
			$post = get_post( $post_id );
			if ( !$post || is_wp_error( $post ) ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}
			$query['post_id'] = $post->ID;
			if ( $this->api->ends_with( $this->path, '/replies' ) ) {
				$query['parent'] = 0;
			}
		} elseif ( $comment_id ) {
			$comment = get_comment( $comment_id );
			if ( !$comment || is_wp_error( $comment ) ) {
				return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
			}
			$query['parent'] = $comment_id;
		}

		if ( isset( $args['page'] ) ) {
			if ( $args['page'] < 1 ) {
				$args['page'] = 1;
			}

			$query['offset'] = ( $args['page'] - 1 ) * $args['number'];
		} else {
			if ( $args['offset'] < 0 ) {
				$args['offset'] = 0;
			}

			$query['offset'] = $args['offset'];
		}

		if ( isset( $args['before_gmt'] ) ) {
			$this->date_range['before_gmt'] = $args['before_gmt'];
		}
		if ( isset( $args['after_gmt'] ) ) {
			$this->date_range['after_gmt'] = $args['after_gmt'];
		}

		if ( $this->date_range ) {
			add_filter( 'comments_clauses', array( $this, 'handle_date_range' ) );
		}
		$comments = get_comments( $query );
		if ( $this->date_range ) {
			remove_filter( 'comments_clauses', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		$return = array();

		foreach ( array_keys( $this->response_format ) as $key ) {
			switch ( $key ) {
			case 'found' :
				$return[$key] = (int) $found;
				break;
			case 'comments' :
				$return_comments = array();
				foreach ( $comments as $comment ) {
					$the_comment = $this->get_comment( $comment->comment_ID, $args['context'] );
					if ( $the_comment && !is_wp_error( $the_comment ) ) {
						$return_comments[] = $the_comment;
					}
				}

				if ( $return_comments ) {
					do_action( 'wpcom_json_api_objects', 'comments', count( $return_comments ) );
				}

				$return[$key] = $return_comments;
				break;
			}
		}

		return $return;
	}

	function handle_date_range( $clauses ) {
		global $wpdb;

		switch ( count( $this->date_range ) ) {
		case 2 :
			$clauses['where'] .= $wpdb->prepare(
				" AND `$wpdb->comments`.comment_date_gmt BETWEEN CAST( %s AS DATETIME ) AND CAST( %s AS DATETIME ) ",
				$this->date_range['after_gmt'],
				$this->date_range['before_gmt']
			);
			break;
		case 1 :
			if ( isset( $this->date_range['before_gmt'] ) ) {
				$clauses['where'] .= $wpdb->prepare(
					" AND `$wpdb->comments`.comment_date_gmt <= CAST( %s AS DATETIME ) ",
					$this->date_range['before_gmt']
				);
			} else {
				$clauses['where'] .= $wpdb->prepare(
					" AND `$wpdb->comments`.comment_date_gmt >= CAST( %s AS DATETIME ) ",
					$this->date_range['after_gmt']
				);
			}
			break;
		}

		return $clauses;
	}
}
