<?php

class Jetpack_Admin {

	var $jetpack;

	function __construct() {
		$this->jetpack = Jetpack::init();
		add_action( 'admin_menu',                    array( $this, 'admin_menu' ), 998 );
		add_action( 'jetpack_admin_menu',            array( $this, 'admin_menu_modules' ) );
		add_action( 'jetpack_admin_menu',            array( $this, 'admin_menu_debugger' ) );
		add_action( 'jetpack_pre_activate_module',   array( $this, 'fix_redirect' ) );
		add_action( 'jetpack_pre_deactivate_module', array( $this, 'fix_redirect' ) );
		add_action( 'jetpack_unrecognized_action',   array( $this, 'handle_unrecognized_action' ) );
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
				$module_array['available']         = self::is_module_available( $module_array );
				$module_array['short_description'] = apply_filters( 'jetpack_short_module_description', $module_array['description'], $module );
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

		if ( isset( $modules['vaultpress'] ) ) {
			unset( $modules['vaultpress'] );
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

	function handle_unrecognized_action( $action ) {
		switch( $action ) {
			case 'bulk-activate' :
				if ( ! current_user_can( 'manage_options' ) )
					break;

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
				if ( ! current_user_can( 'manage_options' ) )
					break;

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
		} else {
			$title          = _x( 'Jetpack', 'The menu item label', 'jetpack' );
		}

		$hook = add_menu_page( 'Jetpack', $title, 'read', 'jetpack', array( $this, 'admin_page' ), 'div' );

		add_action( "load-$hook",                array( $this, 'admin_page_load' ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'      ) );
		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );

		do_action( 'jetpack_admin_menu', $hook );

		add_filter( 'custom_menu_order',         array( $this, 'admin_menu_order'   ) );
		add_filter( 'menu_order',                array( $this, 'jetpack_menu_order' ) );
	}

	function admin_menu_modules() {
		$hook = add_submenu_page( 'jetpack', __( 'Jetpack Modules', 'jetpack' ), __( 'Modules', 'jetpack' ), 'manage_options', 'jetpack_modules', array( $this, 'admin_page_modules' ) );

		add_action( "load-$hook",                array( $this, 'admin_page_load' ) );
		add_action( "admin_head-$hook",          array( $this, 'admin_head'      ) );
		add_action( "admin_print_styles-$hook",  array( $this, 'admin_styles'    ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts'   ) );
	}

	function admin_menu_debugger() {
		$debugger_hook = add_submenu_page( null, __( 'Jetpack Debugging Center', 'jetpack' ), '', 'manage_options', 'jetpack-debugger', array( $this, 'debugger_page' ) );
		add_action( "admin_head-$debugger_hook", array( 'Jetpack_Debugger', 'jetpack_debug_admin_head' ) );
	}

	function debugger_page() {
		nocache_headers();
		if ( ! current_user_can( 'manage_options' ) ) {
			die( '-1' );
		}
		Jetpack_Debugger::jetpack_debug_display_handler();
		exit;
	}

	function admin_page_load() {
		// This is big.  For the moment, just call the existing one.
		return call_user_func_array( array( $this->jetpack, __FUNCTION__ ), func_get_args() );
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
		wp_enqueue_style( 'jetpack-google-fonts', 'http://fonts.googleapis.com/css?family=Open+Sans:400italic,400,700,600,800' );
		wp_enqueue_style( 'jetpack', plugins_url( '_inc/jetpack.css', __FILE__ ), false, JETPACK__VERSION . '-20121016' );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-icanhaz', plugins_url( '_inc/icanhaz.js', __FILE__ ), array( ), JETPACK__VERSION . '-20121111' );
		wp_enqueue_script( 'jetpack-js', plugins_url( '_inc/jp.js', __FILE__ ), array( 'jquery' ), JETPACK__VERSION . '-20121111' );
		wp_localize_script(
			'jetpack-js',
			'jetpackL10n',
			array(
				'ays_disconnect' => "This will deactivate all Jetpack modules.\nAre you sure you want to disconnect?",
				'ays_unlink'     => "This will prevent user-specific modules such as Publicize, Notifications and Post By Email from working.\nAre you sure you want to unlink?",
				'ays_dismiss'    => "This will deactivate Jetpack.\nAre you sure you want to deactivate Jetpack?",
			)
		);
		add_action( 'admin_footer', array( $this->jetpack, 'do_stats' ) );
	}

	function admin_page() {
		return call_user_func_array( array( $this->jetpack, __FUNCTION__ ), func_get_args() );
	}

	function admin_page_modules() { 
		global $current_user;

		$is_connected      = Jetpack::is_active();
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );
		$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
	?>
	<?php
	include_once( '_inc/header.php' );
	?>
	<div class="clouds-sm"></div>
	<div class="page-content configure">
		<div class="frame top">
			<div class="wrap">
				<div class="manage-left">
					<table class="table table-bordered">
						<thead>
							<tr>
								<th class="sm"><input type="checkbox" class="checkall"></th>
								<th colspan="2">
									<span class="filter-search">
										<button type="button" class="btn btn-default">Search/Filter</button>
									</span>
									<select>
										<option>Actions</option>
										<option>Activate</option>
										<option>Deactivate</option>
									</select>
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
							<div class="input-group search-bar">
								<input type="text" class="form-control" placeholder="Search" name="srch-term" id="srch-term">
							</div>
							<p>View:</p>
							<div class="button-group">
								<button type="button" class="button active">All</button>
								<button type="button" class="button">Active</button>
								<button type="button" class="button">Inactive</button>
							</div>
							<p>Sort by:</p>
							<div class="button-group">
								<button type="button" class="button active">Alphabetical</button>
								<button type="button" class="button">Newest</button>
								<button type="button" class="button">Popular</button>
							</div>
							<p>Show:</p>
								<div class="showFilter">
									<a href="#" data-show="all" class="active">All</a>
									<a href="#" data-show="appearance">Appearance</a>
									<a href="#" data-show="mobile">Mobile</a>
									<a href="#" data-show="photos">Photos and Videos</a>
									<a href="#" data-show="social">Social</a>
									<a href="#" data-show="stats">Stats</a>
									<a href="#" data-show="utilities">Utilities</a>
									<a href="#" data-show="writing">Writing</a>
								</div>
						</form>
					</div>
				</div>
				<div class="manage-left">
					<table class="table table-bordered">
						<tbody></tbody>
					</table>
				</div>
			</div><!-- /.wrap -->
		</div><!-- /.frame -->
	</div><!-- /.content -->
	<?php include_once( '_inc/footer.php' ); ?>
		
		
		
		
		
		
		
		
		<?
		/*add_filter( 'jetpack_short_module_description', 'wpautop' );
		include_once( JETPACK__PLUGIN_DIR . 'modules/module-info.php' );
		include_once( 'class.jetpack-modules-list-table.php' );
		$list_table = new Jetpack_Modules_List_Table;
		$this->admin_page_top();
		?>

		<form method="get">

			<input type="hidden" name="page" value="jetpack_modules" />
			<?php if ( ! empty( $_GET['module_tag'] ) ) : ?>
				<input type="hidden" name="module_tag" value="<?php echo esc_attr( $_GET['module_tag'] ); ?>" />
			<?php endif; ?>

			<div class="module-filters">
				<?php $list_table->search_box( __( 'Search', 'jetpack' ), 'search_modules' ); ?>
				<?php $list_table->views(); ?>
			</div>

			<?php $list_table->display(); ?>

		</form>

		<?php
		$this->admin_page_bottom();*/
	}

}
new Jetpack_Admin;
