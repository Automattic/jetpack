<?php

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_facebook_likebox_init' );

function jetpack_facebook_likebox_init() {
	register_widget( 'WPCOM_Widget_Facebook_LikeBox' );
}

/**
 * Facebook Like Box widget class
 * Display a Facebook Like Box as a widget
 * http://developers.facebook.com/docs/reference/plugins/like-box/
 */
class WPCOM_Widget_Facebook_LikeBox extends WP_Widget {

	private $default_height       = 432;
	private $default_width        = 200;
	private $max_width            = 400;
	private $min_width            = 0;
	private $max_height           = 999;
	private $min_height           = 100;
	private $default_colorscheme  = 'light';
	private $allowed_colorschemes = array( 'light', 'dark' );

	function __construct() {
		parent::__construct(
			'facebook-likebox',
			apply_filters( 'jetpack_widget_name', __( 'Facebook Like Box', 'jetpack' ) ),
			array(
				'classname' => 'widget_facebook_likebox',
				'description' => __( 'Display a Facebook Like Box to connect visitors to your Facebook Page', 'jetpack' )
			)
		);
	}

	function widget( $args, $instance ) {

		extract( $args );

		$like_args = $this->normalize_facebook_args( $instance['like_args'] );

		if ( empty( $like_args['href'] ) || ! $this->is_valid_facebook_url( $like_args['href'] ) ) {
			if ( current_user_can('edit_theme_options') ) {
				echo $before_widget;
				echo '<p>' . sprintf( __( 'It looks like your Facebook URL is incorrectly configured. Please check it in your <a href="%s">widget settings</a>.', 'jetpack' ), admin_url( 'widgets.php' ) ) . '</p>';
				echo $after_widget;
			}
			echo '<!-- Invalid Facebook Page URL -->';
			return;
		}


		$title    = apply_filters( 'widget_title', $instance['title'] );
		$page_url = ( is_ssl() ) ? str_replace( 'http://', 'https://', $like_args['href'] ) : $like_args['href'];

		$like_args['show_faces'] = (bool) $like_args['show_faces']         ? 'true' : 'false';
		$like_args['stream']     = (bool) $like_args['stream']             ? 'true' : 'false';
		$like_args['force_wall'] = (bool) $like_args['force_wall']         ? 'true' : 'false';
		$like_args['header']     = (bool) $like_args['header']             ? 'true' : 'false';
		$like_bg_colour          = ( 'dark' == $like_args['colorscheme'] ) ? '#000' : '#fff';

		$locale = $this->get_locale();
		if ( $locale && 'en_US' != $locale )
			$like_args['locale'] = $locale;

		$like_args = urlencode_deep( $like_args );
		$like_url  = add_query_arg( $like_args,  sprintf( '%swww.facebook.com/plugins/likebox.php', ( is_ssl() ) ? 'https://' : 'http://' ) );

		echo $before_widget;

		if ( ! empty( $title ) ) :
			echo $before_title;
			?><a href="<?php echo esc_url( $page_url ); ?>"><?php echo esc_html( $title ); ?></a><?php
			echo $after_title;
		endif;

		?><iframe src="<?php echo esc_url( $like_url ); ?>" scrolling="no" frameborder="0" style="border: none; overflow: hidden;<?php echo 0 != $like_args['width'] ? ' width: ' . (int) $like_args['width'] . 'px; ' : ''; ?> height: <?php echo (int) $like_args['height']; ?>px; background: <?php echo esc_attr( $like_bg_colour ); ?>"></iframe><?php

		echo $after_widget;

		do_action( 'jetpack_stats_extra', 'widget', 'facebook-likebox' );
	}

	function update( $new_instance, $old_instance ) {
		$instance = array(
			'title' => '',
			'like_args' => $this->get_default_args(),
		);

		$instance['title'] = trim( strip_tags( stripslashes( $new_instance['title'] ) ) );

		// Set up widget values
		$instance['like_args'] = array(
			'href'        => trim( strip_tags( stripslashes( $new_instance['href'] ) ) ),
			'width'       => (int) $new_instance['width'],
			'height'      => (int) $new_instance['height'],
			'colorscheme' => $new_instance['colorscheme'],
			'show_faces'  => (bool) $new_instance['show_faces'],
			'stream'      => (bool) $new_instance['stream'],
			'header'      => false, // The header just displays "Find us on Facebook"; it's redundant with the title
			'force_wall'  => (bool) $new_instance['force_wall'],
		);

		$instance['like_args'] = $this->normalize_facebook_args( $instance['like_args'] );

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array(
			'title'     => '',
			'like_args' => $this->get_default_args()
		) );
		$like_args = $this->normalize_facebook_args( $instance['like_args'] );
		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>">
				<?php _e( 'Title', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'title' ); ?>" id="<?php echo $this->get_field_id( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" class="widefat" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'href' ); ?>">
				<?php _e( 'Facebook Page URL', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'href' ); ?>" id="<?php echo $this->get_field_id( 'href' ); ?>" value="<?php echo esc_url( $like_args['href'] ); ?>" class="widefat" />
				<br />
				<small><?php _e( 'The Like Box only works with <a href="http://www.facebook.com/help/?faq=174987089221178">Facebook Pages</a>.', 'jetpack' ); ?></small>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'width' ); ?>">
				<?php _e( 'Width', 'jetpack' ); ?>
				<input type="text" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $like_args['width'] ); ?>" style="width: 30px; text-align: center;" />px
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'height' ); ?>">
				<?php _e( 'Height', 'jetpack' ); ?>
				<input type="text" maxlength="3" name="<?php echo $this->get_field_name( 'height' ); ?>" id="<?php echo $this->get_field_id( 'height' ); ?>" value="<?php echo esc_attr( $like_args['height'] ); ?>" style="width: 30px; text-align: center;" />px
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'colorscheme' ); ?>">
				<?php _e( 'Color Scheme', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'colorscheme' ); ?>" id="<?php echo $this->get_field_id( 'colorscheme' ); ?>">
					<option value="light" <?php selected( $like_args['colorscheme'], 'light' ); ?>><?php _e( 'Light', 'jetpack' ); ?></option>
					<option value="dark" <?php selected( $like_args['colorscheme'], 'dark' ); ?>><?php _e( 'Dark', 'jetpack' ); ?></option>
				</select>
			</label>
		</p>


		<p>
			<label for="<?php echo $this->get_field_id( 'show_faces' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_faces' ); ?>" id="<?php echo $this->get_field_id( 'show_faces' ); ?>" <?php checked( $like_args['show_faces'] ); ?> />
				<?php _e( 'Show Faces', 'jetpack' ); ?>
				<br />
				<small><?php _e( 'Show profile photos in the plugin.', 'jetpack' ); ?></small>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'stream' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'stream' ); ?>" id="<?php echo $this->get_field_id( 'stream' ); ?>" <?php checked( $like_args['stream'] ); ?> />
				<?php _e( 'Show Stream', 'jetpack' ); ?>
				<br />
				<small><?php _e( 'Show the profile stream for the public profile.', 'jetpack' ); ?></small>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'force_wall' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'force_wall' ); ?>" id="<?php echo $this->get_field_id( 'force_wall' ); ?>" <?php checked( $like_args['force_wall'] ); ?> />
				<?php _e( 'Show Wall', 'jetpack' ); ?>
				<br />
				<small><?php _e( 'Show the wall for a Places page rather than friend activity.', 'jetpack' ); ?></small>
			</label>
		</p>

		<?php
	}

	function get_default_args() {
		$defaults = array(
			'href'        => '',
			'width'       => $this->default_width,
			'height'      => $this->default_height,
			'colorscheme' => $this->default_colorscheme,
			'show_faces'  => true,
			'stream'      => false,
			'header'      => false,
			'force_wall'  => false,
		);

		return apply_filters( 'jetpack_facebook_likebox_defaults', $defaults );
	}

	function normalize_facebook_args( $args ) {
		$args = wp_parse_args( (array) $args, $this->get_default_args() );

		// Validate the Facebook Page URL
		if ( $this->is_valid_facebook_url( $args['href'] ) ) {
			$temp = explode( '?', $args['href'] );
			$args['href'] = str_replace( array( 'http://facebook.com', 'https://facebook.com' ), array( 'http://www.facebook.com', 'https://www.facebook.com' ), $temp[0] );
		} else {
			$args['href'] = '';
		}

		$args['width']       = $this->normalize_int_value(  (int) $args['width'], $this->default_width,       $this->max_width, $this->min_width );
		$args['height']       = $this->normalize_int_value(  (int) $args['height'], $this->default_height,       $this->max_height, $this->min_height );
		$args['colorscheme'] = $this->normalize_text_value( $args['colorscheme'], $this->default_colorscheme, $this->allowed_colorschemes        );
		$args['show_faces']  = (bool) $args['show_faces'];
		$args['stream']      = (bool) $args['stream'];
		$args['force_wall']  = (bool) $args['force_wall'];

		// The height used to be dependent on other widget settings
		// If the user changes those settings but doesn't customize the height,
		// let's intelligently assign a new height.
		if ( in_array( $args['height'], array( 580, 110, 432 ) ) ) {
			if( $args['show_faces'] && $args['stream'] ) {
				$args['height'] = 580;
			} else if( ! $args['show_faces'] && ! $args['stream'] ) {
				$args['height'] = 110;
			} else {
				$args['height'] = 432;
			}
		}

		return $args;
	}

	function is_valid_facebook_url( $url ) {
		return ( FALSE !== strpos( $url, 'facebook.com' ) ) ? TRUE : FALSE;
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

	function guess_locale_from_lang( $lang ) {
		if ( 'en' == $lang || 'en_US' == $lang || !$lang ) {
			return 'en_US';
		}

		if ( !class_exists( 'GP_Locales' ) ) {
			if ( !defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || !file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				return false;
			}

			require JETPACK__GLOTPRESS_LOCALES_PATH;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// WP.com: get_locale() returns 'it'
			$locale = GP_Locales::by_slug( $lang );
		} else {
			// Jetpack: get_locale() returns 'it_IT';
			$locale = GP_Locales::by_field( 'wp_locale', $lang );
		}

		if ( !$locale || empty( $locale->facebook_locale ) ) {
			return false;
		}

		return $locale->facebook_locale;
	}

	function get_locale() {
		return $this->guess_locale_from_lang( get_locale() );
	}
}

// END
