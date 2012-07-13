<?php

/**
 * Facebook Like Box widget class
 * Display a Facebook Like Box as a widget
 * http://developers.facebook.com/docs/reference/plugins/like-box/
 */
class WPCOM_Widget_Facebook_LikeBox extends WP_Widget {

	private $default_height       = 432;
	private $default_width        = 200;
	private $max_width            = 400;
	private $min_width            = 100;
	private $default_colorscheme  = 'light';
	private $allowed_colorschemes = array( 'light', 'dark' );

	function __construct() {
		parent::__construct( 'facebook-likebox', __( 'Facebook Like Box', 'jetpack' ), array( 'classname' => 'widget_facebook_likebox', 'description' => __( 'Display a Facebook Like Box to connect visitors to your Facebook Page', 'jetpack' ) ) );
	}

	function widget( $args, $instance ) {
		
		extract( $args );
		
		$like_args = $this->normalize_facebook_args( $instance['like_args'] );
		
		if( empty( $like_args['href'] ) || ! $this->is_valid_facebook_url( $like_args['href'] ) ) {
			echo '<!-- Invalid Facebook Page URL -->';
			return;
		}
		

		$title    = apply_filters( 'widget_title', $instance['title'] );
		$page_url = ( is_ssl() ) ? str_replace( 'http://', 'https://', $like_args['href'] ) : $like_args['href'];
		
		// Calculate the height based on the features enabled
		if( $like_args['show_faces'] && $like_args['stream'] ) {
			$like_args['height'] = 580;
		} else if( ! $like_args['show_faces'] && ! $like_args['stream'] ) {
			$like_args['height'] = 110;
		} else {
			$like_args['height'] = 432;
		}
		
		$like_args['show_faces'] = (bool) $like_args['show_faces']         ? 'true' : 'false';
		$like_args['stream']     = (bool) $like_args['stream']             ? 'true' : 'false';
		$like_args['force_wall'] = (bool) $like_args['force_wall']               ? 'true' : 'false';
		$like_args['header']     = (bool) $like_args['header']             ? 'true' : 'false';
		$like_bg_colour          = ( 'dark' == $like_args['colorscheme'] ) ? '#000' : '#fff';
		
		$locale = $this->get_locale();
		if( $locale && 'en_US' != $locale )
			$like_args['locale'] = $locale;

		$like_args = urlencode_deep( $like_args );
		$like_url  = add_query_arg( $like_args,  sprintf( '%swww.facebook.com/plugins/likebox.php', ( is_ssl() ) ? 'https://' : 'http://' ) );
		
		echo $before_widget;

		if( ! empty( $title ) ) :
			echo $before_title;
			?><a href="<?php echo esc_url( $page_url ); ?>"><?php esc_html_e( $title , 'jetpack' ); ?></a><?php
			echo $after_title;
		endif;

		?><iframe src="<?php echo esc_url( $like_url ); ?>" scrolling="no" frameborder="0" style="border: none; overflow: hidden; width: <?php esc_html_e( $like_args['width'] , 'jetpack' ); ?>px; height: <?php esc_html_e( $like_args['height'] , 'jetpack' ); ?>px; background: <?php esc_html_e( $like_bg_colour , 'jetpack' ); ?>"></iframe><?php

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
				<input type="text" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $like_args['width'] ); ?>" style="width: 30px; text-align: center;" />
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
		$args['colorscheme'] = $this->normalize_text_value( $args['colorscheme'], $this->default_colorscheme, $this->allowed_colorschemes        );
		$args['show_faces']  = (bool) $args['show_faces'];
		$args['stream']      = (bool) $args['stream'];
		$args['force_wall']  = (bool) $args['force_wall'];
		
		return $args;
	}
	
	function is_valid_facebook_url( $url ) {
		return ( FALSE !== strpos( $url, 'facebook.com' ) ) ? TRUE : FALSE;
	}
	
	function normalize_int_value( $value, $default = 0, $max = 0, $min = 0 ) {
		$value = (int) $value;
		
		if( ! $value || $max < $value || $min > $value )
			$value = $default;
			
		return (int) $value;
	}
	
	function normalize_text_value( $value, $default = '', $allowed = array() ) {
		$allowed = (array) $allowed;
		
		if( empty( $value ) || ( ! empty( $allowed ) && ! in_array( $value, $allowed ) ) )
			$value = $default;
		
		return $value; 
	}
	
	function guess_locale_from_lang( $lang ) {
		$lang = strtolower( str_replace( '-', '_', $lang ) );

		if ( 5 == strlen( $lang ) ) {
			$lang = substr( $lang, 0, 3 ) . strtoupper( substr( $lang, 3, 2 ) );
		} else if ( 3 == strlen( $lang ) ) {
			$lang = $lang;
		} else {
			$lang = $lang . '_' . strtoupper( $lang );
		}
	
		if ( 'en_EN' == $lang ) {
			$lang = 'en_US';
		} else if ( 'he_HE' == $lang ) {
			$lang = 'he_IL';
		} else if ( 'ja_JA' == $lang )
			$lang = 'ja_JP';

		return $lang;
	}
	
	function get_locale() {
		return $this->guess_locale_from_lang( get_locale() );
	}
}

// END
