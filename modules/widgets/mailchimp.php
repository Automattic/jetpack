<?php

if ( ! class_exists( 'Jetpack_Mailchimp_Subscriber_Popup_Widget' ) ) {

	//register MailChimp Subscriber Popup widget
	function jetpack_mailchimp_widget_init() {
		register_widget( 'Jetpack_Mailchimp_Subscriber_Popup_Widget' );
	}

	add_action( 'widgets_init', 'jetpack_mailchimp_widget_init' );

	/**
	 * Add a MailChimp Subscriber Popup embedcode
	 *
	 *
	 */
	class Jetpack_Mailchimp_Subscriber_Popup_Widget extends WP_Widget {

		/**
		 * Constructor
		 */
		function __construct() {
			parent::__construct(
				'widget_mailchimp',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'MailChimp Subscriber Popup', 'jetpack' ) ),
				array(
					'classname'                   => 'widget_mailchimp',
					'description'                 => __( 'Allows displaying a popup subscription form to visitors.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
			);
			$this->alt_option_name = 'widget_mailchimp';
		}

		/**
		 * Outputs the HTML for this widget.
		 *
		 * @param array $args     An array of standard parameters for widgets in this theme
		 * @param array $instance An array of settings for this widget instance
		 *
		 * @return void Echoes it's output
		 **/
		function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, array( 'code' => '' ) );

			if ( has_shortcode( $instance['code'], 'mailchimp_subscriber_popup' ) ) {
				echo do_shortcode( $instance['code'] );
			}

			/** This action is documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'mailchimp' );
		}


		/**
		 * Deals with the settings when they are saved by the admin.
		 *
		 * @param array $new_instance New configuration values
		 * @param array $old_instance Old configuration values
		 *
		 * @return array
		 */
		function update( $new_instance, $old_instance ) {
			$instance         = array();
			$instance['code'] = wp_kses_post( stripslashes( $new_instance['code'] ) );

			return $instance;
		}


		/**
		 * Displays the form for this widget on the Widgets page of the WP Admin area.
		 *
		 * @param array $instance Instance configuration.
		 *
		 * @return void
		 */
		function form( $instance ) {
			$instance = wp_parse_args( $instance, array( 'code' => '' ) );
			?>

			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>"><?php esc_html_e( 'Code:', 'jetpack' ); ?></label>
				<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'code' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'code' ) ); ?>"><?php echo esc_textarea( $instance['code'] ); ?></textarea>
			</p>

			<?php
		}

	}

}
