<?php

/*
 * Based on Evolution Twitter Timeline (http://wordpress.org/extend/plugins/evolution-twitter-timeline/)
 * See: https://twitter.com/settings/widgets and https://dev.twitter.com/docs/embedded-timelines for details on Twitter Timelines
 */

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_twitter_timeline_widget_init' );

function jetpack_twitter_timeline_widget_init() {
	register_widget( 'Jetpack_Twitter_Timeline_Widget' );
}

class Jetpack_Twitter_Timeline_Widget extends WP_Widget {
	/**
	* Register widget with WordPress.
	*/
	public function __construct() {
		parent::__construct(
			'twitter_timeline',
			apply_filters( 'jetpack_widget_name', esc_html__( 'Twitter Timeline', 'jetpack' ) ),
			array(
				'classname' => 'widget_twitter_timeline',
				'description' => __( 'Display an official Twitter Embedded Timeline widget.', 'jetpack' )
			)
		);

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_footer', array( $this, 'library' ) );
		}
	}

	/**
	 * Enqueue Twitter's widget library
	 */
	public function library() {
		?>
		<script type="text/javascript">
			!function(d,s,id){
				var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';
				if(!d.getElementById(id)){
					js=d.createElement(s);
					js.id=id;js.src=p+"://platform.twitter.com/widgets.js";
					fjs.parentNode.insertBefore(js,fjs);
				}
			}(document,"script","twitter-wjs");
		</script>
		<?php
	}

	/**
	 * Front-end display of widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		$instance['lang']  = substr( strtoupper( get_locale() ), 0, 2 );

		echo $args['before_widget'];

		if ( $instance['title'] ) {
			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			echo $args['before_title'] . apply_filters( 'widget_title', $instance['title'] ) . $args['after_title'];
		}

		$data_attribs = array( 'widget-id', 'theme', 'link-color', 'border-color', 'chrome', 'tweet-limit' );
		$attribs      = array( 'width', 'height', 'lang' );

		// Start tag output
		echo '<a class="twitter-timeline"';

		foreach ( $data_attribs as $att ) {
			if ( !empty( $instance[$att] ) ) {
				if ( 'tweet-limit' == $att && 0 === $instance[$att] )
					continue;

				if ( is_array( $instance[$att] ) )
					echo ' data-' . esc_attr( $att ) . '="' . esc_attr( join( ' ', $instance['chrome'] ) ) . '"';
				else
					echo ' data-' . esc_attr( $att ) . '="' . esc_attr( $instance[$att] ) . '"';
			}
		}

		foreach ( $attribs as $att ) {
			if ( !empty( $instance[$att] ) )
				echo ' ' . esc_attr( $att ) . '="' . esc_attr( $instance[$att] ) . '"';
		}

		echo '>';

		$timeline_placeholder = __( 'My Tweets', 'jetpack' );

		/**
		 * Filter the Timeline placeholder text.
		 *
		 * @since 3.4.0
		 *
		 * @param string $timeline_placeholder Timeline placeholder text.
		 */
		$timeline_placeholder = apply_filters( 'jetpack_twitter_timeline_placeholder', $timeline_placeholder );

		echo esc_html( $timeline_placeholder ) . '</a>';

		// End tag output

		echo $args['after_widget'];

		/**
		 * Fires after echoing a widget on the frontend, can be used to track the number of widgets that are added.
		 *
		 * @since 2.2.3
		 *
		 * @param string widget Type of action to track.
		 * @param string twitter_timeline Type of widget being displayed.
		 */
		do_action( 'jetpack_bump_stats_extras', 'widget', 'twitter_timeline' );
	}


	/**
	 * Sanitize widget form values as they are saved.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $old_instance Previously saved values from database.
	 *
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $old_instance ) {
		$hex_regex             = '/#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/';
		$instance                  = array();
		$instance['title']         = sanitize_text_field( $new_instance['title'] );
		$instance['width']         = (int) $new_instance['width'];
		$instance['height']        = (int) $new_instance['height'];
		$instance['width']         = ( 0 !== (int) $new_instance['width'] )  ? (int) $new_instance['width']  : '';
		$instance['height']        = ( 0 !== (int) $new_instance['height'] ) ? (int) $new_instance['height'] : '';
		$instance['tweet-limit']   = ( 0 !== (int) $new_instance['tweet-limit'] ) ? (int) $new_instance['tweet-limit'] : null;

		// If they entered something that might be a full URL, try to parse it out
		if ( is_string( $new_instance['widget-id'] ) ) {
			if ( preg_match( '#https?://twitter\.com/settings/widgets/(\d+)#s', $new_instance['widget-id'], $matches ) ) {
				$new_instance['widget-id'] = $matches[1];
			}
		}

		$instance['widget-id'] = sanitize_text_field( $new_instance['widget-id'] );
		$instance['widget-id'] = is_numeric( $instance['widget-id'] ) ? $instance['widget-id'] : '';

		foreach ( array( 'link-color', 'border-color' ) as $color ) {
			$new_color = sanitize_text_field( $new_instance[$color] );
			if ( preg_match( $hex_regex, $new_color ) ) {
				$instance[$color] = $new_color;
			}

		}

		$instance['theme'] = 'light';
		if ( in_array( $new_instance['theme'], array( 'light', 'dark' ) ) )
			$instance['theme'] = $new_instance['theme'];

		$instance['chrome'] = array();
		if ( isset( $new_instance['chrome'] ) ) {
			foreach ( $new_instance['chrome'] as $chrome ) {
				if ( in_array( $chrome, array( 'noheader', 'nofooter', 'noborders', 'noscrollbar', 'transparent' ) ) ) {
					$instance['chrome'][] = $chrome;
				}
			}
		}

		return $instance;
	}


	/**
	 * Back-end widget form.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 */
	public function form( $instance ) {
		$defaults = array(
			'title'        => esc_html__( 'Follow me on Twitter', 'jetpack' ),
			'width'        => '',
			'height'       => '400',
			'widget-id'    => '',
			'link-color'   => '#f96e5b',
			'border-color' => '#e8e8e8',
			'theme'        => 'light',
			'chrome'       => array(),
			'tweet-limit'  => null,
		);

		$instance = wp_parse_args( (array) $instance, $defaults );
		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'width' ); ?>"><?php esc_html_e( 'Width (px):', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'width' ); ?>" name="<?php echo $this->get_field_name( 'width' ); ?>" type="text" value="<?php echo esc_attr( $instance['width'] ); ?>" />
		</p>

		 <p>
			<label for="<?php echo $this->get_field_id( 'height' ); ?>"><?php esc_html_e( 'Height (px):', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'height' ); ?>" name="<?php echo $this->get_field_name( 'height' ); ?>" type="text" value="<?php echo esc_attr( $instance['height'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'tweet-limit' ); ?>"><?php esc_html_e( '# of Tweets Shown:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'tweet-limit' ); ?>" name="<?php echo $this->get_field_name( 'tweet-limit' ); ?>" type="number" min="1" max="20" value="<?php echo esc_attr( $instance['tweet-limit'] ); ?>" />
		</p>

		<p><small>
			<?php
			echo wp_kses_post(
				sprintf(
					__( 'You need to <a href="%1$s" target="_blank">create a widget at Twitter.com</a>, and then enter your widget id (the long number found in the URL of your widget\'s config page) in the field below. <a href="%2$s" target="_blank">Read more</a>.', 'jetpack' ),
					'https://twitter.com/settings/widgets/new/user',
					'http://support.wordpress.com/widgets/twitter-timeline-widget/'
				)
			);
			?>
		</small></p>
		<p>
			<label for="<?php echo $this->get_field_id( 'widget-id' ); ?>"><?php esc_html_e( 'Widget ID:', 'jetpack' ); ?> <a href="http://support.wordpress.com/widgets/twitter-timeline-widget/#widget-id" target="_blank">( ? )</a></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'widget-id' ); ?>" name="<?php echo $this->get_field_name( 'widget-id' ); ?>" type="text" value="<?php echo esc_attr( $instance['widget-id'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'chrome-noheader' ); ?>"><?php esc_html_e( 'Layout Options:', 'jetpack' ); ?></label><br />
			<input type="checkbox"<?php checked( in_array( 'noheader', $instance['chrome'] ) ); ?> id="<?php echo $this->get_field_id( 'chrome-noheader' ); ?>" name="<?php echo $this->get_field_name( 'chrome' ); ?>[]" value="noheader" /> <label for="<?php echo $this->get_field_id( 'chrome-noheader' ); ?>"><?php esc_html_e( 'No Header', 'jetpack' ); ?></label><br />
			<input type="checkbox"<?php checked( in_array( 'nofooter', $instance['chrome'] ) ); ?> id="<?php echo $this->get_field_id( 'chrome-nofooter' ); ?>" name="<?php echo $this->get_field_name( 'chrome' ); ?>[]" value="nofooter" /> <label for="<?php echo $this->get_field_id( 'chrome-nofooter' ); ?>"><?php esc_html_e( 'No Footer', 'jetpack' ); ?></label><br />
			<input type="checkbox"<?php checked( in_array( 'noborders', $instance['chrome'] ) ); ?> id="<?php echo $this->get_field_id( 'chrome-noborders' ); ?>" name="<?php echo $this->get_field_name( 'chrome' ); ?>[]" value="noborders" /> <label for="<?php echo $this->get_field_id( 'chrome-noborders' ); ?>"><?php esc_html_e( 'No Borders', 'jetpack' ); ?></label><br />
			<input type="checkbox"<?php checked( in_array( 'noscrollbar', $instance['chrome'] ) ); ?> id="<?php echo $this->get_field_id( 'chrome-noscrollbar' ); ?>" name="<?php echo $this->get_field_name( 'chrome' ); ?>[]" value="noscrollbar" /> <label for="<?php echo $this->get_field_id( 'chrome-noscrollbar' ); ?>"><?php esc_html_e( 'No Scrollbar', 'jetpack' ); ?></label><br />
			<input type="checkbox"<?php checked( in_array( 'transparent', $instance['chrome'] ) ); ?> id="<?php echo $this->get_field_id( 'chrome-transparent' ); ?>" name="<?php echo $this->get_field_name( 'chrome' ); ?>[]" value="transparent" /> <label for="<?php echo $this->get_field_id( 'chrome-transparent' ); ?>"><?php esc_html_e( 'Transparent Background', 'jetpack' ); ?></label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'link-color' ); ?>"><?php _e( 'Link Color (hex):', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'link-color' ); ?>" name="<?php echo $this->get_field_name( 'link-color' ); ?>" type="text" value="<?php echo esc_attr( $instance['link-color'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'border-color' ); ?>"><?php _e( 'Border Color (hex):', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'border-color' ); ?>" name="<?php echo $this->get_field_name( 'border-color' ); ?>" type="text" value="<?php echo esc_attr( $instance['border-color'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'theme' ); ?>"><?php _e( 'Timeline Theme:', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'theme' ); ?>" id="<?php echo $this->get_field_id( 'theme' ); ?>" class="widefat">
				<option value="light"<?php selected( $instance['theme'], 'light' ); ?>><?php esc_html_e( 'Light', 'jetpack' ); ?></option>
				<option value="dark"<?php selected( $instance['theme'], 'dark' ); ?>><?php esc_html_e( 'Dark', 'jetpack' ); ?></option>
			</select>
		</p>
	<?php
	}
}
