<?php
/**
 * Jetpack Search: Instant Front-End Search and Filtering
 *
 * @since 8.3.0
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

/**
 * Class to load Instant Search experience on the site.
 *
 * @since 8.3.0
 */
class Jetpack_Instant_Search extends Jetpack_Search {

	/**
	 * Loads the php for this version of search
	 *
	 * @since 8.3.0
	 */
	public function load_php() {
		$this->base_load_php();

		if ( class_exists( 'WP_Customize_Manager' ) ) {
			require_once dirname( __FILE__ ) . '/class-jetpack-search-customize.php';
			new Jetpack_Search_Customize();
		}
	}

	/**
	 * Setup the various hooks needed for the plugin to take over search duties.
	 *
	 * @since 5.0.0
	 */
	public function init_hooks() {
		if ( ! is_admin() ) {
			add_filter( 'posts_pre_query', array( $this, 'filter__posts_pre_query' ), 10, 2 );
			add_action( 'parse_query', array( $this, 'action__parse_query' ), 10, 1 );

			add_action( 'init', array( $this, 'set_filters_from_widgets' ) );

			add_action( 'wp_enqueue_scripts', array( $this, 'load_assets' ) );
			add_action( 'wp_footer', array( $this, 'print_instant_search_sidebar' ) );
		} else {
			add_action( 'update_option', array( $this, 'track_widget_updates' ), 10, 3 );
		}

		add_action( 'widgets_init', array( $this, 'register_jetpack_instant_sidebar' ) );
		add_action( 'jetpack_deactivate_module_search', array( $this, 'move_search_widgets_to_inactive' ) );
	}

	/**
	 * Loads assets for Jetpack Instant Search Prototype featuring Search As You Type experience.
	 */
	public function load_assets() {
		$script_relative_path = '_inc/build/instant-search/jp-search.bundle.js';
		$style_relative_path  = '_inc/build/instant-search/instant-search.min.css';
		if ( ! file_exists( JETPACK__PLUGIN_DIR . $script_relative_path ) || ! file_exists( JETPACK__PLUGIN_DIR . $style_relative_path ) ) {
			return;
		}

		$script_version = self::get_asset_version( $script_relative_path );
		$script_path    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
		wp_enqueue_script( 'jetpack-instant-search', $script_path, array(), $script_version, true );
		$this->load_and_initialize_tracks();
		$this->inject_javascript_options();

		$style_version = self::get_asset_version( $style_relative_path );
		$style_path    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
		wp_enqueue_style( 'jetpack-instant-search', $style_path, array(), $style_version );
	}

	/**
	 * Passes all options to the JS app.
	 */
	protected function inject_javascript_options() {
		$widget_options = Jetpack_Search_Helpers::get_widgets_from_option();
		if ( is_array( $widget_options ) ) {
			$widget_options = end( $widget_options );
		}

		$overlay_widget_ids      = array_key_exists( 'jetpack-instant-search-sidebar', get_option( 'sidebars_widgets', array() ) ) ?
			get_option( 'sidebars_widgets', array() )['jetpack-instant-search-sidebar'] : array();
		$filters                 = Jetpack_Search_Helpers::get_filters_from_widgets();
		$widgets                 = array();
		$widgets_outside_overlay = array();
		foreach ( $filters as $key => &$filter ) {
			$filter['filter_id'] = $key;

			if ( in_array( $filter['widget_id'], $overlay_widget_ids, true ) ) {
				if ( ! isset( $widgets[ $filter['widget_id'] ] ) ) {
					$widgets[ $filter['widget_id'] ]['filters']   = array();
					$widgets[ $filter['widget_id'] ]['widget_id'] = $filter['widget_id'];
				}
				$widgets[ $filter['widget_id'] ]['filters'][] = $filter;
			} else {
				if ( ! isset( $widgets_outside_overlay[ $filter['widget_id'] ] ) ) {
					$widgets_outside_overlay[ $filter['widget_id'] ]['filters']   = array();
					$widgets_outside_overlay[ $filter['widget_id'] ]['widget_id'] = $filter['widget_id'];
				}
				$widgets_outside_overlay[ $filter['widget_id'] ]['filters'][] = $filter;
			}
		}
		unset( $filter );

		$post_type_objs   = get_post_types( array(), 'objects' );
		$post_type_labels = array();
		foreach ( $post_type_objs as $key => $obj ) {
			$post_type_labels[ $key ] = array(
				'singular_name' => $obj->labels->singular_name,
				'name'          => $obj->labels->name,
			);
		}

		$prefix         = Jetpack_Search_Options::OPTION_PREFIX;
		$posts_per_page = (int) get_option( 'posts_per_page' );
		if ( ( $posts_per_page > 20 ) || ( $posts_per_page <= 0 ) ) {
			$posts_per_page = 20;
		}
		$options = array(
			'overlayOptions'        => array(
				'colorTheme'      => get_option( $prefix . 'color_theme', 'light' ),
				'enableInfScroll' => (bool) get_option( $prefix . 'inf_scroll', false ),
				'highlightColor'  => get_option( $prefix . 'highlight_color', '#FFC' ),
				'opacity'         => (int) get_option( $prefix . 'opacity', 97 ),
				'overlayTrigger'  => get_option( $prefix . 'overlay_trigger', 'immediate' ),
				'showPoweredBy'   => (bool) get_option( $prefix . 'show_powered_by', true ),
			),

			// core config.
			'homeUrl'               => home_url(),
			'locale'                => str_replace( '_', '-', Jetpack_Search_Helpers::is_valid_locale( get_locale() ) ? get_locale() : 'en_US' ),
			'postsPerPage'          => $posts_per_page,
			'siteId'                => Jetpack::get_option( 'id' ),

			'postTypes'             => $post_type_labels,
			'widgets'               => array_values( $widgets ),
			'widgetsOutsideOverlay' => array_values( $widgets_outside_overlay ),
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

		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'jetpack-instant-search', 'var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $options ) ) . '"));' );
	}

	/**
	 * Registers a widget sidebar for Instant Search.
	 */
	public function register_jetpack_instant_sidebar() {
		$args = array(
			'name'          => __( 'Jetpack Search Sidebar', 'jetpack' ),
			'id'            => 'jetpack-instant-search-sidebar',
			'description'   => __( 'Customize the sidebar inside the Jetpack Search overlay', 'jetpack' ),
			'class'         => '',
			'before_widget' => '<div id="%1$s" class="widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h2 class="widgettitle">',
			'after_title'   => '</h2>',
		);
		register_sidebar( $args );
	}

	/**
	 * Prints Instant Search sidebar.
	 */
	public function print_instant_search_sidebar() {
		?>
		<div class="jetpack-instant-search__widget-area" style="display: none">
			<?php if ( is_active_sidebar( 'jetpack-instant-search-sidebar' ) ) { ?>
				<?php dynamic_sidebar( 'jetpack-instant-search-sidebar' ); ?>
			<?php } ?>
		</div>
		<?php
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
		if ( ! $this->should_handle_query( $query ) ) {
			// Intentionally not adding the 'jetpack_search_abort' action since this should fire for every request except for search.
			return $posts;
		}

		/**
		 * Bypass the main query and return dummy data
		 *  WP Core doesn't call the set_found_posts and its filters when filtering
		 *  posts_pre_query like we do, so need to do these manually.
		 */
		$query->found_posts   = 1;
		$query->max_num_pages = 1;

		return array();
	}

	/**
	 * Run the aggregations API query for any filtering
	 *
	 * @since 8.3.0
	 *
	 * @param WP_Query $query The WP_Query being filtered.
	 */
	public function action__parse_query( $query ) {
		if ( ! empty( $this->search_result ) ) {
			return;
		}

		if ( is_admin() ) {
			return;
		}

		if ( empty( $this->aggregations ) ) {
			return;
		}

		jetpack_require_lib( 'jetpack-wpes-query-builder/jetpack-wpes-query-builder' );

		$builder = new Jetpack_WPES_Query_Builder();
		$this->add_aggregations_to_es_query_builder( $this->aggregations, $builder );
		$this->search_result = $this->instant_api(
			array(
				'aggregations' => $builder->build_aggregation(),
				'size'         => 0,
				'from'         => 0,
			)
		);
	}

	/**
	 * Run an instant search on the WordPress.com public API.
	 *
	 * @since 8.3.0
	 *
	 * @param array $args Args conforming to the WP.com v1.3/sites/<blog_id>/search endpoint.
	 *
	 * @return object|WP_Error The response from the public API, or a WP_Error.
	 */
	public function instant_api( array $args ) {
		global $wp_version;
		$start_time = microtime( true );

		// Cache locally to avoid remote request slowing the page.
		$transient_name = 'jetpack_instant_search_cache_' . md5( wp_json_encode( $args ) );
		$cache          = get_transient( $transient_name );
		if ( false !== $cache ) {
			return $cache;
		}

		$service_url = add_query_arg(
			$args,
			sprintf(
				'https://public-api.wordpress.com/rest/v1.3/sites/%d/search',
				$this->jetpack_blog_id
			)
		);

		$request_args = array(
			'timeout'    => 10,
			'user-agent' => "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' ),
		);

		$request  = wp_remote_get( esc_url_raw( $service_url ), $request_args );
		$end_time = microtime( true );

		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$response_code = wp_remote_retrieve_response_code( $request );
		$response      = json_decode( wp_remote_retrieve_body( $request ), true );

		if ( ! $response_code || $response_code < 200 || $response_code >= 300 ) {
			/**
			 * Fires after a search query request has failed
			 *
			 * @module search
			 *
			 * @since  5.6.0
			 *
			 * @param array Array containing the response code and response from the failed search query
			 */
			do_action(
				'failed_jetpack_search_query',
				array(
					'response_code' => $response_code,
					'json'          => $response,
				)
			);

			return new WP_Error( 'invalid_search_api_response', 'Invalid response from API - ' . $response_code );
		}

		$took = is_array( $response ) && ! empty( $response['took'] )
			? $response['took']
			: null;

		$query = array(
			'args'          => $args,
			'response'      => $response,
			'response_code' => $response_code,
			'elapsed_time'  => ( $end_time - $start_time ) * 1000, // Convert from float seconds to ms.
			'es_time'       => $took,
			'url'           => $service_url,
		);

		/**
		 * Fires after a search request has been performed.
		 *
		 * Includes the following info in the $query parameter:
		 *
		 * array args Array of Elasticsearch arguments for the search
		 * array response Raw API response, JSON decoded
		 * int response_code HTTP response code of the request
		 * float elapsed_time Roundtrip time of the search request, in milliseconds
		 * float es_time Amount of time Elasticsearch spent running the request, in milliseconds
		 * string url API url that was queried
		 *
		 * @module search
		 *
		 * @since  5.0.0
		 * @since  5.8.0 This action now fires on all queries instead of just successful queries.
		 *
		 * @param array $query Array of information about the query performed
		 */
		do_action( 'did_jetpack_search_query', $query );

		// Update local cache.
		set_transient( $transient_name, $response, 1 * HOUR_IN_SECONDS );

		return $response;
	}

	/**
	 * Get the raw Aggregation results from the Elasticsearch response.
	 *
	 * @since  8.4.0
	 *
	 * @return array Array of Aggregations performed on the search.
	 */
	public function get_search_aggregations_results() {
		if ( empty( $this->search_result ) || is_wp_error( $this->search_result ) || ! isset( $this->search_result['aggregations'] ) ) {
			return array();
		}

		return $this->search_result['aggregations'];
	}

	/**
	 * Autoconfig search by adding filter widgets
	 *
	 * @since  8.3.0
	 */
	public function auto_config_search() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return;
		}

		global $wp_registered_sidebars;
		$sidebars = get_option( 'sidebars_widgets', array() );
		$slug     = Jetpack_Search_Helpers::FILTER_WIDGET_BASE;

		if ( isset( $sidebars['jetpack-instant-search-sidebar'] ) ) {
			foreach ( (array) $sidebars['jetpack-instant-search-sidebar'] as $widget_id ) {
				if ( 0 === strpos( $widget_id, $slug ) ) {
					// Already configured.
					return;
				}
			}
		}

		$has_sidebar           = isset( $wp_registered_sidebars['sidebar-1'] );
		$sidebar_id            = false;
		$sidebar_searchbox_idx = false;
		if ( $has_sidebar ) {
			if ( empty( $sidebars['sidebar-1'] ) ) {
				// Adding to an empty sidebar is generally a bad idea.
				$has_sidebar = false;
			}
			foreach ( (array) $sidebars['sidebar-1'] as $idx => $widget_id ) {
				if ( 0 === strpos( $widget_id, 'search-' ) ) {
					$sidebar_searchbox_idx = $idx;
				}
				if ( 0 === strpos( $widget_id, $slug ) ) {
					$sidebar_id = (int) str_replace( Jetpack_Search_Helpers::FILTER_WIDGET_BASE . '-', '', $widget_id );
					break;
				}
			}
		}

		$next_id         = 1;
		$widget_opt_name = Jetpack_Search_Helpers::get_widget_option_name();
		$widget_options  = get_option( $widget_opt_name, array() );
		foreach ( $widget_options as $id => $w ) {
			if ( $id >= $next_id ) {
				$next_id = $id + 1;
			}
		}

		// Copy sidebar settings to overlay.
		if ( ( false !== $sidebar_id ) && isset( $widget_options[ $sidebar_id ] ) ) {
			$widget_options[ $next_id ] = $widget_options[ $sidebar_id ];
			update_option( $widget_opt_name, $widget_options );

			if ( ! isset( $sidebars['jetpack-instant-search-sidebar'] ) ) {
				$sidebars['jetpack-instant-search-sidebar'] = array();
			}
			array_unshift( $sidebars['jetpack-instant-search-sidebar'], Jetpack_Search_Helpers::build_widget_id( $next_id ) );
			update_option( 'sidebars_widgets', $sidebars );

			return;
		}

		// Configure overlay and sidebar (if it exists).
		$preconfig_opts = $this->get_preconfig_widget_options();
		if ( ! isset( $sidebars['jetpack-instant-search-sidebar'] ) ) {
			$sidebars['jetpack-instant-search-sidebar'] = array();
		}
		if ( $has_sidebar ) {
			$widget_options[ $next_id ] = $preconfig_opts;
			if ( false !== $sidebar_searchbox_idx ) {
				// Replace Core search box.
				$sidebars['sidebar-1'][ $sidebar_searchbox_idx ] = Jetpack_Search_Helpers::build_widget_id( $next_id );
			} else {
				// Add to top.
				array_unshift( $sidebars['sidebar-1'], Jetpack_Search_Helpers::build_widget_id( $next_id ) );
			}
			$next_id++;
		}
		$widget_options[ $next_id ] = $preconfig_opts;
		array_unshift( $sidebars['jetpack-instant-search-sidebar'], Jetpack_Search_Helpers::build_widget_id( $next_id ) );

		update_option( $widget_opt_name, $widget_options );
		update_option( 'sidebars_widgets', $sidebars );
	}

	/**
	 * Autoconfig search by adding filter widgets
	 *
	 * @since  8.4.0
	 *
	 * @return array Array of config settings for search widget.
	 */
	protected function get_preconfig_widget_options() {
		$settings = array(
			'title'              => '',
			'search_box_enabled' => 1,
			'user_sort_enabled'  => 0,
			'filters'            => array(),
		);

		$post_types = get_post_types(
			array(
				'public'   => true,
				'_builtin' => false,
			)
		);

		if ( ! empty( $post_types ) ) {
			$settings['filters'][] = array(
				array(
					'name'  => '',
					'type'  => 'post_type',
					'count' => 5,
				),
			);
		}

		$taxonomies = get_taxonomies(
			array(
				'public'   => true,
				'_builtin' => false,
			)
		);

		foreach ( $taxonomies as $t ) {
			$settings['filters'][] = array(
				'name'     => '',
				'type'     => 'taxonomy',
				'taxonomy' => $t,
				'count'    => 5,
			);
		}

		$settings['filters'][] = array(
			'name'     => '',
			'type'     => 'taxonomy',
			'taxonomy' => 'category',
			'count'    => 5,
		);
		$settings['filters'][] = array(
			'name'     => '',
			'type'     => 'taxonomy',
			'taxonomy' => 'post_tag',
			'count'    => 5,
		);
		$settings['filters'][] = array(
			'name'     => '',
			'type'     => 'date_histogram',
			'count'    => 5,
			'field'    => 'post_date',
			'interval' => 'year',
		);

		return $settings;
	}

}
