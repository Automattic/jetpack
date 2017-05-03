<?php /*

**************************************************************************

Plugin Name:  Instagram Widget
Description:  Display some Instagram photos via a widget.
Author:       Automattic Inc.
Author URI:   http://automattic.com/

**************************************************************************/

/**
 * This is the actual Instagram widget along with other code that only applies to the widget.
 */
class WPcom_Instagram_Widget extends WP_Widget {

	const ID_BASE = 'wpcom_instagram_widget';

	public $valid_options;
	public $defaults;

	/**
	 * Sets the widget properties in WordPress, hooks a few functions, and sets some widget options.
	 */
	function __construct() {
		parent::__construct(
			self::ID_BASE,
			__( 'Instagram', 'wpcom-instagram-widget' ),
			array(
				'description' => __( 'Display your latest Instagram photos.', 'wpcom-instagram-widget' ),
			)
		);

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_css' ) );

		$this->valid_options = array(
			'max_columns' => 3,
			'max_count'   => 20,
		);

		$this->defaults = array(
			'token_id' => null,
			'title'    => __( 'Instagram', 'wpcom-instagram-widget' ),
			'columns'  => 2,
			'count'    => 6,
		);
	}

	/**
	 * Enqueues the widget's frontend CSS but only if the widget is currently in use.
	 */
	public function enqueue_css() {
		if ( ! is_active_widget( false, false, self::ID_BASE ) )
			return;

		wp_enqueue_style( self::ID_BASE, plugins_url( 'instagram.css', __FILE__ ) );
	}

	/**
	 * Updates the widget's option in the database to have the passed Keyring token ID.
	 * This is so the user doesn't have to click the "Save" button when we want to set it.
	 *
	 * @param int $token_id A Keyring token ID.
	 */
	public function update_widget_token_id( $token_id ) {
		$widget_options = $this->get_settings();

		if ( ! is_array( $widget_options[ $this->number ] ) )
			$widget_options[ $this->number ] = $this->defaults;

		$widget_options[ $this->number ]['token_id'] = (int) $token_id;

		$this->save_settings( $widget_options );
	}

	/**
	 * Validates the widget instance's token ID and then uses it to fetch images from Instagram.
	 * It then caches the result which it will use on subsequent pageviews.
	 * Keyring is not loaded nor is a remote request is not made in the event of a cache hit.
	 *
	 * @param array $instance A widget $instance, as passed to a widget's widget() method.
	 * @return string|array A string on error, an array of images on success.
	 */
	public function get_images( $instance ) {
		if ( ! $instance['token_id'] ) {
			return 'ERROR';
		}

		$transient_key = implode( '|', array( 'wpcom-instagram-widget', $instance['token_id'], $instance['count'] ) );
		$images = get_transient( $transient_key );

		if ( ! $images ) {
			$domain = preg_replace( '|^https?://|', '', home_url() );
			$exploded = explode( '/', $domain );
			$domain = array_shift( $exploded );
			$path = sprintf( '/sites/%s/instagram/%s?count=%s', $domain, $instance['token_id'], $instance['count'] );
			$result = $this->wpcom_json_api_request_as_blog( $path, 2, [ 'headers' => [ 'content-type' => 'application/json' ] ], null, 'wpcom' );

			// defaults
			$images = 'ERROR'; // non-array value = error
			$cache_time = MINUTE_IN_SECONDS;

			if ( 200 === wp_remote_retrieve_response_code( $result ) ) {
				$data = json_decode( wp_remote_retrieve_body( $result ), true );
				if ( isset( $data['images'] ) ) {
					$images = $data['images'];
					$cache_time = 20 * MINUTE_IN_SECONDS;
				}
			}

			set_transient( $transient_key, $images, $cache_time );
		}

		return $images;
	}

	private function wpcom_json_api_request_as_blog( $path, $version = 1, $args = array(), $body = null, $base_api_path = 'rest' ) {
		if ( ! class_exists( 'Jetpack_Client' ) ) {
			return new WP_Error( 'missing_jetpack', 'The `Jetpack_Client` class is missing' );
		}
		$filtered_args = array_intersect_key( $args, array(
			'headers'     => 'array',
			'method'      => 'string',
			'timeout'     => 'int',
			'redirection' => 'int',
			'stream'      => 'boolean',
			'filename'    => 'string',
			'sslverify'   => 'boolean',
		) );
		/**
		 * Determines whether Jetpack can send outbound https requests to the WPCOM api.
		 *
		 * @since 3.6.0
		 *
		 * @param bool $proto Defaults to true.
		 */
		$proto = apply_filters( 'jetpack_can_make_outbound_https', true ) ? 'https' : 'http';
		// unprecedingslashit
		$_path = preg_replace( '/^\//', '', $path );
		// Use GET by default whereas `remote_request` uses POST
		$request_method = ( isset( $filtered_args['method'] ) ) ? $filtered_args['method'] : 'GET';
		$validated_args = array_merge( $filtered_args, array(
			'url'     => sprintf( '%s://%s/%s/v%s/%s', $proto, JETPACK__WPCOM_JSON_API_HOST, $base_api_path, $version, $_path ),
			'blog_id' => (int) Jetpack_Options::get_option( 'id' ),
			'method'  => $request_method,
		) );
		return Jetpack_Client::remote_request( $validated_args, $body );
	}

	/**
	 * Outputs the contents of the widget on the front end.
	 *
	 * If the widget is unconfigured, a configuration message is displayed to users with admin access
	 * and the entire widget is hidden from everyone else to avoid displaying an empty widget.
	 *
	 * @param array $args The sidebar arguments that control the wrapping HTML.
	 * @param array $instance The widget instance (configuration options).
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		// Don't display anything to non-blog admins if the widgets is unconfigured
		if ( ! $instance['token_id'] && ! current_user_can( 'edit_theme_options' ) )
			return;

		echo $args['before_widget'];

		// Always show a title on an unconfigured widget
		if ( ! $instance['token_id'] && empty( $instance['title'] ) )
			$instance['title'] = $this->defaults['title'];

		if ( ! empty( $instance['title'] ) )
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];

		if ( ! $instance['token_id'] ) {
			echo '<p>This widget is currently unable to make new connections to Instagram. We are working on a fix.</p>';
			echo '<p><em>This notice is only shown to you.</em></p>';
		} else {
			$images = $this->get_images( $instance );

			if ( ! is_array( $images ) ) {
				echo '<p>' . __( 'There was an error retrieving images from Instagram. An attempt will be remade in a few minutes.', 'wpcom-instagram-widget' ) . '</p>';
			}
			elseif ( ! $images ) {
				echo '<p>' . __( 'No Instagram images were found.', 'wpcom-instagram-widget' ) . '</p>';
			}
			else {
				echo '<div class="' . esc_attr( 'wpcom-instagram-images wpcom-instagram-columns-' . (int) $instance['columns'] ) . '">' . "\n";
				foreach ( $images as $image ) {
					echo '<a href="' . esc_url( $image['link'] ) . '"><img src="' . esc_url( set_url_scheme( $image['url'] ) ) . '" width="' . esc_attr( (int) $image['width'] ) . '" height="' . esc_attr( (int) $image['height'] ) . '" alt="' . esc_attr( $image['title'] ) . '" title="' . esc_attr( $image['title'] ) . '" /></a>' . "\n";
				}
				echo "</div>\n";
			}
		}

		echo $args['after_widget'];
	}

	/**
	 * Outputs the widget configuration form for the widget administration page.
	 * Allows the user to add new Instagram Keyring tokens and more.
	 *
	 * @param array $instance The widget instance (configuration options).
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		// No connection.
		if ( ! $instance['token_id'] ) {
			echo '<p>This widget is currently unable to make new connections to Instagram. We are working on a fix.</p>';
			return;
		}

		echo '<p><strong>NOTE:</strong> This widget is temporarily unable to make new connections, so delete it at your own risk!</p>';

		// Title
		echo '<p><label><strong>' . __( 'Widget Title', 'wpcom-instagram-widget' ) . '</strong> <input type="text" id="' . esc_attr( $this->get_field_id( 'title' ) ) . '" name="' . esc_attr( $this->get_field_name( 'title' ) ) . '" value="' . esc_attr( $instance['title'] ) . '" class="widefat" /></label></p>';

		// Number of images to show
		echo '<p><label>';
			echo '<strong>' . __( 'Images', 'wpcom-instagram-widget' ) . '</strong><br />';
			echo __( 'Number to display:', 'wpcom-instagram-widget' ) . ' ';
			echo '<select name="' . esc_attr( $this->get_field_name( 'count' ) ) . '">';
			for ( $i = 1; $i <= $this->valid_options['max_count']; $i++ ) {
				echo '<option value="' . esc_attr( $i ) . '"' . selected( $i, $instance['count'], false ) . '>' . $i . '</option>';
			}
			echo '</select>';
		echo '</label></p>';

		// Columns
		echo '<p><label>';
			echo '<strong>' . __( 'Layout', 'wpcom-instagram-widget' ) . '</strong><br />';
			echo __( 'Number of columns:', 'wpcom-instagram-widget' ) . ' ';
			echo '<select name="' . esc_attr( $this->get_field_name( 'columns' ) ) . '">';
			for ( $i = 1; $i <= $this->valid_options['max_columns']; $i++ ) {
				echo '<option value="' . esc_attr( $i ) . '"' . selected( $i, $instance['columns'], false ) . '>' . $i . '</option>';
			}
			echo '</select>';
		echo '</label></p>';

		echo '<p><small>' . sprintf( __( 'New images may take up to %d minutes to show up on your site.', 'wpcom-instagram-widget' ), 20 ) . '</small></p>';
	}

	/**
	 * Validates and sanitizes the user-supplied widget options.
	 *
	 * @param array $new_instance The user-supplied values.
	 * @param array $old_instance The existing widget options.
	 * @return array A validated and sanitized version of $new_instance.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $this->defaults;

		$instance['token_id'] = $old_instance['token_id'];

		$instance['title'] = strip_tags( $new_instance['title'] );

		$instance['columns'] = max( 1, min( $this->valid_options['max_columns'], (int) $new_instance['columns'] ) );

		$instance['count'] = max( 1, min( $this->valid_options['max_count'], (int) $new_instance['count'] ) );

		return $instance;
	}
}

add_action( 'widgets_init', function() {
	register_widget( 'WPcom_Instagram_Widget' );
} );