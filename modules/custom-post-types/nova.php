<?php

use Automattic\Jetpack\Assets;

/*
 * Put the following code in your theme's Food Menu Page Template to customize the markup of the menu.

if ( class_exists( 'Nova_Restaurant' ) ) {
	Nova_Restaurant::init( array(
		'menu_tag'               => 'section',
		'menu_class'             => 'menu-items',
		'menu_header_tag'        => 'header',
		'menu_header_class'      => 'menu-group-header',
		'menu_title_tag'         => 'h1',
		'menu_title_class'       => 'menu-group-title',
		'menu_description_tag'   => 'div',
		'menu_description_class' => 'menu-group-description',
	) );
}

*/

/* @todo

Bulk/Quick edit response of Menu Item rows is broken.

Drag and Drop reordering.
*/

class Nova_Restaurant {
	const MENU_ITEM_POST_TYPE = 'nova_menu_item';
	const MENU_ITEM_LABEL_TAX = 'nova_menu_item_label';
	const MENU_TAX = 'nova_menu';

	public $version = '0.1';

	protected $default_menu_item_loop_markup = array(
		'menu_tag'               => 'section',
		'menu_class'             => 'menu-items',
		'menu_header_tag'        => 'header',
		'menu_header_class'      => 'menu-group-header',
		'menu_title_tag'         => 'h1',
		'menu_title_class'       => 'menu-group-title',
		'menu_description_tag'   => 'div',
		'menu_description_class' => 'menu-group-description',
	);

	protected $menu_item_loop_markup = array();
	protected $menu_item_loop_last_term_id = false;
	protected $menu_item_loop_current_term = false;

	static function init( $menu_item_loop_markup = array() ) {
		static $instance = false;

		if ( !$instance ) {
			$instance = new Nova_Restaurant();
		}

		if ( $menu_item_loop_markup ) {
			$instance->menu_item_loop_markup = wp_parse_args( $menu_item_loop_markup, $instance->default_menu_item_loop_markup );
		}

		return $instance;
	}

	function __construct() {
		if ( ! $this->site_supports_nova() )
			return;

		$this->register_taxonomies();
		$this->register_post_types();
		add_action( 'admin_menu',            array( $this, 'add_admin_menus'      ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_nova_styles'  ) );
		add_action( 'admin_head',            array( $this, 'set_custom_font_icon' ) );

		// Always sort menu items correctly
		add_action( 'parse_query',   array( $this, 'sort_menu_item_queries_by_menu_order'    ) );
		add_filter( 'posts_results', array( $this, 'sort_menu_item_queries_by_menu_taxonomy' ), 10, 2 );

		add_action( 'wp_insert_post', array( $this, 'add_post_meta' ) );

		$this->menu_item_loop_markup = $this->default_menu_item_loop_markup;

		// Only output our Menu Item Loop Markup on a real blog view.  Not feeds, XML-RPC, admin, etc.
		add_filter( 'template_include', array( $this, 'setup_menu_item_loop_markup__in_filter' ) );

		add_filter( 'enter_title_here',       array( $this, 'change_default_title' ) );
		add_filter( 'post_updated_messages',  array( $this, 'updated_messages'     ) );
		add_filter( 'dashboard_glance_items', array( $this, 'add_to_dashboard'     ) );
	}

	/**
	* Should this Custom Post Type be made available?
	*/
	function site_supports_nova() {
		// If we're on WordPress.com, and it has the menu site vertical.
		if ( function_exists( 'site_vertical' ) && 'nova_menu' == site_vertical() )
			return true;

		// Else, if the current theme requests it.
		if ( current_theme_supports( self::MENU_ITEM_POST_TYPE ) )
			return true;

		// Otherwise, say no unless something wants to filter us to say yes.
		/**
		 * Allow something else to hook in and enable this CPT.
		 *
		 * @module custom-content-types
		 *
		 * @since 2.6.0
		 *
		 * @param bool false Whether or not to enable this CPT.
		 * @param string $var The slug for this CPT.
		 */
		return (bool) apply_filters( 'jetpack_enable_cpt', false, self::MENU_ITEM_POST_TYPE );
	}

/* Setup */

	/**
	 * Register Taxonomies and Post Type
	 */
	function register_taxonomies() {
		if ( ! taxonomy_exists( self::MENU_ITEM_LABEL_TAX ) ) {
			register_taxonomy( self::MENU_ITEM_LABEL_TAX, self::MENU_ITEM_POST_TYPE, array(
				'labels' => array(
					/* translators: this is about a food menu */
					'name'                       => __( 'Menu Item Labels', 'jetpack' ),
					/* translators: this is about a food menu */
					'singular_name'              => __( 'Menu Item Label', 'jetpack' ),
					/* translators: this is about a food menu */
					'search_items'               => __( 'Search Menu Item Labels', 'jetpack' ),
					'popular_items'              => __( 'Popular Labels', 'jetpack' ),
					/* translators: this is about a food menu */
					'all_items'                  => __( 'All Menu Item Labels', 'jetpack' ),
					/* translators: this is about a food menu */
					'edit_item'                  => __( 'Edit Menu Item Label', 'jetpack' ),
					/* translators: this is about a food menu */
					'view_item'                  => __( 'View Menu Item Label', 'jetpack' ),
					/* translators: this is about a food menu */
					'update_item'                => __( 'Update Menu Item Label', 'jetpack' ),
					/* translators: this is about a food menu */
					'add_new_item'               => __( 'Add New Menu Item Label', 'jetpack' ),
					/* translators: this is about a food menu */
					'new_item_name'              => __( 'New Menu Item Label Name', 'jetpack' ),
					'separate_items_with_commas' => __( 'For example, spicy, favorite, etc. <br /> Separate Labels with commas', 'jetpack' ),
					'add_or_remove_items'        => __( 'Add or remove Labels', 'jetpack' ),
					'choose_from_most_used'      => __( 'Choose from the most used Labels', 'jetpack' ),
					'items_list_navigation'      => __( 'Menu item label list navigation',   'jetpack' ),
					'items_list'                 => __( 'Menu item labels list',              'jetpack' ),
				),
				'no_tagcloud' => __( 'No Labels found', 'jetpack' ),
				'hierarchical'  => false,
			) );
		}

		if ( ! taxonomy_exists( self::MENU_TAX ) ) {
			register_taxonomy( self::MENU_TAX, self::MENU_ITEM_POST_TYPE, array(
				'labels' => array(
					/* translators: this is about a food menu */
					'name'               => __( 'Menu Sections', 'jetpack' ),
					/* translators: this is about a food menu */
					'singular_name'      => __( 'Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'search_items'       => __( 'Search Menu Sections', 'jetpack' ),
					/* translators: this is about a food menu */
					'all_items'          => __( 'All Menu Sections', 'jetpack' ),
					/* translators: this is about a food menu */
					'parent_item'        => __( 'Parent Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'parent_item_colon'  => __( 'Parent Menu Section:', 'jetpack' ),
					/* translators: this is about a food menu */
					'edit_item'          => __( 'Edit Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'view_item'          => __( 'View Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'update_item'        => __( 'Update Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'add_new_item'       => __( 'Add New Menu Section', 'jetpack' ),
					/* translators: this is about a food menu */
					'new_item_name'      => __( 'New Menu Sections Name', 'jetpack' ),
					'items_list_navigation' => __( 'Menu section list navigation',  'jetpack' ),
					'items_list'            => __( 'Menu section list',             'jetpack' ),
				),
				'rewrite' => array(
					'slug'         => 'menu',
					'with_front'   => false,
					'hierarchical' => true,
				),
				'hierarchical'  => true,
				'show_tagcloud' => false,
				'query_var'     => 'menu',
			) );
		}
	}

	function register_post_types() {
		if ( post_type_exists( self::MENU_ITEM_POST_TYPE ) ) {
			return;
		}

		register_post_type( self::MENU_ITEM_POST_TYPE, array(
			'description' => __( "Items on your restaurant's menu", 'jetpack' ),

			'labels' => array(
				/* translators: this is about a food menu */
				'name'               => __( 'Menu Items', 'jetpack' ),
				/* translators: this is about a food menu */
				'singular_name'      => __( 'Menu Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'menu_name'          => __( 'Food Menus', 'jetpack' ),
				/* translators: this is about a food menu */
				'all_items'          => __( 'Menu Items', 'jetpack' ),
				/* translators: this is about a food menu */
				'add_new'            => __( 'Add One Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'add_new_item'       => __( 'Add Menu Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'edit_item'          => __( 'Edit Menu Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'new_item'           => __( 'New Menu Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'view_item'          => __( 'View Menu Item', 'jetpack' ),
				/* translators: this is about a food menu */
				'search_items'       => __( 'Search Menu Items', 'jetpack' ),
				/* translators: this is about a food menu */
				'not_found'          => __( 'No Menu Items found', 'jetpack' ),
				/* translators: this is about a food menu */
				'not_found_in_trash' => __( 'No Menu Items found in Trash', 'jetpack' ),
				'filter_items_list'     => __( 'Filter menu items list',       'jetpack' ),
				'items_list_navigation' => __( 'Menu item list navigation',    'jetpack' ),
				'items_list'            => __( 'Menu items list',              'jetpack' ),
			),
			'supports' => array(
				'title',
				'editor',
				'thumbnail',
				'excerpt',
			),
			'rewrite' => array(
				'slug'       => 'item',
				'with_front' => false,
				'feeds'      => false,
				'pages'      => false,
			),
			'register_meta_box_cb' => array( $this, 'register_menu_item_meta_boxes' ),

			'public'          => true,
			'show_ui'         => true, // set to false to replace with custom UI
			'menu_position'   => 20, // below Pages
			'capability_type' => 'page',
			'map_meta_cap'    => true,
			'has_archive'     => false,
			'query_var'       => 'item',
		) );
	}


	/**
	 * Update messages for the Menu Item admin.
	 */
	function updated_messages( $messages ) {
		global $post;

		$messages[self::MENU_ITEM_POST_TYPE] = array(
			0  => '', // Unused. Messages start at index 1.
				/* translators: this is about a food menu */
			1  => sprintf( __( 'Menu item updated. <a href="%s">View item</a>', 'jetpack' ), esc_url( get_permalink( $post->ID ) ) ),
			2  => esc_html__( 'Custom field updated.', 'jetpack' ),
			3  => esc_html__( 'Custom field deleted.', 'jetpack' ),
			/* translators: this is about a food menu */
			4  => esc_html__( 'Menu item updated.', 'jetpack' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( esc_html__( 'Menu item restored to revision from %s', 'jetpack' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			/* translators: this is about a food menu */
			6  => sprintf( __( 'Menu item published. <a href="%s">View item</a>', 'jetpack' ), esc_url( get_permalink( $post->ID ) ) ),
			/* translators: this is about a food menu */
			7  => esc_html__( 'Menu item saved.', 'jetpack' ),
			/* translators: this is about a food menu */
			8  => sprintf( __( 'Menu item submitted. <a target="_blank" href="%s">Preview item</a>', 'jetpack' ), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post->ID ) ) ) ),
			/* translators: this is about a food menu */
			9  => sprintf( __( 'Menu item scheduled for: <strong>%1$s</strong>. <a target="_blank" href="%2$s">Preview item</a>', 'jetpack' ),
			// translators: Publish box date format, see http://php.net/date
			date_i18n( __( 'M j, Y @ G:i', 'jetpack' ), strtotime( $post->post_date ) ), esc_url( get_permalink($post->ID) ) ),
			/* translators: this is about a food menu */
			10 => sprintf( __( 'Menu item draft updated. <a target="_blank" href="%s">Preview item</a>', 'jetpack' ), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post->ID ) ) ) ),
		);

		return $messages;
	}


	/**
	 * Nova Styles and Scripts
	 */
	function enqueue_nova_styles( $hook ) {
		global $post_type;
		$pages = array( 'edit.php', 'post.php', 'post-new.php' );

		if ( in_array( $hook, $pages ) && $post_type == self::MENU_ITEM_POST_TYPE ) {
			wp_enqueue_style( 'nova-style', plugins_url( 'css/nova.css', __FILE__ ),      array(), $this->version );
		}

		wp_enqueue_style( 'nova-font',  plugins_url( 'css/nova-font.css', __FILE__ ), array(), $this->version );
	}


	/**
	 * Change ‘Enter Title Here’ text for the Menu Item.
	 */
	function change_default_title( $title ) {
		if ( self::MENU_ITEM_POST_TYPE == get_post_type() ) {
			/* translators: this is about a food menu */
			$title = esc_html__( "Enter the menu item's name here", 'jetpack' );
		}

		return $title;
	}


	/**
	 * Add to Dashboard At A Glance
	 */
	function add_to_dashboard() {
		$number_menu_items = wp_count_posts( self::MENU_ITEM_POST_TYPE );

		if ( current_user_can( 'administrator' ) ) {
			$number_menu_items_published = sprintf( '<a href="%1$s">%2$s</a>',
				esc_url( get_admin_url( get_current_blog_id(), 'edit.php?post_type=' . self::MENU_ITEM_POST_TYPE ) ),
				sprintf( _n( '%1$d Food Menu Item', '%1$d Food Menu Items', intval( $number_menu_items->publish ), 'jetpack' ), number_format_i18n( $number_menu_items->publish ) )
			);
		}
		else {
			$number_menu_items_published = sprintf( '<span>%1$s</span>',
				sprintf( _n( '%1$d Food Menu Item', '%1$d Food Menu Items', intval( $number_menu_items->publish ), 'jetpack' ), number_format_i18n( $number_menu_items->publish ) )
			);
		}

		echo '<li class="nova-menu-count">' . $number_menu_items_published . '</li>';
	}


	/**
	 * Query
	 */
	function is_menu_item_query( $query ) {
		if (
			( isset( $query->query_vars['taxonomy'] ) && self::MENU_TAX == $query->query_vars['taxonomy'] )
		||
			( isset( $query->query_vars['post_type'] ) && self::MENU_ITEM_POST_TYPE == $query->query_vars['post_type'] )
		) {
			return true;
		}

		return false;
	}

	function sort_menu_item_queries_by_menu_order( $query ) {
		if ( ! $this->is_menu_item_query( $query ) ) {
			return;
		}

		$query->query_vars['orderby'] = 'menu_order';
		$query->query_vars['order'] = 'ASC';

		// For now, just turn off paging so we can sort by taxonmy later
		// If we want paging in the future, we'll need to add the taxonomy sort here (or at least before the DB query is made)
		$query->query_vars['posts_per_page'] = -1;
	}

	function sort_menu_item_queries_by_menu_taxonomy( $posts, $query ) {
		if ( !$posts ) {
			return $posts;
		}

		if ( !$this->is_menu_item_query( $query ) ) {
			return $posts;
		}

		$grouped_by_term = array();

		foreach ( $posts as $post ) {
			$term = $this->get_menu_item_menu_leaf( $post->ID );
			if ( !$term || is_wp_error( $term ) ) {
				$term_id = 0;
			} else {
				$term_id = $term->term_id;
			}

			if ( !isset( $grouped_by_term["$term_id"] ) ) {
				$grouped_by_term["$term_id"] = array();
			}

			$grouped_by_term["$term_id"][] = $post;
		}

		$term_order = get_option( 'nova_menu_order', array() );

		$return = array();
		foreach ( $term_order as $term_id ) {
			if ( isset( $grouped_by_term["$term_id"] ) ) {
				$return = array_merge( $return, $grouped_by_term["$term_id"] );
				unset( $grouped_by_term["$term_id"] );
			}
		}

		foreach ( $grouped_by_term as $term_id => $posts ) {
			$return = array_merge( $return, $posts );
		}

		return $return;
	}


	/**
	 * Add Many Items
	 */
	function add_admin_menus() {
		$hook = add_submenu_page(
			'edit.php?post_type=' . self::MENU_ITEM_POST_TYPE,
			__( 'Add Many Items', 'jetpack' ),
			__( 'Add Many Items', 'jetpack' ),
			'edit_pages',
			'add_many_nova_items',
			array( $this, 'add_many_new_items_page' )
		);

		add_action( "load-$hook",     array( $this, 'add_many_new_items_page_load' ) );

		add_action( 'current_screen', array( $this, 'current_screen_load' ) );

		//Adjust 'Add Many Items' submenu position
		if ( isset( $GLOBALS['submenu']['edit.php?post_type=' . self::MENU_ITEM_POST_TYPE] ) ) {
			$submenu_item = array_pop( $GLOBALS['submenu']['edit.php?post_type=' . self::MENU_ITEM_POST_TYPE] );
			$GLOBALS['submenu']['edit.php?post_type=' . self::MENU_ITEM_POST_TYPE][11] = $submenu_item;
			ksort( $GLOBALS['submenu']['edit.php?post_type=' . self::MENU_ITEM_POST_TYPE] );
		}


		$this->setup_menu_item_columns();

		wp_register_script(
			'nova-menu-checkboxes',
			Assets::get_file_url_for_environment(
				'_inc/build/custom-post-types/js/menu-checkboxes.min.js',
				'modules/custom-post-types/js/menu-checkboxes.js'
			),
			array( 'jquery' ),
			$this->version,
			true
		);
	}


	/**
	 * Custom Nova Icon CSS
	 */
	function set_custom_font_icon() {
	?>
	<style type="text/css">
	#menu-posts-nova_menu_item .wp-menu-image:before {
		font-family: 'nova-font' !important;
		content: '\e603' !important;
	}
	</style>
	<?php
	}

	function current_screen_load() {
		$screen = get_current_screen();
		if ( 'edit-nova_menu_item' !== $screen->id ) {
			return;
		}

		$this->edit_menu_items_page_load();
		add_filter( 'admin_notices', array( $this, 'admin_notices' ) );
	}

/* Edit Items List */

	function admin_notices() {
		if ( isset( $_GET['nova_reordered'] ) )
			/* translators: this is about a food menu */
			printf( '<div class="updated"><p>%s</p></div>', __( 'Menu Items re-ordered.', 'jetpack' ) );
	}

	function no_title_sorting( $columns ) {
		if ( isset( $columns['title'] ) )
			unset( $columns['title'] );
		return $columns;
	}

	function setup_menu_item_columns() {
		add_filter( sprintf( 'manage_edit-%s_sortable_columns', self::MENU_ITEM_POST_TYPE ), array( $this, 'no_title_sorting' ) );
		add_filter( sprintf( 'manage_%s_posts_columns', self::MENU_ITEM_POST_TYPE ), array( $this, 'menu_item_columns' ) );

		add_action( sprintf( 'manage_%s_posts_custom_column', self::MENU_ITEM_POST_TYPE ), array( $this, 'menu_item_column_callback' ), 10, 2 );
	}

	function menu_item_columns( $columns ) {
		unset( $columns['date'], $columns['likes'] );

		$columns['thumbnail'] = __( 'Thumbnail', 'jetpack' );
		$columns['labels']    = __( 'Labels',    'jetpack' );
		$columns['price']     = __( 'Price',     'jetpack' );
		$columns['order']     = __( 'Order',     'jetpack' );

		return $columns;
	}

	function menu_item_column_callback( $column, $post_id ) {
		$screen = get_current_screen();

		switch ( $column ) {
			case 'thumbnail':
				echo get_the_post_thumbnail( $post_id, array( 50, 50 ) );
				break;
			case 'labels' :
				$this->list_admin_labels( $post_id );
				break;
			case 'price' :
				$this->display_price( $post_id );
				break;
			case 'order' :
				$url = admin_url( $screen->parent_file );

				$up_url = add_query_arg( array(
					'action' => 'move-item-up',
					'post_id' => (int) $post_id,
				), wp_nonce_url( $url, 'nova_move_item_up_' . $post_id ) );

				$down_url = add_query_arg( array(
					'action' => 'move-item-down',
					'post_id' => (int) $post_id,
				), wp_nonce_url( $url, 'nova_move_item_down_' . $post_id ) );
				$menu_item = get_post($post_id);
				$this->get_menu_by_post_id( $post_id );
				if ( $term_id = $this->get_menu_by_post_id( $post_id ) ) {
					$term_id = $term_id->term_id;
				}
	?>
				<input type="hidden" class="menu-order-value" name="nova_order[<?php echo (int) $post_id ?>]" value="<?php echo esc_attr( $menu_item->menu_order ) ?>" />
				<input type="hidden" class='nova-menu-term' name="nova_menu_term[<?php echo (int) $post_id ?>]" value="<?php echo esc_attr( $term_id ); ?>">

				<span class="hide-if-js">
				&nbsp; &nbsp; &mdash; <a class="nova-move-item-up" data-post-id="<?php echo (int) $post_id; ?>" href="<?php echo esc_url( $up_url ); ?>">up</a>
				<br />
				&nbsp; &nbsp; &mdash; <a class="nova-move-item-down" data-post-id="<?php echo (int) $post_id; ?>" href="<?php echo esc_url( $down_url ); ?>">down</a>
				</span>
	<?php
				break;
		}
	}

	function get_menu_by_post_id( $post_id = null ) {
		if ( ! $post_id )
			return false;

		$terms = get_the_terms( $post_id, self::MENU_TAX );

		if ( ! is_array( $terms ) )
			return false;

		return array_pop( $terms );
	}

	/**
	 * Fires on a menu edit page. We might have drag-n-drop reordered
	 */
	function maybe_reorder_menu_items() {
		// make sure we clicked our button
		if ( ! ( isset( $_REQUEST['menu_reorder_submit'] ) && $_REQUEST['menu_reorder_submit'] === __( 'Save New Order', 'jetpack' ) ) )
			return;
		;

		// make sure we have the nonce
		if ( ! ( isset( $_REQUEST['drag-drop-reorder'] ) && wp_verify_nonce( $_REQUEST['drag-drop-reorder'], 'drag-drop-reorder' ) ) )
			return;

		$term_pairs = array_map( 'absint', $_REQUEST['nova_menu_term'] );
		$order_pairs = array_map( 'absint', $_REQUEST['nova_order'] );

		foreach( $order_pairs as $ID => $menu_order ) {
			$ID = absint( $ID );
			unset( $order_pairs[$ID] );
			if ( $ID < 0 )
				continue;

			$post = get_post( $ID );
			if ( ! $post )
				continue;

			// save a write if the order hasn't changed
			if ( $menu_order != $post->menu_order )
				wp_update_post( compact( 'ID', 'menu_order' ) );

			// save a write if the term hasn't changed
			if ( $term_pairs[$ID] != $this->get_menu_by_post_id( $ID )->term_id )
				wp_set_object_terms( $ID, $term_pairs[$ID], self::MENU_TAX );

		}

		$redirect = add_query_arg( array(
			'post_type' => self::MENU_ITEM_POST_TYPE,
			'nova_reordered' => '1'
		), admin_url( 'edit.php' ) );
		wp_safe_redirect( $redirect );
		exit;

	}

	function edit_menu_items_page_load() {
		if ( isset( $_GET['action'] ) ) {
			$this->handle_menu_item_actions();
		}

		$this->maybe_reorder_menu_items();

		wp_enqueue_script(
			'nova-drag-drop',
			Assets::get_file_url_for_environment(
				'_inc/build/custom-post-types/js/nova-drag-drop.min.js',
				'modules/custom-post-types/js/nova-drag-drop.js'
			),
			array( 'jquery-ui-sortable' ),
			$this->version,
			true
		);

		wp_localize_script( 'nova-drag-drop', '_novaDragDrop', array(
			'nonce'       => wp_create_nonce( 'drag-drop-reorder' ),
			'nonceName'   => 'drag-drop-reorder',
			'reorder'     => __( 'Save New Order', 'jetpack' ),
			'reorderName' => 'menu_reorder_submit'
		) );
		add_action( 'the_post', array( $this, 'show_menu_titles_in_menu_item_list' ) );
	}

	function handle_menu_item_actions() {
		$action = (string) $_GET['action'];

		switch ( $action ) {
		case 'move-item-up' :
		case 'move-item-down' :
			$reorder = false;

			$post_id = (int) $_GET['post_id'];

			$term = $this->get_menu_item_menu_leaf( $post_id );

			// Get all posts in that term
			$query = new WP_Query( array(
				'taxonomy' => self::MENU_TAX,
				'term'     => $term->slug,
			) );

			$order = array();
			foreach ( $query->posts as $post ) {
				$order[] = $post->ID;
			}

			if ( 'move-item-up' == $action ) {
				check_admin_referer( 'nova_move_item_up_' . $post_id );

				$first_post_id = $order[0];
				if ( $post_id == $first_post_id ) {
					break;
				}

				foreach ( $order as $menu_order => $order_post_id ) {
					if ( $post_id != $order_post_id ) {
						continue;
					}

					$swap_post_id = $order[$menu_order - 1];
					$order[$menu_order - 1] = $post_id;
					$order[$menu_order] = $swap_post_id;

					$reorder = true;
					break;
				}
			} else {
				check_admin_referer( 'nova_move_item_down_' . $post_id );

				$last_post_id = end( $order );
				if ( $post_id == $last_post_id ) {
					break;
				}

				foreach ( $order as $menu_order => $order_post_id ) {
					if ( $post_id != $order_post_id ) {
						continue;
					}

					$swap_post_id = $order[$menu_order + 1];
					$order[$menu_order + 1] = $post_id;
					$order[$menu_order] = $swap_post_id;

					$reorder = true;
				}
			}

			if ( $reorder ) {
				foreach ( $order as $menu_order => $ID ) {
					wp_update_post( compact( 'ID', 'menu_order' ) );
				}
			}

			break;
		case 'move-menu-up' :
		case 'move-menu-down' :
			$reorder = false;

			$term_id = (int) $_GET['term_id'];

			$terms = $this->get_menus();

			$order = array();
			foreach ( $terms as $term ) {
				$order[] = $term->term_id;
			}

			if ( 'move-menu-up' == $action ) {
				check_admin_referer( 'nova_move_menu_up_' . $term_id );

				$first_term_id = $order[0];
				if ( $term_id == $first_term_id ) {
					break;
				}

				foreach ( $order as $menu_order => $order_term_id ) {
					if ( $term_id != $order_term_id ) {
						continue;
					}

					$swap_term_id = $order[$menu_order - 1];
					$order[$menu_order - 1] = $term_id;
					$order[$menu_order] = $swap_term_id;

					$reorder = true;
					break;
				}
			} else {
				check_admin_referer( 'nova_move_menu_down_' . $term_id );

				$last_term_id = end( $order );
				if ( $term_id == $last_term_id ) {
					break;
				}

				foreach ( $order as $menu_order => $order_term_id ) {
					if ( $term_id != $order_term_id ) {
						continue;
					}

					$swap_term_id = $order[$menu_order + 1];
					$order[$menu_order + 1] = $term_id;
					$order[$menu_order] = $swap_term_id;

					$reorder = true;
				}
			}

			if ( $reorder ) {
				update_option( 'nova_menu_order', $order );
			}

			break;
		default :
			return;
		}

		$redirect = add_query_arg( array(
			'post_type' => self::MENU_ITEM_POST_TYPE,
			'nova_reordered' => '1'
		), admin_url( 'edit.php' ) );
		wp_safe_redirect( $redirect );
		exit;
	}

	/*
	 * Add menu title rows to the list table
	 */
	function show_menu_titles_in_menu_item_list( $post ) {
		global $wp_list_table;

		static $last_term_id = false;

		$term = $this->get_menu_item_menu_leaf( $post->ID );

		$term_id = $term instanceof WP_Term ? $term->term_id : null;

		if ( false !== $last_term_id && $last_term_id === $term_id ) {
			return;
		}

		if ( is_null( $term_id ) ) {
			$last_term_id = null;
			$term_name = '';
			$parent_count = 0;
		} else {
			$last_term_id = $term->term_id;
			$term_name = $term->name;
			$parent_count = 0;
			$current_term = $term;
			while ( $current_term->parent ) {
				$parent_count++;
				$current_term = get_term( $current_term->parent, self::MENU_TAX );
			}
		}

		$non_order_column_count = $wp_list_table->get_column_count() - 1;

		$screen = get_current_screen();

		$url = admin_url( $screen->parent_file );

		$up_url = add_query_arg( array(
			'action'  => 'move-menu-up',
			'term_id' => (int) $term_id,
		), wp_nonce_url( $url, 'nova_move_menu_up_' . $term_id ) );

		$down_url = add_query_arg( array(
			'action'  => 'move-menu-down',
			'term_id' => (int) $term_id,
		), wp_nonce_url( $url, 'nova_move_menu_down_' . $term_id ) );

?>
		<tr class="no-items menu-label-row" data-term_id="<?php echo esc_attr( $term_id ) ?>">
			<td class="colspanchange" colspan="<?php echo (int) $non_order_column_count; ?>">
				<h3><?php
					echo str_repeat( ' &mdash; ', (int) $parent_count );

					if ( $term instanceof WP_Term ) {
						echo esc_html( sanitize_term_field( 'name', $term_name, $term_id, self::MENU_TAX, 'display' ) );
						edit_term_link( __( 'edit', 'jetpack' ), '<span class="edit-nova-section"><span class="dashicon dashicon-edit"></span>', '</span>', $term );

					} else {
						_e( 'Uncategorized' , 'jetpack' );
					}
				?></h3>
			</td>
			<td>
				<?php if ( $term instanceof WP_Term ) { ?>
				<a class="nova-move-menu-up" title="<?php esc_attr_e( 'Move menu section up', 'jetpack' ); ?>" href="<?php echo esc_url( $up_url ); ?>"><?php esc_html_e( 'UP', 'jetpack' ); ?></a>
				<br />
				<a class="nova-move-menu-down" title="<?php esc_attr_e( 'Move menu section down', 'jetpack' ); ?>" href="<?php echo esc_url( $down_url ); ?>"><?php esc_html_e( 'DOWN', 'jetpack' ); ?></a>
				<?php } ?>
			</td>
		</tr>
<?php
	}

/* Edit Many Items */

	function add_many_new_items_page_load() {
		if ( 'POST' === strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
			$this->process_form_request();
			exit;
		}

		$this->enqueue_many_items_scripts();
	}

	function enqueue_many_items_scripts() {
		wp_enqueue_script(
			'nova-many-items',
			Assets::get_file_url_for_environment(
				'_inc/build/custom-post-types/js/many-items.min.js',
				'modules/custom-post-types/js/many-items.js'
			),
			array( 'jquery' ),
			$this->version,
			true
		);
	}

	function process_form_request() {
		if ( !isset( $_POST['nova_title'] ) || !is_array( $_POST['nova_title'] ) ) {
			return;
		}

		$is_ajax = !empty( $_POST['ajax'] );

		if ( $is_ajax ) {
			check_ajax_referer( 'nova_many_items' );
		} else {
			check_admin_referer( 'nova_many_items' );
		}

		foreach ( array_keys( $_POST['nova_title'] ) as $key ) :
			// $_POST is already slashed
			$post_details = array(
				'post_status'  => 'publish',
				'post_type'    => self::MENU_ITEM_POST_TYPE,
				'post_content' => $_POST['nova_content'][$key],
				'post_title'   => $_POST['nova_title'][$key],
				'tax_input'    => array(
					self::MENU_ITEM_LABEL_TAX => $_POST['nova_labels'][$key],
					self::MENU_TAX            => isset( $_POST['nova_menu_tax'] ) ? $_POST['nova_menu_tax'] : null,
				),
			);

			$post_id = wp_insert_post( $post_details );
			if ( !$post_id || is_wp_error( $post_id ) ) {
				continue;
			}

			$this->set_price( $post_id, isset( $_POST['nova_price'][$key] ) ? stripslashes( $_POST['nova_price'][$key] ) : '' );

			if ( $is_ajax ) :
				$post = get_post( $post_id );
				$GLOBALS['post'] = $post;
				setup_postdata( $post );

?>
			<td><?php the_title(); ?></td>
			<td class="nova-price"><?php $this->display_price(); ?></td>
			<td><?php $this->list_labels( $post_id ); ?></td>
			<td><?php the_content(); ?></td>
<?php
			endif;

		endforeach;

		if ( $is_ajax ) {
			exit;
		}

		wp_safe_redirect( admin_url( 'edit.php?post_type=' . self::MENU_ITEM_POST_TYPE ) );
		exit;
	}

	function add_many_new_items_page() {
?>
	<div class="wrap">
		<h2><?php esc_html_e( 'Add Many Items', 'jetpack' ); ?></h2>

		<p><?php _e( 'Use the <kbd>TAB</kbd> key on your keyboard to move between colums and the <kbd>ENTER</kbd> or <kbd>RETURN</kbd> key to save each row and move on to the next.', 'jetpack' ); ?></p>

		<form method="post" action="" enctype="multipart/form-data">
			<p><h3><?php esc_html_e( 'Add to section:', 'jetpack' ); ?> <?php wp_dropdown_categories( array(
				'id'           => 'nova-menu-tax',
				'name'         => 'nova_menu_tax',
				'taxonomy'     => self::MENU_TAX,
				'hide_empty'   => false,
				'hierarchical' => true,
			) ); ?></h3></p>

			<table class="many-items-table wp-list-table widefat">
				<thead>
					<tr>
						<th scope="col"><?php esc_html_e( 'Name', 'jetpack' ); ?></th>
						<th scope="col" class="nova-price"><?php esc_html_e( 'Price', 'jetpack' ); ?></th>
						<th scope="col"><?php _e( 'Labels: <small>spicy, favorite, etc. <em>Separate Labels with commas</em></small>', 'jetpack' ); ?></th>
						<th scope="col"><?php esc_html_e( 'Description', 'jetpack' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><input type="text" name="nova_title[]" aria-required="true" /></td>
						<td class="nova-price"><input type="text" name="nova_price[]" /></td>
						<td><input type="text" name="nova_labels[]" /></td>
						<td><textarea name="nova_content[]" cols="20" rows="1"></textarea>
					</tr>
				</tbody>
				<tbody>
					<tr>
						<td><input type="text" name="nova_title[]" aria-required="true" /></td>
						<td class="nova-price"><input type="text" name="nova_price[]" /></td>
						<td><input type="text" name="nova_labels[]" /></td>
						<td><textarea name="nova_content[]" cols="20" rows="1"></textarea>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<th><a class="button button-secondary nova-new-row"><span class="dashicon dashicon-plus"></span> <?php esc_html_e( 'New Row' , 'jetpack' ); ?></a></th>
						<th class="nova-price"></th>
						<th></th>
						<th></th>
					</tr>
				</tfoot>
			</table>

			<p class="submit">
				<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Add These New Menu Items', 'jetpack' ); ?>" />
				<?php wp_nonce_field( 'nova_many_items' ); ?>
			</p>
		</form>
	</div>
<?php
	}

/* Edit One Item */

	function register_menu_item_meta_boxes() {
		wp_enqueue_script( 'nova-menu-checkboxes' );

		add_meta_box( 'menu_item_price', __( 'Price', 'jetpack' ), array( $this, 'menu_item_price_meta_box' ), null, 'side', 'high' );
	}

	function menu_item_price_meta_box( $post, $meta_box ) {
		$price = $this->get_price( $post->ID );
?>
	<label for="nova-price-<?php echo (int) $post->ID; ?>" class="screen-reader-text"><?php esc_html_e( 'Price', 'jetpack' ); ?></label>
	<input type="text" id="nova-price-<?php echo (int) $post->ID; ?>" class="widefat" name="nova_price[<?php echo (int) $post->ID; ?>]" value="<?php echo esc_attr( $price ); ?>" />
<?php
	}

	function add_post_meta( $post_id ) {
		if ( !isset( $_POST['nova_price'][$post_id] ) ) {
			return;
		}

		$this->set_price( $post_id, stripslashes( $_POST['nova_price'][$post_id] ) );
	}

/* Data */

	function get_menus( $args = array() ) {
		$args = wp_parse_args( $args, array(
			'hide_empty' => false,
		) );

		$terms = get_terms( self::MENU_TAX, $args );
		if ( !$terms || is_wp_error( $terms ) ) {
			return array();
		}

		$terms_by_id = array();
		foreach ( $terms as $term ) {
			$terms_by_id["{$term->term_id}"] = $term;
		}

		$term_order = get_option( 'nova_menu_order', array() );

		$return = array();
		foreach ( $term_order as $term_id ) {
			if ( isset( $terms_by_id["$term_id"] ) ) {
				$return[] = $terms_by_id["$term_id"];
				unset( $terms_by_id["$term_id"] );
			}
		}

		foreach ( $terms_by_id as $term_id => $term ) {
			$return[] = $term;
		}

		return $return;
	}

	function get_menu_item_menu_leaf( $post_id ) {
		// Get first menu taxonomy "leaf"
		$term_ids = wp_get_object_terms( $post_id, self::MENU_TAX, array( 'fields' => 'ids' ) );

		foreach ( $term_ids as $term_id ) {
			$children = get_term_children( $term_id, self::MENU_TAX );
			if ( ! $children ) {
				break;
			}
		}

		if ( ! isset( $term_id ) ) {
			return false;
		}

		return get_term( $term_id, self::MENU_TAX );

	}

	function list_labels( $post_id = 0 ) {
		$post = get_post( $post_id );
		echo get_the_term_list( $post->ID, self::MENU_ITEM_LABEL_TAX, '', _x( ', ', 'Nova label separator', 'jetpack' ), '' );
	}

	function list_admin_labels( $post_id = 0 ) {
		$post = get_post( $post_id );
		$labels = get_the_terms( $post->ID, self::MENU_ITEM_LABEL_TAX );
		if ( !empty( $labels ) ) {
			$out = array();
			foreach ( $labels as $label ) {
				$out[] = sprintf( '<a href="%s">%s</a>',
					esc_url( add_query_arg( array(
						'post_type' => self::MENU_ITEM_POST_TYPE,
						'taxonomy'  => self::MENU_ITEM_LABEL_TAX,
						'term'      => $label->slug
					), 'edit.php' ) ),
					esc_html( sanitize_term_field( 'name', $label->name, $label->term_id, self::MENU_ITEM_LABEL_TAX, 'display' ) )
				);
			}

			echo join( _x( ', ', 'Nova label separator', 'jetpack' ), $out );
		} else {
			esc_html_e( 'No Labels', 'jetpack' );
		}
	}

	function set_price( $post_id = 0, $price = '' ) {
		$post = get_post( $post_id );

		return update_post_meta( $post->ID, 'nova_price', $price );
	}

	function get_price( $post_id = 0 ) {
		$post = get_post( $post_id );

		return get_post_meta( $post->ID, 'nova_price', true );
	}

	function display_price( $post_id = 0 ) {
		echo esc_html( $this->get_price( $post_id ) );
	}

/* Menu Item Loop Markup */

	/* Does not support nested loops */

	function get_menu_item_loop_markup( $field = null ) {
		return $this->menu_item_loop_markup;
	}

	/**
	 * Sets up the loop markup.
	 * Attached to the 'template_include' *filter*,
	 * which fires only during a real blog view (not in admin, feeds, etc.)
	 *
	 * @param string Template File
	 * @return string Template File.  VERY Important.
	 */
	function setup_menu_item_loop_markup__in_filter( $template ) {
		add_action( 'loop_start', array( $this, 'start_menu_item_loop' ) );

		return $template;
	}

	/**
	 * If the Query is a Menu Item Query, start outputing the Menu Item Loop Marku
	 * Attached to the 'loop_start' action.
	 *
	 * @param WP_Query
	 */
	function start_menu_item_loop( $query ) {
		if ( !$this->is_menu_item_query( $query ) ) {
			return;
		}

		$this->menu_item_loop_last_term_id = false;
		$this->menu_item_loop_current_term = false;

		add_action( 'the_post', array( $this, 'menu_item_loop_each_post' ) );
		add_action( 'loop_end', array( $this, 'stop_menu_item_loop' ) );
	}

	/**
	 * Outputs the Menu Item Loop Marku
	 * Attached to the 'the_post' action.
	 *
	 * @param WP_Post
	 */
	function menu_item_loop_each_post( $post ) {
		$this->menu_item_loop_current_term = $this->get_menu_item_menu_leaf( $post->ID );

		if ( false === $this->menu_item_loop_last_term_id ) {
			// We're at the very beginning of the loop

			$this->menu_item_loop_open_element( 'menu' ); // Start a new menu section
			$this->menu_item_loop_header(); // Output the menu's header
		} elseif ( $this->menu_item_loop_last_term_id != $this->menu_item_loop_current_term->term_id ) {
			// We're not at the very beginning but still need to start a new menu section.  End the previous menu section first.

			$this->menu_item_loop_close_element( 'menu' ); // End the previous menu section
			$this->menu_item_loop_open_element( 'menu' ); // Start a new menu section
			$this->menu_item_loop_header(); // Output the menu's header
		}

		$this->menu_item_loop_last_term_id = $this->menu_item_loop_current_term->term_id;
	}

	/**
	 * If the Query is a Menu Item Query, stop outputing the Menu Item Loop Marku
	 * Attached to the 'loop_end' action.
	 *
	 * @param WP_Query
	 */
	function stop_menu_item_loop( $query ) {
		if ( !$this->is_menu_item_query( $query ) ) {
			return;
		}

		remove_action( 'the_post', array( $this, 'menu_item_loop_each_post' ) );
		remove_action( 'loop_start', array( $this, 'start_menu_item_loop' ) );
		remove_action( 'loop_end', array( $this, 'stop_menu_item_loop' ) );

		$this->menu_item_loop_close_element( 'menu' ); // End the last menu section
	}

	/**
	 * Outputs the Menu Group Header
	 */
	function menu_item_loop_header() {
		$this->menu_item_loop_open_element( 'menu_header' );
			$this->menu_item_loop_open_element( 'menu_title' );
				echo esc_html( $this->menu_item_loop_current_term->name ); // @todo tax filter
			$this->menu_item_loop_close_element( 'menu_title' );
		if ( $this->menu_item_loop_current_term->description ) :
			$this->menu_item_loop_open_element( 'menu_description' );
				echo esc_html( $this->menu_item_loop_current_term->description ); // @todo kses, tax filter
			$this->menu_item_loop_close_element( 'menu_description' );
		endif;
		$this->menu_item_loop_close_element( 'menu_header' );
	}

	/**
	 * Outputs a Menu Item Markup element opening tag
	 *
	 * @param string $field - Menu Item Markup settings field.
	 */
	function menu_item_loop_open_element( $field ) {
		$markup = $this->get_menu_item_loop_markup();
		/**
		 * Filter a menu item's element opening tag.
		 *
		 * @module custom-content-types
		 *
		 * @since 4.4.0
		 *
		 * @param string       $tag    Menu item's element opening tag.
		 * @param string       $field  Menu Item Markup settings field.
		 * @param array        $markup Array of markup elements for the menu item.
		 * @param false|object $term   Taxonomy term for current menu item.
		 */
		echo apply_filters(
			'jetpack_nova_menu_item_loop_open_element',
			'<' . tag_escape( $markup["{$field}_tag"] ) . $this->menu_item_loop_class( $markup["{$field}_class"] ) . ">\n",
			$field,
			$markup,
			$this->menu_item_loop_current_term
		);
	}

	/**
	 * Outputs a Menu Item Markup element closing tag
	 *
	 * @param string $field - Menu Item Markup settings field
	 */
	function menu_item_loop_close_element( $field ) {
		$markup = $this->get_menu_item_loop_markup();
		/**
		 * Filter a menu item's element closing tag.
		 *
		 * @module custom-content-types
		 *
		 * @since 4.4.0
		 *
		 * @param string       $tag    Menu item's element closing tag.
		 * @param string       $field  Menu Item Markup settings field.
		 * @param array        $markup Array of markup elements for the menu item.
		 * @param false|object $term   Taxonomy term for current menu item.
		 */
		echo apply_filters(
			'jetpack_nova_menu_item_loop_close_element',
			'</' . tag_escape( $markup["{$field}_tag"] ) . ">\n",
			$field,
			$markup,
			$this->menu_item_loop_current_term
		);
	}

	/**
	 * Returns a Menu Item Markup element's class attribute.
	 *
	 * @param  string $class Class name.
	 * @return string HTML   class attribute with leading whitespace.
	 */
	function menu_item_loop_class( $class ) {
		if ( ! $class ) {
			return '';
		}

		/**
		 * Filter a menu Item Markup element's class attribute.
		 *
		 * @module custom-content-types
		 *
		 * @since 4.4.0
		 *
		 * @param string       $tag    Menu Item Markup element's class attribute.
		 * @param string       $class  Menu Item Class name.
		 * @param false|object $term   Taxonomy term for current menu item.
		 */
		return apply_filters(
			'jetpack_nova_menu_item_loop_class',
			' class="' . esc_attr( $class ) . '"',
			$class,
			$this->menu_item_loop_current_term
		);
	}
}

add_action( 'init', array( 'Nova_Restaurant', 'init' ) );
