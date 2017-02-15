<?php
/*
Plugin Name: Social Media Icons Widget
Description: A simple widget that displays social media icons
Author: Chris Rudzki
*/


/**
 * WPCOM_social_media_icons_widget class.
 *
 * @extends WP_Widget
 */
class WPCOM_social_media_icons_widget extends WP_Widget {

	/**
	 * Defaults
	 *
	 * @var mixed
	 * @access private
	 */
	private $defaults;

	/**
	 * Services
	 *
	 * @var mixed
	 * @access private
	 */
	private $services;


	/**
	 * __construct function.
	 *
	 * @access public
	 * @return void
	 */
	public function __construct() {
		parent::__construct(
			'wpcom_social_media_icons_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', esc_html__( 'Social Media Icons', 'jetpack' ) ),
			array(
				'description' => __( 'A simple widget that displays social media icons.', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);
		$this->defaults = array(
			'title'               => __( 'Social', 'jetpack' ),
			'facebook_username'   => '',
			'twitter_username'    => '',
			'instagram_username'  => '',
			'pinterest_username'  => '',
			'linkedin_username'   => '',
			'github_username'     => '',
			'youtube_username'    => '',
			'vimeo_username'      => '',
			'googleplus_username' => '',
			'flickr_username'     => '',
			'wordpress_username'  => '',
			'twitch_username'     => '',
			'tumblr_username'     => '',
		);
		$this->services = array(
			'facebook'   => array( 'Facebook', 'https://www.facebook.com/%s/' ),
			'twitter'    => array( 'Twitter', 'https://twitter.com/%s/' ),
			'instagram'  => array( 'Instagram', 'https://instagram.com/%s/' ),
			'pinterest'  => array( 'Pinterest', 'https://www.pinterest.com/%s/' ),
			'linkedin'   => array( 'LinkedIn', 'https://www.linkedin.com/in/%s/' ),
			'github'     => array( 'GitHub', 'https://github.com/%s/' ),
			'youtube'    => array( 'YouTube', 'https://www.youtube.com/%s/' ),
			'vimeo'      => array( 'Vimeo', 'https://vimeo.com/%s/' ),
			'googleplus' => array( 'Google+', 'https://plus.google.com/u/0/%s/' ),
			'flickr'     => array( 'Flickr', 'https://www.flickr.com/photos/%s/' ),
			'wordpress'  => array( 'WordPress.org', 'https://profiles.wordpress.org/%s/' ),
			'twitch'     => array( 'Twitch', 'https://www.twitch.tv/%s/' ),
			'tumblr'     => array( 'Tumblr', 'https://%s.tumblr.com' ),
		);
		if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		}
	}

	/**
	 * Enqueue Style.
	 *
	 * @access public
	 * @return void
	 */
	public function enqueue_style() {
		wp_register_style( 'jetpack_social_media_icons_widget', plugins_url( 'social-media-icons/style.css', __FILE__ ), array(), '20150602' );
		wp_enqueue_style( 'jetpack_social_media_icons_widget' );
	}

	/**
	 * Check Genericons.
	 *
	 * @access private
	 * @return Bool.
	 */
	private function check_genericons() {
		global $wp_styles;
		foreach ( $wp_styles->queue as $handle ) {
			if ( false !== stristr( $handle, 'genericons' ) ) {
				return $handle;
			}
		}
		return false;
	}

	/**
	 * Widget Front End.
	 *
	 * @access public
	 * @param mixed $args Arguments.
	 * @param mixed $instance Instance.
	 * @return void
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$instance['title'] = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );
		if ( ! $this->check_genericons() ) {
			wp_enqueue_style( 'genericons' );
		}
		$index = 10;
		$html = array();
		$alt_text = esc_attr__( 'View %1$s&#8217;s profile on %2$s', 'jetpack' );
		foreach ( $this->services as $service => $data ) {
			list( $service_name, $url ) = $data;
			if ( ! isset( $instance[ $service . '_username' ] ) ) {
				continue;
			}
			$username = $link_username = $instance[ $service . '_username' ];
			if ( empty( $username ) ) {
				continue;
			}
			$index += 10;
			if (
				'googleplus' === $service
				&& ! is_numeric( $username )
				&& substr( $username, 0, 1 ) !== '+'
			) {
				$link_username = '+' . $username;
			}
			if ( 'youtube' === $service && 'UC' === substr( $username, 0, 2 ) ) {
				$link_username = 'channel/' . $username;
			} else if ( 'youtube' === $service ) {
				$link_username = 'user/' . $username;
			}
			/**
			 * Fires for each profile link in the social icons widget. Can be used
			 * to change the links for certain social networks if needed.
			 *
			 * @module widgets
			 *
			 * @since 3.8.0
			 *
			 * @param string $url the currently processed URL
			 * @param string $service the lowercase service slug, e.g. 'facebook', 'youtube', etc.
			 */
			$link = apply_filters( 'jetpack_social_media_icons_widget_profile_link', esc_url( sprintf( $url, $link_username ) ), $service );
			$html[ $index ] =
				'<a href="' . $link
				. '" class="genericon genericon-' . $service . '" target="_blank"><span class="screen-reader-text">'
				. sprintf( $alt_text, esc_html( $username ), $service_name )
				. '</span></a>';
		}
		/**
		 * Fires at the end of the list of Social Media accounts.
		 * Can be used to add a new Social Media Site to the Social Media Icons Widget.
		 * The filter function passed the array of HTML entries that will be sorted
		 * by key, each wrapped in a list item element and output as an unsorted list.
		 *
		 * @module widgets
		 *
		 * @since 3.8.0
		 *
		 * @param array $html Associative array of HTML snippets per each icon.
		 */
		$html = apply_filters( 'jetpack_social_media_icons_widget_array', $html );
		ksort( $html );
		$html = '<ul><li>' . join( '</li><li>', $html ) . '</li></ul>';
		if ( ! empty( $instance['title'] ) ) {
			$html = $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'] . $html;
		}
		$html = $args['before_widget'] . $html . $args['after_widget'];

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'social_media_icons' );

		/**
		 * Filters the Social Media Icons widget output.
		 *
		 * @module widgets
		 *
		 * @since 3.6.0
		 *
		 * @param string $html Social Media Icons widget html output.
		 */
		echo apply_filters( 'jetpack_social_media_icons_widget_output', $html );
	}

	/**
	 * Widget Settings.
	 *
	 * @access public
	 * @param mixed $instance Instance.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_attr_e( 'Title:', 'jetpack' ); ?></label>
				<input
						class="widefat"
						id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
						name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
						type="text"
						value="<?php echo esc_attr( $instance['title'] ); ?>"
					/>
			</p>
		<?php
		foreach ( $this->services as $service => $data ) {
			list( $service_name, $url ) = $data;
			?>
				<p>
					<label for="<?php echo esc_attr( $this->get_field_id( $service . '_username' ) ); ?>">
					<?php
						/* Translators: %s is a social network name, e.g. Facebook. */
						printf( __( '%s username:', 'jetpack' ), $service_name );
					?>
				</label>
				<input
						class="widefat"
						id="<?php echo esc_attr( $this->get_field_id( $service . '_username' ) ); ?>"
						name="<?php echo esc_attr( $this->get_field_name( $service . '_username' ) ); ?>"
						type="text"
						value="<?php echo esc_attr( $instance[ $service . '_username' ] ); ?>"
					/>
				</p>
			<?php
		}
	}

	/**
	 * Update Widget Settings.
	 *
	 * @access public
	 * @param mixed $new_instance New Instance.
	 * @param mixed $old_instance Old Instance.
	 * @return Instance.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = (array) $old_instance;
		foreach ( $new_instance as $field => $value ) {
			$instance[ $field ] = sanitize_text_field( $new_instance[ $field ] );
		}
		// Stats.
		$stats = $instance;
		unset( $stats['title'] );
		$stats = array_filter( $stats );
		$stats = array_keys( $stats );
		$stats = array_map( array( $this, 'remove_username' ), $stats );
		foreach ( $stats as $val ) {
			/**
			 * Fires for each Social Media account being saved in the Social Media Widget settings.
			 *
			 * @module widgets
			 *
			 * @since 3.6.0
			 *
			 * @param string social-media-links-widget-svcs Type of action to track.
			 * @param string $val Name of the Social Media account being saved.
			 */
			do_action( 'jetpack_bump_stats_extras', 'social-media-links-widget-svcs', $val );
		}
		return $instance;
	}

	/**
	 * Remove username from value before to save stats.
	 *
	 * @access public
	 * @param mixed $val Value.
	 * @return Value.
	 */
	public function remove_username( $val ) {
		return str_replace( '_username', '', $val );
	}
} // End Class.

/**
 * Register and load the widget.
 *
 * @access public
 * @return void
 */
function wpcom_social_media_icons_widget_load_widget() {
	register_widget( 'wpcom_social_media_icons_widget' );
}
add_action( 'widgets_init', 'wpcom_social_media_icons_widget_load_widget' );
