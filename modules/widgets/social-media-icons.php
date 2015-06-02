<?php
/**
 * Module Name: Social Media Icons Widget
 * Module Description: Easily add RSS links to your theme's sidebar.
 * A simple widget that displays social media icons
 * Author: Chris Rudzki
 * First Introduced: 3.6
 */


// Creating the widget

class WPCOM_social_media_icons_widget extends WP_Widget {

	private $defaults;

	public function __construct() {
		parent::__construct(
			'wpcom_social_media_icons_widget',
			apply_filters( 'jetpack_widget_name', esc_html__( 'Social Media Icons', 'jetpack' ) ),
			array(
				'classname' => 'widget_social_media_icons',
				'description' => __( 'A simple widget that displays social media icons.', 'jetpack' )
			)
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

	public function widget_css() {
		?>
		<style type="text/css">
			.widget_wpcom_social_media_icons_widget ul {
				list-style-type: none;
				margin-left: 0;
			}

			.widget_wpcom_social_media_icons_widget li {
				border: 0 none;
				display: inline;
				margin-right: 0.5em;
			}

			.widget_wpcom_social_media_icons_widget li a {
				border: 0 none;
				text-decoration: none;
			}

			.widget_wpcom_social_media_icons_widget .genericon {
				font-family: 'Genericons';
			}

			.widget_wpcom_social_media_icons_widget .screen-reader-text {
				clip: rect(1px, 1px, 1px, 1px);
				position: absolute !important;
				height: 1px;
				width: 1px;
				overflow: hidden;
			}

			.widget_wpcom_social_media_icons_widget .screen-reader-text:hover,
			.widget_wpcom_social_media_icons_widget .screen-reader-text:active,
			.widget_wpcom_social_media_icons_widget .screen-reader-text:focus {
				background-color: #f1f1f1;
				border-radius: 3px;
				box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.6);
				clip: auto !important;
				color: #21759b;
				display: block;
				font-size: 14px;
				font-size: 0.875rem;
				font-weight: bold;
				height: auto;
				left: 5px;
				line-height: normal;
				padding: 15px 23px 14px;
				text-decoration: none;
				top: 5px;
				width: auto;
				z-index: 100000; /* Above WP toolbar. */
			}
		</style>
	<?php
	}

	// front end
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		$instance['title'] = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );

		if ( ! $this->check_genericons() ) {
			wp_enqueue_style( 'genericons' );
		}

		add_action( 'wp_footer', array( $this, 'widget_css' ) );

		// before widget arguments
		$html = $args['before_widget'];

		if ( ! empty( $instance['title'] ) ) {
			$html .= $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];
		}

		// display output
		$html .= '<ul>';

		$alt_text = esc_attr_x( 'View %1$s&#8217;s profile on %2$s', '%1$s: Username on Social Network; %2$s: Name of the Social Network', 'jetpack' );

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
		echo apply_filters( 'wpcom-social-media-icons-widget-output', $html );
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
			<label for="<?php echo esc_attr( $this->get_field_id( 'youtube_username' ) ); ?>"><?php _e( 'YouTube username:', 'jetpack' ); ?></label>
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
		$stats = array_map( function( $val ) {
			return str_replace( '_username', '', $val );
		}, $stats );
		foreach ( $stats as $val ) {
			do_action( 'jetpack_stats_extra', 'social-media-links-widget-svcs', $val );
		}

		return $instance;
	}
} // class ends here

// register and load the widget
function wpcom_social_media_icons_widget_load_widget() {
	register_widget( 'wpcom_social_media_icons_widget' );
}
add_action( 'widgets_init', 'wpcom_social_media_icons_widget_load_widget' );
