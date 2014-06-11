<?php

class Jetpack_Admin {

	/**
	 * @var Jetpack_Admin
	 **/
	private static $instance = null;

	/**
	 * @var Jetpack
	 **/
	private $jetpack;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Admin;
		}
		return self::$instance;
	}

	private function __construct() {
		$this->jetpack = Jetpack::init();
		add_action( 'admin_menu',                    array( $this, 'admin_menu' ), 998 );
		add_action( 'jetpack_admin_menu',            array( $this, 'admin_menu_debugger' ) );
		add_action( 'jetpack_admin_menu',        	 array( $this, 'admin_menu_modules' ) );
		add_action( 'jetpack_pre_activate_module',   array( $this, 'fix_redirect' ) );
		add_action( 'jetpack_pre_deactivate_module', array( $this, 'fix_redirect' ) );
		add_action( 'jetpack_unrecognized_action',   array( $this, 'handle_unrecognized_action' ) );

	}

	function get_modules() {
		include_once( JETPACK__PLUGIN_DIR . 'modules/module-info.php' );
		$available_modules = $this->jetpack->get_available_modules();
		$active_modules    = $this->jetpack->get_active_modules();
		$modules           = array();

		foreach ( $available_modules as $module ) {
			if ( $module_array = $this->jetpack->get_module( $module ) ) {
				$short_desc = apply_filters( 'jetpack_short_module_description', $module_array['description'], $module );
				$short_desc_trunc = ( strlen( $short_desc ) > 143 ) ? substr( $short_desc, 0, 140 ) . '...' : $short_desc;

				$module_array['module']            = $module;
				$module_array['activated']         = in_array( $module, $active_modules );
				$module_array['deactivate_nonce']  = wp_create_nonce( 'jetpack_deactivate-' . $module );
				$module_array['activate_nonce']    = wp_create_nonce( 'jetpack_activate-' . $module );
				$module_array['available']         = self::is_module_available( $module_array );
				$module_array['short_description'] = $short_desc_trunc;
				$module_array['configure_url']     = Jetpack::module_configuration_url( $module );

				ob_start();
				do_action( 'jetpack_learn_more_button_' . $module );
				$module_array['learn_more_button'] = ob_get_clean();

				ob_start();
				if ( Jetpack::is_active() && has_action( 'jetpack_module_more_info_connected_' . $module ) ) {
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

		uasort( $modules, array( $this->jetpack, 'sort_modules' ) );

		if ( ! Jetpack::is_active() ) {
			uasort( $modules, array( __CLASS__, 'sort_requires_connection_last' ) );
		}

		return $modules;
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

	static function is_module_available( $module ) {
		if ( ! is_array( $module ) || empty( $module ) )
			return false;

		return ! ( $module['requires_connection'] && ! Jetpack::is_active() );
	}

	function handle_unrecognized_action( $action ) {
		switch( $action ) {
			case 'bulk-activate' :
				if ( ! current_user_can( 'jetpack_activate_modules' ) ) {
					break;
				}

				$modules = (array) $_GET['modules'];
				$modules = array_map( 'sanitize_key', $modules );
				check_admin_referer( 'bulk-jetpack_page_jetpack_modules' );
				foreach( $modules as $module ) {
					Jetpack::log( 'activate', $module );
					Jetpack::activate_module( $module, false );
				}
				// The following two lines will rarely happen, as Jetpack::activate_module normally exits at the end.
				wp_safe_redirect( wp_get_referer() );
				exit;
			case 'bulk-deactivate' :
				if ( ! current_user_can( 'jetpack_deactivate_modules' ) ) {
					break;
				}

				$modules = (array) $_GET['modules'];
				$modules = array_map( 'sanitize_key', $modules );
				check_admin_referer( 'bulk-jetpack_page_jetpack_modules' );
				foreach ( $modules as $module ) {
					Jetpack::log( 'deactivate', $module );
					Jetpack::deactivate_module( $module );
					Jetpack::state( 'message', 'module_deactivated' );
				}
				Jetpack::state( 'module', $modules );
				wp_safe_redirect( wp_get_referer() );
				exit;
			default:
				return;
		}
	}

	function fix_redirect() {
		if ( wp_get_referer() ) {
			add_filter( 'wp_redirect', 'wp_get_referer' );
		}
	}

	function admin_menu() {
		// @todo: Remove in Jetpack class itself.
		remove_action( 'admin_menu', array( $this->jetpack, 'admin_menu' ), 999 );

		$title = _x( 'Jetpack', 'The menu item label', 'jetpack' );

		list( $jetpack_version ) = explode( ':', Jetpack_Options::get_option( 'version' ) );
		if (
			$jetpack_version
		&&
			$jetpack_version != JETPACK__VERSION
		&&
			( $new_modules = Jetpack::get_default_modules( $jetpack_version, JETPACK__VERSION ) )
		&&
			is_array( $new_modules )
		&&
			( $new_modules_count = count( $new_modules ) )
		&&
			( Jetpack::is_active() || Jetpack::is_development_mode() )
		) {
			$new_count_i18n = number_format_i18n( $new_modules_count );
			$span_title     = esc_attr( sprintf( _n( 'One New Jetpack Module', '%s New Jetpack Modules', $new_modules_count, 'jetpack' ), $new_count_i18n ) );
			$format         = _x( 'Jetpack %s', 'The menu item label with a new module count as %s', 'jetpack' );
			$update_markup  = "<span class='update-plugins count-{$new_modules_count}' title='$span_title'><span class='update-count'>$new_count_i18n</span></span>";
			$title          = sprintf( $format, $update_markup );
		}

		$callback = empty( $_GET['configure'] ) ? array( $this, 'admin_page' ) : array( $this, 'admin_page_nojs_configurable' );

		$hook = add_menu_page( 'Jetpack', $title, 'jetpack_admin_page', 'jetpack', $callback, 'div' );

		add_action( "load-$hook",                array( $this, 'admin_help'      ) );
		add_action( "load-$hook",                array( $this, 'admin_page_load' ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'      ) );
		add_action( "admin_footer-$hook",        array( $this, 'main_page_js_templates' ) );
		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );

		do_action( 'jetpack_admin_menu', $hook );

		add_filter( 'custom_menu_order',         array( $this, 'admin_menu_order'   ) );
		add_filter( 'menu_order',                array( $this, 'jetpack_menu_order' ) );
	}

	function admin_menu_modules() {
		/**
		 * Don't add in the modules page unless modules are available!
		 */
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
			return;
		}
		$hook = add_submenu_page( 'jetpack', __( 'Jetpack Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'jetpack_manage_modules', 'jetpack_modules', array( $this, 'admin_page_modules' ) );

		add_action( "load-$hook",                array( $this, 'admin_page_load'   ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'        ) );
		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'      ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'     ) );
	}

	function admin_menu_debugger() {
		$debugger_hook = add_submenu_page( null, __( 'Jetpack Debugging Center', 'jetpack' ), '', 'manage_options', 'jetpack-debugger', array( $this, 'debugger_page' ) );
		add_action( "admin_head-$debugger_hook", array( 'Jetpack_Debugger', 'jetpack_debug_admin_head' ) );
	}

	function admin_help() {
		$this->jetpack->admin_help();
	}

	function debugger_page() {
		nocache_headers();
		if ( ! current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
		Jetpack_Debugger::jetpack_debug_display_handler();
	}

	function admin_page_load() {
		// This is big.  For the moment, just call the existing one.
		$this->jetpack->admin_page_load();
	}

	function admin_head() {
		if ( isset( $_GET['configure'] ) && Jetpack::is_module( $_GET['configure'] ) && current_user_can( 'manage_options' ) ) {
			do_action( 'jetpack_module_configuration_head_' . $_GET['configure'] );
		}
	}

	function admin_menu_order() {
		return true;
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' )
				$jp_menu_order[] = $item;

			if ( $index == 0 )
				$jp_menu_order[] = 'jetpack';
		}

		return $jp_menu_order;
	}

	function admin_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		
		wp_enqueue_style( 'jetpack-google-fonts', '//fonts.googleapis.com/css?family=Open+Sans:400italic,400,700,600,800' );
		if( is_rtl() ) {
			wp_enqueue_style( 'jetpack-admin', plugins_url( "_inc/jetpack-admin-rtl{$min}.css", __FILE__ ), array( 'genericons' ), JETPACK__VERSION . '-20121016' );
		} else {
			wp_enqueue_style( 'jetpack-admin', plugins_url( "_inc/jetpack-admin{$min}.css", __FILE__ ), array( 'genericons' ), JETPACK__VERSION . '-20121016' );	
		}
	}

	function admin_scripts() {
		// Let's only do this stuff for the main page.
		if ( ! empty( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
			wp_enqueue_script( 'jetpack-icanhaz', plugins_url( '_inc/icanhaz.js', __FILE__ ), array( ), JETPACK__VERSION . '-20121111' );
			wp_enqueue_script( 'jetpack-js', plugins_url( '_inc/jp.js', __FILE__ ), array( 'jquery' ), JETPACK__VERSION . '-20121111' );
			wp_localize_script(
				'jetpack-js',
				'jetpackL10n',
				array(
					'ays_disconnect'    => __( "This will deactivate all Jetpack modules.\nAre you sure you want to disconnect?", 'jetpack' ),
					'ays_unlink'        => __( "This will prevent user-specific modules such as Publicize, Notifications and Post By Email from working.\nAre you sure you want to unlink?", 'jetpack' ),
					'ays_dismiss'       => __( "This will deactivate Jetpack.\nAre you sure you want to deactivate Jetpack?", 'jetpack' ),
					'view_all_features' => __( 'View all Jetpack features', 'jetpack' ),
					'no_modules_found'  => sprintf( __( 'Sorry, no modules were found for the search term "%s"', 'jetpack' ), '{term}' ),
					'modules'           => array_values( $this->get_modules() ),
					'currentVersion'    => JETPACK__VERSION,
				)
			);
		} else {
			wp_enqueue_script( 'jetpack-admin-js', plugins_url( '_inc/jetpack-admin.js', __FILE__ ), array( 'jquery' ), JETPACK__VERSION . '-20121111' );
		}
		add_action( 'admin_footer', array( $this->jetpack, 'do_stats' ) );
	}

	function admin_page_top() {
		include_once( JETPACK__PLUGIN_DIR . '_inc/header.php' );
	}

	function admin_page_bottom() {
		include_once( JETPACK__PLUGIN_DIR . '_inc/footer.php' );
	}

	function admin_page() {
		global $current_user;

		$is_connected      = Jetpack::is_active();
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );
		$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );

		if ( Jetpack::is_development_mode() ) {
			$is_connected      = true;
			$is_user_connected = true;
			$is_master_user    = false;
		}

		$this->admin_page_top(); 

		$data = array(
			'is_connected' => $is_connected,
			'is_user_connected' => $is_user_connected,
			'is_master_user' => $is_master_user
		);
		Jetpack::init()->load_view( 'admin/admin-page.php', $data );
		
		$this->admin_page_bottom();
	}

	function admin_page_nojs_configurable() {
		$this->admin_page_top();

		if ( empty( $_GET['configure'] ) ) {
			$this->admin_page_bottom();
			return;
		}

		echo '<div class="clouds-sm"></div>';
		echo '<div class="wrap configure-module">';

		$module_name = preg_replace( '/[^\da-z\-]+/', '', $_GET['configure'] );
		if ( Jetpack::is_module( $module_name ) && current_user_can( 'jetpack_configure_modules' ) ) {
			Jetpack::admin_screen_configure_module( $module_name );
		} else {
			echo '<h2>' . esc_html__( 'Error, bad module.', 'jetpack' ) . '</h2>';
		}

		echo '</div><!-- /wrap -->';

		$this->admin_page_bottom();
	}

	function admin_page_modules() {
		include_once( 'class.jetpack-modules-list-table.php' );
		$list_table = new Jetpack_Modules_List_Table;

		$this->admin_page_top();
		?>
		<div class="clouds-sm"></div>
		<?php do_action( 'jetpack_notices' ) ?>
		<div class="page-content configure">
			<div class="frame top hide-if-no-js">
				<div class="wrap">
					<div class="manage-left">
						<table class="table table-bordered fixed-top">
							<thead>
								<tr>
									<th class="check-column"><input type="checkbox" class="checkall"></th>
									<th colspan="2">
										<?php $list_table->display_tablenav( 'top' ); ?>
										<span class="filter-search">
											<button type="button" class="button">Filter</button>
										</span>
									</th>
								</tr>
							</thead>
						</table>
					</div>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
			<div class="frame bottom">
				<div class="wrap">
					<div class="manage-right">
						<div class="bumper">
							<form class="navbar-form" role="search">
								<input type="hidden" name="page" value="jetpack_modules" />
								<?php $list_table->search_box( __( 'Search', 'jetpack' ), 'srch-term' ); ?>
								<p><?php esc_html_e( 'View:', 'jetpack' ); ?></p>
								<div class="button-group filter-active">
									<button type="button" class="button <?php if ( empty( $_GET['activated'] ) ) echo 'active'; ?>"><?php esc_html_e( 'All', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['activated'] ) && 'true' == $_GET['activated'] ) echo 'active'; ?>" data-filter-by="activated" data-filter-value="true"><?php esc_html_e( 'Active', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['activated'] ) && 'false' == $_GET['activated'] ) echo 'active'; ?>" data-filter-by="activated" data-filter-value="false"><?php esc_html_e( 'Inactive', 'jetpack' ); ?></button>
								</div>
								<p><?php esc_html_e( 'Sort by:', 'jetpack' ); ?></p>
								<div class="button-group sort">
									<button type="button" class="button <?php if ( empty( $_GET['sort_by'] ) ) echo 'active'; ?>" data-sort-by="name"><?php esc_html_e( 'Alphabetical', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['sort_by'] ) && 'introduced' == $_GET['sort_by'] ) echo 'active'; ?>" data-sort-by="introduced" data-sort-order="reverse"><?php esc_html_e( 'Newest', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['sort_by'] ) && 'sort' == $_GET['sort_by'] ) echo 'active'; ?>" data-sort-by="sort"><?php esc_html_e( 'Popular', 'jetpack' ); ?></button>
								</div>
								<p><?php esc_html_e( 'Show:', 'jetpack' ); ?></p>
								<?php $list_table->views(); ?>
							</form>
						</div>
					</div>
					<div class="manage-left">
						<form class="jetpack-modules-list-table-form" onsubmit="return false;">
						<table class="<?php echo implode( ' ', $list_table->get_table_classes() ); ?>">
							<tbody id="the-list">
								<?php $list_table->display_rows_or_placeholder(); ?>
							</tbody>
						</table>
						</form>
					</div>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
		</div><!-- /.content -->
		<?php
		$this->admin_page_bottom();
	}

	function main_page_js_templates() {
		$modules = 	array('Appearance', 'Developers', 'Mobile', 'Other', 'Photos and Videos', 'Social', 'WordPress.com Stats', 'Writing' );
		?>
<script id="category" type="text/html">
	<?php foreach( $modules as $module ){ 
		$translated_module = Jetpack::translate_module_tag( $module );
		$module_slug = strtolower ( str_replace( array( ' ', '.' ) , array( '-', '' ) , $translated_module ) ); ?> 
		<div class="cat category-<?php echo esc_attr( $module_slug  ); ?> "><h3><?php echo esc_html( $translated_module ); ?></h3><div class="clear"></div></div>
	<?php } ?>
</script>
<script id="modalLoading" type="text/html">
	<div class="loading"><span><?php esc_html_e( 'loading&hellip;', 'jetpack' ); ?></span></div>
</script>
<script id="modalTemplate" type="text/html">
	<header>
		<a href="#" class="close">&times;</a>
		<ul>
			<li><a href="#" class="active"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a></li>
		</ul>
	</header>
	<div class="content-container"><div class="content"></div></div>
</script>
<script id="mod" type="text/html">
	<div href="{{ url }}" data-index="{{ index }}" data-name="{{ name }}" class="module{{#new}} new{{/new}}">
		<h3 class="icon {{ module }}">{{ name }}{{^free}}<span class="paid"><?php esc_html_e( 'Paid', 'jetpack' ); ?></span>{{/free}}</h3>
		<p>{{{ short_description }}}</p>
	</div>
</script>
<script id="modconfig" type="text/html">
	<tr class="configs {{#active}}active{{/active}}">
		<td class="sm"><input type="checkbox"></td>
		<td><a href="{{ url }}" data-name="{{ name }}">{{ name }}</a></td>
		<td class="med"><a href="{{ url }}" data-name="{{ name }}"><span class="genericon genericon-help" title="<?php esc_attr_e( 'Learn more', 'jetpack' ); ?>"></span></a>{{#hasConfig}}<a href="{{ url }}" data-name="{{ name }}"><span class="genericon genericon-cog" title="<?php esc_attr_e( 'Configure', 'jetpack' ); ?>"></span></a>{{/hasConfig}}</td>
	</tr>
</script>
		<?php
	}

}
Jetpack_Admin::init();
