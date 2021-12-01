<?php
/**
 * Jetpack Search: Instant Front-End Search and Filtering
 *
 * @since 8.3.0
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Search\Helper;
use Automattic\Jetpack\Search\Options;

/**
 * Class to load Instant Search experience on the site.
 *
 * @since 8.3.0
 */
class Jetpack_Instant_Search extends Jetpack_Search {
	/**
	 * The name of instant search sidebar
	 *
	 * @since 9.8.0
	 *
	 * @var string
	 */
	const JETPACK_INSTANT_SEARCH_SIDEBAR = 'jetpack-instant-search-sidebar';

	/**
	 * Variable to save old sidebars_widgets value.
	 *
	 * The value is set when action `after_switch_theme` is applied and cleared on filter `pre_update_option_sidebars_widgets`.
	 * The filters mentioned above run on /wp-admin/themes.php?activated=true, a request closely following switching theme.
	 *
	 * @since 9.8.0
	 *
	 * @var array
	 */
	protected $old_sidebars_widgets;

	/**
	 * Get singleton instance of Jetpack Instant Search.
	 *
	 * Instantiates and sets up a new instance if needed, or returns the singleton.
	 *
	 * @since 9.8.0
	 *
	 * @return Jetpack_Instant_Search The Jetpack_Instant_Search singleton.
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new static();
			self::$instance->setup();
		}

		return self::$instance;
	}

	/**
	 * Loads the php for this version of search
	 *
	 * @since 8.3.0
	 */
	public function load_php() {
		$this->base_load_php();

		new Automattic\Jetpack\Search\Settings();

		if ( class_exists( 'WP_Customize_Manager' ) ) {
			require_once __DIR__ . '/class-jetpack-search-customize.php';
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
			add_action( 'wp_footer', array( 'Automattic\Jetpack\Search\Helper', 'print_instant_search_sidebar' ) );
			add_filter( 'body_class', array( $this, 'add_body_class' ), 10 );
		} else {
			add_action( 'update_option', array( $this, 'track_widget_updates' ), 10, 3 );
		}

		/**
		 * Note:
		 * 1. The priority has to be lower than 10 to run before _wp_sidebars_changed.
		 *      Which migrates widgets from old theme to the new one.
		 * 2. WP.com runs after_switch_theme hook from the frontend, so we'll need to hook it.
		 *      No matter it's admin or frontend.
		 */
		add_action( 'after_switch_theme', array( $this, 'save_old_sidebars_widgets' ), 5, 0 );
		add_action( 'pre_update_option_sidebars_widgets', array( $this, 'remove_wp_migrated_widgets' ) );

		add_action( 'widgets_init', array( $this, 'register_jetpack_instant_sidebar' ) );
		add_action( 'jetpack_deactivate_module_search', array( $this, 'move_search_widgets_to_inactive' ) );
	}

	/**
	 * Loads assets for Jetpack Instant Search Prototype featuring Search As You Type experience.
	 */
	public function load_assets() {
		$this->load_assets_with_parameters( '', JETPACK__PLUGIN_FILE );
	}

	/**
	 * Loads assets according to parameters provided.
	 *
	 * @param string $path_prefix - Prefix for assets' relative paths.
	 * @param string $plugin_base_path - Base path for use in plugins_url.
	 */
	public function load_assets_with_parameters( $path_prefix, $plugin_base_path ) {
		Assets::register_script(
			'jetpack-instant-search',
			$path_prefix . '_inc/build/instant-search/jp-search-main.js',
			$plugin_base_path,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack',
			)
		);
		Assets::enqueue_script( 'jetpack-instant-search' );
		$this->load_and_initialize_tracks();
		$this->inject_javascript_options();

		// It only inlines the translations for the script, but does not actually load the script.
		$this->inject_translation_for_script(
			plugins_url(
				$path_prefix . '_inc/build/instant-search/jp-search.chunk-main-payload.js',
				$plugin_base_path
			)
		);
	}

	/**
	 * Add inline translations for script `$payload_url` before loading `$before_handle` script.
	 *
	 * @param string $payload_url - The payload url for which we load the translations.
	 * @param string $before_handle - Inline the translations before this handle.
	 */
	protected function inject_translation_for_script( $payload_url, $before_handle = 'jetpack-instant-search' ) {
		// Set a random name for the script.
		$handle = 'jetpack-instant-search-' . wp_unique_id();
		// Then register it, which is required for the next steps.
		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.NoExplicitVersion
		wp_register_script( $handle, $payload_url, array(), false, false );
		// Set translation domain to `jetpack`, and we need to explicitly set the `path` to load translations files for WPCOM.
		// Otherwise WPCOM would try to load from `WP_LANG_DIR . '/mu-plugins'` and fails.
		wp_set_script_translations( $handle, 'jetpack', WP_LANG_DIR . '/plugins' );
		// Inline the translations before `$before_handle` handle.
		wp_add_inline_script( $before_handle, wp_scripts()->print_translations( $handle, false ), 'before' );
		// Deregister the script as we don't really enqueue it from PHP side.
		wp_deregister_script( $handle );
	}

	/**
	 * Passes all options to the JS app.
	 */
	protected function inject_javascript_options() {
		$options = Helper::generate_initial_javascript_state();
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'jetpack-instant-search', 'var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $options ) ) . '"));', 'before' );
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
	 * Loads scripts for Tracks analytics library
	 */
	public function load_and_initialize_tracks() {
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
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
	 */
	public function action__parse_query() {
		if ( ! empty( $this->search_result ) ) {
			return;
		}

		if ( is_admin() ) {
			return;
		}

		if ( empty( $this->aggregations ) ) {
			return;
		}

		$builder = new Automattic\Jetpack\Search\WPES\Query_Builder();
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
	 * Automatically configure necessary settings for instant search
	 *
	 * @since  8.3.0
	 */
	public function auto_config_search() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return;
		}

		// Set default result format to "expanded".
		update_option( Options::OPTION_PREFIX . 'result_format', Options::RESULT_FORMAT_EXPANDED );

		$this->auto_config_excluded_post_types();
		$this->auto_config_overlay_sidebar_widgets();
		$this->auto_config_woo_result_format();
	}

	/**
	 * Automatically copy configured search widgets into the overlay sidebar
	 *
	 * @since  8.8.0
	 */
	public function auto_config_overlay_sidebar_widgets() {
		global $wp_registered_sidebars;
		$sidebars = get_option( 'sidebars_widgets', array() );
		$slug     = Helper::FILTER_WIDGET_BASE;

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
					$sidebar_id = (int) str_replace( Helper::FILTER_WIDGET_BASE . '-', '', $widget_id );
					break;
				}
			}
		}

		$next_id         = 1;
		$widget_opt_name = Helper::get_widget_option_name();
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
			array_unshift( $sidebars['jetpack-instant-search-sidebar'], Helper::build_widget_id( $next_id ) );
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
				$sidebars['sidebar-1'][ $sidebar_searchbox_idx ] = Helper::build_widget_id( $next_id );
			} else {
				// Add to top.
				array_unshift( $sidebars['sidebar-1'], Helper::build_widget_id( $next_id ) );
			}
			$next_id++;
		}
		$widget_options[ $next_id ] = $preconfig_opts;
		array_unshift( $sidebars['jetpack-instant-search-sidebar'], Helper::build_widget_id( $next_id ) );

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
			'title'   => '',
			'filters' => array(),
		);

		$post_types = get_post_types(
			array(
				'public'   => true,
				'_builtin' => false,
			)
		);

		if ( ! empty( $post_types ) ) {
			$settings['filters'][] = array(
				'name'  => '',
				'type'  => 'post_type',
				'count' => 5,
			);
		}

		// Grab a maximum of 3 taxonomies.
		$taxonomies = array_slice(
			get_taxonomies(
				array(
					'public'   => true,
					'_builtin' => false,
				)
			),
			0,
			3
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

	/**
	 * Automatically configure post types to exclude from one of the search widgets
	 *
	 * @since  8.8.0
	 */
	public function auto_config_excluded_post_types() {
		$post_types         = get_post_types(
			array(
				'exclude_from_search' => false,
				'public'              => true,
			)
		);
		$enabled_post_types = array();
		$widget_options     = get_option( Helper::get_widget_option_name(), array() );

		// Prior to Jetpack 8.8, post types were enabled via Jetpack Search widgets rather than disabled via the Customizer.
		// To continue supporting post types set up in the old way, we iterate through each Jetpack Search
		// widget configuration and append each enabled post type to $enabled_post_types.
		foreach ( $widget_options as $widget_option ) {
			if ( isset( $widget_option['post_types'] ) && is_array( $widget_option['post_types'] ) ) {
				foreach ( $widget_option['post_types'] as $enabled_post_type ) {
					$enabled_post_types[ $enabled_post_type ] = $enabled_post_type;
				}
			}
		}

		if ( ! empty( $enabled_post_types ) ) {
			$post_types_to_disable = array_diff( $post_types, $enabled_post_types );
			update_option( Options::OPTION_PREFIX . 'excluded_post_types', join( ',', $post_types_to_disable ) );
		}
	}

	/**
	 * Automatically set result format to 'product' if WooCommerce is installed
	 *
	 * @since  9.6.0
	 */
	public function auto_config_woo_result_format() {
		if ( ! method_exists( 'Jetpack', 'get_active_plugins' ) ) {
			return false;
		}

		// Check if WooCommerce plugin is active (based on https://docs.woocommerce.com/document/create-a-plugin/).
		if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', Jetpack::get_active_plugins() ), true ) ) {
			return false;
		}

		update_option( Options::OPTION_PREFIX . 'result_format', Options::RESULT_FORMAT_PRODUCT );
	}

	/**
	 * Save sidebars_widgets option before it's migrated by WordPress
	 *
	 * @since 9.8.0
	 *
	 * @param array $old_sidebars_widgets The sidebars_widgets option value to be saved.
	 */
	public function save_old_sidebars_widgets( $old_sidebars_widgets = null ) {
		// The function should only run before _wp_sidebars_changed which migrates the sidebars.
		// So when _wp_sidebars_changed doesn't exist, we should skip the logic.
		if ( has_filter( 'after_switch_theme', '_wp_sidebars_changed' ) !== false ) {
			$this->old_sidebars_widgets = ! is_null( $old_sidebars_widgets ) ? $old_sidebars_widgets : wp_get_sidebars_widgets();
		}
	}

	/**
	 * Clean WordPress auto-migrated sidebar widgets from instant search sidebar before saving option sidebars_widgets
	 *
	 * @since 9.8.0
	 *
	 * @param array $sidebars_widgets The sidebars_widgets option value to be filtered.
	 * @return array The sidebars_widgets option value to be saved
	 */
	public function remove_wp_migrated_widgets( $sidebars_widgets ) {
		// Hook the action only when it is a theme switch i.e. $this->old_sidebars_widgets is not empty.
		// Ensure that the hook only runs when necessary.
		if (
			empty( $this->old_sidebars_widgets )
			|| ! is_array( $this->old_sidebars_widgets )
			|| ! is_array( $sidebars_widgets )
			|| ! array_key_exists( static::JETPACK_INSTANT_SEARCH_SIDEBAR, $sidebars_widgets )
			|| ! array_key_exists( static::JETPACK_INSTANT_SEARCH_SIDEBAR, $this->old_sidebars_widgets )
			// If the new Jetpack sidebar already has fewer widgets, skip execution.
			// Uses less than comparison for defensive programming.
			|| count( $sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ] ) <= count( $this->old_sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ] )
		) {
			return $sidebars_widgets;
		}

		$lost_widgets                            = array_diff( $sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ], $this->old_sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ] );
		$sidebars_widgets['wp_inactive_widgets'] = array_merge( $lost_widgets, (array) $sidebars_widgets['wp_inactive_widgets'] );
		$sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ] = $this->old_sidebars_widgets[ static::JETPACK_INSTANT_SEARCH_SIDEBAR ];

		// Reset $this->old_sidebars_widgets because we want to run the function only once after theme switch.
		$this->old_sidebars_widgets = null;

		return $sidebars_widgets;
	}

	/**
	 * Add current theme name as a body class for easier override
	 *
	 * @param string[] $classes An array of body class names.
	 *
	 * @return string[] The array of classes after filtering
	 */
	public function add_body_class( $classes ) {
		$classes[] = 'jps-theme-' . get_stylesheet();
		return $classes;
	}
}
