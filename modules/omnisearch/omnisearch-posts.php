<?php

if( ! class_exists( 'WP_List_Table' ) )
	require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );

class Jetpack_Omnisearch_Posts extends WP_List_Table {
	static $instance;
	var $post_type = 'post';

	function __construct() {
		self::$instance = $this;
		add_filter( 'omnisearch_results', array( $this, 'search'), 10, 2 );
	}

	function search( $results, $search_term ) {
		parent::__construct();

		$this->post_type_obj = get_post_type_object( $this->post_type );

		$search_url = esc_url( admin_url( sprintf( 'edit.php?post_type=%s&s=%s', urlencode( $this->post_type_obj->name ), urlencode( $search_term ) ) ) );
		$search_link = sprintf( ' <a href="%s" class="add-new-h2">%s</a>', $search_url, $this->post_type_obj->labels->search_items );
		$html = '<h2>' . $this->post_type_obj->labels->name . $search_link .'</h2>';

		$this->posts = get_posts( array( 's' => $search_term, 'post_type' => $this->post_type, 'posts_per_page' => Jetpack_Omnisearch::$num_results, 'post_status' => 'any' ) );

		$this->prepare_items();

		ob_start();
		$this->display();
		$html .= ob_get_clean();

		$results[ __CLASS__ . "_{$this->post_type}" ] = $html;
		return $results;
	}

	function get_columns() {
		$columns = array(
		#	'id' => __('ID'),
			'post_title' => __('Title'),
			'snippet' => __('Snippet'),
			'date' => __('Date'),
		);
		return $columns;
	}

	function prepare_items() {
		$columns = $this->get_columns();
		$hidden = array();
		$sortable = array();
		$this->_column_headers = array( $columns, $hidden, $sortable );
		$this->items = $this->posts;
	}

	function column_post_title( $post ) {
		$actions = array();
		if ( current_user_can( $this->post_type_obj->cap->edit_post, $post ) ) {
			$actions['edit'] = sprintf( '<a href="%s">%s</a>', get_edit_post_link( $post->ID ), $this->post_type_obj->labels->edit_item );
		}
		if ( current_user_can( $this->post_type_obj->cap->delete_post, $post ) ) {
			$actions['delete'] = sprintf( '<a href="%s">%s</a>', get_delete_post_link( $post->ID ), __('Trash') );
		}
		$actions['view'] = sprintf( '<a href="%s">%s</a>', get_permalink( $post->ID ), $this->post_type_obj->labels->view_item );
		return wptexturize( $post->post_title ) . $this->row_actions( $actions );
	}

	function column_date( $post ) {
		$html = '';

		if ( '0000-00-00 00:00:00' == $post->post_date ) {
			$t_time = $h_time = __( 'Unpublished' );
			$time_diff = 0;
		} else {
			$t_time = date( __( 'Y/m/d g:i:s A' ), mysql2date( 'G', $post->post_date ) );
			$m_time = $post->post_date;
			$time = get_post_time( 'G', true, $post );

			$time_diff = time() - $time;

			if ( $time_diff > 0 && $time_diff < DAY_IN_SECONDS )
				$h_time = sprintf( __( '%s ago' ), human_time_diff( $time ) );
			else
				$h_time = mysql2date( __( 'Y/m/d' ), $m_time );
		}

		$html .= '<abbr title="' . $t_time . '">' . $h_time . '</abbr>';
		$html .= '<br />';
		if ( 'publish' == $post->post_status ) {
			$html .= __( 'Published' );
		} elseif ( 'future' == $post->post_status ) {
			if ( $time_diff > 0 )
				$html .= '<strong class="attention">' . __( 'Missed schedule' ) . '</strong>';
			else
				$html .= __( 'Scheduled' );
		} else {
			$html .= __( 'Last Modified' );
		}
		return $html;
	}

	function column_default( $post, $column_name ) {
		switch ( $column_name ) {
			case 'id':
				return $post->ID;
			case 'post_title': // Will never happen, class method overrides.
				return $post->post_title;
			case 'snippet':
				return wp_trim_words( $post->post_content, 55 );
			case 'date': // Will never happen, class method overrides.
				$d = get_option('date_format');
				$t = get_option('time_format');
				return get_post_modified_time( $d, 0, $post, 1 ) . ' @ ' . get_post_modified_time( $t, 0, $post, 1 );
			default:
				return print_r( $post, true );
		}
	}

}
