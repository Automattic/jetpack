<?php

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_googleplus_person_badge_init' );

function jetpack_googleplus_person_badge_init() {
	register_widget( 'WPCOM_Widget_GooglePlus_Person_Badge' );
}

/**
 * Google+ Person Badge widget class
 * Display a Google+ Person Badge as a widget
 * https://developers.google.com/+/web/badge/
 */
class WPCOM_Widget_GooglePlus_Person_Badge extends WP_Widget {

	private $default_width   = 300;
	private $max_width       = 9999;
	private $min_width       = 0;
	private $default_theme   = 'light';
	private $allowed_themes  = array('light', 'dark');
	private $default_layout  = 'portrait';
	private $allowed_layouts = array('landscape', 'portrait');

	function __construct() {
		parent::__construct(
			'googleplus-person-badge',
			apply_filters( 'jetpack_widget_name', __( 'Google+ Person Badge', 'jetpack' ) ),
			array(
				'classname' => 'widget_googleplus_person_badge',
				'description' => __( 'Display a Google+ Person Badge to connect visitors to your Google+ Profile', 'jetpack' )
			)
		);
	}

	function widget( $args, $instance ) {

		extract( $args );

		$like_args = $this->normalize_googleplus_args( $instance['like_args'] );

		if ( empty( $like_args['href'] ) || ! $this->is_valid_googleplus_url( $like_args['href'] ) ) {
			if ( current_user_can('edit_theme_options') ) {
				echo $before_widget;
				echo '<p>' . sprintf( __( 'It looks like your Google+ URL is incorrectly configured. Please check it in your <a href="%s">widget settings</a>.', 'jetpack' ), admin_url( 'widgets.php' ) ) . '</p>';
				echo $after_widget;
			}
			echo '<!-- Invalid Google+ Person URL -->';
			return;
		}


		$title    = apply_filters( 'widget_title', $instance['title'] );

		$like_args['show_coverphoto'] = (bool) $like_args['show_coverphoto']         ? 'true' : 'false';
		$like_args['show_tagline']    = (bool) $like_args['show_tagline']            ? 'true' : 'false';

		echo $before_widget;

		if ( ! empty( $title ) ):
			echo $before_title;

			$badge_widget_title = '<a href="' . esc_url( $like_args['href'] ) . '">' . esc_html( $title ) . '</a>';

			echo apply_filters( 'jetpack_googleplus_person_badge_title', $badge_widget_title, $title, $like_args['href'] );

			echo $after_title;
		endif;

		?><script src="https://apis.google.com/js/platform.js" async defer></script>
		<g:person href="<?php echo esc_url( $like_args['href'] ); ?>" layout="<?php echo esc_attr( $like_args['layout'] ); ?>" theme="<?php echo esc_attr( $like_args['theme'] ); ?>" showcoverphoto="<?php echo esc_attr( $like_args['show_coverphoto'] ); ?>" showtagline="<?php echo esc_attr( $like_args['show_tagline'] ); ?>" width="<?php echo esc_attr( $like_args['width'] ); ?>"></g:person><?php

		echo $after_widget;

		do_action( 'jetpack_stats_extra', 'widget', 'googleplus-person-badge' );
	}

	function update( $new_instance, $old_instance ) {
		$instance = array(
			'title' => '',
			'like_args' => $this->get_default_args(),
		);

		$instance['title'] = trim( strip_tags( stripslashes( $new_instance['title'] ) ) );

		// Set up widget values
		$instance['like_args'] = array(
			'href'            => trim( strip_tags( stripslashes( $new_instance['href'] ) ) ),
			'width'           => (int) $new_instance['width'],
			'layout'          => $new_instance['layout'],
			'theme'           => $new_instance['theme'],
			'show_coverphoto' => (bool) $new_instance['show_coverphoto'],
			'show_tagline'    => (bool) $new_instance['show_tagline'],
		);

		$instance['like_args'] = $this->normalize_googleplus_args( $instance['like_args'] );

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array(
			'title'     => '',
			'like_args' => $this->get_default_args()
		) );
		$like_args = $this->normalize_googleplus_args( $instance['like_args'] );
		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>">
				<?php _e( 'Title', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'title' ); ?>" id="<?php echo $this->get_field_id( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" class="widefat" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'href' ); ?>">
				<?php _e( 'Google+ Profile URL', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'href' ); ?>" id="<?php echo $this->get_field_id( 'href' ); ?>" value="<?php echo esc_url( $like_args['href'] ); ?>" class="widefat" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'width' ); ?>">
				<?php _e( 'Width', 'jetpack' ); ?>
				<input type="number" class="smalltext" min="1" max="999" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $like_args['width'] ); ?>" style="text-align: center;" />px
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'layout' ); ?>">
				<?php _e( 'Layout', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'layout' ); ?>" id="<?php echo $this->get_field_id( 'layout' ); ?>">
					<option value="landscape" <?php selected( $like_args['layout'], 'landscape' ); ?>><?php _e( 'Landscape', 'jetpack' ); ?></option>
					<option value="portrait" <?php selected( $like_args['layout'], 'portrait' ); ?>><?php _e( 'Portrait', 'jetpack' ); ?></option>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'theme' ); ?>">
				<?php _e( 'Theme', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'theme' ); ?>" id="<?php echo $this->get_field_id( 'theme' ); ?>">
					<option value="light" <?php selected( $like_args['theme'], 'light' ); ?>><?php _e( 'Light', 'jetpack' ); ?></option>
					<option value="dark" <?php selected( $like_args['theme'], 'dark' ); ?>><?php _e( 'Dark', 'jetpack' ); ?></option>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_coverphoto' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_coverphoto' ); ?>" id="<?php echo $this->get_field_id( 'show_coverphoto' ); ?>" <?php checked( $like_args['show_coverphoto'] ); ?> />
				<?php _e( 'Show Cover Photo', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_tagline' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_tagline' ); ?>" id="<?php echo $this->get_field_id( 'show_tagline' ); ?>" <?php checked( $like_args['show_tagline'] ); ?> />
				<?php _e( 'Show Tag Line', 'jetpack' ); ?>
			</label>
		</p>

		<?php
	}

	function get_default_args() {
		$defaults = array(
			'href'            => '',
			'width'           => $this->default_width,
			'layout'          => $this->default_layout,
			'theme'           => $this->default_theme,
			'show_coverphoto' => true,
			'show_tagline'    => true,
		);

		return apply_filters( 'jetpack_googleplus_person_badge_defaults', $defaults );
	}

	function normalize_googleplus_args( $args ) {
		$args = wp_parse_args( (array) $args, $this->get_default_args() );

		// Validate the Google+ Person URL
		if ( $this->is_valid_googleplus_url( $args['href'] ) ) {
			$temp = explode( '?', $args['href'] );
			$args['href'] = str_replace( array( 'http://plus.google.com', 'https://plus.google.com' ), 'https://plus.google.com', $temp[0] );
		} else {
			$args['href'] = '';
		}

		$args['width']           = $this->normalize_int_value( (int) $args['width'], $this->default_width, $this->max_width, $this->min_width );
		$args['layout']          = $this->normalize_text_value( $args['layout'], $this->default_layout, $this->allowed_layouts );
		$args['theme']           = $this->normalize_text_value( $args['theme'], $this->default_theme, $this->allowed_themes );
		$args['show_coverphoto'] = (bool) $args['show_coverphoto'];
		$args['show_tagline']    = (bool) $args['show_tagline'];

		return $args;
	}

	function is_valid_googleplus_url( $url ) {
		return ( FALSE !== strpos( $url, 'plus.google.com' ) ) ? TRUE : FALSE;
	}

	function normalize_int_value( $value, $default = 0, $max = 0, $min = 0 ) {
		$value = (int) $value;

		if ( $max < $value || $min > $value )
			$value = $default;

		return (int) $value;
	}

	function normalize_text_value( $value, $default = '', $allowed = array() ) {
		$allowed = (array) $allowed;

		if ( empty( $value ) || ( ! empty( $allowed ) && ! in_array( $value, $allowed ) ) )
			$value = $default;

		return $value;
	}
}

// END
