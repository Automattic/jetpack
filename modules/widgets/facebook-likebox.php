<?php
/**
 * Facebook Like Box widget class
 * Display a Facebook Like Box as a widget
 * http://developers.facebook.com/docs/reference/plugins/like-box/
 */
class Jetpack_Facebook_Like_Box_Widget extends WP_Widget {
	private $default_height = 432;
	private $default_width = 200;
	private $max_width = 400;
	private $min_width = 100;
	private $default_colorscheme = 'light';
	private $allowed_colorschemes = array( 'light', 'dark' );

	function __construct() {
		parent::__construct( 'facebook-likebox', __( 'Facebook Like Box (Jetpack)', 'jetpack' ), array( 'classname' => 'widget_facebook_likebox', 'description' => __( 'Display a Facebook Like Box to connect visitors to your Facebook Page', 'jetpack' ) ) );
	}

	function widget( $args, $instance ) {
		
		extract( $args );
		
		$like_args = $this->normalize_facebook_args( $instance['like_args'] );
		
		if( empty( $like_args['href'] ) || ! $this->is_valid_facebook_url( $like_args['href'] ) ) {
			echo '<!-- Invalid Facebook Page URL -->';
			return;
		}
		
		// TODO: Ideally, we should validate that the URL is a valid Facebook Page
		// Can make a call to https://graph.facebook.com/pagename?metadata=1 and sniff the type value
		
		$title = apply_filters( 'widget_title', $instance['title'] );
		
		$page_url = $like_args['href'];
		
		if( is_ssl() )
			$page_url = str_replace( 'http://', 'https://', $page_url );
		
		// Calculate the height based on the features enabled
		if( $like_args['show_faces'] && $like_args['stream'] )
			$like_args['height'] = 580;
		elseif( ! $like_args['show_faces'] && ! $like_args['stream'] )
			$like_args['height'] = 110;
		else
			$like_args['height'] = 432;
		
		$like_args['show_faces'] = (bool) $like_args['show_faces'] ? 'true' : 'false';
		$like_args['stream'] = (bool) $like_args['stream'] ? 'true' : 'false';
		$like_args['header'] = (bool) $like_args['header'] ? 'true' : 'false';
		
		$like_bg_colour = $like_args['colorscheme'] == 'dark' ? '#000' : '#fff';
		
		$locale = $this->get_locale();
		if( $locale && $locale != 'en_US' )
			$like_args['locale'] = $locale;
		
		$protocol = is_ssl() ? 'https://' : 'http://';
		
		$like_args = array_map( 'urlencode', $like_args );
		
		$like_url = add_query_arg( $like_args, sprintf( '%swww.facebook.com/plugins/likebox.php', $protocol ) );
		
		echo $before_widget;
		if( ! empty( $title ) ) {
			echo $before_title;
			echo sprintf( '<a href="%s">%s</a>', esc_url( $page_url ), esc_html( $title ) );
			echo $after_title;
		}
		echo sprintf( '<iframe src="%1$s" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:%2$spx; height:%3$spx; background:%4$s"></iframe>', $like_url, (int) $like_args['width'], (int) $like_args['height'], $like_bg_colour );
		echo $after_widget;
	}

	function update( $new_instance, $old_instance ) {
		// Settings are saved as array( 'title' => '', 'like_args' => array( 'href' => 'http://ww' ... ) )
	
		$instance['title'] = trim( strip_tags( stripslashes( $new_instance['title'] ) ) );
		
		// Set up widget values
		$instance['like_args'] = array(
			'href' => trim( strip_tags( stripslashes( $new_instance['href'] ) ) ),
			'width' => (int) $new_instance['width'],
			'height' => ( isset( $new_instance['height'] ) ) ? (int) $new_instance['height'] : 432,
			'colorscheme' => $new_instance['colorscheme'],
			'show_faces' => (bool) $new_instance['show_faces'],
			'stream' => ( isset( $new_instance['stream'] ) ) ? (bool) $new_instance['stream'] : false,
			'header' => false, // The header just displays "Find us on Facebook"; it's redundant with the title
		);
		
		$instance['like_args'] = $this->normalize_facebook_args( $instance['like_args'] );

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array( 
			'title' => '',
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
			<label for="<?php echo $this->get_field_id( 'width' ); ?>"><?php _e( 'Width', 'jetpack' ); ?></label>
			<input type="text" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $like_args['width'] ); ?>" style="width: 30px; text-align: center;" />
		</p>
		
		<p>
			<label for="<?php echo $this->get_field_id( 'colorscheme' ); ?>"><?php _e( 'Color Scheme', 'jetpack' ); ?></label>
			<select name="<?php echo $this->get_field_name( 'colorscheme' ); ?>" id="<?php echo $this->get_field_id( 'colorscheme' ); ?>">
				<option value="light" <?php selected( $like_args['colorscheme'], 'light' ); ?>><?php _e( 'Light', 'jetpack' ); ?></option>
				<option value="dark" <?php selected( $like_args['colorscheme'], 'dark' ); ?>><?php _e( 'Dark', 'jetpack' ); ?></option>
			</select>
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
		
		<?php
	}
	
	function get_default_args() {
		return array(
			'href' => '',
			'height' => $this->default_height,
			'width' => $this->default_width, // is there a way to get the widget width?
			'colorscheme' => $this->default_colorscheme,
			'show_faces' => true,
			'stream' => false,
			'header' => false,
		);
	}
	
	function normalize_facebook_args( $args ) {
		$args = wp_parse_args( (array) $args, $this->get_default_args() );
		
		// Validate the Facebook Page URL
		$args['href'] = $this->normalize_facebook_url( $args['href'] );
		if( ! $this->is_valid_facebook_url( $args['href'] ) )
			$args['href'] = '';
		
		$args['width'] = (int) $args['width'];
		
		$args['width'] = $this->normalize_int_value( $args['width'], $this->default_width, $this->max_width, $this->min_width );
		
		$args['colorscheme'] = $this->normalize_text_value( $args['colorscheme'], $this->default_colorscheme, $this->allowed_colorschemes );
		
		$args['show_faces'] = (bool) $args['show_faces'];
		$args['stream'] = (bool) $args['stream'];
		
		return $args;
	}
	
	function is_valid_facebook_url( $url ) {
		return strpos( $url, 'http://www.facebook.com' ) === 0 || strpos( $url, 'https://www.facebook.com' ) === 0;
	}
	
	function normalize_facebook_url( $url ) {
		$url = str_replace( array( 'http://facebook.com', 'https://facebook.com' ), array( 'http://www.facebook.com', 'https://www.facebook.com' ), $url );
		
		// Need to strip query string or Facebook gets unhappy
		$query_string = parse_url( $url, PHP_URL_QUERY );

		if( $query_string )
			$url = str_replace( '?' . $query_string, '', $url );

		return esc_url( $url, array( 'http', 'https' ) );
	}
	
	function normalize_int_value( $value, $default = 0, $max = 0, $min = 0 ) {
		$value = (int) $value;
		
		if( ! $value || $max < $value || $min > $value )
			$value = $default;
			
		return $value;
	}
	
	function normalize_text_value( $value, $default = '', $allowed = array() ) {
		$allowed = (array) $allowed;
		
		if( empty( $value ) || ( ! empty( $allowed ) && ! in_array( $value, $allowed ) ) )
			$value = $default;
		
		return $value; 
	}
	
	// Borrowed from ShareDaddy
	function guess_locale_from_lang( $lang ) {
		$lang = strtolower( str_replace( '-', '_', $lang ) );
		if ( 5 == strlen( $lang ) )
			$lang = substr( $lang, 0, 3 ) . strtoupper( substr( $lang, 3, 2 ) ); // Already in xx_xx, just make sure it's uppered
		else if ( 3 == strlen( $lang ) )
			$lang = $lang; // Don't know what to do with these
		else
			$lang = $lang . '_' . strtoupper( $lang ); // Sometimes this gives a workable locale
		return $lang;
	}
	
	function get_locale() {
		return $this->guess_locale_from_lang( get_locale() );
	}

} //Class Jetpack_Facebook_Like_Box_Widget

function jetpack_facebook_like_box_widget_init() {
	register_widget( 'Jetpack_Facebook_Like_Box_Widget' );
}
add_action( 'widgets_init', 'jetpack_facebook_like_box_widget_init' );
