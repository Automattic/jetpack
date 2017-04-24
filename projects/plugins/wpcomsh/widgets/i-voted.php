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
		$widget_ops = array( 'classname' => 'widget_i_voted', 'description' => __( 'Show your readers that you voted with an "I Voted" sticker.' ) );

		parent::__construct( 'i_voted', __( 'I Voted' ), $widget_ops );
	}

	function widget( $args, $instance ) {
		// [DEPRECATION]: Since we are after the dep. date show admins
		// the warning message, otherwise just display a link to their
		// about.me page
		if ( current_user_can( 'edit_theme_options' ) ) {
			?>
			<h2>
				<?php printf( wp_kses( __(
					'The I Voted widget is no longer available. To remove this widget, ' .
					'<a href="%s">visit your settings</a>. This message is not shown to visitors to your site.',
					'jetpack' ),
					array( 'a' => array( 'href' => array() ) ) ), admin_url( 'widgets.php' )
				); ?>
			</h2>
			<?php
		}

		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title )
			echo $args['before_title'] . esc_html( $title ) . $args['after_title'];

		echo '<img src="//i0.wp.com/wordpress.com/i/i-voted.png" alt="I Voted" style="max-width:100%;height:auto;" />';

		echo "\n" . $args['after_widget'];

		stats_extra( 'widget_view', 'i_voted' );
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

		?>
		<p>
			<strong style="color: #ff6347;">
				<?php _e( 'The I Voted widget is deprecated.', 'jetpack' );
				?>
			</strong>
		</p>
		<?php

		echo '<p><label for="' . $this->get_field_id( 'title' ) . '">' . esc_html__( 'Title:' ) . '
		<input class="widefat" id="' . $this->get_field_id( 'title' ) . '" name="' . $this->get_field_name( 'title' ) . '" type="text" value="' . $title . '" />
		</label></p>';
	}

}
