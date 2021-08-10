<?php
/**
 * The WPAdminPostsListPage Admin Area.
 *
 * @package automattic/jetpack-wp-admin-posts-list-page
 */

namespace Automattic\Jetpack\WPAdminPostsListPage;

use Automattic\Jetpack\Assets;

/**
 * The WPAdminPostsListPage Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_wp_admin_posts_list_page_init' ) ) {
			add_filter( 'query_vars', array( $this, 'add_query_vars' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing WPAdminPostsListPage Admin resources.
			 *
			 * @since 9.8.0
			 */
			do_action( 'jetpack_on_wp_admin_posts_list_page_init' );

			// Add parsed data for each post/page raw.
			add_action( 'manage_posts_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );
			add_action( 'manage_pages_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );

			// Add custom post/page columns.
			add_action( 'manage_posts_columns', array( $this, 'add_wp_admin_posts_list_page_column' ) );
			add_action( 'manage_pages_columns', array( $this, 'add_wp_admin_posts_list_page_column' ) );
		}
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Register wp-admin-posts-list-page query var.
	 *
	 * @param array $vars Current query vars.
	 */
	public function add_query_vars( $vars ) {
		$vars[] = 'wp-admin-posts-list-page';
		return $vars;
	}

	/**
	 * Check whether the wp-admin-posts-list-page feature is enabled,
	 * via the query strinh.
	 *
	 * @return boolean True when feature is active. Otherwise, False.
	 */
	public function is_wp_admin_posts_list_page() {
		$is_wp_admin_posts_list_page = get_query_var( 'wp-admin-posts-list-page' );
		return isset( $is_wp_admin_posts_list_page ) && 'true' === $is_wp_admin_posts_list_page ? true : false;
	}

	/**
	 * Add the WP Admin Plus custom column.
	 *
	 * @param array $columns Columns table.
	 * @return array Columns table, maybe populated.
	 */
	public function add_wp_admin_posts_list_page_column( $columns ) {
		if ( ! self::is_wp_admin_posts_list_page() ) {
			return $columns;
		}

		return array_merge( $columns, array( 'wp-admin-posts-list-page-column' => 'WPAP' ) );
	}

	/**
	 * Pick post data, parse and render in JSON format.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 */
	public function parse_and_render_post_data( $column, $post_id ) {
		if ( ! self::is_wp_admin_posts_list_page() ) {
			return;
		}

		$post = get_post( $post_id );
		if ( 'wp-admin-posts-list-page-column' === $column ) {
			echo '<script type="application/json">';
			echo wp_json_encode(
				array(
					'id'       => $post->ID,
					'type'     => $post->post_type,
					'status'   => $post->post_status,
					'date_gmt' => $post->post_date_gmt,
					'statuses' => self::get_post_statuses( $post_id ),
				)
			);
			echo '</script>';
		}
	}

	/**
	 * Return post statuses definition object,
	 * with especial cases such as `scheduled`, `pending`, etc.
	 *
	 * @param int $post_id The current post ID.
	 * @return array Post statuses object.
	 */
	public function get_post_statuses( $post_id ) {
		return array_merge(
			array(
				'publish' => __( 'Published', 'jetpack' ),
				'private' => __( 'Published', 'jetpack' ),
				'future'  => __( 'Scheduled', 'jetpack' ),
				'pending' => __( 'Pending Review', 'jetpack' ),
				'draft'   => __( 'Draft', 'jetpack' ),
			),
			get_post_statuses( $post_id )
		);
	}

	/**
	 * Enqueue scripts depending on the wp-admin-posts-list-page query var.
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( self::is_wp_admin_posts_list_page() && 'edit.php' === $hook ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';
			$plugin_path  = Assets::get_file_url_for_environment( '../build/index.js', '../build/index.js', __FILE__ );

			wp_enqueue_script(
				'jetpack_wp_admin_posts_list_page_ui_script',
				$plugin_path,
				$build_assets['dependencies'],
				$build_assets['version'],
				true
			);

			wp_enqueue_style(
				'jetpack_wp_admin_posts_list_page_ui_style',
				plugin_dir_url( __DIR__ ) . 'build/style-index.css',
				array( 'wp-components' ),
				$build_assets['version']
			);

			wp_style_add_data(
				'jetpack_wp_admin_posts_list_page_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . 'build/index.rtl.css'
			);

			wp_localize_script(
				'jetpack_wp_admin_posts_list_page_ui_script',
				'Jetpack_WPAdmin_Plus',
				array(
					'postType' => get_query_var( 'post_type' ),
				)
			);
		}
	}
}
