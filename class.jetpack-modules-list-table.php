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
		$modal_info = isset( $_GET['info'] ) ? $_GET['info'] : false;

		wp_register_script(
			'models.jetpack-modules',
			plugins_url( '_inc/jetpack-modules.models.js', JETPACK__PLUGIN_FILE ),
			array( 'backbone', 'underscore' ),
			JETPACK__VERSION
		);
		wp_register_script(
			'views.jetpack-modules',
			plugins_url( '_inc/jetpack-modules.views.js', JETPACK__PLUGIN_FILE ),
			array( 'backbone', 'underscore', 'wp-util' ),
			JETPACK__VERSION
		);
		wp_register_script(
			'jetpack-modules-list-table',
			plugins_url( '_inc/jetpack-modules.js', JETPACK__PLUGIN_FILE ),
			array(
				'views.jetpack-modules',
				'models.jetpack-modules',
				'jquery',
			),
			JETPACK__VERSION,
			true
		);

		wp_localize_script( 'jetpack-modules-list-table', 'jetpackModulesData', array(
			'modules' => Jetpack::get_translated_modules( $this->all_items ),
			'i18n'    => array(
				'search_placeholder' => __( 'Search Modules…', 'jetpack' ),
			),
			'modalinfo' => $this->module_info_check( $modal_info, $this->all_items ),
			'nonces'  => array(
				'bulk' => wp_create_nonce( 'bulk-jetpack_page_jetpack_modules' ),
			),
			'coreIconAvailable' => Jetpack::jetpack_site_icon_available_in_core(),
		) );

		wp_enqueue_script( 'jetpack-modules-list-table' );

		/**
		 * Filters the js_templates callback value.
		 *
		 * @since 3.6.0
		 *
		 * @param array array( $this, 'js_templates' ) js_templates callback.
		 */
		add_action( 'admin_footer', apply_filters( 'jetpack_modules_list_table_js_template_callback', array( $this, 'js_templates' ) ), 9 );
	}

	function js_templates() {
		?>
		<script type="text/html" id="tmpl-Jetpack_Modules_List_Table_Template">
			<# var i = 0;
			if ( data.items.length ) {
			_.each( data.items, function( item, key, list ) {
				if ( item === undefined ) return;
				if ( jetpackModulesData.coreIconAvailable && 'site-icon' == item.module ) { #>
				<tr class="jetpack-module deprecated <# if ( ++i % 2 ) { #> alternate<# } #>" id="site-icon-deprecated">
					<th scope="row" class="check-column">
					<input type="checkbox" name="modules[]" value="{{{ item.module }}}" disabled />
					</th>
					<td class='name column-name'>
						<span class='info'>{{{ item.name }}}</span>
						<div class="row-actions">
							<span class="dep-msg"><?php _ex( 'WordPress now has Site Icon built in!', '"Site Icon" is the feature name.', 'jetpack' ); ?></span>
							<span class='configure'><a href="<?php esc_html_e( admin_url( 'customize.php?autofocus[control]=site_icon' ), 'jetpack' ); ?>"><?php _e( 'Configure' , 'jetpack' ); ?></a></span>
						</div>
					</td>
				</tr>
				<# return; } #>
				<tr class="jetpack-module <# if ( ++i % 2 ) { #> alternate<# } #><# if ( item.activated ) { #> active<# } #><# if ( ! item.available ) { #> unavailable<# } #>" id="{{{ item.module }}}">
					<th scope="row" class="check-column">
						<input type="checkbox" name="modules[]" value="{{{ item.module }}}" />
					</th>
					<td class='name column-name'>
						<span class='info'><a href="{{{item.learn_more_button}}}" target="blank">{{{ item.name }}}</a></span>
						<div class="row-actions">
						<# if ( item.configurable ) { #>
							<span class='configure'>{{{ item.configurable }}}</span>
						<# } #>
						<# if ( item.activated && 'vaultpress' !== item.module && item.available ) { #>
							<span class='delete'><a href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=deactivate&#038;module={{{ item.module }}}&#038;_wpnonce={{{ item.deactivate_nonce }}}"><?php _e( 'Deactivate', 'jetpack' ); ?></a></span>
						<# } else if ( item.available ) { #>
							<span class='activate'><a href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=activate&#038;module={{{ item.module }}}&#038;_wpnonce={{{ item.activate_nonce }}}"><?php _e( 'Activate', 'jetpack' ); ?></a></span>
						<# } #>
						</div>
					</td>
				</tr>
				<#
			});
			} else {
				#>
				<tr class="no-modules-found">
					<td colspan="2"><?php esc_html_e( 'No Modules Found' , 'jetpack' ); ?></td>
				</tr>
				<#
			}
			#>
		</script>
		<?php
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
			if ( 'centralized-management' === $key && Jetpack::is_module_active( 'manage' ) ) {
				continue;
			}
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
		$columns = array(
			'cb'          => '<input type="checkbox" />',
			'name'        => __( 'Name', 'jetpack' ),
		);
		return $columns;
	}

	function get_bulk_actions() {
		$actions = array(
			'bulk-activate'   => __( 'Activate',   'jetpack' ),
			'bulk-deactivate' => __( 'Deactivate', 'jetpack' ),
		);
		return $actions;
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

	function column_cb( $item ) {
		if ( ! $this->is_module_available( $item ) )
			return '';

		return sprintf( '<input type="checkbox" name="modules[]" value="%s" />', $item['module'] );
	}

	function column_icon( $item ) {
		$badge_text = $free_text = '';
		ob_start();
		?>
		<a href="#TB_inline?width=600&height=550&inlineId=more-info-module-settings-modal" class="thickbox">
			<div class="module-image">
				<p><span class="module-image-badge"><?php echo $badge_text; ?></span><span class="module-image-free" style="display: none"><?php echo $free_text; ?></span></p>
			</div>
		</a>
		<?php
		return ob_get_clean();

	}

	function column_name( $item ) {
		$actions = array(
			'info' => sprintf( '<a href="%s" target="blank">%s</a>', esc_url( $item['learn_more_button'] ), esc_html__( 'Feature Info', 'jetpack' ) ),
		);

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

		return $this->row_actions( $actions ) . wptexturize( $item['name'] );
	}

	function column_description( $item ) {
		ob_start();
		/** This action is documented in class.jetpack-admin.php */
		echo apply_filters( 'jetpack_short_module_description', $item['description'], $item['module'] );
		/** This action is documented in class.jetpack-admin.php */
		do_action( 'jetpack_learn_more_button_' . $item['module'] );
		echo '<div id="more-info-' . $item['module'] . '" class="more-info">';
		/** This action is documented in class.jetpack-admin.php */
		do_action( 'jetpack_module_more_info_' . $item['module'] );
		echo '</div>';
		return ob_get_clean();
	}

	function column_module_tags( $item ) {
		$module_tags = array();
		foreach( $item['module_tags'] as $module_tag ) {
			$module_tags[] = sprintf( '<a href="%3$s" data-title="%2$s">%1$s</a>', esc_html( $module_tag ), esc_attr( $module_tag ), esc_url( add_query_arg( 'module_tag', urlencode( $module_tag ) ) ) );
		}
		return implode( ', ', $module_tags );
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
