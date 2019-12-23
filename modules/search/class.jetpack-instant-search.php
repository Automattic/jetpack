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
		require_once dirname( __FILE__ ) . '/class.jetpack-search-template-tags.php';
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
			add_action( 'parse_query', array( $this, 'action__parse_query' ), 10, 1 );

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

		return array(
			new WP_Post(
				array(
					'ID'             => 1,
					'post_author'    => 1,
					'post_date'      => current_time( 'mysql' ),
					'post_date_gmt'  => current_time( 'mysql', 1 ),
					'post_title'     => 'Some title or other',
					'post_content'   => 'Whatever you want here. Maybe some cat pictures....',
					'post_status'    => 'publish',
					'comment_status' => 'closed',
					'ping_status'    => 'closed',
					'post_name'      => 'fake-page',
					'post_type'      => 'page',
					'filter'         => 'raw',
				)
			),
		);
	}

	/**
	 * Run the aggregations API query for any filtering
	 *
	 * @since 8.3.0
	 *
	 * @param WP_Query $query The WP_Query being filtered.
	 */
	public function action__parse_query( $query ) {
		if ( is_admin() ) {
			return;
		}

		if ( empty( $this->aggregations ) ) {
			return;
		}

		jetpack_require_lib( 'jetpack-wpes-query-builder/jetpack-wpes-query-builder' );

		$builder = new Jetpack_WPES_Query_Builder();
		$this->add_aggregations_to_es_query_builder( $this->aggregations, $builder );
		$es_args = array(
			'aggregations' => $builder->build_aggregation(),
			'size'         => 0,
		);

	}

	/**
	 * Run an instant search on the WordPress.com public API.
	 *
	 * @since 8.3.0
	 *
	 * @param array $args Args conforming to the WP.com /sites/<blog_id>/search endpoint.
	 *
	 * @return object|WP_Error The response from the public API, or a WP_Error.
	 */
	public function instant_api( array $args ) {
		$endpoint    = sprintf( '/sites/%s/search', $this->jetpack_blog_id );
		$service_url = 'https://public-api.wordpress.com/rest/v1.3' . $endpoint;

		$do_authenticated_request = false;
		if ( class_exists( 'Automattic\\Jetpack\\Connection\\Client' ) &&
			isset( $args['authenticated_request'] ) &&
			true === $args['authenticated_request'] ) {
			$do_authenticated_request = true;
		}

		unset( $args['authenticated_request'] );

		$request_args = array(
			'headers'    => array(
				'Content-Type' => 'application/json',
			),
			'timeout'    => 10,
			'user-agent' => 'jetpack_search',
		);

		$request_body = wp_json_encode( $args );

		$start_time = microtime( true );

		if ( $do_authenticated_request ) {
			$request_args['method'] = 'POST';

			$request = Client::wpcom_json_api_request_as_blog( $endpoint, Client::WPCOM_JSON_API_VERSION, $request_args, $request_body );
		} else {
			$request_args = array_merge(
				$request_args,
				array(
					'body' => $request_body,
				)
			);

			$request = wp_remote_post( $service_url, $request_args );
		}

		$end_time = microtime( true );

		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$response_code = wp_remote_retrieve_response_code( $request );

		$response = json_decode( wp_remote_retrieve_body( $request ), true );

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

		return $response;
	}



}
