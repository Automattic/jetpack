<?php

class WPCOM_JSON_API_List_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	public $date_range = array();
	public $page_handle = array();

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		//upload_files can probably be used for other endpoints but we want contributors to be able to use media too
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$args = $this->query_args();
		$is_eligible_for_page_handle = true;

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		if ( isset( $args['before'] ) ) {
			$this->date_range['before'] = $args['before'];
		}
		if ( isset( $args['after'] ) ) {
			$this->date_range['after'] = $args['after'];
		}

		$query = array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'post_parent'    => isset( $args['post_ID'] ) ? $args['post_ID'] : null,
			'posts_per_page' => $args['number'],
			'post_mime_type' => isset( $args['mime_type'] ) ? $args['mime_type'] : null,
			'order'          => isset( $args['order'] ) ? $args['order'] : 'DESC',
			'orderby'        => isset( $args['order_by'] ) ? $args['order_by'] : 'date',
			's'              => isset( $args['search'] ) ? $args['search'] : null,
		);

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

		if ( isset( $args['page_handle'] ) ) {
			$page_handle = wp_parse_args( $args['page_handle'] );
			if ( isset( $page_handle['value'] ) && isset( $page_handle['id'] ) ) {
				// we have a valid looking page handle
				$this->page_handle = $page_handle;
				add_filter( 'posts_where', array( $this, 'handle_where_for_page_handle' ) );
			}
		}

		if ( $this->date_range ) {
			add_filter( 'posts_where', array( $this, 'handle_date_range' ) );
		}

		$this->performed_query = $query;
		add_filter( 'posts_orderby', array( $this, 'handle_orderby_for_page_handle' ) );

		$media = new WP_Query( $query );

		remove_filter( 'posts_orderby', array( $this, 'handle_orderby_for_page_handle' ) );

		if ( $this->date_range ) {
			remove_filter( 'posts_where', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		if ( $this->page_handle ) {
			remove_filter( 'posts_where', array( $this, 'handle_where_for_page_handle' ) );
		}

		$response = array();
		foreach ( $media->posts as $item ) {
			$response[] = $this->get_media_item_v1_1( $item->ID );
		}

		$return = array(
			'found' => (int) $media->found_posts,
			'media' => $response
		);

		if ( $is_eligible_for_page_handle && $return['media'] ) {
			$last_post = end( $return['media'] );
			reset( $return['media'] );

			if ( ( $return['found'] > count( $return['media'] ) ) && $last_post ) {
				$return['meta'] = array();
				$return['meta']['next_page'] = $this->build_page_handle( $last_post, $query );
			}
		}

		return $return;
	}

	function build_page_handle( $post, $query ) {
		$column = $query['orderby'];
		if ( ! $column ) {
			$column = 'date';
		}
		return build_query( array( 'value' => urlencode( $post->$column ), 'id' => $post->ID ) );
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
