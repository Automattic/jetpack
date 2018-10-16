<?php

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_googleplus_badge_init' );

function jetpack_googleplus_badge_init() {
	register_widget( 'WPCOM_Widget_GooglePlus_Badge' );
}

/**
 * Google+ Badge widget class
 * Display a Google+ Badge as a widget
 * https://developers.google.com/+/web/badge/
 */
class WPCOM_Widget_GooglePlus_Badge extends WP_Widget {

	private $default_width       = 220;
	private $max_width           = 450;
	private $min_width_portrait  = 180;
	private $min_width_landscape = 273;
	private $min_width;
	private $default_theme   = 'light';
	private $allowed_themes  = array( 'light', 'dark' );
	private $default_layout  = 'portrait';
	private $allowed_layouts = array( 'landscape', 'portrait' );
	private $default_type    = 'person';
	private $allowed_types   = array();

	function __construct() {
		$this->min_width     = min( $this->min_width_portrait, $this->min_width_landscape );
		$this->allowed_types = array(
			'person'    => __( 'Person Widget', 'jetpack' ),
			'page'      => __( 'Page Widget', 'jetpack' ),
			'community' => __( 'Community Widget', 'jetpack' ),
		);

		parent::__construct(
			'googleplus-badge',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Google+ Badge', 'jetpack' ) ),
			array(
				'classname'                   => 'widget_googleplus_badge',
				'description'                 => __( 'Display a Google+ Badge to connect visitors to your Google+', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

		if ( is_active_widget( '', '', 'googleplus-badge' ) || is_customize_preview() ) {
			add_action( 'wp_print_styles', array( $this, 'enqueue_script' ) );
			add_filter( 'script_loader_tag', array( $this, 'replace_script_tag' ), 10, 2 );
		}
	}

	function enqueue_script() {
		wp_enqueue_script( 'googleplus-widget', 'https://apis.google.com/js/platform.js' );
	}

	function replace_script_tag( $tag, $handle ) {
		if ( 'googleplus-widget' !== $handle ) {
			return $tag;
		}

		return str_replace( ' src', ' async defer src', $tag );
	}

	function enqueue_admin_scripts() {
		global $pagenow;

		if ( 'widgets.php' == $pagenow || 'customize.php' == $pagenow ) {
			wp_enqueue_script(
				'googleplus-widget-admin',
				Jetpack::get_file_url_for_environment(
					'_inc/build/widgets/google-plus/js/admin.min.js',
					'modules/widgets/google-plus/js/admin.js'
				),
				array( 'jquery' )
			);
		}
	}

	function widget( $args, $instance ) {
		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'googleplus-badge' );

		if ( empty( $instance['href'] ) || ! $this->is_valid_googleplus_url( $instance['href'] ) ) {
			if ( current_user_can( 'edit_theme_options' ) ) {
				echo $args['before_widget'];
				echo '<p>' . sprintf(
					__( 'It looks like your Google+ URL is incorrectly configured. Please check it in your <a href="%s">widget settings</a>.', 'jetpack' ),
					admin_url( 'widgets.php' )
				) . '</p>';
				echo $args['after_widget'];
			}
			echo '<!-- Invalid Google+ URL -->';
			return;
		}

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $instance['title'] );

		echo $args['before_widget'];

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
		}

		switch ( $instance['type'] ) {
			case 'person':
			case 'page':
				printf(
					'<div class="g-%s" data-href="%s" data-layout="%s" data-theme="%s" data-showcoverphoto="%s" data-showtagline="%s" data-width="%s"></div>',
					$instance['type'],
					esc_url( $instance['href'] ),
					esc_attr( $instance['layout'] ),
					esc_attr( $instance['theme'] ),
					esc_attr( $instance['show_coverphoto'] ? 'true' : 'false' ),
					esc_attr( $instance['show_tagline'] ? 'true' : 'false' ),
					esc_attr( $instance['width'] )
				);
				break;
			case 'community':
				printf(
					'<div class="g-%s" data-href="%s" data-layout="%s" data-theme="%s" data-showphoto="%s" data-showowners="%s" data-showtagline="%s" data-width="%s"></div>',
					$instance['type'],
					esc_url( $instance['href'] ),
					esc_attr( $instance['layout'] ),
					esc_attr( $instance['theme'] ),
					esc_attr( $instance['show_photo'] ? 'true' : 'false' ),
					esc_attr( $instance['show_owners'] ? 'true' : 'false' ),
					esc_attr( $instance['show_tagline'] ? 'true' : 'false' ),
					esc_attr( $instance['width'] )
				);
				break;
		}

		echo $args['after_widget'];
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title'] = trim( strip_tags( stripslashes( $new_instance['title'] ) ) );

		// Validate the Google+ URL
		$instance['href'] = trim( strip_tags( stripslashes( $new_instance['href'] ) ) );

		if ( $this->is_valid_googleplus_url( $instance['href'] ) ) {
			$temp             = explode( '?', $instance['href'] );
			$instance['href'] = str_replace( array( 'http://plus.google.com', 'https://plus.google.com' ), 'https://plus.google.com', $temp[0] );
		} else {
			$instance['href'] = '';
		}

		$instance['theme']  = $this->filter_text( $new_instance['theme'], $this->default_theme, $this->allowed_themes );
		$instance['layout'] = $this->filter_text( $new_instance['layout'], $this->default_layout, $this->allowed_layouts );

		switch ( $instance['layout'] ) {
			case 'portrait':
				$instance['width'] = filter_var(
					$new_instance['width'], FILTER_VALIDATE_INT, array(
						'options' => array(
							'min_range' => $this->min_width_portrait,
							'max_range' => $this->max_width,
							'default'   => $this->default_width,
						),
					)
				);
				break;
			case 'landscape':
				$instance['width'] = filter_var(
					$new_instance['width'], FILTER_VALIDATE_INT, array(
						'options' => array(
							'min_range' => $this->min_width_landscape,
							'max_range' => $this->max_width,
							'default'   => $this->default_width,
						),
					)
				);
				break;
		}

		if ( array_key_exists( $new_instance['type'], $this->allowed_types ) ) {
			$instance['type'] = $new_instance['type'];
		} else {
			$instance['type'] = $this->default_type;
		}

		switch ( $instance['type'] ) {
			case 'person':
			case 'page':
				$instance['show_coverphoto'] = isset( $new_instance['show_coverphoto'] );
				break;
			case 'community':
				$instance['show_photo']  = isset( $new_instance['show_photo'] );
				$instance['show_owners'] = isset( $new_instance['show_owners'] );
				break;
		}

		$instance['show_tagline'] = isset( $new_instance['show_tagline'] );

		return $instance;
	}

	function form( $instance ) {
		$defaults = array(
			'title'           => '',
			'href'            => '',
			'width'           => $this->default_width,
			'layout'          => $this->default_layout,
			'theme'           => $this->default_theme,
			'show_coverphoto' => true,
			'show_photo'      => true,
			'show_owners'     => false,
			'show_tagline'    => true,
			'type'            => $this->default_type,
		);

		$instance = wp_parse_args( $instance, $defaults );
		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>">
				<?php _e( 'Title', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'title' ); ?>" id="<?php echo $this->get_field_id( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" class="widefat" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'type' ); ?>">
				<?php _e( 'Type of Widget', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'type' ); ?>" id="<?php echo $this->get_field_id( 'type' ); ?>" class="widefat googleplus-badge-choose-type">
					<?php
					foreach ( $this->allowed_types as $type_value => $type_display ) {
						printf(
							'<option value="%s"%s>%s</option>',
							esc_attr( $type_value ),
							selected( $type_value, $instance['type'], false ),
							esc_attr( $type_display )
						);
					}
					?>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'href' ); ?>">
				<?php _e( 'Google+ URL', 'jetpack' ); ?>
				<input type="text" name="<?php echo $this->get_field_name( 'href' ); ?>" id="<?php echo $this->get_field_id( 'href' ); ?>" value="<?php echo esc_url( $instance['href'] ); ?>" class="widefat" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'width' ); ?>">
				<?php _e( 'Width', 'jetpack' ); ?>
				<input type="number" class="smalltext" min="<?php echo esc_attr( $this->min_width ); ?>" max="<?php echo esc_attr( $this->max_width ); ?>" maxlength="3" name="<?php echo $this->get_field_name( 'width' ); ?>" id="<?php echo $this->get_field_id( 'width' ); ?>" value="<?php echo esc_attr( $instance['width'] ); ?>" style="text-align: center;" />px
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'layout' ); ?>">
				<?php _e( 'Layout', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'layout' ); ?>" id="<?php echo $this->get_field_id( 'layout' ); ?>">
					<option value="landscape" <?php selected( $instance['layout'], 'landscape' ); ?>><?php _e( 'Landscape', 'jetpack' ); ?></option>
					<option value="portrait" <?php selected( $instance['layout'], 'portrait' ); ?>><?php _e( 'Portrait', 'jetpack' ); ?></option>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'theme' ); ?>">
				<?php _e( 'Theme', 'jetpack' ); ?>
				<select name="<?php echo $this->get_field_name( 'theme' ); ?>" id="<?php echo $this->get_field_id( 'theme' ); ?>">
					<option value="light" <?php selected( $instance['theme'], 'light' ); ?>><?php _e( 'Light', 'jetpack' ); ?></option>
					<option value="dark" <?php selected( $instance['theme'], 'dark' ); ?>><?php _e( 'Dark', 'jetpack' ); ?></option>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_coverphoto' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_coverphoto' ); ?>" id="<?php echo $this->get_field_id( 'show_coverphoto' ); ?>" <?php checked( $instance['show_coverphoto'] ); ?> class="googleplus-badge-only-person googleplus-badge-only-page" />
				<?php _e( 'Show Cover Photo', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_photo' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_photo' ); ?>" id="<?php echo $this->get_field_id( 'show_photo' ); ?>" <?php checked( $instance['show_photo'] ); ?> class="googleplus-badge-only-community" />
				<?php _e( 'Show Photo', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_owners' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_owners' ); ?>" id="<?php echo $this->get_field_id( 'show_owners' ); ?>" <?php checked( $instance['show_owners'] ); ?> class="googleplus-badge-only-community" />
				<?php _e( 'Show Owners', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show_tagline' ); ?>">
				<input type="checkbox" name="<?php echo $this->get_field_name( 'show_tagline' ); ?>" id="<?php echo $this->get_field_id( 'show_tagline' ); ?>" <?php checked( $instance['show_tagline'] ); ?> />
				<?php _e( 'Show Tag Line', 'jetpack' ); ?>
			</label>
		</p>

		<?php
	}

	function is_valid_googleplus_url( $url ) {
		return ( false !== strpos( $url, 'plus.google.com' ) ) ? true : false;
	}

	function filter_text( $value, $default = '', $allowed = array() ) {
		$allowed = (array) $allowed;

		if ( empty( $value ) || ( ! empty( $allowed ) && ! in_array( $value, $allowed ) ) ) {
			$value = $default;
		}

		return $value;
	}
}

// END
