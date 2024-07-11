<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/*
Plugin Name: Tlkio
Description: Widget to add a tlk.io webchat.
Version: 0.1
Author: Automattic Inc.
Author URI: http://automattic.com/
License: GPLv2 or later
*/

/*
 * This widget has been copied verbatum from WordPress.com.
 */

/**
 * Tlkio widget from WordPress.com
 */
class Tlkio_Widget extends WP_Widget {
	/**
	 * Widget settings.
	 *
	 * @var array $defaults
	 */
	private $defaults = array(
		'title'   => '',
		'channel' => 'lobby',
		'height'  => '400',
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'   => 'tlkio-widget',
			'description' => __( 'Add a tlk.io webchat.', 'wpcomsh' ),
		);
		parent::__construct( 'tlkio_widget', __( 'tlk.io Webchat', 'wpcomsh' ), $widget_ops );
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$instance          = wp_parse_args( (array) $instance, $this->defaults );
		$instance['title'] = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		if ( $instance['title'] ) {
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		echo '<div id="tlkio" class="tlkio-container" data-channel="' . esc_attr( $instance['channel'] ) . '" style="width:100%; height:' . esc_attr( $instance['height'] ) . 'px;"></div>';

		if ( ! wp_script_is( 'tlkio-js', 'enqueued' ) ) {
			wp_enqueue_script( 'tlkio-js', plugins_url( 'tlkio.js', __FILE__ ), array(), '140115', true );
		}

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'wpcomsh' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'channel' ) ); ?>"><?php esc_html_e( 'Channel:', 'wpcomsh' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'channel' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'channel' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['channel'] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'height' ) ); ?>"><?php esc_html_e( 'Height (in pixel):', 'wpcomsh' ); ?></label>
			<input id="<?php echo esc_attr( $this->get_field_id( 'height' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'height' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['height'] ); ?>" size="3" />
		</p>
		<?php
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance            = $old_instance;
		$instance['title']   = wp_strip_all_tags( $new_instance['title'] );
		$instance['channel'] = wp_strip_all_tags( $new_instance['channel'] );
		$instance['height']  = intval( $new_instance['height'] );

		return $instance;
	}
}

/**
 * Register widget.
 */
function tlkio_widget_init() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	register_widget( 'Tlkio_Widget' );
}
add_action( 'widgets_init', 'tlkio_widget_init' );
