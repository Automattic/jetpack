<?php
class Jetpack_Widget_Social_Icons extends WP_Widget {
	/**
	 * @var array Default widget options.
	 */
	protected $defaults;

	/**
	 * Widget constructor.
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'                   => 'jetpack_widget_social_icons',
			'description'                 => __( 'Add social-media icons to your site.', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		parent::__construct(
			'jetpack_widget_social_icons',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Social Icons', 'jetpack' ) ),
			$widget_ops
		);

		$this->defaults = array(
			'title'     => __( 'Follow Us', 'jetpack' ),
			'icon-size' => 'medium',
			'new-tab'   => false,
			'icons'     => array(
				array(
					'url' => '',
				),
			),
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'admin_print_footer_scripts', array( $this, 'render_admin_js' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_icon_scripts' ) );
		add_action( 'wp_footer', array( $this, 'include_svg_icons' ), 9999 );
	}

	/**
	 * Script & styles for admin widget form.
	 */
	public function enqueue_admin_scripts() {
		wp_enqueue_script( 'jetpack-widget-social-icons-script', plugins_url( 'social-icons/social-icons-admin.js', __FILE__ ), array( 'jquery-ui-sortable' ), '20170506' );
		wp_enqueue_style( 'jetpack-widget-social-icons-admin', plugins_url( 'social-icons/social-icons-admin.css', __FILE__ ), array(), '20170506' );
	}

	/**
	 * Styles for front-end widget.
	 */
	public function enqueue_icon_scripts() {
		wp_enqueue_style( 'jetpack-widget-social-icons-styles', plugins_url( 'social-icons/social-icons.css', __FILE__ ), array(), '20170506' );
	}

	/**
	 * JavaScript for admin widget form.
	 */
	public function render_admin_js() {
		global $wp_customize;
		global $pagenow;

		if ( ! isset( $wp_customize ) && 'widgets.php' !== $pagenow ) {
			return;
		}
	?>
		<script type="text/html" id="tmpl-jetpack-widget-social-icons-template">
			<?php self::render_icons_template(); ?>
		</script>
	<?php
	}

	/**
	 * Add SVG definitions to the footer.
	 */
	public function include_svg_icons() {
		if ( ! is_active_widget( false, $this->id, $this->id_base, true ) ) {
			return;
		}

		// Define SVG sprite file in Jetpack
		$svg_icons = dirname( dirname( __FILE__ ) ) . '/theme-tools/social-menu/social-menu.svg';

		// Define SVG sprite file in WPCOM
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$svg_icons = dirname( dirname( __FILE__ ) ) . '/social-menu/social-menu.svg';
		}

		// If it exists, include it.
		if ( is_file( $svg_icons ) ) {
			require_once( $svg_icons );
		}
	}

	/**
	 * Front-end display of widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args Widget arguments.
	 * @param array $instance Saved values from database.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );

		echo $args['before_widget'];

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
		}

		if ( ! empty( $instance['icons'] ) ) :

			// Get supported social icons.
			$social_icons  = $this->get_supported_icons();
			$default_icon  = $this->get_svg_icon( array( 'icon' => 'chain' ) );

			// Set target attribute for the link
			if ( true === $instance['new-tab'] ) {
				$target = '_blank';
			} else {
				$target = '_self';				
			}
		?>

			<ul class="jetpack-social-widget-list size-<?php echo esc_attr( $instance['icon-size'] ); ?>">

				<?php foreach ( $instance['icons'] as $icon ) : ?>

					<?php if ( ! empty( $icon['url'] ) ) : ?>
						<li class="jetpack-social-widget-item">
							<a href="<?php echo esc_url( $icon['url'], array( 'http', 'https', 'mailto', 'skype' ) ); ?>" target="<?php echo $target; ?>">
								<?php
									$found_icon = false;

									foreach( $social_icons as $social_icon ) {
										if ( false !== stripos( $icon['url'], $social_icon['url'] ) ) {
											echo '<span class="screen-reader-text">' . esc_attr( $social_icon['label'] ) . '</span>';
											echo $this->get_svg_icon( array( 'icon' => esc_attr( $social_icon['icon'] ) ) );
											$found_icon = true;
											break;
										}
									}

									if ( ! $found_icon ) {
										echo $default_icon;
									}
								?>
							</a>
						</li>
					<?php endif; ?>

				<?php endforeach; ?>

			</ul>

		<?php
		endif;

		echo $args['after_widget'];

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'social_icons' );
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
		$instance['title']     = sanitize_text_field( $new_instance['title'] );
		$instance['icon-size'] = $this->defaults['icon-size'];

		if ( in_array( $new_instance['icon-size'], array( 'small', 'medium', 'large' ) ) ) {
			$instance['icon-size'] = $new_instance['icon-size'];
		}

		$instance['new-tab'] = isset( $new_instance['new-tab'] ) ? (bool) $new_instance['new-tab'] : false;
		$icon_count          = count( $new_instance['url-icons'] );
		$instance['icons']   = array();

		foreach( $new_instance['url-icons'] as $url ) {
			$url = filter_var( $url, FILTER_SANITIZE_URL );

			if ( ! empty( $url ) ) {
				$instance['icons'][] = array(
					'url' => $url,
				);
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
	 *
	 * @return string|void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );
		$title    = sanitize_text_field( $instance['title'] );
		$sizes    = array(
			'small'  => __( 'Small', 'jetpack' ),
			'medium' => __( 'Medium', 'jetpack' ),
			'large'  => __( 'Large', 'jetpack' ),
		);
		$new_tab  = isset( $instance['new-tab'] ) ? (bool) $instance['new-tab'] : false;
		?>

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'icon-size' ); ?>"><?php esc_html_e( 'Size:', 'jetpack' ); ?></label>
			<select class="widefat" name="<?php echo $this->get_field_name( 'icon-size' ); ?>">
				<?php foreach ( $sizes as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $value, $instance['icon-size'] ); ?>><?php echo esc_attr( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>

		<div class="jetpack-social-icons-widget-list"
			data-url-icon-id="<?php echo $this->get_field_id( 'url-icons' ); ?>"
			data-url-icon-name="<?php echo $this->get_field_name( 'url-icons' ); ?>"
		>

			<?php
				foreach ( $instance['icons'] as $icon ) {
					self::render_icons_template( array(
						'url-icon-id'   => $this->get_field_id( 'url-icons' ),
						'url-icon-name' => $this->get_field_name( 'url-icons' ),
						'url-value'     => $icon['url'],
					) );
				}
			?>

		</div>

		<p class="jetpack-social-icons-widget add-button">
			<button type="button" class="button jetpack-social-icons-add-button">
				<?php esc_html_e( 'Add an icon', 'jetpack' ); ?>
			</button>
		</p>

		<?php
			switch ( get_locale() ) {
				case 'es':
					$support = 'https://es.support.wordpress.com/social-media-icons-widget/#iconos-disponibles';
					break;

				case 'pt-br':
					$support = 'https://br.support.wordpress.com/widgets/widget-de-icones-sociais/#ícones-disponíveis';
					break;

				default:
					$support = 'https://en.support.wordpress.com/widgets/social-media-icons-widget/#available-icons';
			}
		?>

		<p>
			<em><a href="<?php echo esc_url( $support ); ?>" target="_blank">
				<?php esc_html_e( 'View available icons', 'jetpack' ); ?>
			</a></em>
		</p>

		<p>
			<input type="checkbox" class="checkbox" id="<?php echo $this->get_field_id( 'new-tab' ); ?>" name="<?php echo $this->get_field_name( 'new-tab' ); ?>" <?php checked( $new_tab ); ?> />
			<label for="<?php echo $this->get_field_id( 'new-tab' ); ?>"><?php esc_html_e( 'Open link in a new tab', 'jetpack' ); ?></label>
		</p>

	<?php
	}

	/**
	 * Generates template to add icons.
	 *
	 * @param array $args Template arguments
	 */
	static function render_icons_template( $args = array() ) {
		$defaults = array(
			'url-icon-id'   => '',
			'url-icon-name' => '',
			'url-value'     => '',
		);

		$args = wp_parse_args( $args, $defaults );
		?>

		<div class="jetpack-social-icons-widget-item">
			<div class="jetpack-social-icons-widget-item-wrapper">
				<div class="handle"></div>

				<p class="jetpack-widget-social-icons-url">
					<?php
						printf( '<input class="widefat id="%1$s" name="%2$s[]" type="text" placeholder="%3$s" value="%4$s"/>',
							esc_attr( $args['url-icon-id'] ),
							esc_attr( $args['url-icon-name'] ),
							esc_attr__( 'Account URL', 'jetpack' ),
							esc_url( $args['url-value'], array( 'http', 'https', 'mailto', 'skype' ) )
						);
					?>
				</p>

				<p class="jetpack-widget-social-icons-remove-item">
					<a class="jetpack-widget-social-icons-remove-item-button" href="javascript:;">
						<?php esc_html_e( 'Remove', 'jetpack' ); ?>
					</a>
				</p>
			</div>
		</div>

		<?php
	}

	/**
	 * Return SVG markup.
	 *
	 * @param array $args {
	 *     Parameters needed to display an SVG.
	 *
	 *     @type string $icon  Required SVG icon filename.
	 * }
	 * @return string SVG markup.
	 */
	public function get_svg_icon( $args = array() ) {
		// Make sure $args are an array.
		if ( empty( $args ) ) {
			return esc_html__( 'Please define default parameters in the form of an array.', 'jetpack' );
		}

		// Set defaults.
		$defaults = array(
			'icon' => '',
		);

		// Parse args.
		$args = wp_parse_args( $args, $defaults );

		// Define an icon.
		if ( false === array_key_exists( 'icon', $args ) ) {
			return esc_html__( 'Please define an SVG icon filename.', 'jetpack' );
		}

		// Set aria hidden.
		$aria_hidden = ' aria-hidden="true"';

		// Begin SVG markup.
		$svg = '<svg class="icon icon-' . esc_attr( $args['icon'] ) . '"' . $aria_hidden . ' role="img">';

		/*
		 * Display the icon.
		 *
		 * The whitespace around `<use>` is intentional - it is a work around to a keyboard navigation bug in Safari 10.
		 *
		 * See https://core.trac.wordpress.org/ticket/38387.
		 */
		$svg .= ' <use href="#icon-' . esc_html( $args['icon'] ) . '" xlink:href="#icon-' . esc_html( $args['icon'] ) . '"></use> ';

		$svg .= '</svg>';

		return $svg;
	}

	/**
	 * Returns an array of supported social links (URL, icon, and label).
	 *
	 * @return array $social_links_icons
	 */
	public function get_supported_icons() {
		$social_links_icons = array(
			array(
				'url'   => '500px.com',
				'icon'  => '500px',
				'label' => '500px',
			),
			array(
				'url'   => 'amazon.cn',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.in',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.fr',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.de',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.it',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.nl',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.es',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.co',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.ca',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'amazon.com',
				'icon'  => 'amazon',
				'label' => 'Amazon',
			),
			array(
				'url'   => 'apple.com',
				'icon'  => 'apple',
				'label' => 'Apple',
			),
			array(
				'url'   => 'itunes.com',
				'icon'  => 'apple',
				'label' => 'iTunes',
			),
			array(
				'url'   => 'bandcamp.com',
				'icon'  => 'bandcamp',
				'label' => 'Bandcamp',
			),
			array(
				'url'   => 'behance.net',
				'icon'  => 'behance',
				'label' => 'Behance',
			),
			array(
				'url'   => 'codepen.io',
				'icon'  => 'codepen',
				'label' => 'CodePen',
			),
			array(
				'url'   => 'deviantart.com',
				'icon'  => 'deviantart',
				'label' => 'DeviantArt',
			),
			array(
				'url'   => 'digg.com',
				'icon'  => 'digg',
				'label' => 'Digg',
			),
			array(
				'url'   => 'dribbble.com',
				'icon'  => 'dribbble',
				'label' => 'Dribbble',
			),
			array(
				'url'   => 'dropbox.com',
				'icon'  => 'dropbox',
				'label' => 'Dropbox',
			),
			array(
				'url'   => 'etsy.com',
				'icon'  => 'etsy',
				'label' => 'Etsy',
			),
			array(
				'url'   => 'facebook.com',
				'icon'  => 'facebook',
				'label' => 'Facebook',
			),
			array(
				'url'   => '/feed/',
				'icon'  => 'feed',
				'label' => __( 'RSS Feed', 'jetpack' ),
			),
			array(
				'url'   => 'flickr.com',
				'icon'  => 'flickr',
				'label' => 'Flickr',
			),
			array(
				'url'   => 'foursquare.com',
				'icon'  => 'foursquare',
				'label' => 'Foursquare',
			),
			array(
				'url'   => 'goodreads.com',
				'icon'  => 'goodreads',
				'label' => 'Goodreads',
			),
			array(
				'url'   => 'google.com/+',
				'icon'  => 'google-plus',
				'label' => 'Google +',
			),
			array(
				'url'   => 'plus.google.com',
				'icon'  => 'google-plus',
				'label' => 'Google +',
			),
			array(
				'url'   => 'google.com',
				'icon'  => 'google',
				'label' => 'Google',
			),
			array(
				'url'   => 'github.com',
				'icon'  => 'github',
				'label' => 'GitHub',
			),
			array(
				'url'   => 'instagram.com',
				'icon'  => 'instagram',
				'label' => 'Instagram',
			),
			array(
				'url'   => 'linkedin.com',
				'icon'  => 'linkedin',
				'label' => 'LinkedIn',
			),
			array(
				'url'   => 'mailto:',
				'icon'  => 'mail',
				'label' => __( 'Email', 'jetpack' ),
			),
			array(
				'url'   => 'meetup.com',
				'icon'  => 'meetup',
				'label' => 'Meetup',
			),
			array(
				'url'   => 'medium.com',
				'icon'  => 'medium',
				'label' => 'Medium',
			),
			array(
				'url'   => 'pinterest.com',
				'icon'  => 'pinterest',
				'label' => 'Pinterest',
			),
			array(
				'url'   => 'getpocket.com',
				'icon'  => 'pocket',
				'label' => 'Pocket',
			),
			array(
				'url'   => 'reddit.com',
				'icon'  => 'reddit',
				'label' => 'Reddit',
			),
			array(
				'url'   => 'skype.com',
				'icon'  => 'skype',
				'label' => 'Skype',
			),
			array(
				'url'   => 'skype:',
				'icon'  => 'skype',
				'label' => 'Skype',
			),
			array(
				'url'   => 'slideshare.net',
				'icon'  => 'slideshare',
				'label' => 'SlideShare',
			),
			array(
				'url'   => 'snapchat.com',
				'icon'  => 'snapchat',
				'label' => 'Snapchat',
			),
			array(
				'url'   => 'soundcloud.com',
				'icon'  => 'soundcloud',
				'label' => 'SoundCloud',
			),
			array(
				'url'   => 'spotify.com',
				'icon'  => 'spotify',
				'label' => 'Spotify',
			),
			array(
				'url'   => 'stumbleupon.com',
				'icon'  => 'stumbleupon',
				'label' => 'StumbleUpon',
			),
			array(
				'url'   => 'tumblr.com',
				'icon'  => 'tumblr',
				'label' => 'Tumblr',
			),
			array(
				'url'   => 'twitch.tv',
				'icon'  => 'twitch',
				'label' => 'Twitch',
			),
			array(
				'url'   => 'twitter.com',
				'icon'  => 'twitter',
				'label' => 'Twitter',
			),
			array(
				'url'   => 'vimeo.com',
				'icon'  => 'vimeo',
				'label' => 'Vimeo',
			),
			array(
				'url'   => 'vk.com',
				'icon'  => 'vk',
				'label' => 'VK',
			),
			array(
				'url'   => 'wordpress.com',
				'icon'  => 'wordpress',
				'label' => 'WordPress.com',
			),
			array(
				'url'   => 'wordpress.org',
				'icon'  => 'wordpress',
				'label' => 'WordPress',
			),
			array(
				'url'   => 'yelp.com',
				'icon'  => 'yelp',
				'label' => 'Yelp',
			),
			array(
				'url'   => 'youtube.com',
				'icon'  => 'youtube',
				'label' => 'YouTube',
			),
		);

		return $social_links_icons;
	}
} // Jetpack_Widget_Social_Icons

/**
 * Register and load the widget.
 *
 * @access public
 * @return void
 */
function jetpack_widget_social_icons_load() {
	register_widget( 'Jetpack_Widget_Social_Icons' );
}
add_action( 'widgets_init', 'jetpack_widget_social_icons_load' );
