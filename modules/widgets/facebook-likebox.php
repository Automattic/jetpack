<?php

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_facebook_likebox_init' );

function jetpack_facebook_likebox_init() {
	register_widget( 'WPCOM_Widget_Facebook_LikeBox' );
}

/**
 * Facebook Page Plugin (formely known as the Like Box)
 * Display a Facebook Page Plugin as a widget (replaces the old like box plugin)
 * https://developers.facebook.com/docs/plugins/page-plugin
 */
class WPCOM_Widget_Facebook_LikeBox extends WP_Widget {

	private $default_height       = 580;
	private $default_width        = 340;
	private $max_width            = 500;
	private $min_width            = 180;
	private $max_height           = 9999;
	private $min_height           = 130;

	function __construct() {
		parent::__construct(
			'facebook-likebox',
			/**
			 * Filter the name of a widget included in the Extra Sidebar Widgets module.
			 *
			 * @module widgets
			 *
			 * @since 2.1.2
			 *
			 * @param string $widget_name Widget title.
			 */
			apply_filters( 'jetpack_widget_name', __( 'Facebook Page Plugin', 'jetpack' ) ),
			array(
				'classname' => 'widget_facebook_likebox',
				'description' => __( 'Use the Facebook Page Plugin to connect visitors to your Facebook Page', 'jetpack' )
			)
		);
	}

	function widget( $args, $instance ) {

		extract( $args );

		$like_args = $this->normalize_facebook_args( $instance['like_args'] );

		wp_enqueue_style( 'jetpack_facebook_likebox', plugins_url( 'facebook-likebox/style.css', __FILE__ ) );
		wp_style_add_data( 'jetpack_facebook_likebox', 'jetpack-inline', true );

		if ( empty( $like_args['href'] ) || ! $this->is_valid_facebook_url( $like_args['href'] ) ) {
			if ( current_user_can('edit_theme_options') ) {
				echo $before_widget;
				echo '<p>' . sprintf( __( 'It looks like your Facebook URL is incorrectly configured. Please check it in your <a href="%s">widget settings</a>.', 'jetpack' ), admin_url( 'widgets.php' ) ) . '</p>';
				echo $after_widget;
			}
			echo '<!-- Invalid Facebook Page URL -->';
			return;
		}

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title    = apply_filters( 'widget_title', $instance['title'] );
		$page_url = set_url_scheme( $like_args['href'], 'https' );

		$like_args['show_faces'] = (bool) $like_args['show_faces'] ? 'true'  : 'false';
		$like_args['stream']     = (bool) $like_args['stream']     ? 'true'  : 'false';
		$like_args['cover']      = (bool) $like_args['cover']      ? 'false' : 'true';

		$locale = $this->get_locale();

		/** This filter is documented in modules/sharedaddy/sharing-sources.php */
		$fb_app_id = apply_filters( 'jetpack_sharing_facebook_app_id', '249643311490' );
		if ( is_numeric( $fb_app_id ) ) {
			$fb_app_id = '&appId=' . $fb_app_id;
		} else {
			$fb_app_id = '';
		}

		echo $before_widget;

		if ( ! empty( $title ) ) :
			echo $before_title;

			$likebox_widget_title = '<a href="' . esc_url( $page_url ) . '">' . esc_html( $title ) . '</a>';

			/**
			 * Filter Facebook Likebox's widget title.
			 *
			 * @module widgets
			 *
			 * @since 3.3.0
			 *
			 * @param string $likebox_widget_title Likebox Widget title (including a link to the Page URL).
			 * @param string $title Widget title as set in the widget settings.
			 * @param string $page_url Facebook Page URL.
			 */
			echo apply_filters( 'jetpack_facebook_likebox_title', $likebox_widget_title, $title, $page_url );

			echo $after_title;
		endif;

		?>
		<div id="fb-root"></div>
		<div class="fb-page" data-href="<?php echo esc_url( $page_url ); ?>" data-width="<?php echo intval( $like_args['width'] ); ?>"  data-height="<?php echo intval( $like_args['height'] ); ?>" data-hide-cover="<?php echo esc_attr( $like_args['cover'] ); ?>" data-show-facepile="<?php echo esc_attr( $like_args['show_faces'] ); ?>" data-show-posts="<?php echo esc_attr( $like_args['stream'] ); ?>">
		<div class="fb-xfbml-parse-ignore"><blockquote cite="<?php echo esc_url( $page_url ); ?>"><a href="<?php echo esc_url( $page_url ); ?>"><?php echo esc_html( $title ); ?></a></blockquote></div>
		</div>
		<script>(function(d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = '//connect.facebook.net/<?php echo esc_html( $locale ); ?>/sdk.js#xfbml=1<?php echo $fb_app_id; ?>&version=v2.3'; fjs.parentNode.insertBefore(js, fjs); }(document, 'script', 'facebook-jssdk'));</script>
		<?php
		echo $after_widget;

		/** This action is already documented in modules/widgets/gravatar-profile.php */
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
			'show_faces'  => isset( $new_instance['show_faces'] ),
			'stream'      => isset( $new_instance['stream'] ),
			'cover'       => isset( $new_instance['cover'] ),
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
				<small><?php _e( 'The widget only works with Facebook Pages.', 'jetpack' ); ?></small>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'width' ); ?>">
				<?php _e( 'Width', 'jetpack' ); ?>
				<input type="number" class="smalltext" min="1" max="999" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $like_args['width'] ); ?>" style="text-align: center;" />px
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'height' ); ?>">
				<?php _e( 'Height', 'jetpack' ); ?>
				<input type="number" class="smalltext" min="1" max="999" maxlength="3" name="<?php echo $this->get_field_name( 'height' ); ?>" id="<?php echo $this->get_field_id( 'height' ); ?>" value="<?php echo esc_attr( $like_args['height'] ); ?>" style="text-align: center;" />px
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
				<small><?php _e( 'Show Page Posts.', 'jetpack' ); ?></small>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'cover' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'cover' ); ?>" id="<?php echo $this->get_field_id( 'cover' ); ?>" <?php checked( $like_args['cover'] ); ?> />
				<?php _e( 'Show Cover Photo', 'jetpack' ); ?>
				<br />
			</label>
		</p>

		<?php
	}

	function get_default_args() {
		$defaults = array(
			'href'        => '',
			'width'       => $this->default_width,
			'height'      => $this->default_height,
			'show_faces'  => 'true',
			'stream'      => '',
			'cover'       => 'true',
		);

		/**
		 * Filter Facebook Likebox default options.
		 *
		 * @module widgets
		 *
		 * @since 1.3.1
		 *
		 * @param array $defaults Array of default options.
		 */
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

		$args['width']      = $this->normalize_int_value(  (int) $args['width'], $this->default_width,   $this->max_width,  $this->min_width );
		$args['height']     = $this->normalize_int_value(  (int) $args['height'], $this->default_height, $this->max_height, $this->min_height );
		$args['show_faces'] = (bool) $args['show_faces'];
		$args['stream']     = (bool) $args['stream'];
		$args['cover']      = (bool) $args['cover'];

		// The height used to be dependent on other widget settings
		// If the user changes those settings but doesn't customize the height,
		// let's intelligently assign a new height.
		if ( in_array( $args['height'], array( 580, 110, 432 ) ) ) {
			if ( $args['show_faces'] && $args['stream'] ) {
				$args['height'] = 580;
			} else if ( ! $args['show_faces'] && ! $args['stream'] ) {
				$args['height'] = 130;
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
			$locale = GP_Locales::by_field( 'facebook_locale', $lang );
		}

		if ( ! $locale ) {
			return false;
		}

		if ( empty( $locale->facebook_locale ) ) {
			if ( empty( $locale->wp_locale ) ) {
				return false;
			} else {
				// Facebook SDK is smart enough to fall back to en_US if a
				// locale isn't supported. Since supported Facebook locales
				// can fall out of sync, we'll attempt to use the known
				// wp_locale value and rely on said fallback.
				return $locale->wp_locale;
			}
		}

		return $locale->facebook_locale;
	}

	function get_locale() {
		$locale = $this->guess_locale_from_lang( get_locale() );

		if ( ! $locale ) {
			$locale = 'en_US';
		}

		return $locale;
	}
}

// END
