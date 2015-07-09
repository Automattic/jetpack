<?php
/*
Plugin Name: Social Media Icons Widget
Description: A simple widget that displays social media icons
Author: Chris Rudzki
*/

// Creating the widget

class WPCOM_social_media_icons_widget extends WP_Widget {

	private $defaults;

	public function __construct() {
		parent::__construct(
			'wpcom_social_media_icons_widget',
			apply_filters( 'jetpack_widget_name', esc_html__( 'Social Media Icons', 'jetpack' ) ),
			array( 'description' => __( 'A simple widget that displays social media icons.', 'jetpack' ), )
		);

		$this->defaults = array(
			'title'              => __( 'Social', 'jetpack' ),
			'facebook_username'  => '',
			'twitter_username'   => '',
			'instagram_username' => '',
			'pinterest_username' => '',
			'linkedin_username'  => '',
			'github_username'    => '',
			'youtube_username'   => '',
			'vimeo_username'     => '',
		);

		if ( is_active_widget( false, false, $this->id_base ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		}
	}

	public function enqueue_style() {
		wp_register_style( 'jetpack_social_media_icons_widget', plugins_url( 'social-media-icons/style.css', __FILE__ ), array(), '20150602' );
		wp_enqueue_style( 'jetpack_social_media_icons_widget' );
	}

	private function check_genericons() {
		global $wp_styles;

		foreach ( $wp_styles->queue as $handle ) {
			if ( false !== stristr( $handle, 'genericons' ) ) {
				return $handle;
			}
		}

		return false;
	}

	// front end
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$instance['title'] = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );

		if ( ! $this->check_genericons() ) {
			wp_enqueue_style( 'genericons' );
		}

		// before widget arguments
		$html = $args['before_widget'];

		if ( ! empty( $instance['title'] ) ) {
			$html .= $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];
		}

		// display output
		$html .= '<ul>';

		$alt_text = esc_attr__( 'View %1$s&#8217;s profile on %2$s', 'jetpack' );

		if ( ! empty( $instance['facebook_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['facebook_username'] ), 'Facebook' ) . '" href="' . esc_url( 'https://www.facebook.com/' . $instance['facebook_username'] . '/' ) . '" class="genericon genericon-facebook" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['facebook_username'] ), 'Facebook' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['twitter_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['twitter_username'] ), 'Twitter' ) . '" href="' . esc_url( 'https://twitter.com/' . $instance['twitter_username'] . '/' ) . '" class="genericon genericon-twitter" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['twitter_username'] ), 'Twitter' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['instagram_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['instagram_username'] ), 'Instagram' ) . '" href="' . esc_url( 'https://instagram.com/' . $instance['instagram_username'] . '/' ) . '" class="genericon genericon-instagram" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['instagram_username'] ), 'Instagram' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['pinterest_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['pinterest_username'] ), 'Pinterest' ) . '" href="' . esc_url( 'https://www.pinterest.com/' . $instance['pinterest_username'] . '/' ) . '" class="genericon genericon-pinterest-alt" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['pinterest_username'] ), 'Pinterest' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['linkedin_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['linkedin_username'] ), 'LinkedIn' ) . '" href="' . esc_url( 'https://www.linkedin.com/in/' . $instance['linkedin_username'] . '/' ) . '" class="genericon genericon-linkedin-alt" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['linkedin_username'] ), 'LinkedIn' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['github_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['github_username'] ), 'GitHub' ) . '" href="' . esc_url( 'https://github.com/' . $instance['github_username'] . '/' ) . '" class="genericon genericon-github" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['github_username'] ), 'GitHub' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['youtube_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['youtube_username'] ), 'YouTube' ) . '" href="' . esc_url( 'https://www.youtube.com/channel/' . $instance['youtube_username'] ) . '" class="genericon genericon-youtube" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['youtube_username'] ), 'YouTube' ) . '</span></a></li>';
		}

		if ( ! empty( $instance['vimeo_username'] ) ) {
			$html .= '<li><a title="' . sprintf( $alt_text, esc_attr( $instance['vimeo_username'] ), 'Vimeo' ) . '" href="' . esc_url( 'https://vimeo.com/' . $instance['vimeo_username'] . '/' ) . '" class="genericon genericon-vimeo" target="_blank"><span class="screen-reader-text">' . sprintf( $alt_text, esc_html( $instance['vimeo_username'] ), 'Vimeo' ) . '</span></a></li>';
		}

		$html .= '</ul>';

		// after widget arguments
		$html .= $args['after_widget'];

		/**
		 * Filters the Social Media Icons widget output.
		 *
		 * @since 3.6.0
		 *
		 * @param string $html Social Media Icons widget html output.
		 */
		echo apply_filters( 'jetpack_social_media_icons_widget_output', $html );
	}

	// backend
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
	?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'facebook_username' ) ); ?>"><?php _e( 'Facebook username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'facebook_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'facebook_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['facebook_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'twitter_username' ) ); ?>"><?php _e( 'Twitter username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'twitter_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'twitter_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['twitter_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'instagram_username' ) ); ?>"><?php _e( 'Instagram username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'instagram_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'instagram_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['instagram_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'pinterest_username' ) ); ?>"><?php _e( 'Pinterest username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'pinterest_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'pinterest_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['pinterest_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'linkedin_username' ) ); ?>"><?php _e( 'LinkedIn username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'linkedin_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'linkedin_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['linkedin_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'github_username' ) ); ?>"><?php _e( 'GitHub username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'github_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'github_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['github_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'youtube_username' ) ); ?>"><?php _e( 'YouTube channel ID:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'youtube_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'youtube_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['youtube_username'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'vimeo_username' ) ); ?>"><?php _e( 'Vimeo username:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'vimeo_username' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'vimeo_username' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['vimeo_username'] ); ?>" />
		</p>
	<?php
	}

	// updating widget settings
	public function update( $new_instance, $old_instance ) {
		$instance = (array) $old_instance;

		foreach ( $new_instance as $field => $value ) {
			$instance[$field] = sanitize_text_field( $new_instance[$field] );
		}

		// Stats
		$stats = $instance;
		unset( $stats['title'] );
		$stats = array_filter( $stats );
		$stats = array_keys( $stats );
		$stats = array_map( array( $this, 'remove_username' ), $stats );
		foreach ( $stats as $val ) {
			/**
			 * Fires for each Social Media account being saved in the Social Media Widget settings.
			 *
			 * @since 3.6.0
			 *
			 * @param string social-media-links-widget-svcs Type of action to track.
			 * @param string $val Name of the Social Media account being saved.
			 */
			do_action( 'jetpack_bump_stats_extras', 'social-media-links-widget-svcs', $val ) ;
		}

		return $instance;
	}

	// Remove username from value before to save stats
	public function remove_username( $val ) {
		return str_replace( '_username', '', $val );
	}

} // class ends here

// register and load the widget
function wpcom_social_media_icons_widget_load_widget() {
	register_widget( 'wpcom_social_media_icons_widget' );
}
add_action( 'widgets_init', 'wpcom_social_media_icons_widget_load_widget' );
