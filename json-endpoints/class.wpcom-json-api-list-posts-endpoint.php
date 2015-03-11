<?php

class WPCOM_JSON_API_List_Posts_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	var $date_range = array();

	var $response_format = array(
		'found'    => '(int) The total number of posts found that match the request (ignoring limits, offsets, and pagination).',
		'posts'    => '(array:post) An array of post objects.',
	);

	// /sites/%s/posts/ -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
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

		if ( isset( $args['type'] ) && ! $this->is_post_type_allowed( $args['type'] ) ) {
			return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
		}

		// Normalize post_type
		if ( isset( $args['type'] ) && 'any' == $args['type'] ) {
			if ( version_compare( $this->api->version, '1.1', '<' ) ) {
				$args['type'] = array( 'post', 'page' );
			} else { // 1.1+
				$args['type'] = $this->_get_whitelisted_post_types();
			}
		}

		// determine statuses
		$status = $args['status'];
		$status = ( $status ) ? explode( ',', $status ) : array( 'publish' );
		if ( is_user_logged_in() ) {
			$statuses_whitelist = array(
				'publish',
				'pending',
				'draft',
				'future',
				'private',
				'trash',
				'any',
			);
			$status = array_intersect( $status, $statuses_whitelist );
		} else {
			// logged-out users can see only published posts
			$statuses_whitelist = array( 'publish', 'any' );
			$status = array_intersect( $status, $statuses_whitelist );

			if ( empty( $status ) ) {
				// requested only protected statuses? nothing for you here
				return array( 'found' => 0, 'posts' => array() );
			}
			// clear it (AKA published only) because "any" includes protected
			$status = array();
		}

		// let's be explicit about defaulting to 'post'
		$args['type'] = isset( $args['type'] ) ? $args['type'] : 'post';

		// make sure the user can read or edit the requested post type(s)
		if ( is_array( $args['type'] ) ) {
			$allowed_types = array();
			foreach ( $args['type'] as $post_type ) {
				if ( $this->current_user_can_access_post_type( $post_type, $args['context'] ) ) {
				   	$allowed_types[] = $post_type;
				}
			}

			if ( empty( $allowed_types ) ) {
				return array( 'found' => 0, 'posts' => array() );
			}
			$args['type'] = $allowed_types;
		}
		else {
			if ( ! $this->current_user_can_access_post_type( $args['type'], $args['context'] ) ) {
				return array( 'found' => 0, 'posts' => array() );
			}
		}

		$query = array(
			'posts_per_page' => $args['number'],
			'order'          => $args['order'],
			'orderby'        => $args['order_by'],
			'post_type'      => $args['type'],
			'post_status'    => $status,
			'post_parent'    => isset( $args['parent_id'] ) ? $args['parent_id'] : null,
			'author'         => isset( $args['author'] ) && 0 < $args['author'] ? $args['author'] : null,
			's'              => isset( $args['search'] ) ? $args['search'] : null,
			'fields'         => 'ids',
		);

		if ( ! is_user_logged_in () ) {
			$query['has_password'] = false;
		}

		if ( isset( $args['meta_key'] ) ) {
			$show = false;
			if ( $this->is_metadata_public( $args['meta_key'] ) )
				$show = true;
			if ( current_user_can( 'edit_post_meta', $query['post_type'], $args['meta_key'] ) )
				$show = true;

			if ( is_protected_meta( $args['meta_key'], 'post' ) && ! $show )
				return new WP_Error( 'invalid_meta_key', 'Invalid meta key', 404 );

			$meta = array( 'key' => $args['meta_key'] );
			if ( isset( $args['meta_value'] ) )
				$meta['value'] = $args['meta_value'];

			$query['meta_query'] = array( $meta );
		}

		if (
			isset( $args['sticky'] )
		&&
			( $sticky = get_option( 'sticky_posts' ) )
		&&
			is_array( $sticky )
		) {
			if ( $args['sticky'] ) {
				$query['post__in'] = $sticky;
			} else {
				$query['post__not_in'] = $sticky;
				$query['ignore_sticky_posts'] = 1;
			}
		} else {
				$query['post__not_in'] = $sticky;
				$query['ignore_sticky_posts'] = 1;
		}

		if ( isset( $args['exclude'] ) ) {
			$query['post__not_in'] = array_merge( $query['post__not_in'], (array) $args['exclude'] );
		}

		if ( isset( $args['exclude_tree'] ) && is_post_type_hierarchical( $args['type'] ) ) {
			// get_page_children is a misnomer; it supports all hierarchical post types
			$page_args = array(
					'child_of' => $args['exclude_tree'],
					'post_type' => $args['type'],
					// since we're looking for things to exclude, be aggressive
					'post_status' => 'publish,draft,pending,private,future,trash',
				);
			$post_descendants = get_pages( $page_args );

			$exclude_tree = array( $args['exclude_tree'] );
			foreach ( $post_descendants as $child ) {
				$exclude_tree[] = $child->ID;
			}

			$query['post__not_in'] = isset( $query['post__not_in'] ) ? array_merge( $query['post__not_in'], $exclude_tree ) : $exclude_tree;
		}

		if ( isset( $args['category'] ) ) {
			$category = get_term_by( 'slug', $args['category'], 'category' );
			if ( $category === false) {
				$query['category_name'] = $args['category'];
			} else {
				$query['cat'] = $category->term_id;
			}
		}

		if ( isset( $args['tag'] ) ) {
			$query['tag'] = $args['tag'];
		}

		if ( isset( $args['page'] ) ) {
			if ( $args['page'] < 1 ) {
				$args['page'] = 1;
			}

			$query['paged'] = $args['page'];
		} else {
			if ( $args['offset'] < 0 ) {
				$args['offset'] = 0;
			}

			$query['offset'] = $args['offset'];
		}

		if ( isset( $args['before'] ) ) {
			$this->date_range['before'] = $args['before'];
		}
		if ( isset( $args['after'] ) ) {
			$this->date_range['after'] = $args['after'];
		}

		if ( $this->date_range ) {
			add_filter( 'posts_where', array( $this, 'handle_date_range' ) );
		}

		/**
		 * 'column' necessary for the me/posts endpoint (which extends sites/$site/posts).
		 * Would need to be added to the sites/$site/posts definition if we ever want to
		 * use it there.
		 */
		$column_whitelist = array( 'post_modified_gmt' );
		if ( isset( $args['column'] ) && in_array( $args['column'], $column_whitelist ) ) {
			$query['column'] = $args['column'];
		}

		$wp_query = new WP_Query( $query );
		if ( $this->date_range ) {
			remove_filter( 'posts_where', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		$return = array();
		$excluded_count = 0;
		foreach ( array_keys( $this->response_format ) as $key ) {
			switch ( $key ) {
			case 'found' :
				$return[$key] = (int) $wp_query->found_posts;
				break;
			case 'posts' :
				$posts = array();
				foreach ( $wp_query->posts as $post_ID ) {
					$the_post = $this->get_post_by( 'ID', $post_ID, $args['context'] );
					if ( $the_post && ! is_wp_error( $the_post ) ) {
						$posts[] = $the_post;
					} else {
						$excluded_count++;
					}
				}

				if ( $posts ) {
					do_action( 'wpcom_json_api_objects', 'posts', count( $posts ) );
				}

				$return[$key] = $posts;
				break;
			}
		}

		$return['found'] -= $excluded_count;

		return $return;
	}

	function handle_date_range( $where ) {
		global $wpdb;

		switch ( count( $this->date_range ) ) {
		case 2 :
			$where .= $wpdb->prepare(
				" AND `$wpdb->posts`.post_date BETWEEN CAST( %s AS DATETIME ) AND CAST( %s AS DATETIME ) ",
				$this->date_range['after'],
				$this->date_range['before']
			);
			break;
		case 1 :
			if ( isset( $this->date_range['before'] ) ) {
				$where .= $wpdb->prepare(
					" AND `$wpdb->posts`.post_date <= CAST( %s AS DATETIME ) ",
					$this->date_range['before']
				);
			} else {
				$where .= $wpdb->prepare(
					" AND `$wpdb->posts`.post_date >= CAST( %s AS DATETIME ) ",
					$this->date_range['after']
				);
			}
			break;
		}

		return $where;
	}
}
