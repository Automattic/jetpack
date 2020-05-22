<?php
/**
 * This is Calypso skin of the wp-admin interface that is conditionally triggered via the ?calypsoify=1 param.
 * Ported from an internal Automattic plugin.
 */

use Automattic\Jetpack\Redirect;

class Jetpack_Calypsoify {

	/**
	 * Singleton instance of `Jetpack_Calypsoify`.
	 *
	 * @var object
	 */
	public static $instance = false;

	/**
	 * Is Calypsoify enabled, based on any value of `calypsoify` user meta.
	 *
	 * @var bool
	 */
	public $is_calypsoify_enabled = false;

	private function __construct() {
		add_action( 'wp_loaded', array( $this, 'setup' ) );
	}

	public static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function setup() {
		$this->is_calypsoify_enabled = 1 == (int) get_user_meta( get_current_user_id(), 'calypsoify', true );
		add_action( 'admin_init', array( $this, 'check_param' ), 4 );

		if ( $this->is_calypsoify_enabled ) {
			add_action( 'admin_init', array( $this, 'setup_admin' ), 6 );
			add_action( 'admin_menu', array( $this, 'remove_core_menus' ), 100 );
			add_action( 'admin_menu', array( $this, 'add_custom_menus' ), 101 );
		}

		// Make this always available -- in case calypsoify gets toggled off.
		add_action( 'wp_ajax_jetpack_toggle_autoupdate', array( $this, 'jetpack_toggle_autoupdate' ) );
		add_filter( 'handle_bulk_actions-plugins', array( $this, 'handle_bulk_actions_plugins' ), 10, 3 );
	}

	public function setup_admin() {
		// Masterbar is currently required for this to work properly. Mock the instance of it
		if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
			$this->mock_masterbar_activation();
		}

		if ( $this->is_page_gutenberg() ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_for_gutenberg' ), 100 );
			return;
		}

		add_action( 'admin_init', array( $this, 'check_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ), 100 );
		add_action( 'in_admin_header', array( $this, 'insert_sidebar_html' ) );
		add_action( 'wp_before_admin_bar_render', array( $this, 'modify_masterbar' ), 100000 );

		add_filter( 'get_user_option_admin_color', array( $this, 'admin_color_override' ) );

		add_action( 'manage_plugins_columns', array( $this, 'manage_plugins_columns_header' ) );
		add_action( 'manage_plugins_custom_column', array( $this, 'manage_plugins_custom_column' ), 10, 2 );
		add_filter( 'bulk_actions-plugins', array( $this, 'bulk_actions_plugins' ) );

		add_action( 'current_screen', array( $this, 'attach_views_filter' ) );

		if ( 'plugins.php' === basename( $_SERVER['PHP_SELF'] ) ) {
			add_action( 'admin_notices', array( $this, 'plugins_admin_notices' ) );
		}
	}

	public function manage_plugins_columns_header( $columns ) {
		if ( current_user_can( 'jetpack_manage_autoupdates' ) ) {
			$columns['autoupdate'] = __( 'Automatic Update', 'jetpack' );
		}
		return $columns;
	}

	public function manage_plugins_custom_column( $column_name, $slug ) {
		static $repo_plugins = array();

		if ( ! current_user_can( 'jetpack_manage_autoupdates' ) ) {
			return;
		}

		if ( empty( $repo_plugins ) ) {
			$repo_plugins = self::get_dotorg_repo_plugins();
		}

		$autoupdating_plugins = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
		// $autoupdating_plugins_translations = Jetpack_Options::get_option( 'autoupdate_plugins_translations', array() );
		if ( 'autoupdate' === $column_name ) {
			if ( ! in_array( $slug, $repo_plugins ) ) {
				return;
			}
			// Shamelessly swiped from https://github.com/Automattic/wp-calypso/blob/59bdfeeb97eda4266ad39410cb0a074d2c88dbc8/client/components/forms/form-toggle
			?>

			<span class="form-toggle__wrapper">
				<input
					id="autoupdate_plugin-toggle-<?php echo esc_attr( $slug ) ?>"
					name="autoupdate_plugins[<?php echo esc_attr( $slug ) ?>]"
					value="autoupdate"
					class="form-toggle autoupdate-toggle"
					type="checkbox"
					<?php checked( in_array( $slug, $autoupdating_plugins ) ); ?>
					readonly
					data-slug="<?php echo esc_attr( $slug ); ?>"
				/>
				<label class="form-toggle__label" for="autoupdate_plugin-toggle-<?php echo esc_attr( $slug ) ?>">
					<span class="form-toggle__switch" role="checkbox"></span>
					<span class="form-toggle__label-content"><?php /*  */ ?></span>
				</label>
			</span>

			<?php
		}
	}

	public static function get_dotorg_repo_plugins() {
		$plugins = get_site_transient( 'update_plugins' );
		return array_merge( array_keys( $plugins->response ), array_keys( $plugins->no_update ) );
	}

	public function bulk_actions_plugins( $bulk_actions ) {
		$bulk_actions['jetpack_enable_plugin_autoupdates'] = __( 'Enable Automatic Updates', 'jetpack' );
		$bulk_actions['jetpack_disable_plugin_autoupdates'] = __( 'Disable Automatic Updates', 'jetpack' );
		return $bulk_actions;
	}

	public function handle_bulk_actions_plugins( $redirect_to, $action, $slugs ) {
		$redirect_to = remove_query_arg( array( 'jetpack_enable_plugin_autoupdates', 'jetpack_disable_plugin_autoupdates' ), $redirect_to );
		if ( in_array( $action, array( 'jetpack_enable_plugin_autoupdates', 'jetpack_disable_plugin_autoupdates' ) ) ) {
			$list = Jetpack_Options::get_option( 'autoupdate_plugins', array() );
			$initial_qty = sizeof( $list );

			if ( 'jetpack_enable_plugin_autoupdates' === $action ) {
				$list = array_unique( array_merge( $list, $slugs ) );
			} elseif ( 'jetpack_disable_plugin_autoupdates' === $action ) {
				$list = array_diff( $list, $slugs );
			}

			Jetpack_Options::update_option( 'autoupdate_plugins', $list );
			$redirect_to = add_query_arg( $action, absint( sizeof( $list ) - $initial_qty ), $redirect_to );
		}
		return $redirect_to;
	}

	public function plugins_admin_notices() {
		if ( ! empty( $_GET['jetpack_enable_plugin_autoupdates'] ) ) {
			$qty = (int) $_GET['jetpack_enable_plugin_autoupdates'];
			printf( '<div id="message" class="updated fade"><p>' . _n( 'Enabled automatic updates on %d plugin.', 'Enabled automatic updates on %d plugins.', $qty, 'jetpack' ) . '</p></div>', $qty );
		} elseif ( ! empty( $_GET['jetpack_disable_plugin_autoupdates'] ) ) {
			$qty = (int) $_GET['jetpack_disable_plugin_autoupdates'];
			printf( '<div id="message" class="updated fade"><p>' . _n( 'Disabled automatic updates on %d plugin.', 'Disabled automatic updates on %d plugins.', $qty, 'jetpack' ) . '</p></div>', $qty );
		}
	}

	public function jetpack_toggle_autoupdate() {
		if ( ! current_user_can( 'jetpack_manage_autoupdates' ) ) {
			wp_send_json_error();
			return;
		}

		$type   = $_POST['type'];
		$slug   = $_POST['slug'];
		$active = 'false' !== $_POST['active'];

		check_ajax_referer( "jetpack_toggle_autoupdate-{$type}" );

		if ( ! in_array( $type, array( 'plugins', 'plugins_translations' ) ) ) {
			wp_send_json_error();
			return;
		}

		$jetpack_option_name = "autoupdate_{$type}";

		$list = Jetpack_Options::get_option( $jetpack_option_name, array() );

		if ( $active ) {
			$list = array_unique( array_merge( $list, (array) $slug ) );
		} else {
			$list = array_diff( $list, (array) $slug );
		}

		Jetpack_Options::update_option( $jetpack_option_name, $list );

		wp_send_json_success( $list );
	}

	public function admin_color_override( $color ) {
		return 'fresh';
	}

	public function mock_masterbar_activation() {
		include_once JETPACK__PLUGIN_DIR . 'modules/masterbar/masterbar.php';
		new A8C_WPCOM_Masterbar;
	}

	public function remove_core_menus() {
		remove_menu_page( 'edit.php?post_type=feedback' );
		remove_menu_page( 'index.php' );
		remove_menu_page( 'jetpack' );
		remove_menu_page( 'edit.php' );
		remove_menu_page( 'upload.php' );
		remove_menu_page( 'edit.php?post_type=page' );
		remove_menu_page( 'edit-comments.php' );
		remove_menu_page( 'themes.php' );
		remove_menu_page( 'plugins.php' );
		remove_menu_page( 'users.php' );
		remove_menu_page( 'tools.php' );
		remove_menu_page( 'link-manager.php' );

		// Core settings pages
		remove_submenu_page( 'options-general.php', 'options-general.php' );
		remove_submenu_page( 'options-general.php', 'options-writing.php' );
		remove_submenu_page( 'options-general.php', 'options-reading.php' );
		remove_submenu_page( 'options-general.php', 'options-discussion.php' );
		remove_submenu_page( 'options-general.php', 'options-media.php' );
		remove_submenu_page( 'options-general.php', 'options-permalink.php' );
		remove_submenu_page( 'options-general.php', 'privacy.php' );
		remove_submenu_page( 'options-general.php', 'sharing' );
	}

	public function add_custom_menus() {
		global $menu, $submenu;

		if ( isset( $_GET['post_type'] ) && 'feedback' === $_GET['post_type'] ) {
			// there is currently no gridicon for feedback, so using dashicon.
			add_menu_page( __( 'Feedback', 'jetpack' ), __( 'Feedback', 'jetpack' ), 'edit_pages', 'edit.php?post_type=feedback', '', 'dashicons-feedback', 1 );
			remove_menu_page( 'options-general.php' );
			remove_submenu_page( 'edit.php?post_type=feedback', 'feedback-export' );
		} else {
			add_menu_page( __( 'Manage Plugins', 'jetpack' ), __( 'Manage Plugins', 'jetpack' ), 'activate_plugins', 'plugins.php', '', $this->installed_plugins_icon(), 1 );
			// Count the settings page submenus, if it's zero then don't show this.
			if ( empty( $submenu['options-general.php'] ) ) {
				remove_menu_page( 'options-general.php' );
			} else {
				// Rename and make sure the plugin settings menu is always last.
				// Sneaky plugins seem to override this otherwise.
				// Settings is always key 80.
				$menu[80][0]                            = __( 'Plugin Settings', 'jetpack' );
				$menu[ max( array_keys( $menu ) ) + 1 ] = $menu[80];
				unset( $menu[80] );
			}
		}
	}

	public function enqueue() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'style.min.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );
        wp_style_add_data( 'calypsoify_wpadminmods_css', 'suffix', '.min' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'mods.js', false, JETPACK__VERSION );
		wp_localize_script( 'calypsoify_wpadminmods_js', 'CalypsoifyOpts', array(
			'nonces' => array(
				'autoupdate_plugins' => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins' ),
				'autoupdate_plugins_translations' => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins_translations' ),
			)
		) );
	}

	public function enqueue_for_gutenberg() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'style-gutenberg.min.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );
        wp_style_add_data( 'calypsoify_wpadminmods_css', 'suffix', '.min' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'mods-gutenberg.js', false, JETPACK__VERSION );
		wp_localize_script(
			'calypsoify_wpadminmods_js',
			'calypsoifyGutenberg',
			array(
				'closeUrl'   => $this->get_close_gutenberg_url(),
				'manageReusableBlocksUrl' => $this->get_calypso_origin() . '/types/wp_block' . $this->get_site_suffix(),
			)
		);
	}

	/**
	 * Inserts Sidebar HTML
	 *
	 * @return void
	 */
	public function insert_sidebar_html() {
		$heading       = ( isset( $_GET['post_type'] ) && 'feedback' === $_GET['post_type'] ) ? __( 'Feedback', 'jetpack' ) : __( 'Plugins', 'jetpack' );
		$stats_day_url = Redirect::get_url( 'calypso-stats-day' );
		?>
		<a href="<?php echo esc_url( $stats_day_url ); ?>" id="calypso-sidebar-header">
			<svg class="gridicon gridicons-chevron-left" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M14 20l-8-8 8-8 1.414 1.414L8.828 12l6.586 6.586"></path></g></svg>

			<ul>
				<li id="calypso-sitename"><?php bloginfo( 'name' ); ?></li>
				<li id="calypso-plugins"><?php echo esc_html( $heading ); ?></li>
			</ul>
		</a>
		<?php
	}

	public function modify_masterbar() {
		global $wp_admin_bar;

		// Add proper links to masterbar top sections.
		$my_sites_node       = (object) $wp_admin_bar->get_node( 'blog' );
		$my_sites_node->href = Redirect::get_url( 'calypso-stats-day' );
		$wp_admin_bar->add_node( $my_sites_node );

		$reader_node       = (object) $wp_admin_bar->get_node( 'newdash' );
		$reader_node->href = Redirect::get_url( 'calypso-read' );
		$wp_admin_bar->add_node( $reader_node );

		$me_node       = (object) $wp_admin_bar->get_node( 'my-account' );
		$me_node->href = Redirect::get_url( 'calypso-me' );
		$wp_admin_bar->add_node( $me_node );
	}

	private function installed_plugins_icon() {
		$svg = '<svg class="gridicon gridicons-plugins" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24"><g><path d="M16 8V3c0-.552-.448-1-1-1s-1 .448-1 1v5h-4V3c0-.552-.448-1-1-1s-1 .448-1 1v5H5v4c0 2.79 1.637 5.193 4 6.317V22h6v-3.683c2.363-1.124 4-3.527 4-6.317V8h-3z" fill="black"></path></g></svg>';

		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	/**
	 * Returns the Calypso domain that originated the current request.
	 *
	 * @return string
	 */
	private function get_calypso_origin() {
		$origin    = ! empty( $_GET['origin'] ) ? $_GET['origin'] : 'https://wordpress.com';
		$whitelist = array(
			'http://calypso.localhost:3000',
			'http://127.0.0.1:41050', // Desktop App
			'https://wpcalypso.wordpress.com',
			'https://horizon.wordpress.com',
			'https://wordpress.com',
		);
		return in_array( $origin, $whitelist ) ? $origin : 'https://wordpress.com';

		function get_site_suffix() {
			if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'build_raw_urls' ) ) {
				$site_suffix = Jetpack::build_raw_urls( home_url() );
			} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
				$site_suffix = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
			}

			if ( $site_suffix ) {
				return "/${site_suffix}";
			}
			return '';
		}
	}

	/**
	 * Returns the site slug suffix to be used as part of the Calypso URLs. It already
	 * includes the slash separator at the beginning.
	 *
	 * @example "https://wordpress.com/block-editor" . $this->get_site_suffix()
	 *
	 * @return string
	 */
	private function get_site_suffix() {
		if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'build_raw_urls' ) ) {
			$site_suffix = Jetpack::build_raw_urls( home_url() );
		} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
			$site_suffix = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
		}

		if ( $site_suffix ) {
			return "/${site_suffix}";
		}
		return '';
	}

	/**
	 * Returns the Calypso URL that displays either the current post type list (if no args
	 * are supplied) or the classic editor for the current post (if a post ID is supplied).
	 *
	 * @param int|null $post_id
	 * @return string
	 */
	public function get_calypso_url( $post_id = null ) {
		$screen = get_current_screen();
		$post_type = $screen->post_type;
		if ( is_null( $post_id ) ) {
			// E.g. `posts`, `pages`, or `types/some_custom_post_type`
			$post_type_suffix = ( 'post' === $post_type || 'page' === $post_type )
				? "/${post_type}s"
				: "/types/${post_type}";
			$post_suffix = '';
		} else {
			$post_type_suffix = ( 'post' === $post_type || 'page' === $post_type )
				? "/${post_type}"
				: "/edit/${post_type}";
			$post_suffix = "/${post_id}";
		}

		return $this->get_calypso_origin() . $post_type_suffix . $this->get_site_suffix() . $post_suffix;
	}

	/**
	 * Returns the URL to be used on the block editor close button for going back to the
	 * Calypso post list.
	 *
	 * @return string
	 */
	public function get_close_gutenberg_url() {
		return $this->get_calypso_url();
	}

	/**
	 * Returns the URL for switching the user's editor to the Classic editor.
	 *
	 * @return string
	 */
	public function get_switch_to_classic_editor_url() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_GET['editor/after-deprecation'] ) ) {
			$post_id    = get_the_ID();
			$post_type  = get_current_screen()->post_type;
			$path       = is_null( $post_id ) ? 'post-new.php' : 'post.php';
			$query_args = array(
				'post'       => $post_id,
				'action'     => ( $post_id ) ? 'edit' : null,
				'post_type'  => ( 'post' !== $post_type ) ? $post_type : null,
				'set-editor' => 'classic',
			);

			return add_query_arg( $query_args, admin_url( $path ) );
		}

		return add_query_arg(
			'set-editor',
			'classic',
			$this->is_calypsoify_enabled ? $this->get_calypso_url( get_the_ID() ) : false
		);
	}

	public function check_param() {
		if ( isset( $_GET['calypsoify'] ) ) {
			if ( 1 == (int) $_GET['calypsoify'] ) {
				update_user_meta( get_current_user_id(), 'calypsoify', 1 );
			} else {
				update_user_meta( get_current_user_id(), 'calypsoify', 0 );
			}

			$page = remove_query_arg( 'calypsoify', wp_basename( $_SERVER['REQUEST_URI'] ) );

			wp_safe_redirect( admin_url( $page ) );
		}
	}

	public function check_page() {
		// If the user hits plain /wp-admin/ then disable Calypso styles.
		$page = wp_basename( esc_url( $_SERVER['REQUEST_URI'] ) );

		if ( false !== strpos( 'index.php', $page ) || false !== strpos( 'wp-admin', $page ) ) {
			update_user_meta( get_current_user_id(), 'calypsoify', 0 );
			wp_safe_redirect( admin_url() );
			die;
		}
	}

	/**
	 * Return whether a post type should display the Gutenberg/block editor.
	 *
	 * @since 6.7.0
	 */
	public function is_post_type_gutenberg( $post_type ) {
		return use_block_editor_for_post_type( $post_type );
	}

	public function is_page_gutenberg() {
		$page = wp_basename( esc_url( $_SERVER['REQUEST_URI'] ) );

		if ( false !== strpos( $page, 'post-new.php' ) && empty ( $_GET['post_type'] ) ) {
			return true;
		}

		if ( false !== strpos( $page, 'post-new.php' ) && isset( $_GET['post_type'] ) && $this->is_post_type_gutenberg( $_GET['post_type'] ) ) {
			return true;
		}

		if ( false !== strpos( $page, 'post.php' ) ) {
			$post = get_post( $_GET['post'] );
			if ( isset( $post ) && isset( $post->post_type ) && $this->is_post_type_gutenberg( $post->post_type ) ) {
				return true;
			}
		}

		if ( false !== strpos( $page, 'revision.php' ) ) {
			$post   = get_post( $_GET['revision'] );
			$parent = get_post( $post->post_parent );
			if ( isset( $parent ) && isset( $parent->post_type ) && $this->is_post_type_gutenberg( $parent->post_type ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Attach a WP_List_Table views filter to all screens.
	 */
	public function attach_views_filter( $current_screen ) {
		add_filter( "views_{$current_screen->id}", array( $this, 'filter_views' ) );
	}

	/**
	 * Remove the parentheses from list table view counts when Calypsofied.
	 *
	 * @param array $views Array of views. See: WP_List_Table::get_views().
	 * @return array Filtered views.
	 */
	public function filter_views( $views ) {
		foreach ( $views as $id => $view ) {
			$views[ $id ] = preg_replace( '/<span class="count">\((\d+)\)<\/span>/', '<span class="count">$1</span>', $view );
		}

		return $views;
	}
}

$Jetpack_Calypsoify = Jetpack_Calypsoify::getInstance();
