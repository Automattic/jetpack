<?php

class WPCOM_Widget_Reservations extends WP_Widget {
	private $defaults = array();
	private $fields   = array();

	public function __construct() {
		parent::__construct(
			'reservations',
			__( 'Reservations', 'wpcomsh' ),
			array( 'description' => 'Allow visitors to submit a reservation inquiry.' )
		);

		$this->defaults = array(
			'title'    => __( 'Reservations', 'wpcomsh' ),
			'subject'  => __( 'Reservation Inquiry', 'wpcomsh' ),
			'email_to' => get_option( 'admin_email' ),
			'show'     => array( 'name', 'email', 'adults', 'children', 'arrival', 'departure', 'message' ),
		);

		$this->fields = array(
			'name'      => __( 'Name', 'wpcomsh' ),
			'email'     => __( 'Email', 'wpcomsh' ),
			'phone'     => __( 'Phone', 'wpcomsh' ),
			'message'   => __( 'Message', 'wpcomsh' ),
			'adults'    => __( '# Adults', 'wpcomsh' ),
			'children'  => __( '# Children', 'wpcomsh' ),
			'arrival'   => __( 'Arrival', 'wpcomsh' ),
			'departure' => __( 'Departure', 'wpcomsh' ),
		);
	}

	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		?>
		<p>
			<label>
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input type="text" class="widefat" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Recipient E-mail Address:', 'wpcomsh' ); ?>
				<input type="text" class="widefat" name="<?php echo $this->get_field_name( 'email_to' ); ?>" value="<?php echo esc_attr( $instance['email_to'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'E-mail Subject:', 'wpcomsh' ); ?>
				<input type="text" class="widefat" name="<?php echo $this->get_field_name( 'subject' ); ?>" value="<?php echo esc_attr( $instance['subject'] ); ?>" />
			</label>
		</p>
		<p>
			<?php esc_html_e( 'Show:', 'wpcomsh' ); ?>
			<fieldset style="padding: 0 10px;">
				<?php foreach ( $this->fields as $key => $label ) { ?>
					<label style="display: block; float: left; width: 50%; margin-bottom: 5px;">
						<input type="checkbox" name="<?php echo $this->get_field_name( 'show-' . $key ); ?>" value="<?php echo esc_attr( $key ); ?>" <?php checked( in_array( $key, $instance['show'] ) ); ?> /> <?php echo esc_html( $label ); ?>
					</label>
				<?php } ?>
			</fieldset>
		</p>
		<?php
	}

	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		if ( empty( $instance['show'] ) ) {
			return;
		}

		$contact_form_shortcode = '[contact-form';

		if ( isset( $instance['email_to'] ) && ! empty( $instance['email_to'] ) ) {
			$contact_form_shortcode .= " to='" . esc_attr( $instance['email_to'] ) . "'";
		}

		if ( isset( $instance['subject'] ) && ! empty( $instance['subject'] ) ) {
			$contact_form_shortcode .= " subject='" . esc_attr( $instance['subject'] ) . "'";
		}

		$contact_form_shortcode .= ']';

		if ( in_array( 'name', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['name'] ) . "' type='name'/]";
		}
		if ( in_array( 'email', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['email'] ) . "' type='email' required='1'/]";
		}
		if ( in_array( 'phone', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['phone'] ) . "' type='text'/]";
		}
		if ( in_array( 'adults', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['adults'] ) . "' type='text' data='" . esc_attr( json_encode( array( 'field-size' => 'small' ) ) ) . "'/]";
		}
		if ( in_array( 'children', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['children'] ) . "' type='text' data='" . esc_attr( json_encode( array( 'field-size' => 'small' ) ) ) . "'/]";
		}
		if ( in_array( 'arrival', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['arrival'] ) . "' type='date' data='" . esc_attr( json_encode( array( 'field-size' => 'small' ) ) ) . "'/]";
		}
		if ( in_array( 'departure', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['departure'] ) . "' type='date' data='" . esc_attr( json_encode( array( 'field-size' => 'small' ) ) ) . "'/]";
		}
		if ( in_array( 'message', $instance['show'] ) ) {
			$contact_form_shortcode .= "[contact-field label='" . esc_attr( $this->fields['message'] ) . "' type='textarea' /]";
		}

		$contact_form_shortcode .= '[/contact-form]';

		echo $args['before_widget'];
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];
		echo do_shortcode( apply_filters( 'widget_text', $contact_form_shortcode ) );
		echo $args['after_widget'];

		do_action( 'jetpack_stats_extra', 'widget_view', 'reservations' );
	}

	public function update( $new_instance, $old_instance ) {
		$new_instance['show'] = array();

		foreach ( $this->fields as $field_key => $unused ) {
			if ( isset( $new_instance[ 'show-' . $field_key ] ) ) {
				$new_instance['show'][] = $field_key;
				unset( $new_instance[ 'show-' . $field_key ] );
			}
		}

		if ( ! is_email( $new_instance['email_to'] ) ) {
			$new_instance['email_to'] = $this->defaults['email_to'];
		}

		if ( empty( $new_instance['subject'] ) ) {
			$new_instance['subject'] = $this->defaults['subject'];
		}

		return $new_instance;
	}
}

/**
 * Register the Reservations widget for all sites running Stay
 * or with an active widget.
 */
function reservations_widget_register() {
	if ( 'stay' == get_stylesheet() || is_active_widget( false, false, 'reservations', false ) ) {
		register_widget( 'WPCOM_Widget_Reservations' );
	}
}
add_action( 'widgets_init', 'reservations_widget_register' );

function reservations_widget_style() {
	if ( is_active_widget( null, null, 'reservations' ) ) {
		wp_enqueue_style( 'widget-reservations', plugins_url( 'reservations/css/reservations.css', __FILE__ ) );
		wp_enqueue_script( 'widget-reservations', plugins_url( 'reservations/js/reservations.js', __FILE__ ), 'jquery', '20130312', true );
	}
}
add_action( 'wp_enqueue_scripts', 'reservations_widget_style' );
