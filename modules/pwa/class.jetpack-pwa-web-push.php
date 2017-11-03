<?php

// TODO output web push JS from this module

class Jetpack_PWA_Web_Push {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Web_Push' ) ) {
			self::$__instance = new Jetpack_PWA_Web_Push();
		}

		return self::$__instance;
	}

	private function __construct() {
		if ( get_option( 'pwa_web_push' ) ) {
			add_filter( 'jetpack_published_post_flags', array( $this, 'modify_published_post_flags' ), 10, 2 );
			add_action( 'widgets_init', array( $this, 'register_subscribe_widget' ) );
		}
	}

	public function modify_published_post_flags( $flags, $post ) {
		if ( ! $this->post_type_is_web_pushable( $post->post_type ) ) {
			return $flags;
		}

		/**
		 * Determines whether a post being published gets sent to web push subscribers.
		 *
		 * @module pwa
		 *
		 * @since 5.6.0
		 *
		 * @param bool $should_publicize Should the post be web_pushed? Default to true.
		 * @param WP_POST $post Current Post object.
		 */
		if ( ! apply_filters( 'pwa_should_web_push_published_post', true, $post ) ) {
			return $flags;
		}

		$flags['web_push'] = true;

		return $flags;
	}

	protected function post_type_is_web_pushable( $post_type ) {
		if ( 'post' == $post_type )
			return true;

		return post_type_supports( $post_type, 'web_push' );
	}

	public function register_subscribe_widget() {
		register_widget( 'Jetpack_PWA_Web_Push_Subscribe_Widget' );
	}
}

if ( ! class_exists( 'Jetpack_PWA_Web_Push_Subscribe_Widget' ) ) {
	class Jetpack_PWA_Web_Push_Subscribe_Widget extends WP_Widget {
		/**
		 * Constructor
		 */
		public function __construct() {
			parent::__construct(
				'web_push_subscribe_widget',
				apply_filters( 'jetpack_widget_name', esc_html__( 'Jetpack Web Push Subscribe', 'jetpack' ) ),
				array(
					'description' => 'Web Push Subscribe',
				),
				array()
			);

			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_scripts' ) );
			}
		}

		/**
		 * Enqueue scripts and styles.
		 */
		function enqueue_frontend_scripts() {
			// TODO:
			// wp_enqueue_style( 'eu-cookie-law-style', plugins_url( 'eu-cookie-law/style.css', __FILE__ ), array(), '20170403' );
			// wp_enqueue_script( 'eu-cookie-law-script', plugins_url( 'eu-cookie-law/eu-cookie-law.js', __FILE__ ), array( 'jquery' ), '20170404', true );
		}

		function defaults() {
			// TODO:
			return array();
		}

		/**
		 * Outputs the content of the widget
		 *
		 * @param array $args
		 * @param array $instance
		 */
		public function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			echo $args['before_widget'];
			// require( dirname( __FILE__ ) . '/widget.php' );
			echo "The widget body";
			echo $args['after_widget'];
			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'web_push_subscribe' );
		}

		/**
		 * Back-end widget form.
		 *
		 * @param array $instance Previously saved values from database.
		 */
		public function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			// require( dirname( __FILE__ ) . '/eu-cookie-law/form.php' );
			echo "The form";
		}

		/**
		 * Processing widget options on save
		 *
		 * @param array $new_instance The new options
		 * @param array $old_instance The previous options
		 *
		 * @return array
		 */
		public function update( $new_instance, $old_instance ) {
			// processes widget options to be saved
		}
	}
}

