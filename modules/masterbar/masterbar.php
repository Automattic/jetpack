<?php

require_once dirname( __FILE__ ) . '/rtl-admin-bar.php';

class A8C_WPCOM_Masterbar {
	/**
	 * Use for testing changes made to remotely enqueued scripts and styles on your sandbox.
	 * If not set it will default to loading the ones from WordPress.com.
	 *
	 * @var string $sandbox_url
	 */
	private $sandbox_url = '';

	private $locale;

	private $user_id;
	private $user_data;
	private $user_login;
	private $user_email;
	private $display_name;
	private $primary_site_slug;
	private $user_text_direction;
	private $user_site_count;

	function __construct() {
		$this->locale  = $this->get_locale();
		$this->user_id = get_current_user_id();

		// Limit the masterbar to be shown only to connected Jetpack users.
		if ( ! Jetpack::is_user_connected( $this->user_id ) ) {
			return;
		}

		Jetpack::dns_prefetch( array(
			'//s0.wp.com',
			'//s1.wp.com',
			'//s2.wp.com',
			'//0.gravatar.com',
			'//1.gravatar.com',
			'//2.gravatar.com',
		) );

		// Atomic only - override user setting that hides masterbar from site's front.
		// https://github.com/Automattic/jetpack/issues/7667
		if ( jetpack_is_atomic_site() ) {
			add_filter( 'show_admin_bar', '__return_true' );
		}

		$this->user_data = Jetpack::get_connected_user_data( $this->user_id );
		$this->user_login = $this->user_data['login'];
		$this->user_email = $this->user_data['email'];
		$this->display_name = $this->user_data['display_name'];
		$this->user_site_count = $this->user_data['site_count'];

		// Used to build menu links that point directly to Calypso.
		$this->primary_site_slug = Jetpack::build_raw_urls( get_home_url() );

		// Used for display purposes and for building WP Admin links.
		$this->primary_site_url = str_replace( '::', '/', $this->primary_site_slug );

		// We need to use user's setting here, instead of relying on current blog's text direction
		$this->user_text_direction = $this->user_data['text_direction'];

		if ( $this->is_rtl() ) {
			// Extend core WP_Admin_Bar class in order to add rtl styles
			add_filter( 'wp_admin_bar_class', array( $this, 'get_rtl_admin_bar_class' ) );
		}
		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );

		add_action( 'wp_before_admin_bar_render', array( $this, 'replace_core_masterbar' ), 99999 );

		add_action( 'wp_enqueue_scripts', array( $this, 'add_styles_and_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_styles_and_scripts' ) );

		add_action( 'wp_enqueue_scripts', array( $this, 'remove_core_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'remove_core_styles' ) );

		if ( Jetpack::is_module_active( 'notes' ) && $this->is_rtl() ) {
			// Override Notification module to include RTL styles
			add_action( 'a8c_wpcom_masterbar_enqueue_rtl_notification_styles', '__return_true' );
		}

		add_action( 'wp_logout', array( $this, 'maybe_logout_user_from_wpcom' ) );
	}

	public function maybe_logout_user_from_wpcom() {
		if ( isset( $_GET['context'] ) && 'masterbar' === $_GET['context'] ) {
			do_action( 'wp_masterbar_logout' );
		}
	}

	public function get_rtl_admin_bar_class() {
		return 'RTL_Admin_Bar';
	}

	/**
	 * Adds CSS classes to admin body tag.
	 *
	 * @since 5.1
	 *
	 * @param string $admin_body_classes CSS classes that will be added.
	 *
	 * @return string
	 */
	public function admin_body_class( $admin_body_classes ) {
		return "$admin_body_classes jetpack-masterbar";
	}

	public function remove_core_styles() {
		wp_dequeue_style( 'admin-bar' );
	}

	public function is_rtl() {
		return $this->user_text_direction === 'rtl' ? true : false;
	}

	public function add_styles_and_scripts() {

		if ( $this->is_rtl() ) {
			wp_enqueue_style( 'a8c-wpcom-masterbar-rtl', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/rtl/wpcom-admin-bar-rtl.css' ), array(), JETPACK__VERSION );
			wp_enqueue_style( 'a8c-wpcom-masterbar-overrides-rtl', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/rtl/masterbar-rtl.css' ), array(), JETPACK__VERSION );
		} else {
			wp_enqueue_style( 'a8c-wpcom-masterbar', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/wpcom-admin-bar.css' ), array(), JETPACK__VERSION );
			wp_enqueue_style( 'a8c-wpcom-masterbar-overrides', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/masterbar.css' ), array(), JETPACK__VERSION );
		}

		// Local overrides
		wp_enqueue_style( 'a8c_wpcom_css_override', plugins_url( 'overrides.css', __FILE__ ), array(), JETPACK__VERSION );

		if ( ! Jetpack::is_module_active( 'notes ' ) ) {
			// Masterbar is relying on some icons from noticons.css
			wp_enqueue_style( 'noticons', $this->wpcom_static_url( '/i/noticons/noticons.css' ), array(), JETPACK__VERSION . '-' . gmdate( 'oW' ) );
		}

		wp_enqueue_script(
			'jetpack-accessible-focus',
			Jetpack::get_file_url_for_environment( '_inc/build/accessible-focus.min.js', '_inc/accessible-focus.js' ),
			array(),
			JETPACK__VERSION
		);
		wp_enqueue_script(
			'a8c_wpcom_masterbar_tracks_events',
			Jetpack::get_file_url_for_environment(
				'_inc/build/masterbar/tracks-events.min.js',
				plugins_url( 'tracks-events.js', __FILE__ )
			),
			array( 'jquery' ),
			JETPACK__VERSION
		);

		wp_enqueue_script( 'a8c_wpcom_masterbar_overrides', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/masterbar.js' ), array( 'jquery' ), JETPACK__VERSION );
	}

	function wpcom_static_url( $file ) {
		if ( ! empty( $this->sandbox_url ) ) {
			// For testing undeployed changes to remotely enqueued scripts and styles.
			return set_url_scheme( $this->sandbox_url . $file, 'https');
		}

		$i   = hexdec( substr( md5( $file ), - 1 ) ) % 2;
		$url = 'https://s' . $i . '.wp.com' . $file;

		return set_url_scheme( $url, 'https');
	}

	public function replace_core_masterbar() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return false;
		}

		$this->clear_core_masterbar( $wp_admin_bar );
		$this->build_wpcom_masterbar( $wp_admin_bar );
	}

	// Remove all existing toolbar entries from core Masterbar
	public function clear_core_masterbar( $wp_admin_bar ) {
		foreach ( $wp_admin_bar->get_nodes() as $node ) {
			$wp_admin_bar->remove_node( $node->id );
		}
	}

	// Add entries corresponding to WordPress.com Masterbar
	public function build_wpcom_masterbar( $wp_admin_bar ) {
		// Menu groups
		$this->wpcom_adminbar_add_secondary_groups( $wp_admin_bar );

		// Left part
		$this->add_my_sites_submenu( $wp_admin_bar );
		$this->add_reader_submenu( $wp_admin_bar );

		// Right part
		if ( Jetpack::is_module_active( 'notes' ) ) {
			$this->add_notifications( $wp_admin_bar );
		}

		$this->add_me_submenu( $wp_admin_bar );
		$this->add_write_button( $wp_admin_bar );
	}

	public function get_locale() {
		$wpcom_locale = get_locale();

		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$wpcom_locale_object = GP_Locales::by_field( 'wp_locale', get_locale() );
			if ( $wpcom_locale_object instanceof GP_Locale ) {
				$wpcom_locale = $wpcom_locale_object->slug;
			}
		}

		return $wpcom_locale;
	}

	public function add_notifications( $wp_admin_bar ) {
		$wp_admin_bar->add_node( array(
			'id'     => 'notes',
			'title'  => '<span id="wpnt-notes-unread-count" class="wpnt-loading wpn-read"></span>
						 <span class="screen-reader-text">' . esc_html__( 'Notifications', 'jetpack' ) . '</span>
						 <span class="noticon noticon-bell"></span>',
			'meta'   => array(
				'html'  => '<div id="wpnt-notes-panel2" style="display:none" lang="'. esc_attr( $this->locale ) . '" dir="' . ( $this->is_rtl() ? 'rtl' : 'ltr' ) . '">' .
				           '<div class="wpnt-notes-panel-header">' .
				           '<span class="wpnt-notes-header">' .
				           esc_html__( 'Notifications', 'jetpack' ) .
				           '</span>' .
				           '<span class="wpnt-notes-panel-link">' .
				           '</span>' .
				           '</div>' .
				           '</div>',
				'class' => 'menupop mb-trackable',
			),
			'parent' => 'top-secondary',
		) );
	}

	public function add_reader_submenu( $wp_admin_bar ) {
		$wp_admin_bar->add_menu( array(
			'parent' => 'root-default',
			'id'    => 'newdash',
			'title' => esc_html__( 'Reader', 'jetpack' ),
			'href'  => '#',
			'meta'  => array(
				'class' => 'mb-trackable',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'streams-header',
			'title'  => esc_html_x(
				'Streams',
				'Title for Reader sub-menu that contains followed sites, likes, and recommendations',
				'jetpack'
			),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			)
		) );

		$following_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/',
				'id'    => 'wp-admin-bar-followed-sites',
				'label' => esc_html__( 'Followed Sites', 'jetpack' ),
			),
			array(
				'url'   => 'https://wordpress.com/following/edit',
				'id'    => 'wp-admin-bar-reader-followed-sites-manage',
				'label' => esc_html__( 'Manage', 'jetpack' ),
			)
		);

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'following',
			'title'  => $following_title,
			'meta'	 => array( 'class' => 'inline-action' )
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'discover-discover',
			'title'  => esc_html__( 'Discover', 'jetpack' ),
			'href'   => 'https://wordpress.com/discover',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'discover-search',
			'title'  => esc_html__( 'Search', 'jetpack' ),
			'href'   => 'https://wordpress.com/read/search',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'discover-recommended-blogs',
			'title'  => esc_html__( 'Recommendations', 'jetpack' ),
			'href'   => 'https://wordpress.com/recommendations',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'my-activity-my-likes',
			'title'  => esc_html__( 'My Likes', 'jetpack' ),
			'href'   => 'https://wordpress.com/activities/likes',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

	}

	public function create_menu_item_pair( $primary, $secondary ) {
		$primary_class   = 'ab-item ab-primary mb-icon';
		$secondary_class = 'ab-secondary';

		$primary_anchor   = $this->create_menu_item_anchor( $primary_class, $primary['url'], $primary['label'], $primary['id'] );
		$secondary_anchor = $this->create_menu_item_anchor( $secondary_class, $secondary['url'], $secondary['label'], $secondary['id'] );

		return $primary_anchor . $secondary_anchor;
	}

	public function create_menu_item_anchor( $class, $url, $label, $id ) {
		return '<a href="' . $url . '" class="' . $class . '" id="' . $id . '">' . $label . '</a>';
	}

	public function wpcom_adminbar_add_secondary_groups( $wp_admin_bar ) {
		$wp_admin_bar->add_group( array(
			'id'     => 'root-default',
			'meta'   => array(
				'class' => 'ab-top-menu',
			),
		) );

		$wp_admin_bar->add_group( array(
			'parent' => 'blog',
			'id'     => 'blog-secondary',
			'meta'   => array(
				'class' => 'ab-sub-secondary',
			),
		) );

		$wp_admin_bar->add_group( array(
			'id'     => 'top-secondary',
			'meta'   => array(
				'class' => 'ab-top-secondary',
			),
		) );
	}

	public function add_me_submenu( $wp_admin_bar ) {
		$user_id = get_current_user_id();
		if ( empty( $user_id ) ) {
			return;
		}

		$avatar = get_avatar( $this->user_email, 32, 'mm', '', array( 'force_display' => true ) );
		$class  = empty( $avatar ) ? 'mb-trackable' : 'with-avatar mb-trackable';

		// Add the 'Me' menu
		$wp_admin_bar->add_menu( array(
			'id'     => 'my-account',
			'parent' => 'top-secondary',
			'title'  => $avatar . '<span class="ab-text">' . esc_html__( 'Me', 'jetpack' ) . '</span>',
			'href'   => '#',
			'meta'   => array(
				'class' => $class,
			),
		) );

		$id = 'user-actions';
		$wp_admin_bar->add_group( array(
			'parent' => 'my-account',
			'id'     => $id,
		) );

		$settings_url = 'https://wordpress.com/me/account';

		$logout_url = wp_logout_url();
		$logout_url = add_query_arg( 'context', 'masterbar', $logout_url );

		$user_info  = get_avatar( $this->user_email, 128, 'mm', '', array( 'force_display' => true ) );
		$user_info .= '<span class="display-name">' . $this->display_name . '</span>';
		$user_info .= '<a class="username" href="http://gravatar.com/' . $this->user_login . '">@' . $this->user_login . '</a>';

		$user_info .= sprintf(
			'<div><a href="%s" class="ab-sign-out">%s</a></div>',
			$logout_url,
			esc_html__( 'Sign Out', 'jetpack' )
		);

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'user-info',
			'title'  => $user_info,
			'meta'   => array(
				'class' => 'user-info user-info-item',
				'tabindex' => -1,
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'profile-header',
			'title'  => esc_html__( 'Profile', 'jetpack' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'my-profile',
			'title'  => esc_html__( 'My Profile', 'jetpack' ),
			'href'   => 'https://wordpress.com/me',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'account-settings',
			'title'  => esc_html__( 'Account Settings', 'jetpack' ),
			'href'   => $settings_url,
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'billing',
			'title'  => esc_html__( 'Manage Purchases', 'jetpack' ),
			'href'   => 'https://wordpress.com/me/purchases',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'security',
			'title'  => esc_html__( 'Security', 'jetpack' ),
			'href'   => 'https://wordpress.com/me/security',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'notifications',
			'title'  => esc_html__( 'Notifications', 'jetpack' ),
			'href'   => 'https://wordpress.com/me/notifications',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'special-header',
			'title'  => esc_html_x(
				'Special',
				'Title for Me sub-menu that contains Get Apps, Next Steps, and Help options',
				'jetpack'
			),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'get-apps',
			'title'  => esc_html__( 'Get Apps', 'jetpack' ),
			'href'   => 'https://wordpress.com/me/get-apps',
			'meta'   => array(
				'class' => 'mb-icon user-info-item',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'next-steps',
			'title'  => esc_html__( 'Next Steps', 'jetpack' ),
			'href'   => 'https://wordpress.com/me/next',
			'meta'   => array(
				'class' => 'mb-icon user-info-item',
			),
		) );

		$help_link = 'https://jetpack.com/support/';

		if ( jetpack_is_atomic_site() ) {
			$help_link = 'https://wordpress.com/help';
		}

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'help',
			'title'  => esc_html__( 'Help', 'jetpack' ),
			'href'   => $help_link,
			'meta'   => array(
				'class' => 'mb-icon user-info-item',
			),
		) );
	}

	public function add_write_button( $wp_admin_bar ) {
		$current_user = wp_get_current_user();

		$posting_blog_id = get_current_blog_id();
		if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			$posting_blog_id = $current_user->primary_blog;
		}

		$user_can_post = current_user_can_for_blog( $posting_blog_id, 'publish_posts' );

		if ( ! $posting_blog_id || ! $user_can_post ) {
			return;
		}

		$blog_post_page = 'https://wordpress.com/post/' . esc_attr( $this->primary_site_slug );

		$wp_admin_bar->add_menu( array(
			'parent'    => 'top-secondary',
			'id' => 'ab-new-post',
			'href' => $blog_post_page,
			'title' => '<span>' . esc_html__( 'Write', 'jetpack' ) . '</span>',
			'meta'  => array(
				'class' => 'mb-trackable',
			)
		) );
	}

	public function add_my_sites_submenu( $wp_admin_bar ) {
		$current_user = wp_get_current_user();

		$blog_name = get_bloginfo( 'name' );
		if ( empty( $blog_name ) ) {
			$blog_name = $this->primary_site_slug;
		}

		if ( mb_strlen( $blog_name ) > 20 ) {
			$blog_name = mb_substr( html_entity_decode( $blog_name, ENT_QUOTES ), 0, 20 ) . '&hellip;';
		}

		$wp_admin_bar->add_menu( array(
			'parent' => 'root-default',
			'id'    => 'blog',
			'title' => _n( 'My Site', 'My Sites', $this->user_site_count, 'jetpack' ),
			'href'  => '#',
			'meta'  => array(
				'class' => 'my-sites mb-trackable',
			),
		) );

		if ( $this->user_site_count > 1 ) {
			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'switch-site',
				'title'  => esc_html__( 'Switch Site', 'jetpack' ),
				'href'   => 'https://wordpress.com/sites',
			) );
		} else {
			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'new-site',
				'title'  => esc_html__( '+ Add New WordPress', 'jetpack' ),
				'href'   => 'https://wordpress.com/start?ref=admin-bar-logged-in',
			) );
		}

		if ( is_user_member_of_blog( $current_user->ID ) ) {
			$blavatar = '';
			$class    = 'current-site';

			if ( has_site_icon() ) {
				$src = get_site_icon_url();
				$blavatar = '<img class="avatar" src="'. esc_attr( $src ) . '" alt="Current site avatar">';
				$class = 'has-blavatar';
			}

			$blog_info = '<div class="ab-site-icon">' . $blavatar . '</div>';
			$blog_info .= '<span class="ab-site-title">' . esc_html( $blog_name ) . '</span>';
			$blog_info .= '<span class="ab-site-description">' . esc_html( $this->primary_site_url ) . '</span>';

			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'blog-info',
				'title'  => $blog_info,
				'href'   => esc_url( trailingslashit( $this->primary_site_url ) ),
				'meta'   => array(
					'class' => $class,
				),
			) );
		}

		// Site Preview
		if ( is_admin() ) {
			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'site-view',
				'title'  => __( 'View Site', 'jetpack' ),
				'href'   => home_url(),
				'meta'   => array(
					'class' => 'mb-icon',
					'target' => '_blank',
				),
			) );
		}

		// Stats
		if ( Jetpack::is_module_active( 'stats' ) ) {
			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'blog-stats',
				'title'  => esc_html__( 'Stats', 'jetpack' ),
				'href'   => 'https://wordpress.com/stats/' . esc_attr( $this->primary_site_slug ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );
		}

		// Add Calypso plans link and plan type indicator
		if ( is_user_member_of_blog( $current_user->ID ) ) {
			$plans_url = 'https://wordpress.com/plans/' . esc_attr( $this->primary_site_slug );
			$label = esc_html__( 'Plan', 'jetpack' );
			$plan = Jetpack::get_active_plan();

			$plan_title = $this->create_menu_item_pair(
				array(
					'url'   => $plans_url,
					'id'    => 'wp-admin-bar-plan',
					'label' => $label,
				),
				array(
					'url'   => $plans_url,
					'id'    => 'wp-admin-bar-plan-badge',
					'label' => $plan['product_name_short']
				)
			);

			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'plan',
				'title'  => $plan_title,
				'meta'   => array(
					'class' => 'inline-action',
				),
			) );
		}

		// Publish group
		$wp_admin_bar->add_group( array(
			'parent' => 'blog',
			'id'     => 'publish',
		) );

		// Publish header
		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'publish-header',
			'title'  => esc_html_x( 'Manage', 'admin bar menu group label', 'jetpack' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		// Pages
		$pages_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/pages/' . esc_attr( $this->primary_site_slug ),
				'id'    => 'wp-admin-bar-edit-page',
				'label' => esc_html__( 'Site Pages', 'jetpack' ),
			),
			array(
				'url'   => 'https://wordpress.com/page/' . esc_attr( $this->primary_site_slug ),
				'id'    => 'wp-admin-bar-new-page-badge',
				'label' => esc_html_x( 'Add', 'admin bar menu new item label', 'jetpack' ),
			)
		);

		if ( ! current_user_can( 'edit_pages' ) ) {
			$pages_title = $this->create_menu_item_anchor(
				'ab-item ab-primary mb-icon',
				'https://wordpress.com/pages/' . esc_attr( $this->primary_site_slug ),
				esc_html__( 'Site Pages', 'jetpack' ),
				'wp-admin-bar-edit-page'
			);
		}

		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'new-page',
			'title'  => $pages_title,
			'meta'   => array(
				'class' => 'inline-action',
			),
		) );

		// Blog Posts
		$posts_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/posts/' . esc_attr( $this->primary_site_slug ),
				'id'    => 'wp-admin-bar-edit-post',
				'label' => esc_html__( 'Blog Posts', 'jetpack' ),
			),
			array(
				'url'   => 'https://wordpress.com/post/' . esc_attr( $this->primary_site_slug ),
				'id'    => 'wp-admin-bar-new-post-badge',
				'label' => esc_html_x( 'Add', 'admin bar menu new item label', 'jetpack' ),
			)
		);

		if ( ! current_user_can( 'edit_posts' ) ) {
			$posts_title = $this->create_menu_item_anchor(
				'ab-item ab-primary mb-icon',
				'https://wordpress.com/posts/' . esc_attr( $this->primary_site_slug ),
				esc_html__( 'Blog Posts', 'jetpack' ),
				'wp-admin-bar-edit-post'
			);
		}

		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'new-post',
			'title'  => $posts_title,
			'meta'   => array(
				'class' => 'inline-action mb-trackable',
			),
		) );

		// Comments
		if ( current_user_can( 'moderate_comments' ) ) {
			$wp_admin_bar->add_menu( array(
				'parent' => 'publish',
				'id'     => 'comments',
				'title'  => __( 'Comments' ),
				'href'   => 'https://wordpress.com/comments/' . esc_attr( $this->primary_site_slug ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );
		}

		// Testimonials
		if ( Jetpack::is_module_active( 'custom-content-types' ) && get_option( 'jetpack_testimonial' ) ) {
			$testimonials_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/types/jetpack-testimonial/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-edit-testimonial',
					'label' => esc_html__( 'Testimonials', 'jetpack' ),
				),
				array(
					'url'   => 'https://wordpress.com/edit/jetpack-testimonial/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-new-testimonial',
					'label' => esc_html_x( 'Add', 'Button label for adding a new item via the toolbar menu', 'jetpack' ),
				)
			);

			if ( ! current_user_can( 'edit_pages' ) ) {
				$testimonials_title = $this->create_menu_item_anchor(
					'ab-item ab-primary mb-icon',
					'https://wordpress.com/types/jetpack-testimonial/' . esc_attr( $this->primary_site_slug ),
					esc_html__( 'Testimonials', 'jetpack' ),
					'wp-admin-bar-edit-testimonial'
				);
			}

			$wp_admin_bar->add_menu( array(
				'parent' => 'publish',
				'id'     => 'new-jetpack-testimonial',
				'title'  => $testimonials_title,
				'meta'   => array(
					'class' => 'inline-action',
				),
			) );
		}

		// Portfolio
		if ( Jetpack::is_module_active( 'custom-content-types' ) && get_option( 'jetpack_portfolio' ) ) {
			$portfolios_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/types/jetpack-portfolio/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-edit-portfolio',
					'label' => esc_html__( 'Portfolio', 'jetpack' ),
				),
				array(
					'url'   => 'https://wordpress.com/edit/jetpack-portfolio/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-new-portfolio',
					'label' => esc_html_x( 'Add', 'Button label for adding a new item via the toolbar menu', 'jetpack' ),
				)
			);

			if ( ! current_user_can( 'edit_pages' ) ) {
				$portfolios_title = $this->create_menu_item_anchor(
					'ab-item ab-primary mb-icon',
					'https://wordpress.com/types/jetpack-portfolio/' . esc_attr( $this->primary_site_slug ),
					esc_html__( 'Portfolio', 'jetpack' ),
					'wp-admin-bar-edit-portfolio'
				);
			}

			$wp_admin_bar->add_menu( array(
				'parent' => 'publish',
				'id'     => 'new-jetpack-portfolio',
				'title'  => $portfolios_title,
				'meta'   => array(
					'class' => 'inline-action',
				),
			) );
		}

		if ( current_user_can( 'edit_theme_options' ) ) {
			// Look and Feel group
			$wp_admin_bar->add_group( array(
				'parent' => 'blog',
				'id'     => 'look-and-feel',
			) );

			// Look and Feel header
			$wp_admin_bar->add_menu( array(
				'parent' => 'look-and-feel',
				'id'     => 'look-and-feel-header',
				'title'  => esc_html_x( 'Personalize', 'admin bar menu group label', 'jetpack' ),
				'meta'   => array(
					'class' => 'ab-submenu-header',
				),
			) );

			if ( is_admin() ) {
				// In wp-admin the `return` query arg will return to that page after closing the Customizer
				$customizer_url = add_query_arg( array( 'return' => urlencode( site_url( $_SERVER['REQUEST_URI'] ) ) ), wp_customize_url() );
			} else {
				// On the frontend the `url` query arg will load that page in the Customizer and also return to it after closing
				// non-home URLs won't work unless we undo domain mapping since the Customizer preview is unmapped to always have HTTPS
				$current_page = '//' . $this->primary_site_slug . $_SERVER['REQUEST_URI'];
				$customizer_url = add_query_arg( array( 'url' => urlencode( $current_page ) ), wp_customize_url() );
			}

			$theme_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/design/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-themes',
					'label' => esc_html__( 'Themes', 'jetpack' ),
				),
				array(
					'url'   => $customizer_url,
					'id'    => 'wp-admin-bar-cmz',
					'label' => esc_html_x( 'Customize', 'admin bar customize item label', 'jetpack' ),
				)
			);
			$meta = array( 'class' => 'mb-icon', 'class' => 'inline-action' );
			$href = false;

			$wp_admin_bar->add_menu( array(
				'parent' => 'look-and-feel',
				'id'     => 'themes',
				'title'  => $theme_title,
				'href'   => $href,
				'meta'   => $meta
			) );
		}

		if ( current_user_can( 'manage_options' ) ) {
			// Configuration group
			$wp_admin_bar->add_group( array(
				'parent' => 'blog',
				'id'     => 'configuration',
			) );

			// Configuration header
			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'configuration-header',
				'title'  => esc_html__( 'Configure', 'admin bar menu group label', 'jetpack' ),
				'meta'   => array(
					'class' => 'ab-submenu-header',
				),
			) );

			if ( Jetpack::is_module_active( 'publicize' ) || Jetpack::is_module_active( 'sharedaddy' ) ) {
				$wp_admin_bar->add_menu( array(
					'parent' => 'configuration',
					'id'     => 'sharing',
					'title'  => esc_html__( 'Sharing', 'jetpack' ),
					'href'   => 'https://wordpress.com/sharing/' . esc_attr( $this->primary_site_slug ),
					'meta'   => array(
						'class' => 'mb-icon',
					),
				) );
			}

			$people_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/people/team/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-people',
					'label' => esc_html__( 'People', 'jetpack' ),
				),
				array(
					'url'   => admin_url( 'user-new.php' ),
					'id'    => 'wp-admin-bar-people-add',
					'label' => esc_html_x( 'Add', 'admin bar people item label', 'jetpack' ),
				)
			);

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'users-toolbar',
				'title'  => $people_title,
				'href'   => false,
				'meta'   => array(
					'class' => 'inline-action',
				),
			) );

			$plugins_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/plugins/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-plugins',
					'label' => esc_html__( 'Plugins', 'jetpack' ),
				),
				array(
					'url'   => 'https://wordpress.com/plugins/manage/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-plugins-add',
					'label' => esc_html_x( 'Manage', 'Label for the button on the Masterbar to manage plugins', 'jetpack' ),
				)
			);

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'plugins',
				'title'  => $plugins_title,
				'href'   => false,
				'meta'   => array(
					'class' => 'inline-action',
				),
			) );

			if ( jetpack_is_atomic_site() ) {
				$domain_title = $this->create_menu_item_pair(
					array(
						'url'   => 'https://wordpress.com/domains/' . esc_attr( $this->primary_site_slug ),
						'id'    => 'wp-admin-bar-domains',
						'label' => esc_html__( 'Domains', 'jetpack' ),
					),
					array(
						'url'   => 'https://wordpress.com/domains/add/' . esc_attr( $this->primary_site_slug ),
						'id'    => 'wp-admin-bar-domains-add',
						'label' => esc_html_x( 'Add', 'Label for the button on the Masterbar to add a new domain', 'jetpack' ),
					)
				);
				$wp_admin_bar->add_menu( array(
					'parent' => 'configuration',
					'id'     => 'domains',
					'title'  => $domain_title,
					'href'   => false,
					'meta'   => array(
						'class' => 'inline-action',
					),
				) );
			}

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'blog-settings',
				'title'  => esc_html__( 'Settings', 'jetpack' ),
				'href'   => 'https://wordpress.com/settings/general/' . esc_attr( $this->primary_site_slug ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );

			if ( ! is_admin() ) {
				$wp_admin_bar->add_menu( array(
					'parent' => 'configuration',
					'id'     => 'legacy-dashboard',
					'title'  => esc_html__( 'Dashboard', 'jetpack' ),
					'href'   => admin_url(),
					'meta'   => array(
						'class' => 'mb-icon',
					),
				) );
			}

			// Restore dashboard menu toggle that is needed on mobile views.
			if ( is_admin() ) {
				$wp_admin_bar->add_menu( array(
				'id'    => 'menu-toggle',
				'title' => '<span class="ab-icon"></span><span class="screen-reader-text">' . esc_html__( 'Menu', 'jetpack' ) . '</span>',
				'href'  => '#',
				) );
			}

			/**
			 * Fires when menu items are added to the masterbar "My Sites" menu.
			 *
			 * @since 5.4
			 */
			do_action( 'jetpack_masterbar' );
		}
	}
}
