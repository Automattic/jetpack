<?php

class Upcoming_Events_Widget extends WP_Widget {
	function __construct() {
		parent::__construct(
			'upcoming_events_widget',
			apply_filters( 'jetpack_widget_name', __( 'Upcoming Events', 'jetpack' ) ),
			array(
				'description' => __( 'Display upcoming events from an iCalendar feed.', 'jetpack' ),
			)
		);
		if ( is_active_widget( false, false, $this->id_base ) ) {
			add_action( 'wp_head', array( $this, 'css' ) );
		}
	}

	function css() {
?>
<style type="text/css">
.upcoming-events li {
	margin-bottom: 10px;
}
.upcoming-events li span {
	display: block;
}
</style>
<?php
	}

	function form( $instance ) {
		$defaults = array(
			'title' => __( 'Upcoming Events', 'jetpack' ),
			'feed-url' => '',
			'count' => 3
		);
		$instance = array_merge( $defaults, (array) $instance );
?>

		<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
		<label for="<?php echo $this->get_field_id( 'feed-url' ); ?>"><?php _e( 'iCalendar Feed URL:', 'jetpack' ); ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'feed-url' ); ?>" name="<?php echo $this->get_field_name( 'feed-url' ); ?>" type="text" value="<?php echo esc_attr( $instance['feed-url'] ); ?>" />
		</p>

		<p>
		<label for="<?php echo $this->get_field_id( 'count' ); ?>"><?php _e( 'Items to show:', 'jetpack' ); ?></label>
		<select id="<?php echo $this->get_field_id( 'count' ); ?>" name="<?php echo $this->get_field_name( 'count' ); ?>">
			<?php $i = 1;
			while ( $i <= 10 ) { ?>
				<option <?php selected( $instance['count'], $i ) ?>><?php echo $i; ?></option>
			<?php $i++; } ?>
			<option value="0" <?php selected( $instance['count'], 0 ) ?>><?php _e( 'All' , 'jetpack' ) ?></option>
		</select>
		</p>
<?php
	}

	function update( $new_instance, $old_instance ) {
		$instance['title'] = strip_tags( $new_instance['title'] );
		$instance['feed-url'] = strip_tags( $new_instance['feed-url'] );
		$instance['count'] = min( absint( $new_instance['count'] ), 10 ); // 10 or less
		return $instance;
	}

	function widget( $args, $instance ) {
		jetpack_require_lib( 'icalendar-reader' );

		$events = icalendar_render_events( $instance['feed-url'], array(
			'context' => 'widget',
			'number' => $instance['count']
		) );

		// nothing to display?
		if ( ! $events )
			$events = sprintf( '<p>%s</p>', __( 'No upcoming events', 'jetpack' ) );

		echo $args['before_widget'];
		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title'];
			echo esc_html( $instance['title'] );
			echo $args['after_title'];
		}
		echo $events;
		echo $args['after_widget'];
	}
}

function upcoming_events_register_widgets() {
	register_widget( 'Upcoming_Events_Widget' );
}

add_action( 'widgets_init', 'upcoming_events_register_widgets' );
