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
				'simple_payments_widget',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'Simple Payments', 'jetpack' ) ),
				array(
					'classname' => 'simple-payments',
					'description' => __( 'Add a Simple Payment Button as a Widget.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
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
			echo $args['before_widget'];

			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$title = apply_filters( 'widget_title', $instance['title'] );
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . $title . $args['after_title'];
			}

			echo '<div class="simple-payments-content">';

			if( ! empty( $instance['product_post_id'] ) ) {
				$attrs = array( 'id' => $instance['product_post_id'] );
			} else {
				$product_posts = get_posts( array(
					'numberposts' => 1,
					'orderby' => 'date',
					'post_type' => 'jp_pay_product'
				 ) );

				$attrs = array( 'id' => $product_posts[0]->ID );
			}

			$jsp = Jetpack_Simple_Payments::getInstance();
			echo $jsp->parse_shortcode( $attrs );

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
			$product_posts = get_posts( array(
				'numberposts' => 100,
				'orderby' => 'date',
				'post_type' => 'jp_pay_product'
			 ) );

			require( dirname( __FILE__ ) . '/simple-payments/form.php' );
		}
	}
	
	// Register Jetpack_Simple_Payments_Widget widget.
	function register_widget_jetpack_simple_payments() {
		register_widget( 'Jetpack_Simple_Payments_Widget' );
	}
	add_action( 'widgets_init', 'register_widget_jetpack_simple_payments' );
}
