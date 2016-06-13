<?php

if ( ! class_exists( 'WP_List_Table' ) )
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';

class Jetpack_Modules_List_Table extends WP_List_Table {

	function __construct() {
		parent::__construct();

		Jetpack::init();

		// In WP 4.2 WP_List_Table will be sanitizing which values are __set()
		global $wp_version;
		if ( version_compare( $wp_version, '4.2-z', '>=' ) && $this->compat_fields && is_array( $this->compat_fields ) ) {
			array_push( $this->compat_fields, 'all_items' );
		}

		$this->items = $this->all_items = Jetpack_Admin::init()->get_modules();
		$this->items = $this->filter_displayed_table_items( $this->items );
		/**
		 * Filters the list of modules available to be displayed in the Jetpack Settings screen.
		 *
		 * @since 3.0.0
		 *
		 * @param array $this->items Array of Jetpack modules.
		 */
		$this->items = apply_filters( 'jetpack_modules_list_table_items', $this->items );
		$this->_column_headers = array( $this->get_columns(), array(), array(), 'name' );

		/**
		 * Filters the js_templates callback value.
		 *
		 * @since 3.6.0
		 * @deprecated
		 *
		 * @param array array( $this, 'js_templates' ) js_templates callback.
		 */
		apply_filters( 'jetpack_modules_list_table_js_template_callback', null );
	}

	function get_views() {
		$modules              = Jetpack_Admin::init()->get_modules();
		$array_of_module_tags = wp_list_pluck( $modules, 'module_tags' );
		$module_tags          = call_user_func_array( 'array_merge', $array_of_module_tags );
		$module_tags_unique   = array_count_values( $module_tags );
		ksort( $module_tags_unique );

		$format  = '<a href="%3$s"%4$s data-title="%1$s">%1$s <span class="count">(%2$s)</span></a>';
		$title   = __( 'All', 'jetpack' );
		$count   = count( $modules );
		$url     = esc_url( remove_query_arg( 'module_tag' ) );
		$current = empty( $_GET['module_tag'] ) ? ' class="current all"' : ' class="all"';
		$views   = array(
			'all' => sprintf( $format, $title, $count, $url, $current ),
		);
		foreach ( $module_tags_unique as $title => $count ) {
			if ( 'Jumpstart' == $title ) {
				continue;
			}
			$key           = sanitize_title( $title );
			$display_title = esc_html( wptexturize( $title ) );
			$url           = esc_url( add_query_arg( 'module_tag', urlencode( $title ) ) );
			$current       = '';
			if ( ! empty( $_GET['module_tag'] ) && $title == $_GET['module_tag'] )
				$current   = ' class="current"';
			$views[ $key ] = sprintf( $format, $display_title, $count, $url, $current );
		}
		return $views;
	}

	function views() {
		$views = $this->get_views();

		echo "<ul class='subsubsub'>\n";
		foreach ( $views as $class => $view ) {
			$views[ $class ] = "\t<li class='$class'>$view</li>";
		}
		echo implode( "\n", $views ) . "\n";
		echo "</ul>";
	}

	function filter_displayed_table_items( $modules ) {
		return array_filter( $modules, array( $this, 'is_module_displayed' ) );
	}

	static function is_module_available( $module ) {
		if ( ! is_array( $module ) || empty( $module ) )
			return false;

		if ( Jetpack::is_development_mode() ) {
			return ! ( $module['requires_connection'] );
		} else {
			return Jetpack::is_active();
		}
	}

	static function is_module_displayed( $module ) {
		// Handle module tag based filtering.
		if ( ! empty( $_REQUEST['module_tag'] ) ) {
			$module_tag = sanitize_text_field( $_REQUEST['module_tag'] );
			if ( ! in_array( $module_tag, $module['module_tags'] ) )
				return false;
		}

		// If nothing rejected it, include it!
		return true;
	}

	static function sort_requires_connection_last( $module1, $module2 ) {
		if ( $module1['requires_connection'] == $module2['requires_connection'] )
			return 0;
		if ( $module1['requires_connection'] )
			return 1;
		if ( $module2['requires_connection'] )
			return -1;

		return 0;
	}

	function get_columns() {
		return array( 'name' => __( 'Name', 'jetpack' ) );
	}

	function single_row( $item ) {
		static $i = 0;
		$row_class = ( ++$i % 2 ) ? ' alternate' : '';

		if ( ! empty( $item['activated'] )  )
			$row_class .= ' active';

		if ( ! $this->is_module_available( $item ) )
			$row_class .= ' unavailable';

		echo '<tr class="jetpack-module' . esc_attr( $row_class ) . '" id="' . esc_attr( $item['module'] ) . '">';
		$this->single_row_columns( $item );
		echo '</tr>';
	}

	function get_table_classes() {
		return array( 'table', 'table-bordered', 'wp-list-table', 'widefat', 'fixed', 'jetpack-modules' );
	}

	function column_name( $item ) {
		$actions = array();

		if ( ! empty( $item['configurable'] ) ) {
			$actions['configure'] = $item['configurable'];
		}

		if ( empty( $item['activated'] ) && $this->is_module_available( $item ) ) {
			$url = wp_nonce_url(
				Jetpack::admin_url( array(
					'page'   => 'jetpack',
					'action' => 'activate',
					'module' => $item['module'],
				) ),
				'jetpack_activate-' . $item['module']
			);
			$actions['activate'] = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html__( 'Activate', 'jetpack' ) );
		} elseif ( ! empty( $item['activated'] ) ) {
			$url = wp_nonce_url(
				Jetpack::admin_url( array(
					'page'   => 'jetpack',
					'action' => 'deactivate',
					'module' => $item['module'],
				) ),
				'jetpack_deactivate-' . $item['module']
			);
			$actions['delete'] = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html__( 'Deactivate', 'jetpack' ) );
		}

		return $this->row_actions( $actions) . wptexturize( $item['name'] );
	}

	function column_default( $item, $column_name ) {
		switch ( $column_name ) {
			case 'icon':
			case 'name':
			case 'description':
				break;
			default:
				return print_r( $item, true );
		}
	}

	//Check if the info parameter provided in the URL corresponds to an actual module
	function module_info_check( $info = false, $modules ) {
		if ( false == $info ) {
			return false;
		} else if ( array_key_exists( $info, $modules ) ) {
			return $info;
		}
	}

	/**
	 * Core switched their `display_tablenav()` method to protected, so we can't access it directly.
	 * Instead, let's include an access function to make it doable without errors!
	 *
	 * @see https://github.com/WordPress/WordPress/commit/d28f6344de97616de8ece543ed290c4ba2383622
	 *
	 * @param string $which
	 *
	 * @return mixed
	 */
	function unprotected_display_tablenav( $which = 'top' ) {
		return $this->display_tablenav( $which );
	}

}
