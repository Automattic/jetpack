<?php

if ( ! class_exists( 'WP_List_Table' ) )
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';

class Jetpack_Modules_List_Table extends WP_List_Table {
	var $jetpack;

	function __construct() {
		parent::__construct();

		$this->jetpack = Jetpack::init();

		$this->items = $this->all_items = $this->get_modules();
		$this->items = $this->filter_displayed_table_items( $this->items );
		$this->items = apply_filters( 'jetpack_modules_list_table_items', $this->items );
		$this->_column_headers = array( $this->get_columns(), array(), array() );

		wp_register_script(
			'models.jetpack-modules',
			plugins_url( 'js/models.jetpack-modules.js', __FILE__ ),
			array( 'backbone', 'underscore'),
			JETPACK__VERSION
		);
		wp_register_script(
			'views.jetpack-modules',
			plugins_url( 'js/views.jetpack-modules.js', __FILE__ ),
			array( 'backbone', 'underscore'),
			JETPACK__VERSION
		);
		wp_register_script(
			'jetpack-modules-list-table',
			plugins_url( 'js/jetpack-module-list-table.js', __FILE__ ),
			array(
				'views.jetpack-modules',
				'models.jetpack-modules',
				'jquery',
			),
			JETPACK__VERSION,
			true
		);

		wp_localize_script( 'jetpack-modules-list-table', 'jetpackModulesData', $this->all_items );

		wp_enqueue_script( 'jetpack-modules-list-table' );
		add_action( 'admin_footer', array( $this, 'js_templates' ), 9 );
	}

	function js_templates() {
		?>
		<script type="text/html" id="Jetpack_Modules_List_Table_Template">
			<% var i = 0;
			_.each( items, function( item, key, list ) {
				%>
				<tr class="jetpack-module <% if ( ++i % 2 ) { %> alternate<% } %><% if ( item.activated ) { %> active<% } %><% if ( item.unavailable ) { %> unavailable<% } %>" id="<%= item.module %>">
					<th scope="row" class="check-column">
						<input type="checkbox" name="modules[]" value="<%= item.module %>" />
					</th>
					<td class='icon column-icon'>
						<a href="#TB_inline?width=600&height=550&inlineId=module-settings-modal" class="thickbox">
							<div class="module-image">
								<p>
									<span class="module-image-badge"></span>
									<span class="module-image-free" style="display: none"></span>
								</p>
							</div>
						</a>
					</td>
					<td class='name column-name'>
						<%= item.name %>
						<div class="row-actions">
						<% if ( item.activated ) { %>
							<span class='delete'><a href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=deactivate&#038;module=<%= item.module %>&#038;_wpnonce=<%= item.deactivate_nonce %>"><?php _e( 'Deactivate', 'jetpack' ); ?></a></span>
						<% } else if ( item.available ) { %>
							<span class='activate'><a href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack&#038;action=activate&#038;module=<%= item.module %>&#038;_wpnonce=<%= item.activate_nonce %>"><?php _e( 'Activate', 'jetpack' ); ?></a></span>
						<% } %>
						<% if ( item.configurable ) { %>
							<span class='configure'><%= item.configurable %></span>
						<% } %>
						</div>
					</td>
					<td class='module_tags column-module_tags'>
					<% _.each( item.module_tags, function( tag, tag_key, tag_list ) { %>
						<a href="<?php echo admin_url( 'admin.php' ); ?>?page=jetpack_modules&#038;list_table=true&#038;module_tag=<%= encodeURIComponent( tag ) %>" data-title="<%- tag %>"><%= tag %></a><% if ( tag_key + 1 < tag_list.length ) { %>, <% } %>
					<% } ); %>
					</td>
					<td class='description column-description'>
						<%= item.short_description %>
						<%= item.learn_more_button %>
						<div id="more-info-<%= item.module %>" class="more-info">
							<%= item.long_description %>
						</div>
					</td>
				</tr>
				<%
			});
			%>
		</script>
		<?php
	}

	function get_modules() {
		$available_modules = $this->jetpack->get_available_modules();
		$active_modules    = $this->jetpack->get_active_modules();
		$modules           = array();

		foreach ( $available_modules as $module ) {
			if ( $module_array = $this->jetpack->get_module( $module ) ) {
				$module_array['module']            = $module;
				$module_array['activated']         = in_array( $module, $active_modules );
				$module_array['deactivate_nonce']  = wp_create_nonce( 'jetpack_deactivate-' . $module );
				$module_array['activate_nonce']    = wp_create_nonce( 'jetpack_activate-' . $module );
				$module_array['unavailable']       = ! self::is_module_available( $module_array );
				$module_array['short_description'] = apply_filters( 'jetpack_short_module_description', $module_array['description'], $module );
				$module_array['configure_url'] = Jetpack::module_configuration_url( $module );

				ob_start();
				do_action( 'jetpack_learn_more_button_' . $module );
				$module_array['learn_more_button'] = ob_get_clean();
				ob_start();
				if ( $this->jetpack->is_active() && has_action( 'jetpack_module_more_info_connected_' . $module ) ) {
					do_action( 'jetpack_module_more_info_connected_' . $module );
				} else {
					do_action( 'jetpack_module_more_info_' . $module );
				}
				$module_array['long_description']  = ob_get_clean();

				$module_array['configurable'] = false;
				if ( current_user_can( 'manage_options' ) && apply_filters( 'jetpack_module_configurable_' . $module, false ) ) {
					$module_array['configurable'] = sprintf( '<a href="%1$s">%2$s</a>', esc_url( Jetpack::module_configuration_url( $module ) ), __( 'Configure', 'jetpack' ) );
				}

				$modules[ $module ] = $module_array;
			}
		}

		if ( isset( $modules['vaultpress'] ) )
			unset( $modules['vaultpress'] );

		uasort( $modules, array( $this->jetpack, 'sort_modules' ) );

		if ( ! Jetpack::is_active() ) {
			uasort( $modules, array( __CLASS__, 'sort_requires_connection_last' ) );
		}

		return $modules;
	}

	function get_views() {
		$modules              = $this->get_modules();
		$array_of_module_tags = wp_list_pluck( $modules, 'module_tags' );
		$module_tags          = call_user_func_array( 'array_merge', $array_of_module_tags );
		$module_tags_unique   = array_count_values( $module_tags );
		ksort( $module_tags_unique );

		$format  = '<a href="%3$s"%4$s data-title="%1$s">%1$s <span class="count">(%2$s)</span></a>';
		$title   = __( 'All', 'jetpack' );
		$count   = count( $modules );
		$url     = remove_query_arg( 'module_tag' );
		$current = empty( $_GET['module_tag'] ) ? ' class="current all"' : ' class="all"';
		$views   = array(
			'all' => sprintf( $format, $title, $count, $url, $current ),
		);
		foreach ( $module_tags_unique as $title => $count ) {
			$key           = sanitize_title( $title );
			$display_title = esc_html( wptexturize( $title ) );
			$url           = add_query_arg( 'module_tag', urlencode( $title ) );
			$current       = '';
			if ( ! empty( $_GET['module_tag'] ) && $title == $_GET['module_tag'] )
				$current   = ' class="current"';
			$views[ $key ] = sprintf( $format, $display_title, $count, $url, $current );
		}
		return $views;
	}

	function filter_displayed_table_items( $modules ) {
		return array_filter( $modules, array( $this, 'is_module_displayed' ) );
	}

	static function is_module_available( $module ) {
		if ( ! is_array( $module ) || empty( $module ) )
			return false;

		return ! ( $module['requires_connection'] && ! Jetpack::is_active() );
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
			'icon'        => '',
			'name'        => __( 'Name',        'jetpack' ),
			'module_tags' => __( 'Module Tags', 'jetpack' ),
			'description' => __( 'Description', 'jetpack' ),
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
		return array( 'widefat', 'fixed', 'jetpack-modules', 'plugins' );
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
		$actions = array();

		if ( empty( $item['activated'] ) && $this->is_module_available( $item ) ) {
			$url = wp_nonce_url(
				$this->jetpack->admin_url( array(
					'page'   => 'jetpack',
					'action' => 'activate',
					'module' => $item['module'],
				) ),
				'jetpack_activate-' . $item['module']
			);
			$actions['activate'] = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html__( 'Activate', 'jetpack' ) );
		} elseif ( ! empty( $item['activated'] ) ) {
			$url = wp_nonce_url(
				$this->jetpack->admin_url( array(
					'page'   => 'jetpack',
					'action' => 'deactivate',
					'module' => $item['module'],
				) ),
				'jetpack_deactivate-' . $item['module']
			);
			$actions['delete'] = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html__( 'Deactivate', 'jetpack' ) );
		}
		if ( ! empty( $item['configurable'] ) ) {
			$actions['configure'] = $item['configurable'];
		}

		return wptexturize( $item['name'] ) . $this->row_actions( $actions );
	}

	function column_description( $item ) {
		ob_start();
		echo apply_filters( 'jetpack_short_module_description', $item['description'], $item['module'] );
		do_action( 'jetpack_learn_more_button_' . $item['module'] );
		echo '<div id="more-info-' . $item['module'] . '" class="more-info">';
		if ( $this->jetpack->is_active() && has_action( 'jetpack_module_more_info_connected_' . $item['module'] ) ) {
			do_action( 'jetpack_module_more_info_connected_' . $item['module'] );
		} else {
			do_action( 'jetpack_module_more_info_' . $item['module'] );
		}
		echo '</div>';
		return ob_get_clean();
	}

	function column_module_tags( $item ) {
		$module_tags = array();
		foreach( $item['module_tags'] as $module_tag ) {
			$module_tags[] = sprintf( '<a href="%3$s" data-title="%2$s">%1$s</a>', esc_html( $module_tag ), esc_attr( $module_tag ), add_query_arg( 'module_tag', urlencode( $module_tag ) ) );
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
}
