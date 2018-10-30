<?php
/*
 * This is Calypso skin of the wp-admin interface that is conditionally triggered via the ?calypsoify=1 param.
 * Portted from an internal Automattic plugin.
*/

class Jetpack_Calypsoify {
	static $instance = false;

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
		add_action( 'admin_init', array( $this, 'check_param' ) );
		if ( 1 == (int) get_user_meta( get_current_user_id(), 'calypsoify', true ) ) {

			// Masterbar is currently required for this to work properly. Mock the instance of it
			if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
				$this->mock_masterbar_activation();
			}

			if ( $this->is_page_gutenberg() ) {
				add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_for_gutenberg' ), 100 );
				return;
			}
			add_action( 'admin_init', array( $this, 'check_page' ) );
			add_action( 'admin_menu', array( $this, 'remove_core_menus' ), 100 );
			add_action( 'admin_menu', array( $this, 'add_plugin_menus' ), 101 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ), 100 );
			add_action( 'in_admin_header', array( $this, 'insert_sidebar_html' ) );
			add_action( 'wp_before_admin_bar_render', array( $this, 'modify_masterbar' ), 100000 );
		}
	}

	public function mock_masterbar_activation() {
		include dirname( __FILE__ ) . '/masterbar/masterbar.php';
		new A8C_WPCOM_Masterbar;
	}

	public function remove_core_menus() {
		remove_menu_page( 'index.php' );
		remove_menu_page( 'jetpack' );
		remove_menu_page( 'edit.php' );
		remove_menu_page( 'edit.php?post_type=feedback' );
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

	public function add_plugin_menus() {
		global $menu, $submenu;

		add_menu_page( __( 'Manage Plugins', 'jetpack' ), __( 'Manage Plugins', 'jetpack' ), 'activate_plugins', 'plugins.php', '', $this->installed_plugins_icon(), 1 );

		// // Count the settings page submenus, if it's zero then don't show this.
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

	public function enqueue() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'calypsoify/style.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'calypsoify/mods.js', false, JETPACK__VERSION );
	}

	public function enqueue_for_gutenberg() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'calypsoify/style-gutenberg.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'calypsoify/mods-gutenberg.js', false, JETPACK__VERSION );
		wp_localize_script(
			'calypsoify_wpadminmods_js',
			'calypsoifyGutenberg',
			array(
				'closeUrl'   => $this->get_close_gutenberg_url(),
			)
		);
	}

	public function insert_sidebar_html() { ?>
		<a href="<?php echo esc_url( 'https://wordpress.com/stats/day/' . Jetpack::build_raw_urls( home_url() ) ); ?>" id="calypso-sidebar-header">
			<svg class="gridicon gridicons-chevron-left" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M14 20l-8-8 8-8 1.414 1.414L8.828 12l6.586 6.586"></path></g></svg>

			<ul>
				<li id="calypso-sitename"><?php bloginfo( 'name' ); ?></li>
				<li id="calypso-plugins"><?php esc_html_e( 'Plugins' ); ?></li>
			</ul>
		</a>
		<?php
	}

	public function modify_masterbar() {
		global $wp_admin_bar;

		// Add proper links to masterbar top sections.
		$my_sites_node       = $wp_admin_bar->get_node( 'blog' );
		$my_sites_node->href = 'https://wordpress.com/stats/day/' . Jetpack::build_raw_urls( home_url() );
		$wp_admin_bar->add_node( $my_sites_node );

		$reader_node       = $wp_admin_bar->get_node( 'newdash' );
		$reader_node->href = 'https://wordpress.com';
		$wp_admin_bar->add_node( $reader_node );

		$me_node       = $wp_admin_bar->get_node( 'my-account' );
		$me_node->href = 'https://wordpress.com/me';
		$wp_admin_bar->add_node( $me_node );
	}

	private function installed_plugins_icon() {
		$svg = '<svg class="gridicon gridicons-plugins" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24"><g><path d="M16 8V3c0-.552-.448-1-1-1s-1 .448-1 1v5h-4V3c0-.552-.448-1-1-1s-1 .448-1 1v5H5v4c0 2.79 1.637 5.193 4 6.317V22h6v-3.683c2.363-1.124 4-3.527 4-6.317V8h-3z" fill="black"></path></g></svg>';

		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	public function get_close_gutenberg_url() {
		$screen = get_current_screen();

		// E.g. `posts`, `pages`, or `types/some_custom_post_type`
		$post_type = ( 'post' === $screen->post_type || 'page' === $screen->post_type )
			? $screen->post_type . 's'
			: 'types/' . $screen->post_type;

		return 'https://wordpress.com/' . $post_type . '/' . Jetpack::build_raw_urls( home_url() );
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
		// @TODO: Remove function check once 5.0 is the minimum supported WP version.
		if ( function_exists( 'use_block_editor_for_post_type' ) ) {
			return use_block_editor_for_post_type( $post_type );
		} else {
			// We use the filter introduced in WordPress 5.0 to be backwards compatible.
			/** This filter is already documented in core/wp-admin/includes/post.php */
			return apply_filters( 'use_block_editor_for_post_type', true, $post_type );
		}
	}

	public function is_page_gutenberg() {
		if ( ! Jetpack_Gutenberg::is_gutenberg_available() ) {
			return false;
		}

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
}

$Jetpack_Calypsoify = Jetpack_Calypsoify::getInstance();
