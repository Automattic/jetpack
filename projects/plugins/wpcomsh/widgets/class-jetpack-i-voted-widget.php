<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 *
 *
 * [DEPRECATION]: This widget was deprecated.
 */

/*
 * File mostly copied from WP.com
 */

add_action( 'widgets_init', 'jetpack_i_voted_widget_init' );

function jetpack_i_voted_widget_init() {
	// [DEPRECATION]: Only register widget if active widget exists already
	$has_widget = is_active_widget( false, false, 'aboutme_widget', false );
	if ( false === $has_widget ) {
		return;
	}

	register_widget( 'Jetpack_I_Voted_Widget' );
}

class Jetpack_I_Voted_Widget extends WP_Widget {

	function __construct() {
		$widget_ops = array(
			'classname'   => 'widget_i_voted',
			'description' => __( 'Show your readers that you voted with an "I Voted" sticker.', 'wpcomsh' ),
		);

		parent::__construct( 'i_voted', __( 'I Voted', 'wpcomsh' ), $widget_ops );
	}

	function widget( $args, $instance ) {
		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
		}

		echo '<img src="//i0.wp.com/wordpress.com/i/i-voted.png" alt="I Voted" style="max-width:100%;height:auto;" />';

		echo "\n" . $args['after_widget'];
	}

	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title'] = strip_tags( $new_instance['title'] );

		return $instance;
	}

	function form( $instance ) {
		$defaults = array(
			'title' => '',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		$title = esc_attr( $instance['title'] );

		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . esc_html__( 'Title:', 'wpcomsh' ) . '
		<input class="widefat" id="' . $this->get_field_id( 'title' ) . '" name="' . $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" />
		</label></p>';
	}

}
