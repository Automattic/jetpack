<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Manage restaurant menus from your WordPress site,
 * via a new "nova" CPT.
 *
 * Put the following code in your theme's Food Menu Page Template to customize the markup of the menu.
 *
 * if ( class_exists( 'Nova_Restaurant' ) ) {
 *  Nova_Restaurant::init( array(
 *      'menu_tag'               => 'section',
 *      'menu_class'             => 'menu-items',
 *      'menu_header_tag'        => 'header',
 *      'menu_header_class'      => 'menu-group-header',
 *      'menu_title_tag'         => 'h1',
 *      'menu_title_class'       => 'menu-group-title',
 *      'menu_description_tag'   => 'div',
 *      'menu_description_class' => 'menu-group-description',
 *  ) );
 * }
 *
 * @todo
 * - Bulk/Quick edit response of Menu Item rows is broken.
 * - Drag and Drop reordering.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( '\Nova_Restaurant' ) ) {

	/**
	 * Create the new Nova CPT.
	 */
	class Nova_Restaurant {
		const MENU_ITEM_POST_TYPE = 'nova_menu_item';
		const MENU_ITEM_LABEL_TAX = 'nova_menu_item_label';
		const MENU_TAX            = 'nova_menu';

		/**
		 * Store an instance of the new class
		 *
		 * @var Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant
		 */
		protected $new_instance;

		/**
		 * Version number used when enqueuing all resources (css and js).
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @var string
		 */
		public $version = '20210303';

		/**
		 * Default markup for the menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @var array
		 */
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

		/**
		 * Array of markup for the menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @var array
		 */
		protected $menu_item_loop_markup = array();

		/**
		 * Last term ID of a loop of menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @var bool|int
		 */
		protected $menu_item_loop_last_term_id = false;

		/**
		 * Current term ID of a loop of menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @var bool|int
		 */
		protected $menu_item_loop_current_term = false;

		/**
		 * Initialize class.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param array $menu_item_loop_markup Array of markup for the menu items.
		 *
		 * @return Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant
		 */
		public static function init( $menu_item_loop_markup = array() ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant::init( $menu_item_loop_markup );
		}

		/**
		 * Constructor.
		 * Hook into WordPress to create CPT and utilities if needed.
		 */
		public function __construct() {
			$this->new_instance = new Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant();
		}

		/**
		 * Forward all method calls to the Nova_Restaurant class.
		 *
		 * @param string $name The name of the method.
		 * @param array  $arguments The arguments to pass to the method.
		 *
		 * @throws Exception If the method is not found.
		 */
		public function __call( $name, $arguments ) {
			if ( method_exists( $this->new_instance, $name ) ) {
				return call_user_func_array( array( $this->new_instance, $name ), $arguments );
			} else {
				// Handle cases where the method is not found
				throw new Exception( sprintf( 'Undefined method: %s', esc_html( $name ) ) );
			}
		}

		/**
		 * Forward all static method calls to the Nova_Restaurant class.
		 *
		 * @param string $name The name of the method.
		 * @param array  $arguments The arguments to pass to the method.
		 *
		 * @throws Exception If the method is not found.
		 */
		public static function __callStatic( $name, $arguments ) {
			if ( method_exists( Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant::class, $name ) ) {
				return call_user_func_array( array( Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant::class, $name ), $arguments );
			} else {
				// Handle cases where the method is not found
				throw new Exception( sprintf( 'Undefined static method: %s', esc_html( $name ) ) );
			}
		}

		/**
		 * Should this Custom Post Type be made available?
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return bool
		 */
		public function site_supports_nova() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->site_supports_nova();
		}

		/* Setup */

		/**
		 * Register Taxonomies and Post Type
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 */
		public function register_taxonomies() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->register_taxonomies();
		}

		/**
		 * Register our Post Type.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 */
		public function register_post_types() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->register_post_types();
		}

		/**
		 * Update messages for the Menu Item admin.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param array $messages Existing post update messages.
		 *
		 * @return array $messages Updated post update messages.
		 */
		public function updated_messages( $messages ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->updated_messages( $messages );
		}

		/**
		 * Nova styles and scripts.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $hook Page hook.
		 *
		 * @return void
		 */
		public function enqueue_nova_styles( $hook ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->enqueue_nova_styles( $hook );
		}

		/**
		 * Change ‘Enter Title Here’ text for the Menu Item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $title Default title placeholder text.
		 *
		 * @return string
		 */
		public function change_default_title( $title ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->change_default_title( $title );
		}

		/**
		 * Add to Dashboard At A Glance
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function add_to_dashboard() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->add_to_dashboard();
		}

		/**
		 * If the WP query for our menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Query $query WP Query.
		 *
		 * @return bool
		 */
		public function is_menu_item_query( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->is_menu_item_query( $query );
		}

		/**
		 * Custom sort the menu item queries by menu order.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Query $query WP Query.
		 *
		 * @return void
		 */
		public function sort_menu_item_queries_by_menu_order( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->sort_menu_item_queries_by_menu_order( $query );
		}

		/**
		 * Custom sort the menu item queries by menu taxonomies.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Post[] $posts Array of post objects.
		 * @param WP_Query  $query The WP_Query instance.
		 *
		 * @return WP_Post[]
		 */
		public function sort_menu_item_queries_by_menu_taxonomy( $posts, $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->sort_menu_item_queries_by_menu_taxonomy( $posts, $query );
		}

		/**
		 * Add new "Add many items" submenu, custom colunmns, and custom bulk actions.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function add_admin_menus() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->add_admin_menus();
		}

		/**
		 * Custom Nova Icon CSS
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function set_custom_font_icon() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->set_custom_font_icon();
		}

		/**
		 * Load Nova menu management tools on the CPT admin screen.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function current_screen_load() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->current_screen_load();
		}

		/* Edit Items List */

		/**
		 * Display a notice in wp-admin after items have been changed.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function admin_notices() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->admin_notices();
		}

		/**
		 * Do not allow sorting by title.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param array $columns An array of sortable columns.
		 *
		 * @return array $columns.
		 */
		public function no_title_sorting( $columns ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->no_title_sorting( $columns );
		}

		/**
		 * Set up custom columns for our Nova menu.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function setup_menu_item_columns() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->setup_menu_item_columns();
		}

		/**
		 * Add custom columns to the Nova menu item list.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param array $columns An array of columns.
		 *
		 * @return array $columns.
		 */
		public function menu_item_columns( $columns ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->menu_item_columns( $columns );
		}

		/**
		 * Display custom data in each new custom column we created.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $column  The name of the column to display.
		 * @param int    $post_id The current post ID.
		 *
		 * @return void
		 */
		public function menu_item_column_callback( $column, $post_id ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_column_callback( $column, $post_id );
		}

		/**
		 * Get menu item by post ID.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return bool|WP_Term
		 */
		public function get_menu_by_post_id( $post_id = null ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->get_menu_by_post_id( $post_id );
		}

		/**
		 * Fires on a menu edit page. We might have drag-n-drop reordered
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 */
		public function maybe_reorder_menu_items() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->maybe_reorder_menu_items();
		}

		/**
		 * Handle changes to menu items.
		 * (process actions, update data, enqueue necessary scripts).
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function edit_menu_items_page_load() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->edit_menu_items_page_load();
		}

		/**
		 * Process actions to move menu items around.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function handle_menu_item_actions() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->handle_menu_item_actions();
		}

		/**
		 * Add menu title rows to the list table
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Post $post The Post object.
		 *
		 * @return void
		 */
		public function show_menu_titles_in_menu_item_list( $post ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->show_menu_titles_in_menu_item_list( $post );
		}

		/* Edit Many Items */

		/**
		 * Handle form submissions that aim to add many menu items at once.
		 * (process posted data and enqueue necessary script).
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function add_many_new_items_page_load() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->add_many_new_items_page_load();
		}

		/**
		 * Enqueue script to create many items at once.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function enqueue_many_items_scripts() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->enqueue_many_items_scripts();
		}

		/**
		 * Process form request to create many items at once.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function process_form_request() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->process_form_request();
		}

		/**
		 * Admin page contents for adding many menu items at once.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function add_many_new_items_page() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->add_many_new_items_page();
		}

		/* Edit One Item */

		/**
		 * Create admin meta box to save price for a menu item,
		 * and add script to add extra checkboxes to the UI.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function register_menu_item_meta_boxes() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->register_menu_item_meta_boxes();
		}

		/**
		 * Meta box to edit the price of a menu item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Post $post The post object.
		 *
		 * @return void
		 */
		public function menu_item_price_meta_box( $post ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_price_meta_box( $post );
		}

		/**
		 * Save the price of a menu item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 */
		public function add_post_meta( $post_id ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->add_post_meta( $post_id );
		}

		/* Data */

		/**
		 * Get ordered array of menu items.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param array $args Optional argumments.
		 *
		 * @return array
		 */
		public function get_menus( $args = array() ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->get_menus( $args );
		}

		/**
		 * Get first menu taxonomy "leaf".
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return bool|WP_Term|WP_Error|null
		 */
		public function get_menu_item_menu_leaf( $post_id ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->get_menu_item_menu_leaf( $post_id );
		}

		/**
		 * Get a list of the labels linked to a menu item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return void
		 */
		public function list_labels( $post_id = 0 ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->list_labels( $post_id );
		}

		/**
		 * Get a list of the labels linked to a menu item, with links to manage them.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return void
		 */
		public function list_admin_labels( $post_id = 0 ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->list_admin_labels( $post_id );
		}

		/**
		 * Update post meta with the price defined in meta box.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int    $post_id Post ID.
		 * @param string $price   Price.
		 *
		 * @return int|bool
		 */
		public function set_price( $post_id = 0, $price = '' ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->set_price( $post_id, $price );
		}

		/**
		 * Get the price of a menu item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return bool|string
		 */
		public function get_price( $post_id = 0 ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->get_price( $post_id );
		}

		/**
		 * Echo the price of a menu item.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param int $post_id Post ID.
		 *
		 * @return void
		 */
		public function display_price( $post_id = 0 ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->display_price( $post_id );
		}

		/* Menu Item Loop Markup */

		/**
		 * Get markup for a menu item.
		 * Note: Does not support nested loops.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param null|string $field The field to get the value for.
		 *
		 * @return array
		 */
		public function get_menu_item_loop_markup( $field = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->get_menu_item_loop_markup( $field );
		}

		/**
		 * Sets up the loop markup.
		 * Attached to the 'template_include' *filter*,
		 * which fires only during a real blog view (not in admin, feeds, etc.)
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $template Template File.
		 *
		 * @return string Template File.  VERY Important.
		 */
		public function setup_menu_item_loop_markup__in_filter( $template ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->setup_menu_item_loop_markup__in_filter( $template );
		}

		/**
		 * If the Query is a Menu Item Query, start outputing the Menu Item Loop Marku
		 * Attached to the 'loop_start' action.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Query $query Post query.
		 *
		 * @return void
		 */
		public function start_menu_item_loop( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->start_menu_item_loop( $query );
		}

		/**
		 * Outputs the Menu Item Loop Marku
		 * Attached to the 'the_post' action.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Post $post Post object.
		 *
		 * @return void
		 */
		public function menu_item_loop_each_post( $post ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_loop_each_post( $post );
		}

		/**
		 * If the Query is a Menu Item Query, stop outputing the Menu Item Loop Marku
		 * Attached to the 'loop_end' action.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param WP_Query $query Post query.
		 *
		 * @return void
		 */
		public function stop_menu_item_loop( $query ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->stop_menu_item_loop( $query );
		}

		/**
		 * Outputs the Menu Group Header
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @return void
		 */
		public function menu_item_loop_header() {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_loop_header();
		}

		/**
		 * Outputs a Menu Item Markup element opening tag
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $field - Menu Item Markup settings field.
		 *
		 * @return void
		 */
		public function menu_item_loop_open_element( $field ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_loop_open_element( $field );
		}

		/**
		 * Outputs a Menu Item Markup element closing tag
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param string $field - Menu Item Markup settings field.
		 *
		 * @return void
		 */
		public function menu_item_loop_close_element( $field ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			$this->new_instance->menu_item_loop_close_element( $field );
		}

		/**
		 * Returns a Menu Item Markup element's class attribute.
		 *
		 * @deprecated 14.3 Moved to Classic Theme Helper package.
		 *
		 * @param  string $class Class name.
		 *
		 * @return string HTML class attribute with leading whitespace.
		 */
		public function menu_item_loop_class( $class ) {
			_deprecated_function( __FUNCTION__, 'jetpack-14.3' );
			return $this->new_instance->menu_item_loop_class( $class );
		}
	}
}
