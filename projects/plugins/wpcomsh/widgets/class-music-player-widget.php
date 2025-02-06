<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/**
 * A multi-song music player widget
 */
class Music_Player_Widget extends WP_Widget {

	/**
	 * Constructor
	 *
	 * @return void
	 **/
	public function __construct() {
		$widget_ops = array(
			'classname'   => 'music-player',
			'description' => __( 'A multi-song music player', 'wpcomsh' ),
		);
		parent::__construct( 'music-player', __( 'Music Player', 'wpcomsh' ), $widget_ops );
		add_action( 'admin_enqueue_scripts', array( $this, 'widget_scripts' ) );
	}

	/**
	 * Enqueue media and scripts.
	 */
	public function widget_scripts() {
		wp_enqueue_media();
		wp_enqueue_script( 'music-player', plugins_url( 'music-player/music-player.js', __FILE__ ), array( 'jquery', 'thickbox' ), '1', true );
	}

	/**
	 * Outputs the HTML for this widget.
	 *
	 * @param array $args An array of standard parameters for widgets in this theme.
	 * @param array $instance An array of settings for this widget instance.
	 *
	 * @return void Echoes its output.
	 **/
	public function widget( $args, $instance ) {
		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			$title = apply_filters( 'widget_title', $instance['title'] );
			echo esc_html( $title );
			echo $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		$instance['shortcode'] = wp_kses( $instance['shortcode'], array() );
		echo do_shortcode( $instance['shortcode'] );
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Deals with the settings when they are saved by the admin. Here is
	 * where any validation should be dealt with.
	 *
	 * @param array $new_instance An array of new settings as submitted by the admin.
	 * @param array $old_instance An array of the previous settings.
	 *
	 * @return array The validated and (if necessary) amended settings
	 **/
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$updated_instance = array(
			'title'     => wp_strip_all_tags( $new_instance['title'] ),
			'shortcode' => wp_strip_all_tags( $new_instance['shortcode'] ),
		);
		return $updated_instance;
	}

	/**
	 * Displays the form for this widget on the Widgets page of the WP Admin area.
	 *
	 * @param array $instance An array of the current settings for this widget.
	 *
	 * @return never Echoes its output
	 **/
	public function form( $instance ) {
		$instance = wp_parse_args(
			(array) $instance,
			array(
				'title'     => '',
				'shortcode' => '',
			)
		);
		printf(
			'<p><label>%s <input type="text" value="%s" name="%s" id="%s" /></label></p>',
			esc_html__( 'Title:', 'wpcomsh' ),
			esc_attr( $instance['title'] ),
			esc_attr( $this->get_field_name( 'title' ) ),
			esc_attr( $this->get_field_id( 'title' ) )
		);

		printf(
			'<p><a class="music-player-edit" data-widget_id="%s" href="#">%s</a></p>',
			esc_attr( $this->get_field_id( 'shortcode' ) ),
			esc_html__( 'Choose songs', 'wpcomsh' )
		);

		printf(
			'<p><label>%s <input class="widefat" name="%s" id="%s" value="%s" /></label>',
			esc_html__( 'Music Player', 'wpcomsh' ),
			esc_attr( $this->get_field_name( 'shortcode' ) ),
			esc_attr( $this->get_field_id( 'shortcode' ) ),
			esc_attr( $instance['shortcode'] )
		);
	}
}

/**
 * Register the widget.
 */
function register_music_player_widget() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	register_widget( 'Music_Player_Widget' );
}
add_action( 'widgets_init', 'register_music_player_widget' );
