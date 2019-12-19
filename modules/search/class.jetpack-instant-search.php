<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack Search: Instant Front-End Search and Filtering
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

class Jetpack_Instant_Search extends Jetpack_Search {

	/**
	 * Jetpack_Instant_Search constructor.
	 *
	 * @since 5.0.0
	 *
	 * Doesn't do anything. This class needs to be initialized via the instance() method instead.
	 */
	protected function __construct() {
	}

	/**
	 * Loads the php for this version of search
	 *
	 * @since 8.3.0
	 */
	public function load_php() {
		require_once JETPACK__PLUGIN_DIR . 'modules/widgets/search.php';
	}


	/**
	 * Setup the various hooks needed for the plugin to take over search duties.
	 *
	 * @since 5.0.0
	 */
	public function init_hooks() {
		if ( ! is_admin() ) {
			add_filter( 'posts_pre_query', array( $this, 'filter__posts_pre_query' ), 10, 2 );

			add_action( 'init', array( $this, 'set_filters_from_widgets' ) );

			add_action( 'wp_enqueue_scripts', array( $this, 'load_assets' ) );
		} else {
			add_action( 'update_option', array( $this, 'track_widget_updates' ), 10, 3 );
		}

		add_action( 'jetpack_deactivate_module_search', array( $this, 'move_search_widgets_to_inactive' ) );
	}

	/**
	 * Loads assets for Jetpack Instant Search Prototype featuring Search As You Type experience.
	 */
	public function load_assets() {
		$script_relative_path = '_inc/build/instant-search/jp-search.bundle.js';
		if ( file_exists( JETPACK__PLUGIN_DIR . $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path );
			$script_path    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_script( 'jetpack-instant-search', $script_path, array(), $script_version, true );
			$this->load_and_initialize_tracks();

			$widget_options = Jetpack_Search_Helpers::get_widgets_from_option();
			if ( is_array( $widget_options ) ) {
				$widget_options = end( $widget_options );
			}

			$filters = Jetpack_Search_Helpers::get_filters_from_widgets();
			$widgets = array();
			foreach ( $filters as $key => $filter ) {
				if ( ! isset( $widgets[ $filter['widget_id'] ] ) ) {
					$widgets[ $filter['widget_id'] ]['filters']   = array();
					$widgets[ $filter['widget_id'] ]['widget_id'] = $filter['widget_id'];
				}
				$new_filter                                   = $filter;
				$new_filter['filter_id']                      = $key;
				$widgets[ $filter['widget_id'] ]['filters'][] = $new_filter;
			}

			$post_type_objs   = get_post_types( array(), 'objects' );
			$post_type_labels = array();
			foreach ( $post_type_objs as $key => $obj ) {
				$post_type_labels[ $key ] = array(
					'singular_name' => $obj->labels->singular_name,
					'name'          => $obj->labels->name,
				);
			}
			// This is probably a temporary filter for testing the prototype.
			$options = array(
				'enableLoadOnScroll' => false,
				'homeUrl'            => home_url(),
				'locale'             => str_replace( '_', '-', get_locale() ),
				'postTypeFilters'    => $widget_options['post_types'],
				'postTypes'          => $post_type_labels,
				'siteId'             => Jetpack::get_option( 'id' ),
				'sort'               => $widget_options['sort'],
				'widgets'            => array_values( $widgets ),
			);
			/**
			 * Customize Instant Search Options.
			 *
			 * @module search
			 *
			 * @since 7.7.0
			 *
			 * @param array $options Array of parameters used in Instant Search queries.
			 */
			$options = apply_filters( 'jetpack_instant_search_options', $options );

			wp_localize_script(
				'jetpack-instant-search',
				'JetpackInstantSearchOptions',
				$options
			);
		}

		$style_relative_path = '_inc/build/instant-search/instant-search.min.css';
		if ( file_exists( JETPACK__PLUGIN_DIR . $script_relative_path ) ) {
			$style_version = self::get_asset_version( $style_relative_path );
			$style_path    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-instant-search', $style_path, array(), $style_version );
		}
	}

	/**
	 * Loads scripts for Tracks analytics library
	 */
	public function load_and_initialize_tracks() {
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	/**
	 * Get the version number to use when loading the file. Allows us to bypass cache when developing.
	 *
	 * @param string $file Path of the file we are looking for.
	 * @return string $script_version Version number.
	 */
	public static function get_asset_version( $file ) {
		return Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $file )
			? filemtime( JETPACK__PLUGIN_DIR . $file )
			: JETPACK__VERSION;
	}

	/**
	 * Bypass the normal Search query since we will run it with instant search.
	 *
	 * @since 8.3.0
	 *
	 * @param array    $posts Current array of posts (still pre-query).
	 * @param WP_Query $query The WP_Query being filtered.
	 *
	 * @return array Array of matching posts.
	 */
	public function filter__posts_pre_query( $posts, $query ) {
		//TODO: run search aggs for the filtering

		if ( ! $this->should_handle_query( $query ) ) {
			// Intentionally not adding the 'jetpack_search_abort' action since this should fire for every request except for search.
			return $posts;
		}

		//TODO: pre-render search results

		return array(
			new WP_Post( array(
				'ID' => 0;
				'post_author'     => 1,
				'post_date'       => current_time( 'mysql' ),
				'post_date_gmt'   => current_time( 'mysql', 1 ),
				'post_title'      => 'Some title or other',
				'post_content'    => 'Whatever you want here. Maybe some cat pictures....',
				'post_status'     => 'publish',
				'comment_status'  => 'closed',
				'ping_status'     => 'closed',
				'post_name'       => 'fake-page-' . rand( 1, 99999 ),
				'post_type'       => 'page',
				'filter'          => 'raw',
			) );
		);
	}

}
