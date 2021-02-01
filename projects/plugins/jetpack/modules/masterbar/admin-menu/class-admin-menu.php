<?php
/**
 * Admin Menu file.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Status;

/**
 * Class Admin_Menu.
 */
class Admin_Menu {
	/**
	 * Holds class instances.
	 *
	 * @var array
	 */
	protected static $instances;

	/**
	 * Whether the current request is a REST API request.
	 *
	 * @var bool
	 */
	protected $is_api_request = false;

	/**
	 * Domain of the current site.
	 *
	 * @var string
	 */
	protected $domain;

	/**
	 * The customizer default link.
	 *
	 * @var string
	 */
	protected $customize_slug = 'customize.php';

	/**
	 * Admin_Menu constructor.
	 */
	protected function __construct() {
		add_action( 'admin_menu', array( $this, 'reregister_menu_items' ), 99999 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'rest_request_before_callbacks', array( $this, 'rest_api_init' ), 11 );

		$this->domain = ( new Status() )->get_site_suffix();
	}

	/**
	 * Returns class instance.
	 *
	 * @return Admin_Menu
	 */
	public static function get_instance() {
		$class = get_called_class();

		if ( empty( static::$instances[ $class ] ) ) {
			static::$instances[ $class ] = new $class();
		}

		return static::$instances[ $class ];
	}

	/**
	 * Sets up class properties for REST API requests.
	 */
	public function rest_api_init() {
		$this->is_api_request = true;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		// Constant is not defined until parse_request.
		if ( ! $this->is_api_request ) {
			$this->is_api_request = defined( 'REST_REQUEST' ) && REST_REQUEST;
		}

		/*
		 * Whether links should point to Calypso or wp-admin.
		 *
		 * Options:
		 * false - Calypso (Default).
		 * true  - wp-admin.
		 */
		$wp_admin = $this->should_link_to_wp_admin();

		// Remove separators.
		remove_menu_page( 'separator1' );

		$this->add_my_home_menu( $wp_admin );
		$this->add_stats_menu();
		$this->add_upgrades_menu();
		$this->add_posts_menu( $wp_admin );
		$this->add_media_menu( $wp_admin );
		$this->add_page_menu( $wp_admin );
		$this->add_testimonials_menu( $wp_admin );
		$this->add_portfolio_menu( $wp_admin );
		$this->add_comments_menu( $wp_admin );
		$this->add_appearance_menu( $wp_admin );
		$this->add_plugins_menu();
		$this->add_users_menu( $wp_admin );
		$this->add_tools_menu( $wp_admin );
		$this->add_options_menu( $wp_admin );

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Adds My Home menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_my_home_menu( $wp_admin = false ) {
		global $submenu;

		$menu_slug = $wp_admin ? 'index.php' : 'https://wordpress.com/home/' . $this->domain;

		remove_menu_page( 'index.php' );
		remove_submenu_page( 'index.php', 'index.php' );

		add_menu_page( __( 'My Home', 'jetpack' ), __( 'My Home', 'jetpack' ), 'read', $menu_slug, null, 'dashicons-admin-home', 2 );

		// Only add submenu when there are other submenu items.
		if ( ! empty( $submenu['index.php'] ) ) {
			add_submenu_page( $menu_slug, __( 'My Home', 'jetpack' ), __( 'My Home', 'jetpack' ), 'read', $menu_slug, null, 1 );
		}

		$this->migrate_submenus( 'index.php', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'index.php' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Stats menu.
	 */
	public function add_stats_menu() {
		add_menu_page( __( 'Stats', 'jetpack' ), __( 'Stats', 'jetpack' ), 'edit_posts', 'https://wordpress.com/stats/day/' . $this->domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Upgrades menu.
	 */
	public function add_upgrades_menu() {
		remove_menu_page( 'paid-upgrades.php' );

		$menu_slug = 'https://wordpress.com/plans/' . $this->domain;

		add_menu_page( __( 'Upgrades', 'jetpack' ), __( 'Upgrades', 'jetpack' ), 'manage_options', $menu_slug, null, 'dashicons-cart', 4 );
		add_submenu_page( $menu_slug, __( 'Plans', 'jetpack' ), __( 'Plans', 'jetpack' ), 'manage_options', $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, __( 'Purchases', 'jetpack' ), __( 'Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 15 );

		$this->migrate_submenus( 'paid-upgrades.php', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'paid-upgrades.php' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Posts menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_posts_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$ptype_obj = get_post_type_object( 'post' );
		$menu_slug = 'https://wordpress.com/posts/' . $this->domain;

		remove_menu_page( 'edit.php' );
		remove_submenu_page( 'edit.php', 'edit.php' );
		remove_submenu_page( 'edit.php', 'post-new.php' );

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, 'dashicons-admin-post', $ptype_obj->menu_position );
		add_submenu_page( $menu_slug, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/post/' . $this->domain, null, 10 );

		$this->migrate_submenus( 'edit.php', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'edit.php' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Media menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_media_menu( $wp_admin = false ) {
		remove_submenu_page( 'upload.php', 'upload.php' );
		remove_submenu_page( 'upload.php', 'media-new.php' );

		if ( ! $wp_admin ) {
			$menu_slug = 'https://wordpress.com/media/' . $this->domain;

			remove_menu_page( 'upload.php' );
			add_menu_page( __( 'Media', 'jetpack' ), __( 'Media', 'jetpack' ), 'upload_files', $menu_slug, null, 'dashicons-admin-media', 10 );
			$this->migrate_submenus( 'upload.php', $menu_slug );

			add_filter(
				'parent_file',
				function ( $parent_file ) use ( $menu_slug ) {
					return 'upload.php' === $parent_file ? $menu_slug : $parent_file;
				}
			);
		}
	}

	/**
	 * Adds Page menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_page_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$ptype_obj = get_post_type_object( 'page' );
		$menu_slug = 'https://wordpress.com/pages/' . $this->domain;

		remove_menu_page( 'edit.php?post_type=page' );
		remove_submenu_page( 'edit.php?post_type=page', 'edit.php?post_type=page' );
		remove_submenu_page( 'edit.php?post_type=page', 'post-new.php?post_type=page' );

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, 'dashicons-admin-page', $ptype_obj->menu_position );
		add_submenu_page( $menu_slug, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/page/' . $this->domain, null, 10 );

		$this->migrate_submenus( 'edit.php?post_type=page', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'edit.php?post_type=page' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Testimonials menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_testimonials_menu( $wp_admin = false ) {
		$this->add_custom_post_type_menu( 'jetpack-testimonial', $wp_admin );
	}

	/**
	 * Adds Portfolio menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_portfolio_menu( $wp_admin = false ) {
		$this->add_custom_post_type_menu( 'jetpack-portfolio', $wp_admin );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 * @param bool   $wp_admin  Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_custom_post_type_menu( $post_type, $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$ptype_obj = get_post_type_object( $post_type );
		if ( empty( $ptype_obj ) ) {
			return;
		}

		$cpt_slug  = 'edit.php?post_type=' . $post_type;
		$menu_slug = 'https://wordpress.com/types/' . $post_type . '/' . $this->domain;

		remove_menu_page( $cpt_slug );
		remove_submenu_page( $cpt_slug, $cpt_slug );
		remove_submenu_page( $cpt_slug, 'post-new.php?post_type=' . $post_type );

		// Menu icon.
		$menu_icon = 'dashicons-admin-post';
		if ( is_string( $ptype_obj->menu_icon ) ) {
			// Special handling for data:image/svg+xml and Dashicons.
			if ( 0 === strpos( $ptype_obj->menu_icon, 'data:image/svg+xml;base64,' ) || 0 === strpos( $ptype_obj->menu_icon, 'dashicons-' ) ) {
				$menu_icon = $ptype_obj->menu_icon;
			} else {
				$menu_icon = esc_url( $ptype_obj->menu_icon );
			}
		}

		/*
		 * Menu position.
		 *
		 * If $ptype_menu_position is already populated or will be populated
		 * by a hard-coded value below, increment the position.
		 */
		$ptype_menu_position = is_int( $ptype_obj->menu_position ) ? $ptype_obj->menu_position : ++$GLOBALS['_wp_last_object_menu'];
		$core_menu_positions = array( 59, 60, 65, 70, 75, 80, 85, 99 );
		while ( isset( $GLOBALS['menu'][ $ptype_menu_position ] ) || in_array( $ptype_menu_position, $core_menu_positions, true ) ) {
			$ptype_menu_position++;
		}

		add_menu_page( esc_attr( $ptype_obj->labels->menu_name ), $ptype_obj->labels->menu_name, $ptype_obj->cap->edit_posts, $menu_slug, null, $menu_icon, $ptype_menu_position );
		add_submenu_page( $menu_slug, $ptype_obj->labels->all_items, $ptype_obj->labels->all_items, $ptype_obj->cap->edit_posts, $menu_slug, null, 5 );
		add_submenu_page( $menu_slug, $ptype_obj->labels->add_new, $ptype_obj->labels->add_new, $ptype_obj->cap->create_posts, 'https://wordpress.com/edit/' . $post_type . '/' . $this->domain, null, 10 );
		$this->migrate_submenus( $cpt_slug, $menu_slug );

		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $cpt_slug, $menu_slug ) {
				return $cpt_slug === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Comments menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_comments_menu( $wp_admin = false ) {
		if ( $wp_admin || ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		$awaiting_mod      = wp_count_comments();
		$awaiting_mod      = $awaiting_mod->moderated;
		$awaiting_mod_i18n = number_format_i18n( $awaiting_mod );
		/* translators: %s: Number of comments. */
		$awaiting_mod_text = sprintf( _n( '%s Comment in moderation', '%s Comments in moderation', $awaiting_mod, 'jetpack' ), $awaiting_mod_i18n );

		/* translators: %s: Number of comments. */
		$menu_title = sprintf( __( 'Comments %s', 'jetpack' ), '<span class="awaiting-mod count-' . absint( $awaiting_mod ) . '"><span class="pending-count" aria-hidden="true">' . $awaiting_mod_i18n . '</span><span class="comments-in-moderation-text screen-reader-text">' . $awaiting_mod_text . '</span></span>' );
		$menu_slug  = 'https://wordpress.com/comments/all/' . $this->domain;

		remove_menu_page( 'edit-comments.php' );
		remove_submenu_page( 'edit-comments.php', 'edit-comments.php' );

		add_menu_page( esc_attr__( 'Comments', 'jetpack' ), $menu_title, 'edit_posts', $menu_slug, null, 'dashicons-admin-comments', 25 );

		$this->migrate_submenus( 'edit-comments.php', $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'edit-comments.php' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_appearance_menu( $wp_admin = false ) {
		$user_can_customize = current_user_can( 'customize' );
		$appearance_cap     = current_user_can( 'switch_themes' ) ? 'switch_themes' : 'edit_theme_options';
		$themes_slug        = $wp_admin ? 'themes.php' : 'https://wordpress.com/themes/' . $this->domain;
		$customize_url      = add_query_arg( 'return', urlencode( remove_query_arg( wp_removable_query_args(), wp_unslash( $_SERVER['REQUEST_URI'] ) ) ), 'customize.php' ); // phpcs:ignore
		remove_menu_page( 'themes.php' );
		remove_submenu_page( 'themes.php', 'themes.php' );
		remove_submenu_page( 'themes.php', 'theme-editor.php' );
		remove_submenu_page( 'themes.php', $customize_url );
		remove_submenu_page( 'themes.php', 'custom-header' );
		remove_submenu_page( 'themes.php', 'custom-background' );

		add_menu_page( esc_attr__( 'Appearance', 'jetpack' ), __( 'Appearance', 'jetpack' ), $appearance_cap, $themes_slug, null, 'dashicons-admin-appearance', 60 );
		add_submenu_page( $themes_slug, esc_attr__( 'Themes', 'jetpack' ), __( 'Themes', 'jetpack' ), 'switch_themes', $themes_slug, null, 5 );
		add_submenu_page( $themes_slug, esc_attr__( 'Customize', 'jetpack' ), __( 'Customize', 'jetpack' ), 'customize', $this->customize_slug, null, 10 );

		// Maintain id as JS selector.
		$GLOBALS['menu'][60][5] = 'menu-appearance'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		if ( current_theme_supports( 'custom-header' ) && $user_can_customize ) {
			$customize_header_url = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url );
			remove_submenu_page( 'themes.php', esc_url( $customize_header_url ) );

			// TODO: Remove WPCom_Theme_Customizer::modify_header_menu_links() and WPcom_Custom_Header::modify_admin_menu_links().
			$customize_header_url = admin_url( 'themes.php?page=custom-header' );
			remove_submenu_page( 'themes.php', esc_url( $customize_header_url ) );

			$customize_header_url = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $this->customize_slug );
			add_submenu_page( $themes_slug, __( 'Header', 'jetpack' ), __( 'Header', 'jetpack' ), 'customize', esc_url( $customize_header_url ), null, 15 );
		}

		if ( current_theme_supports( 'custom-background' ) && $user_can_customize ) {
			$customize_background_url = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $customize_url );
			remove_submenu_page( 'themes.php', esc_url( $customize_background_url ) );

			// TODO: Remove Colors_Manager::modify_header_menu_links() and Colors_Manager_Common::modify_header_menu_links().
			$customize_background_url = add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), admin_url( 'customize.php' ) );
			remove_submenu_page( 'themes.php', esc_url( $customize_background_url ) );

			$customize_background_url = add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $this->customize_slug );
			add_submenu_page( $themes_slug, esc_attr__( 'Background', 'jetpack' ), __( 'Background', 'jetpack' ), 'customize', esc_url( $customize_background_url ), null, 20 );
		}

		if ( current_theme_supports( 'widgets' ) ) {
			remove_submenu_page( 'themes.php', 'widgets.php' );

			$customize_menu_url = add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $this->customize_slug );
			add_submenu_page( $themes_slug, esc_attr__( 'Widgets', 'jetpack' ), __( 'Widgets', 'jetpack' ), 'customize', esc_url( $customize_menu_url ), null, 20 );
		}

		if ( current_theme_supports( 'menus' ) || current_theme_supports( 'widgets' ) ) {
			remove_submenu_page( 'themes.php', 'nav-menus.php' );

			$customize_menu_url = add_query_arg( array( 'autofocus' => array( 'panel' => 'nav_menus' ) ), $this->customize_slug );
			add_submenu_page( $themes_slug, esc_attr__( 'Menus', 'jetpack' ), __( 'Menus', 'jetpack' ), 'customize', esc_url( $customize_menu_url ), null, 20 );
		}

		// Register menu for the Custom CSS Jetpack module, but don't add it as a menu item.
		$GLOBALS['_registered_pages']['admin_page_editcss'] = true; // phpcs:ignore

		$this->migrate_submenus( 'themes.php', $themes_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $themes_slug ) {
				return 'themes.php' === $parent_file ? $themes_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {
		remove_submenu_page( 'plugins.php', 'plugin-editor.php' );
	}

	/**
	 * Adds Users menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_users_menu( $wp_admin = false ) {
		$users_slug   = $wp_admin ? 'users.php' : 'https://wordpress.com/people/team/' . $this->domain;
		$add_new_slug = 'https://wordpress.com/people/new/' . $this->domain;
		$profile_slug = $wp_admin ? 'profile.php' : 'https://wordpress.com/me';

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
			add_submenu_page( $users_slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', 'https://wordpress.com/me/account', null, 20 );

			$this->migrate_submenus( 'users.php', $users_slug );
			add_filter(
				'parent_file',
				function ( $parent_file ) use ( $users_slug ) {
					return 'users.php' === $parent_file ? $users_slug : $parent_file;
				}
			);
		}
	}

	/**
	 * Adds Tools menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_tools_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$admin_slug = 'tools.php';
		$menu_slug  = 'https://wordpress.com/marketing/tools/' . $this->domain;

		remove_menu_page( $admin_slug );
		remove_submenu_page( $admin_slug, $admin_slug );
		remove_submenu_page( $admin_slug, 'import.php' );
		remove_submenu_page( $admin_slug, 'delete-blog' );

		add_menu_page( esc_attr__( 'Tools', 'jetpack' ), __( 'Tools', 'jetpack' ), 'manage_options', $menu_slug, null, 'dashicons-admin-tools', 75 );
		add_submenu_page( $menu_slug, esc_attr__( 'Import', 'jetpack' ), __( 'Import', 'jetpack' ), 'import', 'https://wordpress.com/import/' . $this->domain, null, 15 );

		$this->migrate_submenus( $admin_slug, $menu_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $menu_slug ) {
				return 'tools.php' === $parent_file ? $menu_slug : $parent_file;
			}
		);
	}

	/**
	 * Adds Settings menu.
	 *
	 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
	 */
	public function add_options_menu( $wp_admin = false ) {
		if ( $wp_admin ) {
			return;
		}

		$options_slug = 'https://wordpress.com/settings/general/' . $this->domain;

		remove_menu_page( 'options-general.php' );
		remove_submenu_page( 'options-general.php', 'options-general.php' );
		remove_submenu_page( 'options-general.php', 'options-discussion.php' );
		remove_submenu_page( 'options-general.php', 'options-writing.php' );

		add_menu_page( esc_attr__( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'manage_options', $options_slug, null, 'dashicons-admin-settings', 80 );
		add_submenu_page( $options_slug, esc_attr__( 'General', 'jetpack' ), __( 'General', 'jetpack' ), 'manage_options', $options_slug, null, 10 );

		$this->migrate_submenus( 'options-general.php', $options_slug );
		add_filter(
			'parent_file',
			function ( $parent_file ) use ( $options_slug ) {
				return 'options-general.php' === $parent_file ? $options_slug : $parent_file;
			}
		);
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
		$style_dependencies = array();
		$rtl                = is_rtl() ? '-rtl' : '';
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$style_dependencies = array( 'wpcom-admin-bar', 'wpcom-masterbar-css' );
		} else {
			$style_dependencies = array( 'a8c-wpcom-masterbar' . $rtl, 'a8c-wpcom-masterbar-overrides' . $rtl );
		}
		wp_enqueue_style(
			'jetpack-admin-menu',
			plugins_url( 'admin-menu.css', __FILE__ ),
			$style_dependencies,
			JETPACK__VERSION
		);
		wp_enqueue_script(
			'jetpack-admin-menu',
			plugins_url( 'admin-menu.js', __FILE__ ),
			array(),
			JETPACK__VERSION,
			true
		);
	}

	/**
	 * Dequeues unnecessary scripts.
	 */
	public function dequeue_scripts() {
		wp_dequeue_script( 'a8c_wpcom_masterbar_overrides' ); // Initially loaded in modules/masterbar/masterbar/class-masterbar.php.
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		return get_user_option( 'jetpack_admin_menu_link_destination' );
	}
}
