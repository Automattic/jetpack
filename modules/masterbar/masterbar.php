<?php

class A8C_WPCOM_Masterbar {
	private $locale;

	private $user_id;
	private $user_data;
	private $user_login;
	private $display_name;
	private $primary_site_slug;

	function __construct() {
		$this->locale    = $this->get_locale();
		$this->user_id   = get_current_user_id();

		if ( Jetpack::is_user_connected( $this->user_id ) ) {
			$this->user_data = Jetpack::get_connected_user_data( $this->user_id );
			$this->user_login = $this->user_data['login'];
			$this->display_name = $this->user_data['display_name'];
			$this->primary_site_slug = $this->get_site_slug();
		}

		add_action( 'wp_before_admin_bar_render', array( $this, 'replace_core_masterbar' ), 99999 );

		add_action( 'wp_head', array( $this, 'add_styles_and_scripts' ) );
		add_action( 'admin_head', array( $this, 'add_styles_and_scripts' ) );
	}

	public function add_styles_and_scripts() {
		wp_enqueue_style( 'a8c_wpcom_masterbar', plugins_url( 'masterbar.css', __FILE__ ) );
		wp_enqueue_style( 'a8c_wpcom_masterbar_overrides', plugins_url( 'masterbar-overrides/masterbar.css', __FILE__ ) );
		wp_enqueue_style( 'a8c_wpcom_masterbar_mobile', plugins_url( 'masterbar-mobile.css', __FILE__ ) );

		wp_enqueue_script( 'wpcom-masterbar-js', plugins_url( 'masterbar-overrides/masterbar.js', __FILE__ ) );
	}

	public function get_site_slug() {
		$url = get_site_url();
		$url = parse_url( $url );
		$url = $url['host'] . untrailingslashit( $url['path'] );

		return str_replace( '/', '::', $url );
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
		global $wp_admin_bar;

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
		$this->add_notifications( $wp_admin_bar );
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
						 <span class="noticon noticon-bell"></span>',
			'meta'   => array(
				'html'  => '<div id="wpnt-notes-panel2" style="display:none" lang="'. esc_attr( $this->locale ) . '" dir="' . ( is_rtl() ? 'rtl' : 'ltr' ) . '">' .
				           '<div class="wpnt-notes-panel-header">' .
				           '<span class="wpnt-notes-header">' .
				           __( 'Notifications', 'jetpack' ) .
				           '</span>' .
				           '<span class="wpnt-notes-panel-link">' .
				           '</span>' .
				           '</div>' .
				           '</div>',
				'class' => 'menupop',
			),
			'parent' => 'top-secondary',
		) );
	}

	public function add_reader_submenu( $wp_admin_bar ) {
		$wp_admin_bar->add_menu( array(
			'id'    => 'newdash',
			'title' => __( 'Reader' ),
			'href'  => 'https://wordpress.com/',
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'streams-header',
			'title'  => __( 'Streams' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			)
		) );

		$following_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/',
				'id'    => 'wp-admin-bar-followed-sites',
				'label' => __( 'Followed Sites' ),
			),
			array(
				'url'   => 'https://wordpress.com/following/edit',
				'id'    => 'wp-admin-bar-reader-followed-sites-manage',
				'label' => __( 'Manage' ),
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
			'title'  => __( 'Discover' ),
			'href'   => 'https://wordpress.com/discover',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'discover-search',
			'title'  => __( 'Search' ),
			'href'   => 'https://wordpress.com/read/search',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'discover-recommended-blogs',
			'title'  => __( 'Recommendations' ),
			'href'   => 'https://wordpress.com/recommendations',
			'meta'   => array(
				'class' => 'mb-icon-spacer',
			)
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'newdash',
			'id'     => 'my-activity-my-likes',
			'title'  => __( 'My Likes' ),
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
		$class = 'ab-top-secondary';
		$wp_admin_bar->add_group( array(
			'id'     => 'top-secondary',
			'meta'   => array(
				'class' => $class,
			),
		) );

		$wp_admin_bar->add_group( array(
			'parent' => 'blog',
			'id'     => 'blog-secondary',
			'meta'   => array(
				'class' => 'ab-sub-secondary',
			),
		) );
	}

	public function add_me_submenu( $wp_admin_bar ) {
		global $current_user, $current_blog;

		$user_id = get_current_user_id();
		if ( empty( $user_id ) ) {
			return;
		}

		$avatar = get_avatar( $user_id, 32, 'mm', '', array( 'force_display' => true ) );
		$class  = empty( $avatar ) ? '' : 'with-avatar';

		// Add the 'Me' menu
		$wp_admin_bar->add_menu( array(
			'id'     => 'my-account',
			'parent' => 'top-secondary',
			'title'  => $avatar . '<span class="ab-text">' . __( 'Me' ) . '</span>',
			'href'   => 'https://wordpress.com/me/',
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

		$user_info  = get_avatar( $user_id, 128, 'mm', '', array( 'force_display' => true ) );
		$user_info .= '<span class="display-name">' . $this->display_name . '</span>';
		$user_info .= '<a class="username" href="http://gravatar.com/' . $this->user_login . '">@' . $this->user_login . '</a>';
		$user_info .= '<form action="' . $logout_url . '" method="post"><button class="ab-sign-out" type="submit">' . __( 'Sign Out' ) . '</button></form>';

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
			'title'  => __( 'Profile' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'my-profile',
			'title'  => __( 'My Profile' ),
			'href'   => 'https://wordpress.com/me',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'account-settings',
			'title'  => __( 'Account Settings' ),
			'href'   => $settings_url,
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'billing',
			'title'  => __( 'Manage Purchases' ),
			'href'   => 'https://wordpress.com/me/purchases',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'security',
			'title'  => __( 'Security' ),
			'href'   => 'https://wordpress.com/me/security',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'notifications',
			'title'  => __( 'Notifications' ),
			'href'   => 'https://wordpress.com/me/notifications',
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'special-header',
			'title'  => __( 'Special' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'get-apps',
			'title'  => __( 'Get Apps' ),
			'href'   => 'https://wordpress.com/me/get-apps',
			'meta'   => array(
				'class' => 'user-info-item',
			),
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'next-steps',
			'title'  => __( 'Next Steps' ),
			'href'   => 'https://wordpress.com/me/next',
			'meta'   => array(
				'class' => 'user-info-item',
			),
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => $id,
			'id'     => 'help',
			'title'  => __( 'Help' ),
			'href'   => 'https://wordpress.com/help',
			'meta'   => array(
				'class' => 'user-info-item',
			),
			'meta'   => array(
				'class' => 'mb-icon',
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

		$blog_post_page = 'https://wordpress.com/post/' . $this->primary_site_slug;

		$wp_admin_bar->add_menu( array(
			'parent'    => 'top-secondary',
			'id' => 'ab-new-post',
			'href' => $blog_post_page,
			'title' => '<span>' . __( 'Write' ) . '</span>',
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
			'id'    => 'blog',
			'title' => __( 'My Sites' ),
			'href'  => 'https://wordpress.com/stats/' . $this->primary_site_slug,
			'meta'  => array(
				'class' => 'my-sites',
			),
		) );

		$wp_admin_bar->add_menu( array(
			'parent' => 'blog',
			'id'     => 'switch-site',
			'title'  => __( 'Switch Site' ),
			'href'   => 'https://wordpress.com/sites',
		) );

		if ( is_user_member_of_blog( $current_user->ID ) ) {
			$blavatar = '';
			$class    = 'current-site';

			// TODO: Get blavatar for site here
			// stub test
			// $blavatar = "<img class=\"avatar\" src=\"https://secure.gravatar.com/blavatar/c89faee845bc10cfb6f41eb3df885e87?s=120\" alt=\"Current site avatar\" originals=\"120\" scale=\"2\">";
			// $class = 'has-blavatar';
			// end stub

			$blog_description = $this->primary_site_slug;

			$blog_info = '<div class="ab-site-icon">' . $blavatar . '</div>';
			$blog_info .= '<span class="ab-site-title">' . esc_html( $blog_name ) . '</span>';
			$blog_info .= '<span class="ab-site-description">' . esc_html( $blog_description ) . '</span>';

			$wp_admin_bar->add_menu( array(
				'parent' => 'blog',
				'id'     => 'blog-info',
				'title'  => $blog_info,
				'href'   => esc_url( trailingslashit( get_home_url() ) ),
				'meta'   => array(
					'class' => $class,
				),
			) );

		}

		// Stats
		$wp_admin_bar->add_menu( array(
			'parent' => 'blog',
			'id'     => 'blog-stats',
			'title'  => __( 'Stats' ),
			'href'   => 'https://wordpress.com/stats/' . esc_attr( $this->primary_site_slug ),
			'meta'   => array(
				'class' => 'mb-icon',
			),
		) );

		// Add Calypso plans link and plan type indicator
		if ( is_user_member_of_blog( $current_user->ID ) ) {
			$plans_url = 'https://wordpress.com/plans/' . esc_attr( $this->primary_site_slug );
			$label = __( 'Plan' );
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
			'title'  => _x( 'Publish', 'admin bar menu group label' ),
			'meta'   => array(
				'class' => 'ab-submenu-header',
			),
		) );

		// Blog Posts
		$posts_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/posts/' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-edit-post',
				'label' => __( 'Blog Posts' ),
			),
			array(
				'url'   => 'https://wordpress.com/posts/' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-new-post',
				'label' => _x( 'Add', 'admin bar menu new item label' ),
			)
		);

		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'new-post',
			'title'  => $posts_title,
			'meta'   => array(
				'class' => 'inline-action',
			),
		) );

		// Pages
		$pages_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/pages/' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-edit-page',
				'label' => __( 'Pages' ),
			),
			array(
				'url'   => 'https://wordpress.com/page/' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-new-page',
				'label' => _x( 'Add', 'admin bar menu new item label' ),
			)
		);

		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'new-page',
			'title'  => $pages_title,
			'meta'   => array(
				'class' => 'inline-action',
			),
		) );

		// Portfolio
		$portfolios_title = $this->create_menu_item_pair(
			array(
				'url'   => 'https://wordpress.com/types/jetpack-portfolio/' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-edit-page',
				'label' => __( 'Portfolio' ),
			),
			array(
				'url'   => 'https://wordpress.com/edit/jetpack-portfolio' . $this->primary_site_slug,
				'id'    => 'wp-admin-bar-new-page',
				'label' => _x( 'Add', 'admin bar menu new item label' ),
			)
		);

		$wp_admin_bar->add_menu( array(
			'parent' => 'publish',
			'id'     => 'new-portfolio',
			'title'  => $portfolios_title,
			'meta'   => array(
				'class' => 'inline-action',
			),
		) );

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
				'title'  => _x( 'Personalize', 'admin bar menu group label' ),
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
				global $current_blog;
				$current_page = 'https://' . $current_blog->domain . $_SERVER['REQUEST_URI'];
				$customizer_url = add_query_arg( array( 'url' => urlencode( $current_page ) ), wp_customize_url() );
			}

			$theme_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/design/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-themes',
					'label' => __( 'Themes' ),
				),
				array(
					'url'   => $customizer_url,
					'id'    => 'wp-admin-bar-cmz',
					'label' => _x( 'Customize', 'admin bar customize item label' ),
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

			if ( current_theme_supports( 'menus' ) ) {
				$wp_admin_bar->add_menu( array(
					'parent' => 'look-and-feel',
					'id'     => 'menus',
					'title'  => __( 'Menus' ),
					'href'   => 'https://wordpress.com/menus/' . esc_attr( $this->primary_site_slug ),
					'meta' => array(
						'class' => 'mb-icon',
					),
				) );
			}
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
				'title'  => __( 'Configure', 'admin bar menu group label' ),
				'meta'   => array(
					'class' => 'ab-submenu-header',
				),
			) );

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'sharing',
				'title'  => __( 'Sharing' ),
				'href'   => 'https://wordpress.com/sharing/' . esc_attr( $this->primary_site_slug ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );

			$people_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/people/team/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-people',
					'label' => __( 'People' ),
				),
				array(
					'url'   => 'https://wordpress.com/people/new/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-people-add',
					'label' => _x( 'Add', 'admin bar people item label' ),
				)
			);

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'users-toolbar',
				'title'  => $people_title,
				'href'   => false,
				'meta'   => array(
					'class' => 'mb-icon',
					'class' => 'inline-action'
				),
			) );

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'plugins',
				'title'  => __( 'Plugins' ),
				'href'   => 'https://wordpress.com/plugins/' . esc_attr( $this->primary_site_slug ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );

			$domain_title = $this->create_menu_item_pair(
				array(
					'url'   => 'https://wordpress.com/domains/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-domains',
					'label' => __( 'Domains' ),
				),
				array(
					'url'   => 'https://wordpress.com/domains/add/' . esc_attr( $this->primary_site_slug ),
					'id'    => 'wp-admin-bar-domains-add',
					'label' => _x( 'Add', 'Label for the button on the Masterbar to add a new domain' ),
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

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'blog-settings',
				'title'  => __( 'Settings' ),
				'href'   => 'https://wordpress.com/settings/general/' . $this->primary_site_slug,
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );

			$wp_admin_bar->add_menu( array(
				'parent' => 'configuration',
				'id'     => 'legacy-dashboard',
				'title'  => __( 'WP Admin' ),
				'href'   => 'https://' . $this->primary_site_slug . '/wp-admin/',
				'meta'   => array(
					'class' => 'mb-icon',
				),
			) );
		}
	}

}
