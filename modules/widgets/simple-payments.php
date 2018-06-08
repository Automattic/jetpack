<?php
/**
 * Disable direct access/execution to/of the widget code.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Simple_Payments_Widget' ) ) {
	/**
	 * Simple Payments Button
	 *
	 * Display a Simple Payment Button as a Widget.
	 */
	class Jetpack_Simple_Payments_Widget extends WP_Widget {
		/**
		 * Constructor.
		 */
		function __construct() {
			parent::__construct(
				'jetpack_simple_payments_widget',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'Simple Payments', 'jetpack' ) ),
				array(
					'classname' => 'jetpack-simple-payments',
					'description' => __( 'Add a Simple Payment Button as a Widget.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
			);

			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
			}
		}

		function enqueue_style() {
			wp_enqueue_style( 'jetpack-simple-payments-widget-style', plugins_url( 'simple-payments/style.css', __FILE__ ), array(), '20180518' );
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
				'title' => '',
				'product_post_id' => 0,
			);
		}

		/**
		 * Front-end display of widget.
		 *
		 * @see WP_Widget::widget()
		 *
		 * @param array $args     Widget arguments.
		 * @param array $instance Saved values from database.
		 */
		function widget( $args, $instance ) {
			if( ! empty( $instance['product_post_id'] ) ) {
				$attrs = array( 'id' => $instance['product_post_id'] );
			} else {
				$product_posts = get_posts( array(
					'numberposts' => 1,
					'orderby' => 'date',
					'post_type' => Jetpack_Simple_Payments::$post_type_product
				 ) );

				$attrs = array( 'id' => $product_posts[0]->ID );
			}

			$jsp = Jetpack_Simple_Payments::getInstance();

			$simple_payments_button = $jsp->parse_shortcode( $attrs );

			if ( is_null( $simple_payments_button ) && ! is_customize_preview() ) {
				return;
			}

			echo $args['before_widget'];

			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$title = apply_filters( 'widget_title', $instance['title'] );
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . $title . $args['after_title'];
			}

			echo '<div class="jetpack-simple-payments-content">';

			echo $simple_payments_button;

			echo '</div><!--simple-payments-->';

			echo $args['after_widget'];

			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'simple_payments' );
		}

		/**
		 * Sanitize widget form values as they are saved.
		 *
		 * @see WP_Widget::update()
		 *
		 * @param array $new_instance Values just sent to be saved.
		 * @param array $old_instance Previously saved values from database.
		 *
		 * @return array Updated safe values to be saved.
		 */
		function update( $new_instance, $old_instance ) {
			return array(
				'title' => ! empty( $new_instance['title'] ) ? sanitize_text_field( $new_instance['title'] ) : '',
				'product_post_id' => (int) $new_instance['product_post_id'],
			);
		}

		/**
		 * Back-end widget form.
		 *
		 * @see WP_Widget::form()
		 *
		 * @param array $instance Previously saved values from database.
		 */
		function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );

			$product_posts = get_posts( array(
				'numberposts' => 100,
				'orderby' => 'date',
				'post_type' => Jetpack_Simple_Payments::$post_type_product
			 ) );

			require( dirname( __FILE__ ) . '/simple-payments/form.php' );
		}
	}

	// Register Jetpack_Simple_Payments_Widget widget.
	function register_widget_jetpack_simple_payments() {
		// || ! Jetpack::active_plan_supports( 'simple-payment' )
		// || ! shortcode_exists( Jetpack_Simple_Payments::$shortcode )
		if ( ! Jetpack::is_active() ) {
			return;
		}

		register_widget( 'Jetpack_Simple_Payments_Widget' );
	}
	add_action( 'widgets_init', 'register_widget_jetpack_simple_payments' );
}
