<?php
/**
 * Admin Menu file.
 *
 * @package A8C\Admin_Plugins
 */

namespace Automattic\Jetpack;

/**
 * Class Admin_Menu.
 */
class Admin_Menu {
	/**
	 * Holds class instance.
	 *
	 * @var Admin_Menu
	 */
	private static $instance;

	/**
	 * Whether the current request is a REST API request.
	 *
	 * @var bool
	 */
	private $is_api_request;

	/**
	 * Admin_Menu constructor.
	 */
	private function __construct() {
		if ( jetpack_is_atomic_site() ) {
			add_action(
				'admin_menu',
				function () {
					remove_action( 'admin_menu', 'gutenberg_menu', 9 );
				},
				0
			);
		}

		add_action( 'admin_menu', array( $this, 'reregister_menu_items' ), 99999 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Returns class instance.
	 *
	 * @return Admin_Menu
	 */
	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new self();
		}

		return static::$instance;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		$this->is_api_request = ( defined( 'REST_API_PLUGINS' ) && REST_API_PLUGINS ) || ( defined( 'REST_REQUEST' ) && REST_REQUEST );

		$domain = wp_parse_url( get_home_url(), PHP_URL_HOST );

		// TODO: Remove once feature has shipped. See jetpack_parent_file().
		if ( ! $this->is_api_request && ! defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
			$domain = add_query_arg( 'flags', 'nav-unification', $domain );
		}

		// Not needed outside of wp-admin.
		if ( ! $this->is_api_request && ( $this->is_wpcom_site() || jetpack_is_atomic_site() ) ) {
			$this->add_browse_sites_link();
			$this->add_site_card_menu( $domain );
		}

		/*
		 * Whether links should point to Calypso or wp-admin.
		 *
		 * true  - Calypso.
		 * false - wp-admin.
		 */
		$calypso = true;

		// Remove separators.
		remove_menu_page( 'separator1' );

		$this->add_my_home_menu( $domain, $calypso );
		$this->add_stats_menu( $domain );
		$this->add_purchases_menu( $domain );
		$this->add_posts_menu( $domain, $calypso );
		$this->add_media_menu( $domain, $calypso );
		$this->add_page_menu( $domain, $calypso );

		// Custom Post Types (except Feedback).
		$post_types = (array) get_post_types(
			array(
				'show_ui'      => true,
				'_builtin'     => false,
				'show_in_menu' => true,
			),
			'objects'
		);
		foreach ( $post_types as $post_type ) {
			if ( 'feedback' === $post_type->name ) {
				continue;
			}

			// Check if it should be a submenu.
			if ( true !== $post_type->show_in_menu ) {
				continue;
			}

			$this->add_custom_post_type_menu( $post_type, $domain, $calypso );
		}

		$this->add_comments_menu( $domain, $calypso );
		$this->add_jetpack_menu( $domain );
		$this->add_appearance_menu( $domain, $calypso );
		$this->add_plugins_menu( $domain );
		$this->add_users_menu( $domain, $calypso );
		$this->add_tools_menu( $domain, $calypso );
		$this->add_options_menu( $domain );

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Adds the site switcher link if user has more than one site.
	 */
	public function add_browse_sites_link() {
		// Only show switcher when there are other sites.
		if ( ! is_multisite() || ( function_exists( 'get_blog_count_for_user' ) && get_blog_count_for_user() < 2 ) ) {
			return;
		}

		// Add the menu item.
		add_menu_page( __( 'Browse sites', 'jetpack' ), __( 'Browse sites', 'jetpack' ), 'read', 'https://wordpress.com/home', null, 'dashicons-arrow-left-alt2', 0 );
	}

	/**
	 * Adds site card component.
	 *
	 * @param string $domain Site domain.
	 */
	public function add_site_card_menu( $domain ) {
		$default = 'data:image/svg+xml,' . rawurlencode( '<svg class="gridicon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Globe</title><rect fill-opacity="0" x="0" width="24" height="24"/><g><path fill="#fff" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18l2-2 1-1v-2h-2v-1l-1-1H9v3l2 2v1.93c-3.94-.494-7-3.858-7-7.93l1 1h2v-2h2l3-3V6h-2L9 5v-.41C9.927 4.21 10.94 4 12 4s2.073.212 3 .59V6l-1 1v2l1 1 3.13-3.13c.752.897 1.304 1.964 1.606 3.13H18l-2 2v2l1 1h2l.286.286C18.03 18.06 15.24 20 12 20z"/></g></svg>' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$icon    = get_site_icon_url( 32, $default );

		if ( $default === $icon && function_exists( 'blavatar_exists' ) && blavatar_exists( $domain ) && function_exists( 'blavatar_url' ) ) {
			$icon = blavatar_url( $domain, 'img', 32 );
		}

		$badge = '';
		if ( $this->is_wpcom_site() ) {
			if ( function_exists( 'is_private_blog' ) && function_exists( 'wpcom_is_coming_soon' ) && is_private_blog() ) {
				$badge .= sprintf(
					'<span class="site__badge site__badge-private">%s</span>',
					wpcom_is_coming_soon() ? esc_html__( 'Coming Soon', 'jetpack' ) : esc_html__( 'Private', 'jetpack' )
				);
			}

			if ( function_exists( 'is_redirected_domain' ) && is_redirected_domain( $domain ) ) {
				$badge .= '<span class="site__badge site__badge-redirect">' . esc_html__( 'Redirect', 'jetpack' ) . '</span>';
			}

			if ( ! empty( get_option( 'options' )['is_domain_only'] ) ) {
				$badge .= '<span class="site__badge site__badge-domain-only">' . esc_html__( 'Domain', 'jetpack' ) . '</span>';
			}
		}

		if ( jetpack_is_atomic_site() ) {
			if ( function_exists( 'site_is_private' ) && function_exists( 'site_is_coming_soon' ) && site_is_private() ) {
				$badge .= sprintf(
					'<span class="site__badge site__badge-private">%s</span>',
					site_is_coming_soon() ? esc_html__( 'Coming Soon', 'jetpack' ) : esc_html__( 'Private', 'jetpack' )
				);
			}
		}

		$site_card = '
<div class="site__info">
	<div class="site__title">%1$s</div>
	<div class="site__domain">%2$s</div>
	%3$s
</div>';

		$site_card = sprintf(
			$site_card,
			get_option( 'blogname' ),
			$domain,
			$badge
		);

		add_menu_page( 'site-card', $site_card, 'read', get_home_url(), null, $icon, 1 );
		add_filter( 'add_menu_classes', array( $this, 'set_site_card_menu_class' ) );
	}

	/**
	 * Adds a custom element class and id for Site Card's menu item.
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_site_card_menu_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-card' !== $menu_item[3] ) {
				continue;
			}

			$domain  = wp_parse_url( get_home_url(), PHP_URL_HOST );
			$classes = 'toplevel_page_site-card';
			$a = has_site_icon();
			$b = get_site_icon_url();
			if ( ( function_exists( 'blavatar_exists' ) && blavatar_exists( $domain ) ) || has_site_icon() ) {
				$classes .= ' has-site-icon' . ' ' . $a . ' ' . $b;
			}

			$menu[ $key ][4] = add_cssclass( $classes, $menu_item[4] );
			$menu[ $key ][5] = 'toplevel_page_site_card';
			break;
		}

		return $menu;
	}

	/**
	 * Adds My Home menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_my_home_menu( $domain, $calypso = true ) {
		global $submenu;

		$menu_slug = $calypso ? 'https://wordpress.com/home/' . $domain : 'index.php';

		remove_menu_page( 'index.php' );
		remove_submenu_page( 'index.php', 'index.php' );

		add_menu_page( __( 'My Home', 'jetpack' ), __( 'My Home', 'jetpack' ), 'read', $menu_slug, null, 'dashicons-admin-home', 2 );

		// Only add submenu when there are other submenu items.
		if ( ! empty( $submenu['index.php'] ) ) {
			add_submenu_page( $menu_slug, __( 'My Home', 'jetpack' ), __( 'My Home', 'jetpack' ), 'read', $menu_slug, null, 1 );
		}

		$this->migrate_submenus( 'index.php', $menu_slug );
	}

	/**
	 * Adds Stats menu.
	 *
	 * @param string $domain Site domain.
	 */
	public function add_stats_menu( $domain ) {
		$menu_title = __( 'Stats', 'jetpack' );

		if ( $this->is_wpcom_site() && ! $this->is_api_request ) {
			$menu_title .= sprintf(
				'<img class="sidebar-unified__sparkline" width="80" height="20" src="%1$s" alt="%2$s">',
				esc_url( home_url( 'wp-includes/charts/admin-bar-hours-scale-2x.php?masterbar=1&s=' . get_current_blog_id() ) ),
				esc_attr__( 'Hourly views', 'jetpack' )
			);
		}

		add_menu_page( __( 'Stats', 'jetpack' ), $menu_title, 'edit_posts', 'https://wordpress.com/stats/day/' . $domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Purchases menu.
	 *
	 * @param string $domain Site domain.
	 */
	public function add_purchases_menu( $domain ) {
		remove_menu_page( 'paid-upgrades.php' );
		add_menu_page( __( 'Purchases', 'jetpack' ), __( 'Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/plans/' . $domain, null, 'dashicons-cart', 4 );
		$this->migrate_submenus( 'paid-upgrades.php', 'https://wordpress.com/plans/' . $domain );
	}

	/**
	 * Adds Posts menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_posts_menu( $domain, $calypso = true ) {
		if ( ! $calypso ) {
			return;
		}

		$ptype_obj = get_post_type_object( 'post' );
		$menu_slug = 'https://wordpress.com/posts/' . $domain;

		remove_menu_page( 'edit.php' );
		remove_submenu_page( 'edit.php', 'edit.php' );
		remove_submenu_page( 'edit.php', 'post-new.php' );

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, 'dashicons-admin-post', $ptype_obj->menu_position );
		add_submenu_page( $menu_slug, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/post/' . $domain, null, 10 );

		$this->migrate_submenus( 'edit.php', $menu_slug );
	}

	/**
	 * Adds Media menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_media_menu( $domain, $calypso = true ) {
		remove_submenu_page( 'upload.php', 'upload.php' );
		remove_submenu_page( 'upload.php', 'media-new.php' );

		if ( $calypso ) {
			$menu_slug = 'https://wordpress.com/media/' . $domain;

			remove_menu_page( 'upload.php' );
			add_menu_page( __( 'Media', 'jetpack' ), __( 'Media', 'jetpack' ), 'upload_files', $menu_slug, null, 'dashicons-admin-media', 10 );
			$this->migrate_submenus( 'upload.php', $menu_slug );
		}
	}

	/**
	 * Adds Page menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_page_menu( $domain, $calypso = true ) {
		if ( ! $calypso ) {
			return;
		}

		$ptype_obj = get_post_type_object( 'page' );
		$menu_slug = 'https://wordpress.com/pages/' . $domain;

		remove_menu_page( 'edit.php?post_type=page' );
		remove_submenu_page( 'edit.php?post_type=page', 'edit.php?post_type=page' );
		remove_submenu_page( 'edit.php?post_type=page', 'post-new.php?post_type=page' );

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, 'dashicons-admin-page', $ptype_obj->menu_position );
		add_submenu_page( $menu_slug, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/page/' . $domain, null, 10 );
		$this->migrate_submenus( 'edit.php?post_type=page', $menu_slug );
	}

	/**
	 * Adds custom post type menus.
	 *
	 * @param \WP_Post_Type $ptype_obj Post type object.
	 * @param string        $domain    Site domain.
	 * @param bool          $calypso   Optional. Whether links should point to Calypso or wp-admin.
	 *                                 Default true (Calypso).
	 */
	public function add_custom_post_type_menu( \WP_Post_Type $ptype_obj, $domain, $calypso = true ) {
		if ( ! $calypso ) {
			return;
		}

		$post_type = $ptype_obj->name;
		$menu_icon = 'dashicons-admin-post';
		if ( is_string( $ptype_obj->menu_icon ) ) {
			// Special handling for data:image/svg+xml and Dashicons.
			if ( 0 === strpos( $ptype_obj->menu_icon, 'data:image/svg+xml;base64,' ) || 0 === strpos( $ptype_obj->menu_icon, 'dashicons-' ) ) {
				$menu_icon = $ptype_obj->menu_icon;
			} else {
				$menu_icon = esc_url( $ptype_obj->menu_icon );
			}
		}

		$old_slug   = 'edit.php?post_type=' . $post_type;
		$ptype_file = 'https://wordpress.com/types/' . $post_type . '/' . $domain;

		remove_menu_page( $old_slug );
		remove_submenu_page( $old_slug, $old_slug );
		remove_submenu_page( $old_slug, 'post-new.php?post_type=' . $post_type );

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $ptype_file, null, $menu_icon, $ptype_obj->menu_position );
		add_submenu_page( $ptype_file, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $ptype_file, null, 5 );
		add_submenu_page( $ptype_file, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/edit/' . $post_type . '/' . $domain, null, 10 );

		$this->migrate_submenus( $old_slug, $ptype_file );
	}

	/**
	 * Adds Comments menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_comments_menu( $domain, $calypso = true ) {
		if ( ! $calypso || ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		$awaiting_mod      = wp_count_comments();
		$awaiting_mod      = $awaiting_mod->moderated;
		$awaiting_mod_i18n = number_format_i18n( $awaiting_mod );
		/* translators: %s: Number of comments. */
		$awaiting_mod_text = sprintf( _n( '%s Comment in moderation', '%s Comments in moderation', $awaiting_mod, 'jetpack' ), $awaiting_mod_i18n );

		/* translators: %s: Number of comments. */
		$menu_title = sprintf( __( 'Comments %s', 'jetpack' ), '<span class="awaiting-mod count-' . absint( $awaiting_mod ) . '"><span class="pending-count" aria-hidden="true">' . $awaiting_mod_i18n . '</span><span class="comments-in-moderation-text screen-reader-text">' . $awaiting_mod_text . '</span></span>' );
		$menu_slug  = 'https://wordpress.com/comments/all/' . $domain;

		remove_menu_page( 'edit-comments.php' );
		remove_submenu_page( 'edit-comments.php', 'edit-comments.php' );

		add_menu_page( esc_attr__( 'Comments', 'jetpack' ), $menu_title, 'edit_posts', $menu_slug, null, 'dashicons-admin-comments', 25 );
		$this->migrate_submenus( 'edit-comments.php', $menu_slug );
	}

	/**
	 * Adds Jetpack menu.
	 *
	 * @param string $domain Site domain.
	 */
	public function add_jetpack_menu( $domain ) {
		if ( ! $this->is_wpcom_site() && ! jetpack_is_atomic_site() ) {
			return;
		}

		global $menu;

		$position = 50;
		while ( isset( $menu[ $position ] ) ) {
			$position++;
		}

		// TODO: Replace with proper SVG data url.
		$jetpack_icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 32 32' %3E%3Cpath fill='%23a0a5aa' d='M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z'%3E%3C/path%3E%3Cpolygon fill='%23fff' points='15,19 7,19 15,3 '%3E%3C/polygon%3E%3Cpolygon fill='%23fff' points='17,29 17,13 25,13 '%3E%3C/polygon%3E%3C/svg%3E";
		$jetpack_slug = 'https://wordpress.com/activity-log/' . $domain;

		$this->add_admin_menu_separator( $position++, 'manage_options' );
		add_menu_page( esc_attr__( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'manage_options', $jetpack_slug, null, $jetpack_icon, $position );

		// Maintain id for jQuery selector.
		$menu[ $position ][5] = 'toplevel_page_jetpack'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		remove_menu_page( 'jetpack' );
		remove_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );

		$this->migrate_submenus( 'jetpack', $jetpack_slug );

		add_submenu_page( $jetpack_slug, esc_attr__( 'Activity Log', 'jetpack' ), __( 'Activity Log', 'jetpack' ), 'manage_options', 'https://wordpress.com/activity-log/' . $domain, null, 5 );
		add_submenu_page( $jetpack_slug, esc_attr__( 'Backup', 'jetpack' ), __( 'Backup', 'jetpack' ), 'manage_options', 'https://wordpress.com/backup/' . $domain, null, 10 );
		add_submenu_page( $jetpack_slug, esc_attr__( 'Scan', 'jetpack' ), __( 'Scan', 'jetpack' ), 'manage_options', 'https://wordpress.com/scan/' . $domain, null, 15 );

		add_filter( 'parent_file', array( $this, 'jetpack_parent_file' ) );
	}

	/**
	 * Filters the parent file of an admin menu sub-menu item.
	 *
	 * @param string $parent_file The parent file.
	 * @return string Updated parent file.
	 */
	public function jetpack_parent_file( $parent_file ) {
		if ( 'jetpack' === $parent_file ) {
			$parent_file = 'https://wordpress.com/activity-log/' . wp_parse_url( get_home_url(), PHP_URL_HOST );

			// TODO: Remove once feature has shipped. See reregister_menu_items().
			if ( ! $this->is_api_request && ! defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
				$parent_file = add_query_arg( 'flags', 'nav-unification', $parent_file );
			}
		}

		return $parent_file;
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_appearance_menu( $domain, $calypso = true ) {
		$user_can_customize = current_user_can( 'customize' );
		$appearance_cap     = $user_can_customize ? 'customize' : 'edit_theme_options';
		$customize_slug     = $calypso ? 'https://wordpress.com/customize/' . $domain : 'customize.php';
		$themes_slug        = $calypso ? 'https://wordpress.com/themes/' . $domain : 'themes.php';
		$appearance_slug    = $user_can_customize ? $customize_slug : $themes_slug;
		$customize_url      = add_query_arg( 'return', urlencode( remove_query_arg( wp_removable_query_args(), wp_unslash( $_SERVER['REQUEST_URI'] ) ) ), 'customize.php' ); // phpcs:ignore

		remove_menu_page( 'themes.php' );
		remove_submenu_page( 'themes.php', 'themes.php' );
		remove_submenu_page( 'themes.php', 'theme-editor.php' );
		remove_submenu_page( 'themes.php', $customize_url );

		add_menu_page( esc_attr__( 'Appearance', 'jetpack' ), __( 'Appearance', 'jetpack' ), $appearance_cap, $appearance_slug, null, 'dashicons-admin-appearance', 60 );
		add_submenu_page( $appearance_slug, esc_attr__( 'Customize', 'jetpack' ), __( 'Customize', 'jetpack' ), 'customize', $customize_slug, null, 5 );
		add_submenu_page( $appearance_slug, esc_attr__( 'Themes', 'jetpack' ), __( 'Themes', 'jetpack' ), $appearance_cap, $themes_slug, null, 10 );

		if ( current_theme_supports( 'custom-header' ) && $user_can_customize ) {
			$customize_header_url = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url );
			remove_submenu_page( 'themes.php', $customize_header_url );

			$customize_header_url = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $appearance_slug );
			add_submenu_page( $appearance_slug, __( 'Header', 'jetpack' ), __( 'Header', 'jetpack' ), $appearance_cap, esc_url( $customize_header_url ), null, 15 );
		}

		if ( current_theme_supports( 'custom-background' ) && $user_can_customize ) {
			$customize_background_url = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $customize_url );
			remove_submenu_page( 'themes.php', $customize_background_url );

			$customize_background_url = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $appearance_slug );
			add_submenu_page( $appearance_slug, esc_attr__( 'Background', 'jetpack' ), __( 'Background', 'jetpack' ), $appearance_cap, esc_url( $customize_background_url ), null, 20 );
		}

		if ( current_theme_supports( 'widgets' ) ) {
			remove_submenu_page( 'themes.php', 'widgets.php' );

			$customize_menu_url = add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $appearance_slug );
			add_submenu_page( $appearance_slug, esc_attr__( 'Widgets', 'jetpack' ), __( 'Widgets', 'jetpack' ), $appearance_cap, esc_url( $customize_menu_url ), null, 20 );
		}

		if ( current_theme_supports( 'menus' ) || current_theme_supports( 'widgets' ) ) {
			remove_submenu_page( 'themes.php', 'nav-menus.php' );

			$customize_menu_url = add_query_arg( array( 'autofocus' => array( 'panel' => 'nav_menus' ) ), $appearance_slug );
			add_submenu_page( $appearance_slug, esc_attr__( 'Menus', 'jetpack' ), __( 'Menus', 'jetpack' ), $appearance_cap, esc_url( $customize_menu_url ), null, 20 );
		}

		$this->migrate_submenus( 'themes.php', $appearance_slug );
	}

	/**
	 * Adds Plugins menu.
	 *
	 * @param string $domain  Site domain.
	 */
	public function add_plugins_menu( $domain ) {
		$calypso = $this->is_wpcom_site();

		remove_submenu_page( 'plugins.php', 'plugin-editor.php' );

		if ( $calypso ) {
			remove_menu_page( 'plugins.php' );

			if ( $this->is_api_request ) {
				remove_submenu_page( 'plugins.php', 'plugins.php' );
			}

			$count = '';
			if ( ! is_multisite() && current_user_can( 'update_plugins' ) ) {
				$update_data = wp_get_update_data();
				$count       = sprintf(
					'<span class="update-plugins count-%s"><span class="plugin-count">%s</span></span>',
					$update_data['counts']['plugins'],
					number_format_i18n( $update_data['counts']['plugins'] )
				);
			}

			/* translators: %s: Number of pending plugin updates. */
			add_menu_page( esc_attr__( 'Plugins', 'jetpack' ), sprintf( __( 'Plugins %s', 'jetpack' ), $count ), 'activate_plugins', 'https://wordpress.com/plugins/' . $domain, null, 'dashicons-admin-plugins', 65 );
			$this->migrate_submenus( 'plugins.php', 'https://wordpress.com/plugins/' . $domain );
		}
	}

	/**
	 * Adds Users menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_users_menu( $domain, $calypso = true ) {
		$users_slug   = $calypso ? 'https://wordpress.com/people/team/' . $domain : 'users.php';
		$add_new_slug = 'https://wordpress.com/people/new/' . $domain;
		$profile_slug = $calypso ? 'https://wordpress.com/me' : 'grofiles-editor';
		$account_slug = $calypso ? 'https://wordpress.com/me/account' : 'grofiles-user-settings';

		if ( current_user_can( 'list_users' ) ) {
			remove_menu_page( 'users.php' );
			remove_submenu_page( 'users.php', 'users.php' );
			remove_submenu_page( 'users.php', 'user-new.php' );
			remove_submenu_page( 'users.php', 'profile.php' );
			remove_submenu_page( 'users.php', 'grofiles-editor' );
			remove_submenu_page( 'users.php', 'grofiles-user-settings' );

			add_menu_page( esc_attr__( 'Users', 'jetpack' ), __( 'Users', 'jetpack' ), 'list_users', $users_slug, null, 'dashicons-admin-users', 70 );
			add_submenu_page( $users_slug, esc_attr__( 'All People', 'jetpack' ), __( 'All People', 'jetpack' ), 'list_users', $users_slug, null, 5 );
			add_submenu_page( $users_slug, esc_attr__( 'Add New', 'jetpack' ), __( 'Add New', 'jetpack' ), 'promote_users', $add_new_slug, null, 10 );
			add_submenu_page( $users_slug, esc_attr__( 'My Profile', 'jetpack' ), __( 'My Profile', 'jetpack' ), 'read', $profile_slug, null, 15 );
			add_submenu_page( $users_slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', $account_slug, null, 20 );
			$this->migrate_submenus( 'users.php', $users_slug );
		} else {
			remove_menu_page( 'profile.php' );
			remove_submenu_page( 'profile.php', 'grofiles-editor' );
			remove_submenu_page( 'profile.php', 'grofiles-user-settings' );

			add_menu_page( esc_attr__( 'My Profile', 'jetpack' ), __( 'My Profile', 'jetpack' ), 'read', $profile_slug, null, 'dashicons-admin-users', 70 );
			add_submenu_page( $profile_slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', $account_slug, null, 5 );
			$this->migrate_submenus( 'profile.php', $profile_slug );
		}
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param string $domain  Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_tools_menu( $domain, $calypso = true ) {
		$admin_slug = 'tools.php';
		$menu_slug  = $calypso ? 'https://wordpress.com/marketing/tools/' . $domain : $admin_slug;

		add_submenu_page( $menu_slug, esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'manage_options', 'https://wordpress.com/marketing/tools/' . $domain, null, 5 );
		add_submenu_page( $menu_slug, esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $domain, null, 10 );

		if ( $calypso ) {
			remove_menu_page( $admin_slug );
			remove_submenu_page( $admin_slug, $admin_slug );
			remove_submenu_page( $admin_slug, 'import.php' );
			remove_submenu_page( $admin_slug, 'export.php' );
			remove_submenu_page( $admin_slug, 'delete-blog' );

			add_menu_page( esc_attr__( 'Tools', 'jetpack' ), __( 'Tools', 'jetpack' ), 'manage_options', $menu_slug, null, 'dashicons-admin-tools', 75 );
			add_submenu_page( $menu_slug, esc_attr__( 'Import', 'jetpack' ), __( 'Import', 'jetpack' ), 'import', 'https://wordpress.com/import/' . $domain, null, 15 );
			add_submenu_page( $menu_slug, esc_attr__( 'Export', 'jetpack' ), __( 'Export', 'jetpack' ), 'export', 'https://wordpress.com/export/' . $domain, null, 20 );

			$this->migrate_submenus( $admin_slug, $menu_slug );
		}
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param string $domain Site domain.
	 * @param bool   $calypso Optional. Whether links should point to Calypso or wp-admin. Default true (Calypso).
	 */
	public function add_options_menu( $domain, $calypso = true ) {
		if ( $calypso ) {
			remove_submenu_page( 'options-general.php', 'options-discussion.php' );
			remove_submenu_page( 'options-general.php', 'options-writing.php' );
		}

		add_options_page( esc_attr__( 'Domains', 'jetpack' ), __( 'Domains', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $domain, null, 1 );
		add_options_page( esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $domain, null, 6 );
	}

	/**
	 * Migrates submenu items from wp-admin menu slugs to Calypso menu slugs.
	 *
	 * @param string $old_slug WP-Admin menu slug.
	 * @param string $new_slug Calypso menu slug. (Calypso URL).
	 */
	public function migrate_submenus( $old_slug, $new_slug ) {
		global $submenu;

		if ( $old_slug !== $new_slug && ! empty( $submenu[ $old_slug ] ) ) {
			if ( ! empty( $submenu[ $new_slug ] ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $new_slug ] = array_replace( $submenu[ $new_slug ], $submenu[ $old_slug ] );
			} else {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $new_slug ] = $submenu[ $old_slug ];
			}
			unset( $submenu[ $old_slug ] );
		}
	}

	/**
	 * Adds a menu separator.
	 *
	 * @param int    $position The position in the menu order this item should appear.
	 * @param string $cap      Optional. The capability required for this menu to be displayed to the user.
	 *                         Default: 'read'.
	 */
	public function add_admin_menu_separator( $position, $cap = 'read' ) {
		global $menu;
		static $uid = 3;

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $position ] = array(
			'',                               // Menu title (ignored).
			$cap,                             // Required capability.
			'separator-custom-' . ( ++$uid ), // URL or file (ignored, but must be unique).
			'',                               // Page title (ignored).
			'wp-menu-separator',              // CSS class. Identifies this item as a separator.
		);
		ksort( $menu );
	}

	/**
	 * Enqueues scripts and styles.
	 */
	public function enqueue_scripts() {
		wp_enqueue_style(
			'jetpack-admin-menu',
			plugins_url( 'admin-menu.css', __FILE__ ),
			array(),
			'1'
		);
		wp_enqueue_script(
			'jetpack-admin-menu',
			plugins_url( 'admin-menu.js', __FILE__ ),
			array(),
			'1',
			true
		);
	}

	/**
	 * Whether we're in a WordPress.com context.
	 *
	 * @return bool
	 */
	private function is_wpcom_site() {
		/**
		 * Filters whether this request is executed in a WordPress.com environment.
		 *
		 * Filterable to make it easier to unit test other parts of this class.
		 *
		 * @param bool $is_wpcom Whether this is a WordPress.com request. Defaults to the value of IS_WPCOM,
		 */
		return apply_filters( 'jetpack_admin_menu_is_wpcom', defined( 'IS_WPCOM' ) && IS_WPCOM );
	}
}
