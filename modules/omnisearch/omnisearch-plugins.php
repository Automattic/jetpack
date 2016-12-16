<?php

if( ! class_exists( 'WP_Plugin_Install_List_Table' ) )
	require_once( ABSPATH . 'wp-admin/includes/class-wp-plugin-install-list-table.php' );

class Jetpack_Omnisearch_Plugins extends WP_Plugin_Install_List_Table {
	static $instance;

	function __construct() {
		self::$instance = $this;
		add_filter( 'omnisearch_results', array( $this, 'search'), 10, 2 );
		add_action( 'wp_ajax_omnisearch_plugins', array( $this, 'wp_ajax_omnisearch_plugins' ) );
	}

	function search( $results, $search_term ) {
		wp_enqueue_script( 'plugin-install' );
		add_thickbox();

		$search_url = esc_url( admin_url( sprintf( 'plugin-install.php?tab=search&s=%s', urlencode( $search_term ) ) ) );
		$search_link = sprintf( ' <a href="%s" class="add-new-h2">%s</a>', $search_url, esc_html__('Search Plugins', 'jetpack') );
		$html = '<h2>' . esc_html__('Plugins', 'jetpack') . $search_link . '</h2>';

		$html .= '<div id="' . __CLASS__ . '_results">' . esc_html__('Loading &hellip;', 'jetpack') . '</div>';
		$html .= '<script>jQuery("#' . __CLASS__ . '_results").load(ajaxurl,{action:"omnisearch_plugins",search_term:search_term,num_results:num_results});</script>';

		$label = __( 'Plugins', 'jetpack' );
		$results[ $label ] = $html;
		return $results;
	}

	function results_html( $search_term, $num_results = null ) {
		$_GET['tab'] = 'search';
		$GLOBALS['hook_suffix'] = 'foo';
		$_REQUEST['s'] = $search_term;
		parent::__construct();

		ob_start();
		$this->prepare_items();
		/** This action is documented in modules/omnisearch/omnisearch-core.php */
		$num_results = intval( $num_results ) ? intval( $num_results ) : apply_filters( 'omnisearch_num_results', 5 );
		$this->items = array_slice( $this->items, 0, $num_results );
		remove_action( 'install_plugins_table_header', 'install_search_form' );
		$this->display();
		$html = ob_get_clean();

		return $html;
	}

	function wp_ajax_omnisearch_plugins() {
		$search_term = $_REQUEST['search_term'];
		$num_results = isset( $_REQUEST['num_results'] ) ? $_REQUEST['num_results'] : null;
		echo $this->results_html( $search_term, $num_results );
		exit;
	}

	function get_bulk_actions() {
		return array();
	}

	function pagination( $which ) {}
}
