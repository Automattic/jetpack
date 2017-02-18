<?php

/**
 * Plugin Name: Blogs I Follow Widget
 */

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_blogs_i_follow_widget_init' );

function jetpack_blogs_i_follow_widget_init() {
	if ( Jetpack::is_active() ) {
		register_widget( 'Jetpack_Widget_Blogs_I_Follow' );
		add_filter( 'jetpack_populate_blog_subscriptions', array( 'Jetpack_Widget_Blogs_I_Follow', 'populate_blog_subscriptions' ), 10, 1 );
	}
}

/**
 * Adds 10 minute running interval to the cron schedules
 *
 * @param array $schedules Existing cron schedules
 * @return array The schedules with the 10 minute interval included
 */
function jetpack_blogs_i_follow_widget_cron_intervals( $schedules ) {
	if ( ! isset( $schedules['minutes_10'] ) ) {
		$schedules['minutes_10'] = array(
			'interval' => 10 * MINUTE_IN_SECONDS,
			'display'  => 'Every 10 minutes'
		);
	}
	return $schedules;
}
add_filter( 'cron_schedules', 'jetpack_blogs_i_follow_widget_cron_intervals' );

/**
 * Blogs I Follow Widget class
 * Displays blogs followed by the specified user
 */

class Jetpack_Widget_Blogs_I_Follow extends WP_Widget {
	public $subscriptions;
	public $user_id;
	static $expiration     = 300;
	static $avatar_size    = 200;
	static $default_avatar = 'en.wordpress.com/i/logo/wpcom-gray-white.png';

	/**
	 * class constructor
	 * declare the widget as a widget and set some class/instance vars
	 *
	 * @return void
	 */
	function __construct() {

		parent::__construct( 'jp_blogs_i_follow', __( 'Blogs I Follow', 'jetpack' ), array( 'classname' => 'widget_jp_blogs_i_follow', 'description' => __( 'Display linked images for the blogs you follow', 'jetpack' ) ) );

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_script' ) );
			add_action( 'wp_print_styles', array( $this, 'enqueue_style' ) );
			add_action( 'wp_footer', array( $this, 'footer' ) );
		}

		$this->subscriptions = array();
	}

	/**
	 * widget output
	 * displays the subscriptions for the selected user id
	 * displays nothing if there are no subscriptions
	 * or a friendly message if the current user is the user to whom the widget belongs
	 *
	 * @param array $args the global widget args
	 * @param array $instance the settings for the current widget instance
	 * @return void
	 */
	function widget( $args, $instance ) {
		$instance = $this->extend_default_options( $instance );

		$this->user_id = $instance['user_id'];
		$this->display = $instance['display'];

		$this->subscriptions = $this->get_subscriptions();

		if ( $this->shouldnt_show( $subscriptions ) ) {
			return;
		}

		$title = apply_filters( 'widget_title', $instance['title'] );

		echo $args['before_widget'];

		if ( ! empty( $title ) )
			echo $args['before_title'] . $title . $args['after_title'];

		if ( ! empty( $this->subscriptions ) ) {
			if ( 'grid' === $this->display ) {
				echo $this->grid_view( $this->subscriptions );
			} else {
				echo $this->list_view( $this->subscriptions );
			}
		} elseif ( current_user_can( 'edit_theme_options' ) ) {
			echo $this->get_friendly_message();
		}

		// Track the usage stats for this widget
		echo $args['after_widget'];
		do_action( 'jetpack_stats_extra', 'widget_view', 'blogs_i_follow' );
	}

	/**
	 * Creates a URL for a REST API endpoint
	 *
	 * @param string $endpoint An endpoint, e.g. 'read/following/mine' (no leading slash)
	 * @return string The return value is a URL suitable to be used in an HTTP request to
	 * the endpoint
	 */
	private static function create_endpoint_url( $endpoint ) {
		return sprintf(
			'https://%s/rest/v%s/%s',
			JETPACK__WPCOM_JSON_API_HOST,
			Jetpack_Client::WPCOM_JSON_API_VERSION,
			$endpoint
		);
	}

	/**
	 * Converts data from the WordPress.com REST API into a format usable by the plugin
	 *
	 * The read/following/mine API is not identical in its contents or format to the private
	 * WPCOM tables used for Blogs I Follow. The data must be translated into a format that
	 * loosely conforms to what the plugin expects.
	 *
	 * @param object $subscription The subscription element retrieved from the REST API
	 * @return array The return value is an array reformmated to be similar to the data
	 * format used in WPCOM
	 */
	private static function convert_rest_subscription( $subscription ) {
		return array(
			'id' => intval( $subscription->ID ),
			'blog_id' => intval( $subscription->blog_ID ),
			'blog_url' => $subscription->URL,
			'feed_url' => $subscription->URL,
			'date_subscribed' => $subscription->date_subscribed,
		);
	}

	/**
	 * Retrieve the user's followed blogs from the WordPress.com REST API
	 *
	 * @param array $args An array of arguments used by WPCOM (including the
	 * user id). It is ignored by this function as the REST API call will be
	 * done on behalf of the Jetpack-connected account.
	 * @return array The return value is an array of blog subscription arrays
	 */
	public static function populate_blog_subscriptions( $args ) {
		$url = self::create_endpoint_url( 'read/following/mine' );
		$request_args = array(
			'url' => $url,
			'user_id' => JETPACK_MASTER_USER,
			'method' => 'GET',
		);
		$response = Jetpack_Client::remote_request( $request_args );
		if ( is_wp_error( $response ) ) {
			return array();
		} else {
			$response_body = wp_remote_retrieve_body( $response );
			if ( empty( $response_body ) ) {
				return array();
			}
			$response_body = json_decode( $response_body );
			$followed_blogs = array_map( array('Jetpack_Widget_Blogs_I_Follow', 'convert_rest_subscription'), $response_body->subscriptions );
			$followed_blogs = Jetpack_Widget_Blogs_I_Follow::populate_blog_details( $followed_blogs );
			return $followed_blogs;
		}
	}

	/**
	 * get the subscriptions used by the widget
	 * result is cached using a transient
	 *
	 * @return array the subscriptions
	 */
	function get_subscriptions() {
		$widget_data = get_option( 'widget_jp_blogs_i_follow' );
		$subscriptions = $widget_data[ $this->number ]['subscriptions_cache'];
		if ( empty( $subscriptions ) ) {
			$subscription_args = array( 'user_id' => $user_id, 'public_only' => true );
			// TODO: For WordPress.com, hook into this filter and use wpcom_subs_get_blogs
			// and other related functions to populate the subscription data
			/**
			 * Retrieve a collection of the user's WordPress.com blog subscriptions
			 *
			 * @module widgets
			 *
			 * @since 4.7.0
			 *
			 * @param array $subscription_args Used by WordPress.com to retrieve the user's blog subscriptions
			 * @return array The return value is an array of subscription arrays with information about each
			 * followed blog
			 */
			$subscriptions = apply_filters( 'jetpack_populate_blog_subscriptions', null, $subscription_args );

			if ( is_array( $subscriptions ) ) {
				foreach ( $subscriptions as &$sub ) {
					if ( ! wp_startswith( $sub['blog_url'], 'http://' ) && ! wp_startswith( $sub['blog_url'], 'https://' ) ) {
						$sub['blog_url'] = 'http://' . $sub['blog_url'];
					}
				}

				if ( ! empty( $subscriptions ) ) {
					$maximum_blogs = $widget_data[ $this->number ]['number'];
					$subscriptions = array_slice( $subscriptions, 0, $maximum_blogs );
					$widget_data[ $this->number ]['subscriptions_cache'] = $subscriptions;
					$widget_data[ $this->number ]['grid_html_cache'] = false;
					update_option( 'widget_jp_blogs_i_follow', $widget_data );
				}
			}
		}

		return $subscriptions;
	}

	/**
	 * determine if the widget should be hidden or shown
	 *
	 * @param array $subscriptions the subscriptions for the current widget
	 * @return bool
	 */
	function shouldnt_show( $subscriptions ) {
		return ( empty( $subscriptions ) && get_current_user_id() != $this->user_id );
	}

	/**
	 * Infer the blog name from the subscription URL(s) when the name is not available
	 *
	 * @param array $subscription the subscription data lacking a blog name
	 * @return string the inferred blog name
	 */
	function get_inferred_blog_name( $subscription ) {
		return rtrim( str_replace( array( 'http://', 'https://' ), '', empty( $subscription['blog_url'] ) ? $subscription['feed_url'] : $subscription['blog_url'] ), '/' );
	}

	/**
	 * Creates a string for a REST API call to the /sites/$site endpoint
	 *
	 * @param array $subscription Array containing data for a single blog subscription
	 * @return string The return value is a string for the REST endpoint to get information
	 * about the subscribed blog
	 */
	private static function get_subscription_blog_id( $subscription ) {
		return '/sites/' . $subscription['blog_id'];
	}

	/**
	 * Retrieves blavatars for the given subscriptions using the WordPress.com REST API
	 *
	 * @param array $subscriptions Array containing arrays of subscription data
	 * @return array The return value is an array of blog_id => img tag pairs where the
	 * img tag is set to the blavatar URL
	 */
	public static function populate_blog_details( $subscriptions ) {
		$blog_ids = array_map( array( 'Jetpack_Widget_Blogs_I_Follow', 'get_subscription_blog_id' ), $subscriptions );
		$batched_blavatar_query = build_query( array( 'urls' => $blog_ids ) );
		$response = wp_remote_get( 'https://public-api.wordpress.com/rest/v1.2/batch/?' . $batched_blavatar_query );
		if ( is_wp_error( $response ) ) {
			return NULL;
		} else {
			$response_body = wp_remote_retrieve_body( $response );
			if ( empty( $response_body ) ) {
				return NULL;
			}
			$response_body = json_decode( $response_body );
			// Process the JSON response, collecting the blavatars and the blog descriptions
			foreach ( $response_body as $site ) {
				if ( isset( $site->ID ) && isset( $site->icon ) && isset( $site->icon->img ) ) {
					$blavatars[ $site->ID ] = '<img src="' . $site->icon->img . '" />';
				}
				if ( isset( $site->ID ) && isset( $site->description ) ) {
					$descriptions[ $site->ID ] = $site->description;
				}
				if ( isset( $site->ID ) && isset( $site->name ) ) {
					$blog_names[ $site->ID ] = $site->name;
				}
			}
			// Update the subscriptions array with the additional fields retrieved from the API request
			foreach ( $subscriptions as &$subscription ) {
				$blog_id = $subscription['blog_id'];
				$subscription['blavatar_img_tag'] = isset( $blavatars[ $blog_id ] ) ? $blavatars[ $blog_id ] : null;
				$subscription['description'] = isset( $descriptions[ $blog_id ] ) ? $descriptions[ $blog_id ] : null;
				$subscription['blog_name'] = isset( $blog_names[ $blog_id ] ) ? $blog_names[ $blog_id ] : null;
			}
			return $subscriptions;
		}
	}

	function grid_view( $subscriptions ) {
		wp_enqueue_style( 'hover-bubbles' );

		// We are caching the HTML output because the blavatar functions
		// make either queries or HTTP requests, so they are slow.
		$widget_data = get_option( 'widget_jp_blogs_i_follow' );
		$output = $widget_data[ $this->number ]['grid_html_cache'];

		if ( empty( $output ) ) {

			$output  = '';

			$output .= "<div class='widgets-grid-layout no-grav'>";

			$i = 0;
			foreach ( $subscriptions as $subscription ) {
				$i++;

				if ( 'http://' === $subscription['blog_url'] )
					$subscription['blog_url'] = $subscription['feed_url'];

				$img = isset( $subscription['blavatar_img_tag'] ) ? $subscription['blavatar_img_tag'] : null;

				if ( !$img ) {
					if ( !empty( $subscription['blog_id'] ) ) {
						// TODO: On WordPress.com, register this filter for get_blog_option. The admin email
						// is not available via the REST API, so Jetpack currently cannot retrieve it.
						/**
						 * Allow blog options from external WordPress.com blogs to be retrieved
						 *
						 * @module widgets
						 *
						 * @since 4.7.0
						 *
						 * @param int $blog_id The blog's ID
						 * @param string option The option to be retrieved, e.g. 'admin_email'
						 * @return mixed The return value is the value of the requested option, or null if the option cannot be found
						 */
						$email = apply_filters( 'wpcom_blog_option', null, $subscription['blog_id'], 'admin_email' );
						$http = is_ssl() ? 'https' : 'http';
						$img = get_avatar( $email, self::$avatar_size, apply_filters( 'jetpack_static_url', esc_url_raw( $http . '://' . self::$default_avatar ) ) );
					}
				}
				if ( !$img )
					continue;

				$blog_name = empty( $subscription['blog_name'] ) ? $this->get_inferred_blog_name( $subscription ) : $subscription['blog_name'];
				$output .= "<div class='widget-grid-view-image wpcom-follow-gravatar'>";
				$output .= "<a href='"  . esc_url( $subscription['blog_url'] ) . "' title='" . esc_attr( $blog_name ) . "' data-id='" . esc_attr( 'wpcom-bubble-' . $this->id . '-' . $i ) . "' class='bump-view' data-bump-view='bif'>";
				$output .= $img;
				$output .= "</a>";
				$output .= "</div>";
			}

			$output .= "</div><div style='clear: both;'></div>";
			$widget_data[ $this->number ]['grid_html_cache'] = $output;
			update_option( 'widget_jp_blogs_i_follow', $widget_data );
		}

		return $output;
	}

	/**
	 * Simple HTML list view of the subscriptions. Just showing blog name with a link.
	 * @param  array $subscriptions All subscription data
	 * @return String containing full OL>LI list.
	 */
	function list_view( $subscriptions ) {
		$output = '';

		if ( count( $subscriptions ) ) {
			$output .= '<ul>';
			foreach ( $subscriptions as $sub ) {
				if ( 'http://' === $sub['blog_url'] )
					$sub['blog_url'] = $sub['feed_url'];

				if ( empty( $sub['blog_name'] ) ) {
					$sub['blog_name'] = $this->get_inferred_blog_name($sub);
				}

				$output .= '<li><a href="' . esc_url( $sub['blog_url'] ) . '" class="bump-view" data-bump-view="bif">' . esc_html( $sub['blog_name'] ) . '</a></li>';
			}
			$output .= '</ul>';
		}

		return $output;
	}

	/**
	 * output for friendly message
	 * displayed when there are no subscriptions and
	 * the current user is the user to whom the widget belongs
	 *
	 * @return string the message
	 */
	function get_friendly_message() {
		$message = sprintf(
			__( 'You are not yet following any blogs. Try <a href="%1$s">finding your friends</a> or check out our <a href="%2$s">recommended blogs</a>.', 'jetpack' ),
			/**
			 * Allow blog locales to be retrieved from WordPress.com or Jetpack
			 *
			 * @module widgets
			 *
			 * @since 4.7.0
			 *
			 * @return string The return value is the locale shortcode for the blog, e.g. 'en' or 'it'
			 */
			esc_url( apply_filters('jetpack_blog_locale', null) . '.wordpress.com/find-friends' ) . '" target="_blank',
			esc_url( apply_filters('jetpack_blog_locale', null) . '.wordpress.com/recommendations' ) . '" target="_blank'
		);

		return '<p>' . $message . '</p>';
	}

	/**
	 * widget save update
	 *
	 * @param array $new_instance the widget instance being saved
	 * @param array $old_instance the widget instance, prior to being saved
	 * @return array $instance, the saved widget instance
	 */
	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['id'] = $this->id;
		$instance['title']  = wp_kses( $new_instance['title'], array() );
		$instance['number'] = absint( $new_instance['number'] );

		$instance['user_id'] = (int) $new_instance['user_id'];
		if ( empty( $instance['user_id'] ) ) {
			$instance['user_id'] = absint( get_current_user_id() );			
		}

		if ( $instance['number'] < 1 || $instance['number'] > 50 ) {
			$instance['number'] = 20;
		}

		$instance['display'] = isset( $new_instance['display'] ) && 'grid' == $new_instance['display'] ? 'grid' : 'list';

		// Reset the caches
		$instance['subscriptions_cache'] = false;
		$instance['grid_html_cache'] = false;

		// TODO: Activate cron to generate first set of subscriptions, or maybe update cache directly

		return $instance;
	}

	/**
	 * display the widget admin form
	 *
	 * @param array $instance the current widget instance
	 *
	 * @return void
	 */
	function form( $instance ) {
		$instance = $this->extend_default_options( $instance );
		$display = $instance['display'];

		if ( empty( $instance['user_id']  ) ) {
			$instance['user_id'] = get_current_user_id();
		}
		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'number' ); ?>"><?php esc_html_e( 'Number of blogs to show:', 'jetpack' ); ?>
				<input type="number" id="<?php echo $this->get_field_id( 'number' ); ?>" name="<?php echo $this->get_field_name( 'number' ); ?>" value="<?php echo esc_attr( $instance['number'] ); ?>" min="1" max="50" />
				<br><small><?php esc_html_e( '(at most 50)', 'jetpack' ) ?> <a href="https://en.support.wordpress.com/widgets/blogs-i-follow-widget/" target="_blank">( ? )</a></small>
			</label>
		</p>

		<p>
			<label><?php esc_html_e( 'Display as:', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-list" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="list" <?php checked( 'list', $display ); ?> /> <?php esc_html_e( 'List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-grid" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="grid" <?php checked( 'grid', $display ); ?> /> <?php esc_html_e( 'Grid', 'jetpack' ); ?></label></li>
			</ul>
		</p>

		<input type="hidden" id="<?php echo $this->get_field_id( 'user_id' ); ?>" name="<?php echo $this->get_field_name( 'user_id' ); ?>" value="<?php echo esc_attr( (int) $instance['user_id'] ); ?>" />
		<?php
	}

	/**
	 * enqueue necessary scripts for the hovers
	 * only called when the widget is active
	 *
	 * @return void
	 */
	function enqueue_script() {
		// TODO: For Jetpack, hook into this action after determining what WordPress.com does
		// TODO: For WordPress.com, hook into this action to invoke enable_follow_buttons()
		/**
		 * Fires when follow buttons for blog subscriptions should be enabled on WordPress.com
		 *
		 * @module widgets
		 *
		 * @since 4.7.0
		 */
		do_action( 'jetpack_enable_follow_buttons' );
		wp_enqueue_script( 'jp-widget-follow-blogs', plugins_url( 'blogs-i-follow.js', __FILE__ ), array( 'jquery' ), false, true );
		wp_enqueue_script( 'widget-bump-view' );
	}

	/**
	 * enqueue necessary scripts for the hovers
	 * only called when the widget is active
	 *
	 * @return void
	 */
	function enqueue_style() {
		// The common style may have been registered by another widget
		if ( ! wp_style_is( 'widget-grid-and-list', 'registered' ) ) {
			wp_register_style(
				'widget-grid-and-list',
				plugins_url( '../widget-grid-and-list.css', __FILE__ ),
				array(),
				JETPACK__VERSION
			);
		}
		wp_enqueue_style(
			'blogs-i-follow-widget',
			plugins_url( 'blogs-i-follow.css', __FILE__ ),
			array(),
			'20120712a'
		);
		wp_enqueue_style( 'widget-grid-and-list' );
		wp_enqueue_style(
			'blogs-i-follow-widget-bubbles',
			plugins_url( 'hover-bubbles.css', __FILE__ ),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * generate markup used for the bla/gra/vatar hover/popups
	 * only when the widget is active & there's active subscriptions
	 *
	 * @return void
	 */
	function footer() {
		$widget_data = get_option( 'widget_jp_blogs_i_follow' );
		if ( ! is_active_widget( false, false, $this->id_base ) && ! empty( $widget_data ) )
			return;

		foreach ( $widget_data as $instance_data ) {
			if ( ! isset( $instance_data['id'] ) ) {
				continue;
			}
			$widget_id = $instance_data['id'];
			if ( ! empty( $instance_data['subscriptions_cache'] && $instance_data['display'] === 'grid' ) ) {
				$i = 0;
				$output = '<div id="wpcom-follow-bubbles-' . $widget_id . '" class="wpcom-follow-bubbles">';

				foreach ( $instance_data['subscriptions_cache'] as $subscription ) {
					$i++;
					$description = isset( $subscription['description'] ) ? $subscription['description'] : null;
					// TODO: For WordPress.com, $subscription['description'] will not be set. Hook into the filter
					// below and return the result of get_blog_option
					$description = apply_filters( 'wpcom_blog_option', $description, $subscription['blog_id'], 'blogdescription' );
					$description = ( !empty( $description ) ) ? '<small>' .  $description . '</small>' : '';
					$blog_name = empty( $subscription['blog_name'] ) ? $this->get_inferred_blog_name( $subscription ) : $subscription['blog_name'];
					$output .= '<div id="' . esc_attr( 'wpcom-bubble-' . $widget_id . '-' . $i ) . '" class="wpcom-bubble wpcom-follow-bubble"><div class="bubble-txt"><a href="' . esc_url( $subscription['blog_url'] ) . '" class="bump-view" data-bump-view="bif">' . $blog_name . '</a>';
					$output .= empty( $description ) ? '' : '<p>' . $description . '</p>';
					$output .= '</div></div>';
				}

				$output .= '</div>';
			}

			echo $output;
		}
	}

	function extend_default_options( $options ) {
		$defaults = array(
			'title' => __( 'Blogs I Follow', 'jetpack' ),
			'number' => 20,
			'user_id' => get_current_user_id(),
			'display' => 'list'
		);

		$merged = array_merge( $defaults, $options );

		if ( ! in_array( $merged['display'], array( 'grid', 'list' ) ) ) {
			$merged['display'] = 'list';
		}

		return $merged;
	}
}
