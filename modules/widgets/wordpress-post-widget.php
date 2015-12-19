<?php
/**
 * Plugin Name: Display Recent WordPress Posts Widget
 * Description: Displays recent posts from a WordPress.com or Jetpack-enabled self-hosted WordPress site.
 * Version: 1.0
 * Author: Brad Angelcyk, Kathryn Presner, Justin Shreve, Carolyn Sonnek
 * Author URI: http://automattic.com
 * License: GPL2
 */
add_action( 'widgets_init', 'jetpack_display_posts_widget' );
function jetpack_display_posts_widget() {
	 register_widget( 'Jetpack_Display_Posts_Widget' );
}

/*
 * Display a list of recent posts from a WordPress.com or Jetpack-enabled blog.
 */
class Jetpack_Display_Posts_Widget extends WP_Widget {

	public $service_url = 'https://public-api.wordpress.com/rest/v1.1/';

	public function __construct() {
		parent::__construct(
			// internal id
			'jetpack_display_posts_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Display WordPress Posts', 'jetpack' ) ),
			array(
				'description' => __( 'Displays a list of recent posts from another WordPress.com or Jetpack-enabled blog.', 'jetpack' ),
			)
		);
	}

	/**
	 * Expiring transients have a name length maximum of 45 characters,
	 * so this function returns an abbreviated MD5 hash to use instead of
	 * the full URI.
	 */
	public function get_site_hash( $site ) {
		return substr( md5( $site ), 0, 21 );
	}

	public function get_site_info( $site ) {
		$site_hash = $this->get_site_hash( $site );
		$data_from_cache = get_transient( 'display_posts_site_info_' . $site_hash );
		if ( false === $data_from_cache ) {
			$raw_data = $this->fetch_site_info( $site );
			$response = $this->parse_site_info_response( $raw_data );

			set_transient( 'display_posts_site_info_' . $site_hash, $response, 10 * MINUTE_IN_SECONDS );
		} else {
			$response = $data_from_cache;
		}

		return $response;
	}


	/**
     * Fetch a remote service endpoint and parse it.
     *
	 * @param string $endpoint Parametrized endpoint to call.
	 *
	 * @return array|WP_Error
 	 */
	public function fetch_service_endpoint( $endpoint ) {
		$raw_data = wp_remote_get( $this->service_url . ltrim( $endpoint, '/' ) );

		$parsed_data = $this->parse_service_response( $raw_data );

		return $parsed_data;
	}


	/**
     * Parse data from service response.
     * Do basic error handling for general service and data errors
     *
	 * @param array $service_response Response from the service.
	 *
	 * @return array
     */
	public function parse_service_response( $service_response ) {
		/**
		 * If there is an error, we add the error message to the parsed response
         */
        if ( is_wp_error( $service_response ) ) {
			return new WP_Error(
							'general_error',
							__( 'An error occurred while fetching data from remote.', 'jetpack' ),
							$service_response->get_error_messages()
						);
		}

		/**
		 * Validate HTTP response code.
		 */
		if ( 200 !== wp_remote_retrieve_response_code( $service_response ) ) {
			return new WP_Error(
							'http_error',
							__( 'An error occurred while fetching data from remote.', 'jetpack' ),
							wp_remote_retrieve_response_message( $service_response )
						);
		}

		/**
		 * No body has been set in the response. This should be pretty bad.
		 */
		if ( ! isset( $service_response['body'] ) ) {
			return new WP_Error(
							'no_body',
							__( 'Invalid data returned by remote.', 'jetpack' ),
							'No body in response.'
						);
		}

		/**
		 * Parse the JSON response from the API. Convert to associative array.
         */
		$parsed_data = json_decode( $service_response['body'] );

		/**
         * If there is a problem with parsing the posts return an empty array.
         */
		if ( is_null( $parsed_data ) ) {
			return new WP_Error(
							'no_body',
							__( 'Invalid data returned by remote.', 'jetpack' ),
							'Invalid JSON from remote.'
						);
		}

		/**
         * Check for errors in the parsed body.
		 */
		if ( isset( $parsed_data->error ) ) {
			return new WP_Error(
							'remote_error',
							__( 'We cannot display information for this blog.', 'jetpack' ),
							$parsed_data['error']
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
				 * @see https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/
				 *
				 * @module widgets
				 *
				 * @since 3.6.0
				 *
				 * @param string $args Extra parameters to filter posts returned from the WordPress.com REST API.
				 */
				apply_filters( 'jetpack_display_posts_widget_posts_params', '' )
			)
		);

		return $response;
	}

	/**
     * Parse external API response and handle errors if any occur.
     *
     * @param array|WP_Error $service_response The raw response to be parsed.
     *
     * @return array
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
		if ( ! is_array( $service_response->posts ) ) {
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
     * Format the posts for better storage. Drop all the data that is not used.
     *
	 * @param array $parsed_data Array of posts returned by the APIs
	 *
	 * @return array Formatted posts or
	 */
	public function format_posts_for_storage( $parsed_data ) {

		$formatted_posts = array();

		/**
		 * Loop through all the posts and format them appropriately.
		 */
		foreach ( $parsed_data->posts as $single_post ) {

			$prepared_post = array(
				'title'          => $single_post->title          ? $single_post->title           : '',
				'excerpt'        => $single_post->excerpt        ? $single_post->excerpt         : '',
				'featured_image' => $single_post->featured_image ? $single_post->featured_image  : '',
				'url'            => $single_post->URL,
			);

			/**
			 * Append the formatted post to the results.
			 */
			$formatted_posts[] = $prepared_post;
		}

		return $formatted_posts;
	}

	/*
	 * Set up the widget display on the front end
	 */
	public function widget( $args, $instance ) {
		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $instance['title'] );

		wp_enqueue_style( 'jetpack_display_posts_widget', plugins_url( 'wordpress-post-widget/style.css', __FILE__ ) );

		$site_info = $this->get_site_info( $instance['url'] );

		echo $args['before_widget'];

		if ( false === $site_info ) {
			echo '<p>' . __( 'We cannot load blog data at this time.', 'jetpack' ) . '</p>';
			echo $args['after_widget'];
			return;
		}

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title . ': ' . $site_info->name ) . $args['after_title'];
		} else {
			echo $args['before_title'] . esc_html( $site_info->name ) . $args['after_title'];
		}

		$site_hash = $this->get_site_hash( $instance['url'] );
		$data_from_cache = get_transient( 'display_posts_post_info_' . $site_hash );
		if ( false === $data_from_cache ) {
			$raw_data = $this->fetch_posts_for_site( $site_info->ID );
			$response = $this->parse_posts_response( $raw_data );

			set_transient( 'display_posts_post_info_' . $site_hash, $response, 10 * MINUTE_IN_SECONDS );
		} else {
			$response = $data_from_cache;
		}

		echo '<div class="jetpack-display-remote-posts">';

		if ( is_wp_error( $response ) ) {
			/** @var WP_Error $response */
			// TODO remove debug
			echo '<p>' . esc_html( print_r($response->get_error_messages(),1) ) . ' '.esc_html( print_r($response->get_error_data(),1) ).'</p>';
			echo '</div><!-- .jetpack-display-remote-posts -->';
			echo $args['after_widget'];
			return;
		}


		// TODO currently the data format has a personality disorder.
		//$posts_info = json_decode( $response['body'] );
		$posts_list = $response;

		/**
		 * Show only as much posts as we need. If we have less than configured amount,
         * we must show only that much posts.
         */
		$number_of_posts = min( $instance['number_of_posts'], count( $posts_list ) );

		for ( $i = 0; $i < $number_of_posts; $i++ ) {
			$single_post = $posts_list[$i];
			$post_title = ( $single_post['title'] ) ? $single_post['title']: '( No Title )';

			$target = '';
			if ( isset( $instance['open_in_new_window'] ) && $instance['open_in_new_window'] == true ) {
 				 $target = ' target="_blank"';
			}
			echo '<h4><a href="' . esc_url( $single_post['url'] ) . '"' . $target . '>' . esc_html( $post_title ) . '</a></h4>' . "\n";
			if ( ( $instance['featured_image'] == true ) && ( ! empty ( $single_post['featured_image'] ) ) ) {
				$featured_image = $single_post['featured_image'];
				/**
				 * Allows setting up custom Photon parameters to manipulate the image output in the Display Posts widget.
				 *
				 * @see https://developer.wordpress.com/docs/photon/
				 *
				 * @module widgets
				 *
				 * @since 3.6.0
				 *
				 * @param array $args Array of Photon Parameters.
				 */
				$image_params = apply_filters( 'jetpack_display_posts_widget_image_params', array() );
				echo '<a title="' . esc_attr( $post_title ) . '" href="' . esc_url( $single_post['url'] ) . '"><img src="' . jetpack_photon_url( $featured_image, $image_params ) . '" alt="' . esc_attr( $post_title ) . '"/></a>';
			}

			if ( $instance['show_excerpts'] == true ) {
				echo $single_post['excerpt'];
			}
		}

		echo '</div><!-- .jetpack-display-remote-posts -->';
		echo $args['after_widget'];
	}

	public function form( $instance ) {
		if ( isset( $instance['title'] ) ) {
			$title = $instance['title'];
		} else {
			$title = __( 'Recent Posts', 'jetpack' );
		}

		if ( isset( $instance['url'] ) ) {
			$url = $instance['url'];
		} else {
			$url = '';
		}

		if ( isset( $instance['number_of_posts'] ) ) {
			$number_of_posts = $instance['number_of_posts'];
		} else {
			$number_of_posts = 5;
		}

		$open_in_new_window = false;
		if ( isset( $instance['open_in_new_window'] ) ) {
		    $open_in_new_window = $instance['open_in_new_window'];
		}

		if ( isset( $instance['featured_image'] ) ) {
			$featured_image = $instance['featured_image'];
		} else {
			$featured_image = false;
		}

		if ( isset( $instance['show_excerpts'] ) ) {
			$show_excerpts = $instance['show_excerpts'];
		} else {
			$show_excerpts = false;
		}

		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'url' ); ?>"><?php _e( 'Blog URL:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'url' ); ?>" name="<?php echo $this->get_field_name( 'url' ); ?>" type="text" value="<?php echo esc_attr( $url ); ?>" />
			<p>
			<?php _e( "Enter a WordPress.com or Jetpack WordPress site URL.", 'jetpack' ); ?>
			</p>
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'number_of_posts' ); ?>"><?php _e( 'Number of Posts to Display:', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'number_of_posts' ); ?>">
				<?php
					for ($i = 1; $i <= 10; $i++) {
					echo '<option value="' . $i . '" '.selected( $number_of_posts, $i ).'>' . $i . '</option>';
					}
				?>
			</select>
		</p>
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
	}

	public function update( $new_instance, $old_instance ) {
		$instance = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		$instance['url'] = ( ! empty( $new_instance['url'] ) ) ? strip_tags( $new_instance['url'] ) : '';
		$instance['url'] = str_replace( "http://", "", $instance['url'] );
		$instance['url'] = untrailingslashit( $instance['url'] );

		// Normalize www.
		$site_info = $this->get_site_info( $instance['url'] );
		if ( ! $site_info && 'www.' === substr( $instance['url'], 0, 4 ) ) {
			$site_info = $this->get_site_info( substr( $instance['url'], 4 ) );
			if ( $site_info ) {
				$instance['url'] = substr( $instance['url'], 4 );
			}
		}

		$instance['number_of_posts'] = ( ! empty( $new_instance['number_of_posts'] ) ) ? intval( $new_instance['number_of_posts'] ) : '';
		$instance['open_in_new_window'] = ( ! empty( $new_instance['open_in_new_window'] ) ) ? true : '';
		$instance['featured_image'] = ( ! empty( $new_instance['featured_image'] ) ) ? true : '';
		$instance['show_excerpts'] = ( ! empty( $new_instance['show_excerpts'] ) ) ? true : '';
		return $instance;
	}
}