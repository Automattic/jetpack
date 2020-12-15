<?php
/**
 * This is Calypso skin of the wp-admin interface that is conditionally triggered via the ?calypsoify=1 param.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Masterbar;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

/**
 * Class Jetpack_Calypsoify
 */
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

	/**
	 * Jetpack_Calypsoify constructor.
	 */
	private function __construct() {
		add_action( 'wp_loaded', array( $this, 'setup' ) );
	}

	/**
	 * Original singleton.
	 *
	 * @todo We need to leave this in place until wpcomsh is updated. wpcomsh can be updated once 9.3.0 is stable.
	 *
	 * Deprecated 9.3.0
	 *
	 * @return Jetpack_Calypsoify
	 */
	public static function getInstance() { //phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		_deprecated_function( __METHOD__, 'Jetpack 9.3.0', 'Jetpack_Calypsoify::get_instance' );
		return self::get_instance();
	}

	/**
	 * Singleton.
	 *
	 * @return Jetpack_Calypsoify
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Setup function that is loaded on the `wp_loaded` hook via the constructor.
	 */
	public function setup() {
		$this->is_calypsoify_enabled = 1 === (int) get_user_meta( get_current_user_id(), 'calypsoify', true );
		if ( isset( $_GET['calypsoify'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$this->is_calypsoify_enabled = 1 === (int) $_GET['calypsoify']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		add_action( 'admin_init', array( $this, 'check_param' ), 4 );

		if ( $this->is_calypsoify_enabled ) {
			add_action( 'admin_init', array( $this, 'setup_admin' ), 6 );
			add_action( 'admin_menu', array( $this, 'remove_core_menus' ), 100 );
			add_action( 'admin_menu', array( $this, 'add_custom_menus' ), 101 );
		}
	}

	/**
	 * Setup functionality within wp-admin via the `admin_init` hook.
	 */
	public function setup_admin() {
		// Masterbar is currently required for this to work properly. Mock the instance of it.
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

		add_action( 'current_screen', array( $this, 'attach_views_filter' ) );
	}

	/**
	 * Set admin color.
	 *
	 * Used via the get_user_option_admin_color filter.
	 *
	 * @return string 'fresh'
	 */
	public function admin_color_override() {
		return 'fresh';
	}

	/**
	 * Mocks the Masterbar module.
	 *
	 * Calypsoify uses the Masterbar, so for sites without the Masterbar module active, this will use it for the sake of a Calyposify request.
	 *
	 * @return Masterbar
	 */
	public function mock_masterbar_activation() {
		include_once JETPACK__PLUGIN_DIR . 'modules/masterbar/masterbar/class-masterbar.php';
		return new Masterbar();
	}

	/**
	 * Removes Core's menu pages that we don't display.
	 */
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

		// Core settings pages.
		remove_submenu_page( 'options-general.php', 'options-general.php' );
		remove_submenu_page( 'options-general.php', 'options-writing.php' );
		remove_submenu_page( 'options-general.php', 'options-reading.php' );
		remove_submenu_page( 'options-general.php', 'options-discussion.php' );
		remove_submenu_page( 'options-general.php', 'options-media.php' );
		remove_submenu_page( 'options-general.php', 'options-permalink.php' );
		remove_submenu_page( 'options-general.php', 'privacy.php' );
		remove_submenu_page( 'options-general.php', 'sharing' );
	}

	/**
	 * Adds the custom menus.
	 */
	public function add_custom_menus() {
		global $menu, $submenu;

		if ( isset( $_GET['post_type'] ) && 'feedback' === $_GET['post_type'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
				$menu[80][0]                            = __( 'Plugin Settings', 'jetpack' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$menu[ max( array_keys( $menu ) ) + 1 ] = $menu[80]; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				unset( $menu[80] );
			}
		}
	}

	/**
	 * Enqueues scripts, data, and styles.
	 */
	public function enqueue() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'style.min.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'suffix', '.min' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'mods.js', false, JETPACK__VERSION, false );
		wp_localize_script(
			'calypsoify_wpadminmods_js',
			'CalypsoifyOpts',
			array(
				'nonces' => array(
					'autoupdate_plugins'              => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins' ),
					'autoupdate_plugins_translations' => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins_translations' ),
				),
			)
		);
	}

	/**
	 * Enqueues scripts, data, and styles for Gutenberg.
	 */
	public function enqueue_for_gutenberg() {
		wp_enqueue_style( 'calypsoify_wpadminmods_css', plugin_dir_url( __FILE__ ) . 'style-gutenberg.min.css', false, JETPACK__VERSION );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'rtl', 'replace' );
		wp_style_add_data( 'calypsoify_wpadminmods_css', 'suffix', '.min' );

		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'mods-gutenberg.js', false, JETPACK__VERSION, false );
		wp_localize_script(
			'calypsoify_wpadminmods_js',
			'calypsoifyGutenberg',
			array(
				'closeUrl'                => $this->get_close_gutenberg_url(),
				'manageReusableBlocksUrl' => $this->get_calypso_origin() . '/types/wp_block/' . ( new Status() )->get_site_suffix(),
			)
		);
	}

	/**
	 * Inserts Sidebar HTML
	 *
	 * @return void
	 */
	public function insert_sidebar_html() {
		$heading  = ( isset( $_GET['post_type'] ) && 'feedback' === $_GET['post_type'] ) ? __( 'Feedback', 'jetpack' ) : __( 'Plugins', 'jetpack' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$home_url = Redirect::get_url( 'calypso-home' );
		?>
		<a href="<?php echo esc_url( $home_url ); ?>" id="calypso-sidebar-header">
			<svg class="gridicon gridicons-chevron-left" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M14 20l-8-8 8-8 1.414 1.414L8.828 12l6.586 6.586"></path></g></svg>

			<ul>
				<li id="calypso-sitename"><?php bloginfo( 'name' ); ?></li>
				<li id="calypso-plugins"><?php echo esc_html( $heading ); ?></li>
			</ul>
		</a>
		<?php
	}

	/**
	 * Modifies the masterbar.
	 */
	public function modify_masterbar() {
		global $wp_admin_bar;

		// Add proper links to masterbar top sections.
		$my_sites_node       = (object) $wp_admin_bar->get_node( 'blog' );
		$my_sites_node->href = Redirect::get_url( 'calypso-home' );
		$wp_admin_bar->add_node( $my_sites_node );

		$reader_node       = (object) $wp_admin_bar->get_node( 'newdash' );
		$reader_node->href = Redirect::get_url( 'calypso-read' );
		$wp_admin_bar->add_node( $reader_node );

		$me_node       = (object) $wp_admin_bar->get_node( 'my-account' );
		$me_node->href = Redirect::get_url( 'calypso-me' );
		$wp_admin_bar->add_node( $me_node );
	}

	/**
	 * Returns a SVG of the installed plugins icon.
	 *
	 * @return string SVG+XML of the installed plugins icon.
	 */
	private function installed_plugins_icon() {
		$svg = '<svg class="gridicon gridicons-plugins" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24"><g><path d="M16 8V3c0-.552-.448-1-1-1s-1 .448-1 1v5h-4V3c0-.552-.448-1-1-1s-1 .448-1 1v5H5v4c0 2.79 1.637 5.193 4 6.317V22h6v-3.683c2.363-1.124 4-3.527 4-6.317V8h-3z" fill="black"></path></g></svg>';

		return 'data:image/svg+xml;base64,' . base64_encode( $svg ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	/**
	 * Returns the Calypso domain that originated the current request.
	 *
	 * @return string
	 */
	private function get_calypso_origin() {
		$origin  = ! empty( $_GET['origin'] ) ? $_GET['origin'] : 'https://wordpress.com'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$allowed = array(
			'http://calypso.localhost:3000',
			'http://127.0.0.1:41050', // Desktop App.
			'https://wpcalypso.wordpress.com',
			'https://horizon.wordpress.com',
			'https://wordpress.com',
		);
		return in_array( $origin, $allowed, true ) ? $origin : 'https://wordpress.com';
	}

	/**
	 * Returns the Calypso URL that displays either the current post type list (if no args
	 * are supplied) or the classic editor for the current post (if a post ID is supplied).
	 *
	 * @param int|null $post_id Post ID.
	 *
	 * @return string
	 */
	public function get_calypso_url( $post_id = null ) {
		$screen      = get_current_screen();
		$post_type   = $screen->post_type;
		$site_suffix = ( new Status() )->get_site_suffix();

		if ( is_null( $post_id ) ) {
			// E.g. posts or pages have no special suffix. CPTs are in the `types/{cpt}` format.
			$post_type_suffix = ( 'post' === $post_type || 'page' === $post_type )
				? "/${post_type}s/"
				: "/types/${post_type}/";
			$post_suffix      = '';
		} else {
			$post_type_suffix = ( 'post' === $post_type || 'page' === $post_type )
				? "/${post_type}/"
				: "/edit/${post_type}/";
			$post_suffix      = "/${post_id}";
		}

		return $this->get_calypso_origin() . $post_type_suffix . $site_suffix . $post_suffix;
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
	 * Returns the URL for switching the user's editor to the Calypso (WordPress.com Classic) editor.
	 *
	 * @return string
	 */
	public function get_switch_to_classic_editor_url() {
		return add_query_arg(
			'set-editor',
			'classic',
			$this->is_calypsoify_enabled ? $this->get_calypso_url( get_the_ID() ) : false
		);
	}

	/**
	 * Checks for the URL parameter if this is a Calypsoify request.
	 */
	public function check_param() {
		if ( isset( $_GET['calypsoify'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( 1 === (int) $_GET['calypsoify'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				update_user_meta( get_current_user_id(), 'calypsoify', 1 );
			} else {
				update_user_meta( get_current_user_id(), 'calypsoify', 0 );
			}
		}
	}

	/**
	 * If the visitor is hitting wp-admin/ then disable this functionality.
	 */
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
	 *
	 * @param string $post_type Post type.
	 */
	public function is_post_type_gutenberg( $post_type ) {
		return use_block_editor_for_post_type( $post_type );
	}

	/**
	 * Determines if the page is an instance of the Gutenberg block editor.
	 *
	 * @return bool
	 */
	public function is_page_gutenberg() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		// Disabling WordPress.Security.NonceVerification.Recommended because this function fires within admin_init and this is only changing display.
		$page = wp_basename( esc_url( $_SERVER['REQUEST_URI'] ) );

		if ( false !== strpos( $page, 'post-new.php' ) && empty( $_GET['post_type'] ) ) {
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
		// phpcs:enable
	}

	/**
	 * Attach a WP_List_Table views filter to all screens.
	 *
	 * @param WP_Screen $current_screen Current WP_Screen instance.
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

Jetpack_Calypsoify::get_instance();
