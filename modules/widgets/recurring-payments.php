<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Disable direct access/execution to/of the widget code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Recurring_Payments_Widget' ) ) {
	/**
	 * Recurring Payments Button
	 *
	 * Display a Recurring Payments Button as a Widget.
	 */
	class Jetpack_Recurring_Payments_Widget extends WP_Widget {
		/**
		 * Constructor.
		 */
		public function __construct() {
			parent::__construct(
				'jetpack_recurring_payments_widget',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'Recurring Payments', 'jetpack' ) ),
				array(
					'classname'                   => 'jetpack-recurring-payments',
					'description'                 => __( 'Add a Recurring Payments Button as a Widget.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
			);

		}

		/**
		 * Return an associative array of default values.
		 * These values are used in new widgets.
		 *
		 * @param int $first_product_id - ID of the first product post.
		 * @see self::get_first_product_id.
		 *
		 * @return array Default values for the widget options.
		 */
		private function defaults( $first_product_id ) {
			return array(
				'title'           => '',
				'product_post_id' => $first_product_id,
				'text'            => __( 'Contribution', 'jetpack' ),
			);
		}

		/**
		 * Get the first product to serve as a default.
		 *
		 * @return int - the id of the first product.
		 */
		private function get_first_product_id() {
			$first_product = get_posts(
				array(
					'numberposts' => 1,
					'orderby'     => 'date',
					'post_type'   => Jetpack_Memberships::$post_type_plan,
					'post_status' => 'publish',
				)
			);
			if ( ! $first_product || is_wp_error( $first_product ) ) {
				return 0;
			}
			return $first_product->ID;
		}

		/**
		 * Front-end display of widget.
		 *
		 * @see WP_Widget::widget()
		 *
		 * @param array $args     Widget arguments.
		 * @param array $instance Saved values from database.
		 */
		public function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults( $this->get_first_product_id() ) );
			$post     = get_post( $instance['product_post_id'] );
			if ( ! $post ) {
				return;
			}
			$plan = Jetpack_Memberships::product_post_to_array( $post );
			if ( ! $plan ) {
				return;
			}

			echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$title = apply_filters( 'widget_title', $instance['title'] );
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . stripslashes( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}

			echo '<div class="jetpack-recurring-payments-content">';
			echo Jetpack_Memberships::get_instance()->render_button( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				array(
					'planId'           => $instance['product_post_id'],
					'submitButtonText' => $instance['text'], // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				)
			);

			echo '</div><!--simple-payments-->';

			echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'recurring_payments' );
		}

		/**
		 * Gets the latests field value from either the old instance or the new instance.
		 *
		 * @param array  $new_instance - Array of values for the new form instance.
		 * @param array  $old_instance - Array of values for the old form instance.
		 * @param string $field - Field ID.
		 * @return mixed Field value.
		 */
		private function get_latest_field_value( $new_instance, $old_instance, $field ) {
			return ! empty( $new_instance[ $field ] )
				? sanitize_text_field( $new_instance[ $field ] )
				: $old_instance[ $field ];
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
		public function update( $new_instance, $old_instance ) {
			$defaults = $this->defaults( $this->get_first_product_id() );
			// do not overrite `product_post_id` for `$new_instance` with the defaults.
			$new_instance = wp_parse_args( $new_instance, array_diff_key( $defaults, array( 'product_post_id' => 0 ) ) );
			$old_instance = wp_parse_args( $old_instance, $defaults );

			return array(
				'title'           => $this->get_latest_field_value( $new_instance, $old_instance, 'title' ),
				'product_post_id' => $this->get_latest_field_value( $new_instance, $old_instance, 'product_post_id' ),
				'text'            => $this->get_latest_field_value( $new_instance, $old_instance, 'text' ),
			);

		}

		/**
		 * Back-end widget form.
		 *
		 * @see WP_Widget::form()
		 *
		 * @param array $instance Previously saved values from database.
		 */
		public function form( $instance ) {
			$product_posts = get_posts(
				array(
					'numberposts' => 100,
					'orderby'     => 'date',
					'post_type'   => Jetpack_Memberships::$post_type_plan,
					'post_status' => 'publish',
				)
			);
			$instance      = wp_parse_args( $instance, $this->defaults( $product_posts ? $product_posts[0]->ID : 0 ) );
			$product_posts = array_map(
				function( $post ) {
						return Jetpack_Memberships::product_post_to_array( $post );
				},
				$product_posts
			);
			$blog_id       = Jetpack_Memberships::get_blog_id(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			require dirname( __FILE__ ) . '/recurring-payments/form.php';
		}
	}

	/**
	 * Register Jetpack_Recurring_Payments_Widget widget.
	 */
	function register_widget_jetpack_recurring_payments() {
		if ( ! class_exists( 'Jetpack_Memberships' ) ) {
			return;
		}
		if ( ! Jetpack::is_active() || ! Jetpack_Plan::supports( 'recurring-payments' ) ) {
			return;
		}
		register_widget( 'Jetpack_Recurring_Payments_Widget' );
	}
	add_action( 'widgets_init', 'register_widget_jetpack_recurring_payments' );
}
