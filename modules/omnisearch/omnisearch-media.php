<?php

if( ! class_exists( 'WP_Media_List_Table' ) )
	require_once( ABSPATH . 'wp-admin/includes/class-wp-media-list-table.php' );

class Jetpack_Omnisearch_Media extends WP_Media_List_Table {
	static $instance;

	function __construct() {
		self::$instance = $this;
		add_filter( 'omnisearch_results', array( $this, 'search' ), 10, 2 );
	}

	function search( $results, $search_term ) {
		$search_url = esc_url( add_query_arg( 's', $search_term, admin_url( 'upload.php' ) ) );
		$search_link = sprintf( ' <a href="%s" class="add-new-h2">%s</a>', $search_url, esc_html__( 'Search Media', 'jetpack' ) );
		$html = '<h2>' . esc_html__( 'Media', 'jetpack' ) . $search_link . '</h2>';
		parent::__construct();

		ob_start();
		$this->prepare_items();
		$columns = $this->get_columns();
		unset( $columns['cb'] );
		$this->_column_headers = array( $columns, array(), array() );
		$this->display();
		$html .= ob_get_clean();

		$label = __( 'Media', 'jetpack' );
		$results[ $label ] = $html;
		return $results;
	}

	function get_sortable_columns() {
		return array();
	}

	function get_bulk_actions() {
		return array();
	}

	function pagination( $which ) {}

	function extra_tablenav( $which ) {}
}
