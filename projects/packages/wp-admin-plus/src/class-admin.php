<?php
/**
 * The WPAdminPlus Admin Area.
 *
 * @package automattic/jetpack-wp-admin-plus
 */

namespace Automattic\Jetpack\WPAdminPlus;

use Automattic\Jetpack\Assets;

/**
 * The WPAdminPlus Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_wp_admin_plus_init' ) ) {
			add_filter( 'query_vars', array( $this, 'add_query_vars' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing WPAdminPlus Admin resources.
			 *
			 * @since 9.8.0
			 */
			do_action( 'jetpack_on_wp_admin_plus_init' );

			// Add parsed data for each post/page raw.
			add_action( 'manage_posts_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );
			add_action( 'manage_pages_custom_column', array( $this, 'parse_and_render_post_data' ), 10, 2 );

			// Add custom post/page columns.
			add_action( 'manage_posts_columns', array( $this, 'add_wpadmin_plus_column' ) );
			add_action( 'manage_pages_columns', array( $this, 'add_wpadmin_plus_column' ) );
		}
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Register wp-admin-plus query var.
	 *
	 * @param array $vars Current query vars.
	 */
	public function add_query_vars( $vars ) {
		$vars[] = 'wp-admin-plus';
		return $vars;
	}

	/**
	 * Check whether the wp-admin-plus feature is enabled,
	 * via the query strinh.
	 *
	 * @return boolean True when feature is active. Otherwise, False.
	 */
	public function is_wp_admin_plus() {
		$is_wp_admin_plus = get_query_var( 'wp-admin-plus' );
		return isset( $is_wp_admin_plus ) && 'true' === $is_wp_admin_plus ? true : false;
	}

	/**
	 * Add the WP Admin Plus custom column.
	 *
	 * @param array $columns Columns table.
	 * @return array Columns table, maybe populated.
	 */
	public function add_wpadmin_plus_column( $columns ) {
		if ( ! self::is_wp_admin_plus() ) {
			return $columns;
		}

		return array_merge( $columns, array( 'wp-admin-plus-column' => 'WPAP' ) );
	}

	/**
	 * Pick post data, parse and render in JSON format.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 */
	public function parse_and_render_post_data( $column, $post_id ) {
		if ( ! self::is_wp_admin_plus() ) {
			return;
		}

		$post = get_post( $post_id );
		if ( 'wp-admin-plus-column' === $column ) {
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
	 * Enqueue scripts depending on the wp-admin-plus query var.
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( self::is_wp_admin_plus() && 'edit.php' === $hook ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';
			$plugin_path  = Assets::get_file_url_for_environment( '../build/index.js', '../build/index.js', __FILE__ );

			wp_enqueue_script(
				'jetpack_wpadminplus_ui_script',
				$plugin_path,
				$build_assets['dependencies'],
				$build_assets['version'],
				true
			);

			wp_enqueue_style(
				'jetpack_wpadminplus_ui_style',
				plugin_dir_url( __DIR__ ) . 'build/style-index.css',
				array( 'wp-components' ),
				$build_assets['version']
			);

			wp_style_add_data(
				'jetpack_wpadminplus_ui_style',
				'rtl',
				plugin_dir_url( __DIR__ ) . 'build/index.rtl.css'
			);

			wp_localize_script(
				'jetpack_wpadminplus_ui_script',
				'Jetpack_WPAdmin_Plus',
				array(
					'postType' => get_query_var( 'post_type' ),
				)
			);
		}
	}
}
