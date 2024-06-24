<?php // phpcs:ignore Squiz.Commenting.FileComment.MissingPackageTag
/**
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

/**
 * The "I Voted" widget.
 */
class Jetpack_I_Voted_Widget extends WP_Widget {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'   => 'widget_i_voted',
			'description' => __( 'Show your readers that you voted with an "I Voted" sticker.', 'wpcomsh' ),
		);

		parent::__construct( 'i_voted', __( 'I Voted', 'wpcomsh' ), $widget_ops );
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$title = $instance['title'] ?? null;
		$title = apply_filters( 'widget_title', $title );

		if ( $title ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		echo '<img src="//i0.wp.com/wordpress.com/i/i-voted.png" alt="I Voted" style="max-width:100%;height:auto;" />';

		echo "\n" . $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		$instance['title'] = wp_strip_all_tags( $new_instance['title'] );

		return $instance;
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		$defaults = array(
			'title' => '',
		);
		$instance = wp_parse_args( (array) $instance, $defaults );

		$title = esc_attr( $instance['title'] );

		echo '<p><label for="' . esc_attr( $this->get_field_id( 'title' ) ) . '">' . esc_html__( 'Title:', 'wpcomsh' ) . '
		<input class="widefat" id="' . esc_attr( $this->get_field_id( 'title' ) ) . '" name="' . esc_attr( $this->get_field_name( 'title' ) ) . '" type="text" value="' . esc_attr( $title ) . '" />
		</label></p>';
	}
}

/**
 * Register the widget (only if active).
 */
function jetpack_i_voted_widget_init() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	// [DEPRECATION]: Only register widget if active widget exists already
	$has_widget = is_active_widget( false, false, 'aboutme_widget', false );
	if ( false === $has_widget ) {
		return;
	}

	register_widget( 'Jetpack_I_Voted_Widget' );
}
add_action( 'widgets_init', 'jetpack_i_voted_widget_init' );
