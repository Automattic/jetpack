<?php
/**
 * This is Calypso skin of the wp-admin interface that is conditionally triggered via the ?calypsoify=1 param.
 * Ported from an internal Automattic plugin.
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
		}

		// Make this always available -- in case calypsoify gets toggled off.
		add_action( 'wp_ajax_jetpack_toggle_autoupdate', array( $this, 'jetpack_toggle_autoupdate' ) );
		add_filter( 'handle_bulk_actions-plugins', array( $this, 'handle_bulk_actions_plugins' ), 10, 3 );
	}

	public function setup_admin() {
		if ( $this->is_page_gutenberg() ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_for_gutenberg' ), 100 );
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ), 100 );

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

	public function enqueue() {
		wp_enqueue_script( 'calypsoify_wpadminmods_js', plugin_dir_url( __FILE__ ) . 'mods.js', false, JETPACK__VERSION );
		wp_localize_script( 'calypsoify_wpadminmods_js', 'CalypsoifyOpts', array(
			'nonces' => array(
				'autoupdate_plugins' => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins' ),
				'autoupdate_plugins_translations' => wp_create_nonce( 'jetpack_toggle_autoupdate-plugins_translations' ),
			)
		) );
	}

	public function enqueue_for_gutenberg() {
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
