<?php
/**
 * Freshly Pressed widget from WordPress.com.
 */
class WPCOM_Freshly_Pressed_Widget extends WP_Widget {

	function __construct() {
		$widget_ops  = array(
			'classname'   => 'widget_freshly_pressed',
			'description' => __( 'Display a Freshly Pressed badge in your sidebar', 'wpcomsh' ),
		);
		$control_ops = array( 'width' => 250 );
		parent::__construct( 'freshly_pressed', __( 'Freshly Pressed', 'wpcomsh' ), $widget_ops, $control_ops );
	}

	function widget( $args, $instance ) {
		extract( $args );
		$defaults = array(
			'title' => '',
			'badge' => 'rectangle',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		echo $before_widget;

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title ) {
			echo $before_title . esc_html( $title ) . $after_title;
		}

		$badge_size = $this->get_badge_size( $instance['badge'] );

		echo '<a href="http://discover.wordpress.com/" title="Featured on Freshly Pressed"><img src="' . $this->get_badge_url( $instance['badge'] ) . '" width="' . $badge_size['width'] . 'px" height="' . $badge_size['height'] . 'px" /></a>';

		echo "\n" . $after_widget;

		do_action( 'jetpack_stats_extra', 'widget_view', 'freshly_pressed' );
	}

	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title'] = strip_tags( $new_instance['title'] );
		$instance['badge'] = esc_attr( $new_instance['badge'] );

		return $instance;
	}

	function form( $instance ) {
		$defaults = array(
			'title' => '',
			'badge' => 'rectangle',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		$title = esc_attr( $instance['title'] );
		$badge = esc_attr( $instance['badge'] );

		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . esc_html__( 'Title:', 'wpcomsh' ) . '
		<input class="widefat" id="' . $this->get_field_id( 'title' ) . '" name="' . $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" />
		</label></p>

		<p>' . __( 'Choose an image to display in your sidebar:', 'wpcomsh' ) . '<br /><br />';

		foreach ( $this->badges() as $badge_name => $badge_ops ) {
			echo '<input type="radio" name="' . $this->get_field_name( 'badge' ) . '" value="' . esc_attr( $badge_name ) . '" ' . checked( $badge_name, $badge, false ) . '/> <img src="' . $this->get_badge_url( $badge_name ) . '" width="' . intval( $badge_ops['width'] ) . 'px" height="' . intval( $badge_ops['height'] ) . 'px" style="vertical-align: middle" /><br /><br />';
		}

		echo '</select></p>';
	}

	function get_badge_url( $badge ) {
		return 'https://s0.wp.com/i/badges/freshly-pressed-' . $badge . '.png';
	}

	function badges() {
		return array(
			'rectangle' => array(
				'width'  => 200,
				'height' => 62,
			),
			'circle'    => array(
				'width'  => 150,
				'height' => 150,
			),
		);
	}

	function get_badge_size( $badge ) {
		$badges = $this->badges();

		return $badges[ $badge ];
	}
}

// Only activate the widget for users that already have an instance of it.
function wpcom_freshly_pressed_widget_init() {
	if ( is_active_widget( false, false, 'freshly_pressed' ) ) {
		register_widget( 'WPCOM_Freshly_Pressed_Widget' );
	}
}
add_action( 'widgets_init', 'wpcom_freshly_pressed_widget_init' );
