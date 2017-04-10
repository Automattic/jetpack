<?php
/**
 * Disable direct access/execution to/of the widget code.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Flickr_Widget' ) ) {
	/**
	 * Flickr Widget
	 *
	 * Display your recent Flickr photos.
	 */
	class Jetpack_Flickr_Widget extends WP_Widget {
		/**
		 * Constructor.
		 */
		function __construct() {
			parent::__construct(
				'flickr',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', esc_html__( 'Flickr', 'jetpack' ) ),
				array(
					'description' => esc_html__( 'Display your recent Flickr photos.', 'jetpack' ),
					'customize_selective_refresh' => true,
				),
				array()
			);

			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
			}
		}

		/**
		 * Enqueue style.
		 */
		function enqueue_style() {
			wp_enqueue_style( 'flickr-widget-style', plugins_url( 'flickr/style.css', __FILE__ ), array(), '20170405' );
		}

		/**
		 * Return an associative array of default values.
		 *
		 * These values are used in new widgets.
		 *
		 * @return array Default values for the widget options.
		 */
		public function defaults() {
			return array(
				'title'             => esc_html__( 'Flickr Photos', 'jetpack' ),
				'items'             => 3,
				'flickr_image_size' => 'thumbnail',
				'flickr_rss_url'    => ''
			);
		}

		/**
		 * Front-end display of the widget.
		 *
		 * @param array $args     Widget arguments.
		 * @param array $instance Saved values from database.
		 */
		public function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );

			$image_size_string = 'small' == $instance['flickr_image_size'] ? '_m.jpg' : '_t.jpg';

			$rss_url = ( ! isset( $instance['flickr_rss_url'] ) || empty( $instance['flickr_rss_url'] ) )
				? 'https://api.flickr.com/services/feeds/photos_interesting.gne?format=rss_200'
				: htmlspecialchars_decode( $instance['flickr_rss_url'] );

			// We want to use the HTTPS version so the URLs in the API response are also HTTPS and we avoid mixed-content warnings.
			$rss_url = preg_replace( '!^http://api.flickr.com/!i', 'https://api.flickr.com/', $rss_url );

			$rss = fetch_feed( $rss_url );

			$photos = array();
			if ( ! is_wp_error( $rss ) ) {
				foreach ( $rss->get_items( 0, $instance['items'] ) as $photo ) {
					if ( $enclosure = $photo->get_enclosure() ) {
						$src = str_replace( '_s.jpg', $image_size_string, $enclosure->get_thumbnail() );
					} else {
						$src = preg_match( '/src="(.*?)"/i', $photo->get_description(), $p );
						$src = str_replace( '_m.jpg', $image_size_string, $p[1] );
					}
					array_push( $photos, array(
						'href'  => esc_url( $photo->get_permalink(), array( 'http', 'https' ) ),
						'src'   => esc_url( $src, array( 'http', 'https' ) ),
						'title' => esc_attr( $photo->get_title() ),
					) );
				}
				$flickr_home = esc_url( $rss->get_link(), array( 'http', 'https' ) );
			}

			echo $args['before_widget'];
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];
			require( dirname( __FILE__ ) . '/flickr/widget.php' );
			echo $args['after_widget'];
			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'flickr' );
		}

		/**
		 * Back-end widget form.
		 *
		 * @param array $instance Previously saved values from database.
		 */
		public function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			require( dirname( __FILE__ ) . '/flickr/form.php' );
		}

		/**
		 * Sanitize widget form values as they are saved.
		 *
		 * @param  array $new_instance Values just sent to be saved.
		 * @param  array $old_instance Previously saved values from database.
		 * @return array Updated safe values to be saved.
		 */
		public function update( $new_instance, $old_instance ) {
			$instance = array();
			$defaults = $this->defaults();

			if ( isset( $new_instance['title'] ) ) {
				$instance['title'] = wp_kses( $new_instance['title'], array() );
			}

			if ( isset( $new_instance['items'] ) ) {
				$instance['items'] = intval( $new_instance['items'] );
			}

			if (
				isset( $new_instance['flickr_image_size'] ) &&
				in_array( $new_instance['flickr_image_size'], array( 'thumbnail', 'small' ) )
			) {
				$instance['flickr_image_size'] = $new_instance['flickr_image_size'];
			} else {
				$instance['flickr_image_size'] = 'thumbnail';
			}

			if ( isset( $new_instance['flickr_rss_url'] ) ) {
				$instance['flickr_rss_url'] = esc_url( $new_instance['flickr_rss_url'], array( 'http', 'https' ) );

				if ( strlen( $instance['flickr_rss_url'] ) < 10 ) {
					$instance['flickr_rss_url'] = '';
				}
			}

			return $instance;
		}
	}

	// Register Jetpack_Flickr_Widget widget.
	function jetpack_register_flickr_widget() {
		register_widget( 'Jetpack_Flickr_Widget' );
	}
	add_action( 'widgets_init', 'jetpack_register_flickr_widget' );
}
