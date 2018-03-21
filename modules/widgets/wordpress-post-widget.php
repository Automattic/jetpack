<?php
/**
 * Plugin Name: Display Recent WordPress Posts Widget
 * Description: Displays recent posts from a WordPress.com or Jetpack-enabled self-hosted WordPress site.
 * Version: 1.0
 * Author: Brad Angelcyk, Kathryn Presner, Justin Shreve, Carolyn Sonnek
 * Author URI: http://automattic.com
 * License: GPL2
 */

/**
 * Disable direct access/execution to/of the widget code.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'widgets_init', 'jetpack_display_posts_widget' );
function jetpack_display_posts_widget() {
	register_widget( 'Jetpack_Display_Posts_Widget' );
}


/**
 * Cron tasks
 */

add_filter( 'cron_schedules', 'jetpack_display_posts_widget_cron_intervals' );

/**
 * Adds 10 minute running interval to the cron schedules.
 *
 * @param array $current_schedules Currently defined schedules list.
 *
 * @return array
 */
function jetpack_display_posts_widget_cron_intervals( $current_schedules ) {

	/**
	 * Only add the 10 minute interval if it wasn't already set.
	 */
	if ( ! isset( $current_schedules['minutes_10'] ) ) {
		$current_schedules['minutes_10'] = array(
			'interval' => 10 * MINUTE_IN_SECONDS,
			'display'  => 'Every 10 minutes'
		);
	}

	return $current_schedules;
}

/**
 * Execute the cron task
 */
add_action( 'jetpack_display_posts_widget_cron_update', 'jetpack_display_posts_update_cron_action' );
function jetpack_display_posts_update_cron_action() {
	$widget = new Jetpack_Display_Posts_Widget();
	$widget->cron_task();
}

/**
 * Handle activation procedures for the cron.
 *
 * `updating_jetpack_version` - Handle cron activation when Jetpack gets updated. It's here
 *                              to cover the first cron activation after the update.
 *
 * `jetpack_activate_module_widgets` - Activate the cron when the Extra Sidebar widgets are activated.
 *
 * `activated_plugin` - Activate the cron when Jetpack gets activated.
 *
 */
add_action( 'updating_jetpack_version', 'jetpack_display_posts_widget_conditionally_activate_cron' );
add_action( 'jetpack_activate_module_widgets', 'Jetpack_Display_Posts_Widget::activate_cron' );
add_action( 'activated_plugin', 'jetpack_conditionally_activate_cron_on_plugin_activation' );

/**
 * Executed when Jetpack gets activated. Tries to activate the cron if it is needed.
 *
 * @param string $plugin_file_name The plugin file that was activated.
 */
function jetpack_conditionally_activate_cron_on_plugin_activation( $plugin_file_name ) {
	if ( plugin_basename( JETPACK__PLUGIN_FILE ) === $plugin_file_name ) {
		jetpack_display_posts_widget_conditionally_activate_cron();
	}
}

/**
 * Activates the cron only when needed.
 * @see Jetpack_Display_Posts_Widget::should_cron_be_running
 */
function jetpack_display_posts_widget_conditionally_activate_cron() {
	$widget = new Jetpack_Display_Posts_Widget();
	if ( $widget->should_cron_be_running() ) {
		$widget->activate_cron();
	}

	unset( $widget );
}

/**
 * End of cron activation handling.
 */


/**
 * Handle deactivation procedures where they are needed.
 *
 * If Extra Sidebar Widgets module is deactivated, the cron is not needed.
 *
 * If Jetpack is deactivated, the cron is not needed.
 */
add_action( 'jetpack_deactivate_module_widgets', 'Jetpack_Display_Posts_Widget::deactivate_cron_static' );
register_deactivation_hook( plugin_basename( JETPACK__PLUGIN_FILE ), 'Jetpack_Display_Posts_Widget::deactivate_cron_static' );

/**
 * End of Cron tasks
 */
/*
 * Display a list of recent posts from a WordPress.com or Jetpack-enabled blog.
 */

class Jetpack_Display_Posts_Widget extends WP_Widget {

	/**
	 * @var string Remote service API URL prefix.
	 */
	public $service_url = 'https://public-api.wordpress.com/rest/v1.1/';

	/**
	 * @var string Widget options key prefix.
	 */
	public $widget_options_key_prefix = 'display_posts_site_data_';

	/**
	 * @var string The name of the cron that will update widget data.
	 */
	public static $cron_name = 'jetpack_display_posts_widget_cron_update';


	public function __construct() {
		parent::__construct(
		// internal id
			'jetpack_display_posts_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Display WordPress Posts', 'jetpack' ) ),
			array(
				'description' => __( 'Displays a list of recent posts from another WordPress.com or Jetpack-enabled blog.', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);

		if ( is_customize_preview() ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		}
	}

	/**
	 * Expiring transients have a name length maximum of 45 characters,
	 * so this function returns an abbreviated MD5 hash to use instead of
	 * the full URI.
	 *
	 * @param string $site Site to get the hash for.
	 *
	 * @return string
	 */
	public function get_site_hash( $site ) {
		return substr( md5( $site ), 0, 21 );
	}

	/**
	 * Fetch a remote service endpoint and parse it.
	 *
	 * Timeout is set to 15 seconds right now, because sometimes the WordPress API
	 * takes more than 5 seconds to fully respond.
	 *
	 * Caching is used here so we can avoid re-downloading the same endpoint
	 * in a single request.
	 *
	 * @param string $endpoint Parametrized endpoint to call.
	 *
	 * @param int    $timeout  How much time to wait for the API to respond before failing.
	 *
	 * @return array|WP_Error
	 */
	public function fetch_service_endpoint( $endpoint, $timeout = 15 ) {

		/**
		 * Holds endpoint request cache.
		 */
		static $cache = array();

		if ( ! isset( $cache[ $endpoint ] ) ) {
			$raw_data           = $this->wp_wp_remote_get( $this->service_url . ltrim( $endpoint, '/' ), array( 'timeout' => $timeout ) );
			$cache[ $endpoint ] = $this->parse_service_response( $raw_data );
		}

		return $cache[ $endpoint ];
	}

	/**
	 * Parse data from service response.
	 * Do basic error handling for general service and data errors
	 *
	 * @param array $service_response Response from the service.
	 *
	 * @return array|WP_Error
	 */
	public function parse_service_response( $service_response ) {
		/**
		 * If there is an error, we add the error message to the parsed response
		 */
		if ( is_wp_error( $service_response ) ) {
			return new WP_Error(
				'general_error',
				__( 'An error occurred fetching the remote data.', 'jetpack' ),
				$service_response->get_error_messages()
			);
		}

		/**
		 * Validate HTTP response code.
		 */
		if ( 200 !== wp_remote_retrieve_response_code( $service_response ) ) {
			return new WP_Error(
				'http_error',
				__( 'An error occurred fetching the remote data.', 'jetpack' ),
				wp_remote_retrieve_response_message( $service_response )
			);
		}


		/**
		 * Extract service response body from the request.
		 */

		$service_response_body = wp_remote_retrieve_body( $service_response );


		/**
		 * No body has been set in the response. This should be pretty bad.
		 */
		if ( ! $service_response_body ) {
			return new WP_Error(
				'no_body',
				__( 'Invalid remote response.', 'jetpack' ),
				'No body in response.'
			);
		}

		/**
		 * Parse the JSON response from the API. Convert to associative array.
		 */
		$parsed_data = json_decode( $service_response_body );

		/**
		 * If there is a problem with parsing the posts return an empty array.
		 */
		if ( is_null( $parsed_data ) ) {
			return new WP_Error(
				'no_body',
				__( 'Invalid remote response.', 'jetpack' ),
				'Invalid JSON from remote.'
			);
		}

		/**
		 * Check for errors in the parsed body.
		 */
		if ( isset( $parsed_data->error ) ) {
			return new WP_Error(
				'remote_error',
				__( 'It looks like the WordPress site URL is incorrectly configured. Please check it in your widget settings.', 'jetpack' ),
				$parsed_data->error
			);
		}


		/**
		 * No errors found, return parsed data.
		 */
		return $parsed_data;
	}

	/**
	 * Fetch site information from the WordPress public API
	 *
	 * @param string $site URL of the site to fetch the information for.
	 *
	 * @return array|WP_Error
	 */
	public function fetch_site_info( $site ) {

		$response = $this->fetch_service_endpoint( sprintf( '/sites/%s', urlencode( $site ) ) );

		return $response;
	}

	/**
	 * Parse external API response from the site info call and handle errors if they occur.
	 *
	 * @param array|WP_Error $service_response The raw response to be parsed.
	 *
	 * @return array|WP_Error
	 */
	public function parse_site_info_response( $service_response ) {

		/**
		 * If the service returned an error, we pass it on.
		 */
		if ( is_wp_error( $service_response ) ) {
			return $service_response;
		}

		/**
		 * Check if the service returned proper site information.
		 */
		if ( ! isset( $service_response->ID ) ) {
			return new WP_Error(
				'no_site_info',
				__( 'Invalid site information returned from remote.', 'jetpack' ),
				'No site ID present in the response.'
			);
		}

		return $service_response;
	}

	/**
	 * Fetch list of posts from the WordPress public API.
	 *
	 * @param int $site_id The site to fetch the posts for.
	 *
	 * @return array|WP_Error
	 */
	public function fetch_posts_for_site( $site_id ) {

		$response = $this->fetch_service_endpoint(
			sprintf(
				'/sites/%1$d/posts/%2$s',
				$site_id,
				/**
				 * Filters the parameters used to fetch for posts in the Display Posts Widget.
				 *
				 * @see    https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/
				 *
				 * @module widgets
				 *
				 * @since  3.6.0
				 *
				 * @param string $args Extra parameters to filter posts returned from the WordPress.com REST API.
				 */
				apply_filters( 'jetpack_display_posts_widget_posts_params', '' )
			)
		);

		return $response;
	}

	/**
	 * Parse external API response from the posts list request and handle errors if any occur.
	 *
	 * @param object|WP_Error $service_response The raw response to be parsed.
	 *
	 * @return array|WP_Error
	 */
	public function parse_posts_response( $service_response ) {

		/**
		 * If the service returned an error, we pass it on.
		 */
		if ( is_wp_error( $service_response ) ) {
			return $service_response;
		}

		/**
		 * Check if the service returned proper posts array.
		 */
		if ( ! isset( $service_response->posts ) || ! is_array( $service_response->posts ) ) {
			return new WP_Error(
				'no_posts',
				__( 'No posts data returned by remote.', 'jetpack' ),
				'No posts information set in the returned data.'
			);
		}

		/**
		 * Format the posts to preserve storage space.
		 */

		return $this->format_posts_for_storage( $service_response );
	}

	/**
	 * Format the posts for better storage. Drop all the data that is not used.
	 *
	 * @param object $parsed_data Array of posts returned by the APIs.
	 *
	 * @return array Formatted posts or an empty array if no posts were found.
	 */
	public function format_posts_for_storage( $parsed_data ) {

		$formatted_posts = array();

		/**
		 * Only go through the posts list if we have valid posts array.
		 */
		if ( isset( $parsed_data->posts ) && is_array( $parsed_data->posts ) ) {

			/**
			 * Loop through all the posts and format them appropriately.
			 */
			foreach ( $parsed_data->posts as $single_post ) {

				$prepared_post = array(
					'title'          => $single_post->title ? $single_post->title : '',
					'excerpt'        => $single_post->excerpt ? $single_post->excerpt : '',
					'featured_image' => $single_post->featured_image ? $single_post->featured_image : '',
					'url'            => $single_post->URL,
				);

				/**
				 * Append the formatted post to the results.
				 */
				$formatted_posts[] = $prepared_post;
			}
		}

		return $formatted_posts;
	}

	/**
	 * Fetch site information and posts list for a site.
	 *
	 * @param string $site           Site to fetch the data for.
	 * @param array  $original_data  Optional original data to updated.
	 *
	 * @param bool   $site_data_only Fetch only site information, skip posts list.
	 *
	 * @return array Updated or new data.
	 */
	public function fetch_blog_data( $site, $original_data = array(), $site_data_only = false ) {

		/**
		 * If no optional data is supplied, initialize a new structure
		 */
		if ( ! empty( $original_data ) ) {
			$widget_data = $original_data;
		}
		else {
			$widget_data = array(
				'site_info' => array(
					'last_check'  => null,
					'last_update' => null,
					'error'       => null,
					'data'        => array(),
				),
				'posts'     => array(
					'last_check'  => null,
					'last_update' => null,
					'error'       => null,
					'data'        => array(),
				)
			);
		}

		/**
		 * Update check time and fetch site information.
		 */
		$widget_data['site_info']['last_check'] = time();

		$site_info_raw_data    = $this->fetch_site_info( $site );
		$site_info_parsed_data = $this->parse_site_info_response( $site_info_raw_data );


		/**
		 * If there is an error with the fetched site info, save the error and update the checked time.
		 */
		if ( is_wp_error( $site_info_parsed_data ) ) {
			$widget_data['site_info']['error'] = $site_info_parsed_data;

			return $widget_data;
		}
		/**
		 * If data is fetched successfully, update the data and set the proper time.
		 *
		 * Data is only updated if we have valid results. This is done this way so we can show
		 * something if external service is down.
		 *
		 */
		else {
			$widget_data['site_info']['last_update'] = time();
			$widget_data['site_info']['data']        = $site_info_parsed_data;
			$widget_data['site_info']['error']       = null;
		}


		/**
		 * If only site data is needed, return it here, don't fetch posts data.
		 */
		if ( true === $site_data_only ) {
			return $widget_data;
		}

		/**
		 * Update check time and fetch posts list.
		 */
		$widget_data['posts']['last_check'] = time();

		$site_posts_raw_data    = $this->fetch_posts_for_site( $site_info_parsed_data->ID );
		$site_posts_parsed_data = $this->parse_posts_response( $site_posts_raw_data );


		/**
		 * If there is an error with the fetched posts, save the error and update the checked time.
		 */
		if ( is_wp_error( $site_posts_parsed_data ) ) {
			$widget_data['posts']['error'] = $site_posts_parsed_data;

			return $widget_data;
		}
		/**
		 * If data is fetched successfully, update the data and set the proper time.
		 *
		 * Data is only updated if we have valid results. This is done this way so we can show
		 * something if external service is down.
		 *
		 */
		else {
			$widget_data['posts']['last_update'] = time();
			$widget_data['posts']['data']        = $site_posts_parsed_data;
			$widget_data['posts']['error']       = null;
		}

		return $widget_data;
	}

	/**
	 * Gets blog data from the cache.
	 *
	 * @param string $site
	 *
	 * @return array|WP_Error
	 */
	public function get_blog_data( $site ) {
		// load from cache, if nothing return an error
		$site_hash = $this->get_site_hash( $site );

		$cached_data = $this->wp_get_option( $this->widget_options_key_prefix . $site_hash );

		/**
		 * If the cache is empty, return an empty_cache error.
		 */
		if ( false === $cached_data ) {
			return new WP_Error(
				'empty_cache',
				__( 'Information about this blog is currently being retrieved.', 'jetpack' )
			);
		}

		return $cached_data;

	}

	/**
	 * Activates widget update cron task.
	 */
	public static function activate_cron() {
		if ( ! wp_next_scheduled( self::$cron_name ) ) {
			wp_schedule_event( time(), 'minutes_10', self::$cron_name );
		}
	}

	/**
	 * Deactivates widget update cron task.
	 *
	 * This is a wrapper over the static method as it provides some syntactic sugar.
	 */
	public function deactivate_cron() {
		self::deactivate_cron_static();
	}

	/**
	 * Deactivates widget update cron task.
	 */
	public static function deactivate_cron_static() {
		$next_scheduled_time = wp_next_scheduled( self::$cron_name );
		wp_unschedule_event( $next_scheduled_time, self::$cron_name );
	}

	/**
	 * Checks if the update cron should be running and returns appropriate result.
	 *
	 * @return bool If the cron should be running or not.
	 */
	public function should_cron_be_running() {
		/**
		 * The cron doesn't need to run empty loops.
		 */
		$widget_instances = $this->get_instances_sites();

		if ( empty( $widget_instances ) || ! is_array( $widget_instances ) ) {
			return false;
		}

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			/**
			 * If Jetpack is not active or in development mode, we don't want to update widget data.
			 */
			if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
				return false;
			}

			/**
			 * If Extra Sidebar Widgets module is not active, we don't need to update widget data.
			 */
			if ( ! Jetpack::is_module_active( 'widgets' ) ) {
				return false;
			}
		}

		/**
		 * If none of the above checks failed, then we definitely want to update widget data.
		 */
		return true;
	}

	/**
	 * Main cron code. Updates all instances of the widget.
	 *
	 * @return bool
	 */
	public function cron_task() {

		/**
		 * If the cron should not be running, disable it.
		 */
		if ( false === $this->should_cron_be_running() ) {
			return true;
		}

		$instances_to_update = $this->get_instances_sites();

		/**
		 * If no instances are found to be updated - stop.
		 */
		if ( empty( $instances_to_update ) || ! is_array( $instances_to_update ) ) {
			return true;
		}

		foreach ( $instances_to_update as $site_url ) {
			$this->update_instance( $site_url );
		}

		return true;
	}

	/**
	 * Get a list of unique sites from all instances of the widget.
	 *
	 * @return array|bool
	 */
	public function get_instances_sites() {

		$widget_settings = $this->wp_get_option( 'widget_jetpack_display_posts_widget' );

		/**
		 * If the widget still hasn't been added anywhere, the config will not be present.
		 *
		 * In such case we don't want to continue execution.
		 */
		if ( false === $widget_settings || ! is_array( $widget_settings ) ) {
			return false;
		}

		$urls = array();

		foreach ( $widget_settings as $widget_instance_data ) {
			if ( isset( $widget_instance_data['url'] ) && ! empty( $widget_instance_data['url'] ) ) {
				$urls[] = $widget_instance_data['url'];
			}
		}

		/**
		 * Make sure only unique URLs are returned.
		 */
		$urls = array_unique( $urls );

		return $urls;

	}

	/**
	 * Update a widget instance.
	 *
	 * @param string $site The site to fetch the latest data for.
	 */
	public function update_instance( $site ) {

		/**
		 * Fetch current information for a site.
		 */
		$site_hash = $this->get_site_hash( $site );

		$option_key = $this->widget_options_key_prefix . $site_hash;

		$instance_data = $this->wp_get_option( $option_key );

		/**
		 * Fetch blog data and save it in $instance_data.
		 */
		$new_data = $this->fetch_blog_data( $site, $instance_data );

		/**
		 * If the option doesn't exist yet - create a new option
		 */
		if ( false === $instance_data ) {
			$this->wp_add_option( $option_key, $new_data );
		}
		else {
			$this->wp_update_option( $option_key, $new_data );
		}
	}

	/**
	 * Set up the widget display on the front end.
	 *
	 * @param array $args
	 * @param array $instance
	 */
	public function widget( $args, $instance ) {
		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'display_posts' );

		// Enqueue front end assets.
		$this->enqueue_scripts();

		$content = $args['before_widget'];

		if ( empty( $instance['url'] ) ) {
			if ( current_user_can( 'manage_options' ) ) {
				$content .= '<p>';
				/* Translators: the "Blog URL" field mentioned is the input field labeled as such in the widget form. */
				$content .= esc_html__( 'The Blog URL is not properly setup in the widget.', 'jetpack' );
				$content .= '</p>';
			}
			$content .= $args['after_widget'];

			echo $content;
			return;
		}

		$data = $this->get_blog_data( $instance['url'] );
		// check for errors
		if ( is_wp_error( $data ) || empty( $data['site_info']['data'] ) ) {
			$content .= '<p>' . __( 'Cannot load blog information at this time.', 'jetpack' ) . '</p>';
			$content .= $args['after_widget'];

			echo $content;
			return;
		}

		$site_info = $data['site_info']['data'];

		if ( ! empty( $instance['title'] ) ) {
			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$instance['title'] = apply_filters( 'widget_title', $instance['title'] );
			$content .= $args['before_title'] . esc_html( $instance['title'] . ': ' . $site_info->name ) . $args['after_title'];
		}
		else {
			$content .= $args['before_title'] . esc_html( $site_info->name ) . $args['after_title'];
		}

		$content .= '<div class="jetpack-display-remote-posts">';

		if ( is_wp_error( $data['posts']['data'] ) || empty( $data['posts']['data'] ) ) {
			$content .= '<p>' . __( 'Cannot load blog posts at this time.', 'jetpack' ) . '</p>';
			$content .= '</div><!-- .jetpack-display-remote-posts -->';
			$content .= $args['after_widget'];

			echo $content;
			return;
		}

		$posts_list = $data['posts']['data'];

		/**
		 * Show only as much posts as we need. If we have less than configured amount,
		 * we must show only that much posts.
		 */
		$number_of_posts = min( $instance['number_of_posts'], count( $posts_list ) );

		for ( $i = 0; $i < $number_of_posts; $i ++ ) {
			$single_post = $posts_list[ $i ];
			$post_title  = ( $single_post['title'] ) ? $single_post['title'] : '( No Title )';

			$target = '';
			if ( isset( $instance['open_in_new_window'] ) && $instance['open_in_new_window'] == true ) {
				$target = ' target="_blank" rel="noopener"';
			}
			$content .= '<h4><a href="' . esc_url( $single_post['url'] ) . '"' . $target . '>' . esc_html( $post_title ) . '</a></h4>' . "\n";
			if ( ( $instance['featured_image'] == true ) && ( ! empty ( $single_post['featured_image'] ) ) ) {
				$featured_image = $single_post['featured_image'];
				/**
				 * Allows setting up custom Photon parameters to manipulate the image output in the Display Posts widget.
				 *
				 * @see    https://developer.wordpress.com/docs/photon/
				 *
				 * @module widgets
				 *
				 * @since  3.6.0
				 *
				 * @param array $args Array of Photon Parameters.
				 */
				$image_params = apply_filters( 'jetpack_display_posts_widget_image_params', array() );
				$content .= '<a title="' . esc_attr( $post_title ) . '" href="' . esc_url( $single_post['url'] ) . '"' . $target . '><img src="' . jetpack_photon_url( $featured_image, $image_params ) . '" alt="' . esc_attr( $post_title ) . '"/></a>';
			}

			if ( $instance['show_excerpts'] == true ) {
				$content .= $single_post['excerpt'];
			}
		}

		$content .= '</div><!-- .jetpack-display-remote-posts -->';
		$content .= $args['after_widget'];

		/**
		 * Filter the WordPress Posts widget content.
		 *
		 * @module widgets
		 *
		 * @since 4.7.0
		 *
		 * @param string $content Widget content.
		 */
		echo apply_filters( 'jetpack_display_posts_widget_content', $content );
	}

	/**
	 * Scan and extract first error from blog data array.
	 *
	 * @param array|WP_Error $blog_data Blog data to scan for errors.
	 *
	 * @return string First error message found
	 */
	public function extract_errors_from_blog_data( $blog_data ) {

		$errors = array(
			'message' => '',
			'debug'   => '',
			'where'   => '',
		);


		/**
		 * When the cache result is an error. Usually when the cache is empty.
		 * This is not an error case for now.
		 */
		if ( is_wp_error( $blog_data ) ) {
			return $errors;
		}

		/**
		 * Loop through `site_info` and `posts` keys of $blog_data.
		 */
		foreach ( array( 'site_info', 'posts' ) as $info_key ) {

			/**
			 * Contains information on which stage the error ocurred.
			 */
			$errors['where'] = $info_key;

			/**
			 * If an error is set, we want to check it for usable messages.
			 */
			if ( isset( $blog_data[ $info_key ]['error'] ) && ! empty( $blog_data[ $info_key ]['error'] ) ) {

				/**
				 * Extract error message from the error, if possible.
				 */
				if ( is_wp_error( $blog_data[ $info_key ]['error'] ) ) {
					/**
					 * In the case of WP_Error we want to have the error message
					 * and the debug information available.
					 */
					$error_messages    = $blog_data[ $info_key ]['error']->get_error_messages();
					$errors['message'] = reset( $error_messages );

					$extra_data = $blog_data[ $info_key ]['error']->get_error_data();
					if ( is_array( $extra_data ) ) {
						$errors['debug'] = implode( '; ', $extra_data );
					}
					else {
						$errors['debug'] = $extra_data;
					}

					break;
				}
				elseif ( is_array( $blog_data[ $info_key ]['error'] ) ) {
					/**
					 * In this case we don't have debug information, because
					 * we have no way to know the format. The widget works with
					 * WP_Error objects only.
					 */
					$errors['message'] = reset( $blog_data[ $info_key ]['error'] );
					break;
				}

				/**
				 * We do nothing if no usable error is found.
				 */
			}
		}

		return $errors;
	}

	/**
	 * Enqueue CSS and JavaScript.
	 *
	 * @since 4.0.0
	 */
	public function enqueue_scripts() {
		wp_enqueue_style( 'jetpack_display_posts_widget', plugins_url( 'wordpress-post-widget/style.css', __FILE__ ) );
	}

	/**
	 * Display the widget administration form.
	 *
	 * @param array $instance Widget instance configuration.
	 *
	 * @return string|void
	 */
	public function form( $instance ) {

		/**
		 * Initialize widget configuration variables.
		 */
		$title              = ( isset( $instance['title'] ) ) ? $instance['title'] : __( 'Recent Posts', 'jetpack' );
		$url                = ( isset( $instance['url'] ) ) ? $instance['url'] : '';
		$number_of_posts    = ( isset( $instance['number_of_posts'] ) ) ? $instance['number_of_posts'] : 5;
		$open_in_new_window = ( isset( $instance['open_in_new_window'] ) ) ? $instance['open_in_new_window'] : false;
		$featured_image     = ( isset( $instance['featured_image'] ) ) ? $instance['featured_image'] : false;
		$show_excerpts      = ( isset( $instance['show_excerpts'] ) ) ? $instance['show_excerpts'] : false;


		/**
		 * Check if the widget instance has errors available.
		 *
		 * Only do so if a URL is set.
		 */
		$update_errors = array();

		if ( ! empty( $url ) ) {
			$data          = $this->get_blog_data( $url );
			$update_errors = $this->extract_errors_from_blog_data( $data );
		}

		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'url' ); ?>"><?php _e( 'Blog URL:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'url' ); ?>" name="<?php echo $this->get_field_name( 'url' ); ?>" type="text" value="<?php echo esc_attr( $url ); ?>" />
			<i>
				<?php _e( "Enter a WordPress.com or Jetpack WordPress site URL.", 'jetpack' ); ?>
			</i>
			<?php
			/**
			 * Show an error if the URL field was left empty.
			 *
			 * The error is shown only when the widget was already saved.
			 */
			if ( empty( $url ) && ! preg_match( '/__i__|%i%/', $this->id ) ) {
				?>
				<br />
				<i class="error-message"><?php echo __( 'You must specify a valid blog URL!', 'jetpack' ); ?></i>
				<?php
			}
			?>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'number_of_posts' ); ?>"><?php _e( 'Number of Posts to Display:', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'number_of_posts' ); ?>">
				<?php
				for ( $i = 1; $i <= 10; $i ++ ) {
					echo '<option value="' . $i . '" ' . selected( $number_of_posts, $i ) . '>' . $i . '</option>';
				}
				?>
			</select>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'open_in_new_window' ); ?>"><?php _e( 'Open links in new window/tab:', 'jetpack' ); ?></label>
			<input type="checkbox" name="<?php echo $this->get_field_name( 'open_in_new_window' ); ?>" <?php checked( $open_in_new_window, 1 ); ?> />
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'featured_image' ); ?>"><?php _e( 'Show Featured Image:', 'jetpack' ); ?></label>
			<input type="checkbox" name="<?php echo $this->get_field_name( 'featured_image' ); ?>" <?php checked( $featured_image, 1 ); ?> />
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'show_excerpts' ); ?>"><?php _e( 'Show Excerpts:', 'jetpack' ); ?></label>
			<input type="checkbox" name="<?php echo $this->get_field_name( 'show_excerpts' ); ?>" <?php checked( $show_excerpts, 1 ); ?> />
		</p>

		<?php

		/**
		 * Show error messages.
		 */
		if ( ! empty( $update_errors['message'] ) ) {

			/**
			 * Prepare the error messages.
			 */

			$where_message = '';
			switch ( $update_errors['where'] ) {
				case 'posts':
					$where_message .= __( 'An error occurred while downloading blog posts list', 'jetpack' );
					break;

				/**
				 * If something else, beside `posts` and `site_info` broke,
				 * don't handle it and default to blog `information`,
				 * as it is generic enough.
				 */
				case 'site_info':
				default:
					$where_message .= __( 'An error occurred while downloading blog information', 'jetpack' );
					break;
			}

			?>
			<p class="error-message">
				<?php echo esc_html( $where_message ); ?>:
				<br />
				<i>
					<?php echo esc_html( $update_errors['message'] ); ?>
					<?php
					/**
					 * If there is any debug - show it here.
					 */
					if ( ! empty( $update_errors['debug'] ) ) {
						?>
						<br />
						<br />
						<?php esc_html_e( 'Detailed information', 'jetpack' ); ?>:
						<br />
						<?php echo esc_html( $update_errors['debug'] ); ?>
						<?php
					}
					?>
				</i>
			</p>

			<?php
		}
	}

	public function update( $new_instance, $old_instance ) {

		$instance          = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['url']   = ( ! empty( $new_instance['url'] ) ) ? strip_tags( trim( $new_instance['url'] ) ) : '';
		$instance['url']   = preg_replace( "!^https?://!is", "", $instance['url'] );
		$instance['url']   = untrailingslashit( $instance['url'] );


		/**
		 * Check if the URL should be with or without the www prefix before saving.
		 */
		if ( ! empty( $instance['url'] ) ) {
			$blog_data = $this->fetch_blog_data( $instance['url'], array(), true );

			if ( is_wp_error( $blog_data['site_info']['error'] ) && 'www.' === substr( $instance['url'], 0, 4 ) ) {
				$blog_data = $this->fetch_blog_data( substr( $instance['url'], 4 ), array(), true );

				if ( ! is_wp_error( $blog_data['site_info']['error'] ) ) {
					$instance['url'] = substr( $instance['url'], 4 );
				}
			}
		}

		$instance['number_of_posts']    = ( ! empty( $new_instance['number_of_posts'] ) ) ? intval( $new_instance['number_of_posts'] ) : '';
		$instance['open_in_new_window'] = ( ! empty( $new_instance['open_in_new_window'] ) ) ? true : '';
		$instance['featured_image']     = ( ! empty( $new_instance['featured_image'] ) ) ? true : '';
		$instance['show_excerpts']      = ( ! empty( $new_instance['show_excerpts'] ) ) ? true : '';

		/**
		 * Forcefully activate the update cron when saving widget instance.
		 *
		 * So we can be sure that it will be running later.
		 */
		$this->activate_cron();


		/**
		 * If there is no cache entry for the specified URL, run a forced update.
		 *
		 * @see get_blog_data Returns WP_Error if the cache is empty, which is what is needed here.
		 */
		$cached_data = $this->get_blog_data( $instance['url'] );

		if ( is_wp_error( $cached_data ) ) {
			$this->update_instance( $instance['url'] );
		}

		return $instance;
	}

	/**
	 * This is just to make method mocks in the unit tests easier.
	 *
	 * @param string $param Option key to get
	 *
	 * @return mixed
	 *
	 * @codeCoverageIgnore
	 */
	public function wp_get_option( $param ) {
		return get_option( $param );
	}

	/**
	 * This is just to make method mocks in the unit tests easier.
	 *
	 * @param string $option_name  Option name to be added
	 * @param mixed  $option_value Option value
	 *
	 * @return mixed
	 *
	 * @codeCoverageIgnore
	 */
	public function wp_add_option( $option_name, $option_value ) {
		return add_option( $option_name, $option_value );
	}

	/**
	 * This is just to make method mocks in the unit tests easier.
	 *
	 * @param string $option_name  Option name to be updated
	 * @param mixed  $option_value Option value
	 *
	 * @return mixed
	 *
	 * @codeCoverageIgnore
	 */
	public function wp_update_option( $option_name, $option_value ) {
		return update_option( $option_name, $option_value );
	}


	/**
	 * This is just to make method mocks in the unit tests easier.
	 *
	 * @param string $url  The URL to fetch
	 * @param array  $args Optional. Request arguments.
	 *
	 * @return array|WP_Error
	 *
	 * @codeCoverageIgnore
	 */
	public function wp_wp_remote_get( $url, $args = array() ) {
		return wp_remote_get( $url, $args );
	}
}
