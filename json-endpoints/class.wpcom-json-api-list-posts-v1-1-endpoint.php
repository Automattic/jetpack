<?php

class WPCOM_JSON_API_List_Posts_v1_1_Endpoint extends WPCOM_JSON_API_Post_v1_1_Endpoint {
	var $date_range = array();
	var $modified_range = array();
	var $page_handle = array();
	var $performed_query = null;

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
		$is_eligible_for_page_handle = true;

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

		if ( isset( $args['type'] ) &&
			   ! in_array( $args['type'], array( 'post', 'page', 'revision', 'any' ) ) &&
			   defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
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

		if ( $args['sticky'] === 'include' ) {
			$query['ignore_sticky_posts'] = 1;
		} else if ( $args['sticky'] === 'exclude' ) {
			$sticky = get_option( 'sticky_posts' );
			if ( is_array( $sticky ) ) {
				$query['post__not_in'] = $sticky;
			}
		} else if ( $args['sticky'] === 'require' ) {
			$sticky = get_option( 'sticky_posts' );
			if ( is_array( $sticky ) ) {
				$query['post__in'] = $sticky;
			}
		}

		if ( isset( $args['exclude'] ) ) {
			$excluded_ids = (array) $args['exclude'];
			$query['post__not_in'] = isset( $query['post__not_in'] ) ? array_merge( $query['post__not_in'], $excluded_ids ) : $excluded_ids;
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
			if ( $query['paged'] !== 1 ) {
				$is_eligible_for_page_handle = false;
			}
		} else {
			if ( $args['offset'] < 0 ) {
				$args['offset'] = 0;
			}

			$query['offset'] = $args['offset'];
			if ( $query['offset'] !== 0 ) {
				$is_eligible_for_page_handle = false;
			}
		}

		if ( isset( $args['before'] ) ) {
			$this->date_range['before'] = $args['before'];
		}
		if ( isset( $args['after'] ) ) {
			$this->date_range['after'] = $args['after'];
		}

		if ( isset( $args['modified_before_gmt'] ) ) {
			$this->modified_range['before'] = $args['modified_before_gmt'];
		}
		if ( isset( $args['modified_after_gmt'] ) ) {
			$this->modified_range['after'] = $args['modified_after_gmt'];
		}

		if ( $this->date_range ) {
			add_filter( 'posts_where', array( $this, 'handle_date_range' ) );
		}

		if ( $this->modified_range ) {
			add_filter( 'posts_where', array( $this, 'handle_modified_range' ) );
		}

		if ( isset( $args['page_handle'] ) ) {
			$page_handle = wp_parse_args( $args['page_handle'] );
			if ( isset( $page_handle['value'] ) && isset( $page_handle['id'] ) ) {
				// we have a valid looking page handle
				$this->page_handle = $page_handle;
				add_filter( 'posts_where', array( $this, 'handle_where_for_page_handle' ) );
			}
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

		$this->performed_query = $query;
		add_filter( 'posts_orderby', array( $this, 'handle_orderby_for_page_handle' ) );

		$wp_query = new WP_Query( $query );

		remove_filter( 'posts_orderby', array( $this, 'handle_orderby_for_page_handle' ) );

		if ( $this->date_range ) {
			remove_filter( 'posts_where', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		if ( $this->modified_range ) {
			remove_filter( 'posts_where', array( $this, 'handle_modified_range' ) );
			$this->modified_range = array();
		}

		if ( $this->page_handle ) {
			remove_filter( 'posts_where', array( $this, 'handle_where_for_page_handle' ) );

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

		if ( $is_eligible_for_page_handle && $return['posts'] ) {
			$last_post = end( $return['posts'] );
			reset( $return['posts'] );

			if ( ( $return['found'] > count( $return['posts'] ) ) && $last_post ) {
				$return['meta'] = array();
				$return['meta']['next_page'] = $this->build_page_handle( $last_post, $query );
			}
		}

		$return['found'] -= $excluded_count;

		return $return;
	}

	function build_page_handle( $post, $query ) {
		$column = $query['orderby'];
		if ( ! $column ) {
			$column = 'date';
		}
		return build_query( array( 'value' => urlencode($post[$column]), 'id' => $post['ID'] ) );
	}

	function _build_date_range_query( $column, $range, $where ) {
		global $wpdb;

		switch ( count( $range ) ) {
			case 2 :
				$where .= $wpdb->prepare(
					" AND `$wpdb->posts`.$column >= CAST( %s AS DATETIME ) AND `$wpdb->posts`.$column < CAST( %s AS DATETIME ) ",
					$range['after'],
					$range['before']
				);
				break;
			case 1 :
				if ( isset( $range['before'] ) ) {
					$where .= $wpdb->prepare(
						" AND `$wpdb->posts`.$column < CAST( %s AS DATETIME ) ",
						$range['before']
					);
				} else {
					$where .= $wpdb->prepare(
						" AND `$wpdb->posts`.$column > CAST( %s AS DATETIME ) ",
						$range['after']
					);
				}
				break;
		}

		return $where;
	}

	function handle_date_range( $where ) {
		return $this->_build_date_range_query( 'post_date', $this->date_range, $where );
	}

	function handle_modified_range( $where ) {
		return $this->_build_date_range_query( 'post_modified_gmt', $this->modified_range, $where );
	}

	function handle_where_for_page_handle( $where ) {
		global $wpdb;

		$column = $this->performed_query['orderby'];
		if ( ! $column ) {
			$column = 'date';
		}
		$order = $this->performed_query['order'];
		if ( ! $order ) {
			$order = 'DESC';
		}

		if ( ! in_array( $column, array( 'ID', 'title', 'date', 'modified', 'comment_count' ) ) ) {
			return $where;
		}

		if ( ! in_array( $order, array( 'DESC', 'ASC' ) ) ) {
			return $where;
		}

		$db_column = '';
		$db_value = '';
		switch( $column ) {
			case 'ID':
				$db_column = 'ID';
				$db_value = '%d';
				break;
			case 'title':
				$db_column = 'post_title';
				$db_value = '%s';
				break;
			case 'date':
				$db_column = 'post_date';
				$db_value = 'CAST( %s as DATETIME )';
				break;
			case 'modified':
				$db_column = 'post_modified';
				$db_value = 'CAST( %s as DATETIME )';
				break;
			case 'comment_count':
				$db_column = 'comment_count';
				$db_value = '%d';
				break;
		}

		if ( 'DESC'=== $order ) {
			$db_order = '<';
		} else {
			$db_order = '>';
		}

		// Add a clause that limits the results to items beyond the passed item, or equivalent to the passed item
		// but with an ID beyond the passed item. When we're ordering by the ID already, we only ask for items
		// beyond the passed item.
		$where .= $wpdb->prepare( " AND ( ( `$wpdb->posts`.`$db_column` $db_order $db_value ) ", $this->page_handle['value'] );
		if ( $db_column !== 'ID' ) {
			$where .= $wpdb->prepare( "OR ( `$wpdb->posts`.`$db_column` = $db_value AND `$wpdb->posts`.ID $db_order %d )", $this->page_handle['value'], $this->page_handle['id'] );
		}
		$where .= ' )';

		return $where;
	}

	function handle_orderby_for_page_handle( $orderby ) {
		global $wpdb;
		if ( $this->performed_query['orderby'] === 'ID' ) {
			// bail if we're already ordering by ID
			return $orderby;
		}

		if ( $orderby ) {
			$orderby .= ' ,';
		}
		$order = $this->performed_query['order'];
		if ( ! $order ) {
			$order = 'DESC';
		}
		$orderby .= " `$wpdb->posts`.ID $order";
		return $orderby;
	}
}
