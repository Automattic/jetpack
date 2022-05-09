<?php

/**
 * A multi-song music player widget
 */

class Music_Player_Widget extends WP_Widget {

	/**
	 * Constructor
	 *
	 * @return void
	 **/
	function __construct() {
		$widget_ops = array(
			'classname'   => 'music-player',
			'description' => __( 'A multi-song music player', 'wpcomsh' ),
		);
		parent::__construct( 'music-player', __( 'Music Player', 'wpcomsh' ), $widget_ops );
		add_action( 'admin_enqueue_scripts', array( $this, 'widget_scripts' ) );
	}

	function widget_scripts() {
		wp_enqueue_media();
		wp_enqueue_script( 'music-player', plugins_url( 'music-player/music-player.js', __FILE__ ), array( 'jquery', 'thickbox' ), 1, true );
	}

	/**
	 * Outputs the HTML for this widget.
	 *
	 * @param array  An array of standard parameters for widgets in this theme
	 * @param array  An array of settings for this widget instance
	 * @return void Echoes it's output
	 **/
	function widget( $args, $instance ) {
		extract( $args, EXTR_SKIP );

		echo $before_widget;

		if ( isset( $instance['title'] ) && ! empty( $instance['title'] ) ) {
			echo $before_title;
			echo apply_filters( 'widget_title', $instance['title'] );
			echo $after_title;
		}

		$instance['shortcode'] = wp_kses( $instance['shortcode'], array() );
		echo do_shortcode( $instance['shortcode'] );
		echo $after_widget;
	}

	/**
	 * Deals with the settings when they are saved by the admin. Here is
	 * where any validation should be dealt with.
	 *
	 * @param array  An array of new settings as submitted by the admin
	 * @param array  An array of the previous settings
	 * @return array The validated and (if necessary) amended settings
	 **/
	function update( $new_instance, $old_instance ) {
		// update logic goes here
		$updated_instance['title']     = strip_tags( $new_instance['title'] );
		$updated_instance['shortcode'] = strip_tags( $new_instance['shortcode'] );
		return $updated_instance;
	}

	/**
	 * Displays the form for this widget on the Widgets page of the WP Admin area.
	 *
	 * @param array  An array of the current settings for this widget
	 * @return void Echoes it's output
	 **/
	function form( $instance ) {
		$instance = wp_parse_args(
			(array) $instance,
			array(
				'title'     => '',
				'shortcode' => '',
			)
		);
		printf(
			'<p><label>%s <input type="text" value="%s" name="%s" id="%s" /></label></p>',
			__( 'Title:', 'wpcomsh' ),
			esc_attr( $instance['title'] ),
			$this->get_field_name( 'title' ),
			$this->get_field_id( 'title' )
		);

		printf(
			'<p><a class="music-player-edit" data-widget_id="%s" href="#">%s</a></p>',
			$this->get_field_id( 'shortcode' ),
			__( 'Choose songs', 'wpcomsh' )
		);

		printf(
			'<p><label>%s <input class="widefat" name="%s" id="%s" value="%s" /></label>',
			__( 'Music Player', 'wpcomsh' ),
			$this->get_field_name( 'shortcode' ),
			$this->get_field_id( 'shortcode' ),
			esc_attr( $instance['shortcode'] )
		);
	}
}

add_action( 'widgets_init', 'register_Music_Player_Widget' );
function register_Music_Player_Widget() {
	register_widget( 'Music_Player_Widget' );
}
