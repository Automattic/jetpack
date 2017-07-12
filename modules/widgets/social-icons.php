<?php
class Jetpack_Widget_Social_Icons extends WP_Widget {
	/**
	 * @var array Default widget options.
	 */
	protected $defaults;

	/**
	 * @var array protocols that are allowed in esc_url validation function.
	 */
	protected $protocols = array( 'http', 'https', 'mailto', 'skype' );

	/**
	 * Widget constructor.
	 */
	public function __construct() {
		$widget_ops = array(
			'classname'                   => 'jetpack_widget_social_icons',
			'description'                 => esc_html__( 'Add social-media icons to your site.', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		parent::__construct( 'jetpack_widget_social_icons', esc_html__( 'Social Icons', 'jetpack' ), $widget_ops );

		$this->defaults = array(
			'title'     => esc_html__( 'Follow Us', 'jetpack' ),
			'icon-size' => 'medium',
			'icons'     => array(
				array(
					'url'   => '',
				),
			),
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'admin_print_footer_scripts', array( $this, 'render_admin_js' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_icon_scripts' ) );
		add_action( 'wp_footer', array( $this, 'jetpack_social_menu_include_svg_icons' ), 9999 );
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
	?>
		<script type="text/html" id="tmpl-jetpack-widget-social-icons-template">
			<?php self::render_icons_template(); ?>
		</script>
	<?php
	}

	/**
	 * Add SVG definitions to the footer.
	 */
	public function jetpack_social_menu_include_svg_icons() {
		// Define SVG sprite file.
		$svg_icons = dirname( dirname( __FILE__ ) ) . '/theme-tools/social-menu/social-menu.svg';

		// If it exists, include it.
		if ( file_exists( $svg_icons ) ) {
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
		$instance = wp_parse_args( (array) $instance, $this->defaults );

		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', empty( $instance['title'] ) ? '' : $instance['title'], $instance, $this->id_base );

		echo $args['before_widget'];

		if ( ! empty( $title ) ) {
			echo $args['before_title'] . esc_html( $title ) . $args['after_title'];
		}

		if ( ! empty( $instance['icons'] ) ) :

			// Get supported social icons.
			$social_labels = jetpack_social_menu_social_links_labels();
			$social_icons  = jetpack_social_menu_social_links_icons();
		?>

			<ul class="jetpack-social-widget-list size-<?php echo esc_attr( $instance['icon-size'] ); ?>">

				<?php foreach ( $instance['icons'] as $icon ) : ?>

					<?php if ( ! empty( $icon['url'] ) ) : ?>
						<li class="jetpack-social-widget-item">
							<a href="<?php echo esc_url( $icon['url'], $this->protocols ); ?>">
								<?php
									// Add a label if there is supported URL.
									foreach ( $social_labels as $attr => $value ) {
										if ( false !== strpos( $icon['url'], $attr ) ) {
											echo '<span class="screen-reader-text">' . esc_attr( $value ) . '</span>';
										}
									}

									$icon_output = jetpack_social_menu_get_svg( array( 'icon' => 'chain' ) );

									// Change SVG icon inside social links menu if there is supported URL.
									foreach ( $social_icons as $attr => $value ) {
										if ( false !== strpos( $icon['url'], $attr ) ) {
											$icon_output = jetpack_social_menu_get_svg( array( 'icon' => esc_attr( $value ) ) );
										}
									}

									echo $icon_output;
								?>
							</a>
						</li>
					<?php endif; ?>

				<?php endforeach; ?>

			</ul>

		<?php
		endif;

		echo $args['after_widget'];
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

		$icon_count        = count( $new_instance['url-icons'] );
		$instance['icons'] = array();

		for ( $i = 0; $i < $icon_count; $i++ ) {
			$url = filter_var( $new_instance['url-icons'][ $i ], FILTER_SANITIZE_URL );

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
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		$title    = sanitize_text_field( $instance['title'] );
		$sizes    = array(
			'small'  => esc_html__( 'Small', 'jetpack' ),
			'medium' => esc_html__( 'Medium', 'jetpack' ),
			'large'  => esc_html__( 'Large', 'jetpack' ),
		);
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
			$support     = 'https://en.support.wordpress.com/widgets/social-media-icons-widget/#available-icons';
			if ( 'es' === get_locale() ) {
				$support = 'https://es.support.wordpress.com/social-media-icons-widget/#iconos-disponibles';
			}
			if ( 'pt-br' === get_locale() ) {
				$support = 'https://br.support.wordpress.com/widgets/widget-de-icones-sociais/#ícones-disponíveis';
			}
		?>

		<p>
			<em><a href="<?php echo esc_url( $support ); ?>" target="_blank">
				<?php esc_html_e( 'View available icons', 'jetpack' ); ?>
			</a></em>
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
							esc_url( $args['url-value'] )
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

if ( ! function_exists( 'jetpack_social_menu_get_svg' ) ) :
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
function jetpack_social_menu_get_svg( $args = array() ) {
	// Make sure $args are an array.
	if ( empty( $args ) ) {
		return esc_html__( 'Please define default parameters in the form of an array.', 'jetpack' );
	}

	// Set defaults.
	$defaults = array(
		'icon'     => '',
		'fallback' => false,
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

	// Add some markup to use as a fallback for browsers that do not support SVGs.
	if ( $args['fallback'] ) {
		$svg .= '<span class="svg-fallback icon-' . esc_attr( $args['icon'] ) . '"></span>';
	}

	$svg .= '</svg>';

	return $svg;
}
endif;

if ( ! function_exists( 'jetpack_social_menu_social_links_icons' ) ) :
/**
 * Returns an array of supported social links (URL and icon name).
 *
 * @return array $social_links_icons
 */
function jetpack_social_menu_social_links_icons() {
	// Supported social links icons.
	$social_links_icons = array(
		'500px.com'       => '500px',
		'amazon.cn'       => 'amazon',
		'amazon.in'       => 'amazon',
		'amazon.fr'       => 'amazon',
		'amazon.de'       => 'amazon',
		'amazon.it'       => 'amazon',
		'amazon.nl'       => 'amazon',
		'amazon.es'       => 'amazon',
		'amazon.co'       => 'amazon',
		'amazon.ca'       => 'amazon',
		'amazon.com'      => 'amazon',
		'apple.com'       => 'apple',
		'itunes.com'      => 'apple',
		'bandcamp.com'    => 'bandcamp',
		'behance.net'     => 'behance',
		'codepen.io'      => 'codepen',
		'deviantart.com'  => 'deviantart',
		'digg.com'        => 'digg',
		'dribbble.com'    => 'dribbble',
		'dropbox.com'     => 'dropbox',
		'etsy.com'        => 'etsy',
		'facebook.com'    => 'facebook',
		'/feed/'          => 'feed',
		'flickr.com'      => 'flickr',
		'foursquare.com'  => 'foursquare',
		'goodreads.com'   => 'goodreads',
		'google.com'      => 'google',
		'plus.google.com' => 'google-plus',
		'github.com'      => 'github',
		'instagram.com'   => 'instagram',
		'linkedin.com'    => 'linkedin',
		'mailto:'         => 'mail',
		'meetup.com'      => 'meetup',
		'medium.com'      => 'medium',
		'pinterest.com'   => 'pinterest',
		'getpocket.com'   => 'pocket',
		'reddit.com'      => 'reddit',
		'skype.com'       => 'skype',
		'skype:'          => 'skype',
		'slideshare.net'  => 'slideshare',
		'snapchat.com'    => 'snapchat',
		'soundcloud.com'  => 'soundcloud',
		'spotify.com'     => 'spotify',
		'stumbleupon.com' => 'stumbleupon',
		'tumblr.com'      => 'tumblr',
		'twitch.tv'       => 'twitch',
		'twitter.com'     => 'twitter',
		'vimeo.com'       => 'vimeo',
		'vk.com'          => 'vk',
		'wordpress.org'   => 'wordpress',
		'wordpress.com'   => 'wordpress',
		'yelp.com'        => 'yelp',
		'youtube.com'     => 'youtube',
	);

	return $social_links_icons;
}
endif;

if ( ! function_exists( 'jetpack_social_menu_social_links_labels' ) ) :
/**
 * Returns an array of supported social links (URL and label).
 *
 * @return array $social_links_labels
 */
function jetpack_social_menu_social_links_labels() {
	// Supported social links icons.
	$social_links_labels = array(
		'500px.com'       => '500px',
		'amazon.cn'       => 'Amazon',
		'amazon.in'       => 'Amazon',
		'amazon.fr'       => 'Amazon',
		'amazon.de'       => 'Amazon',
		'amazon.it'       => 'Amazon',
		'amazon.nl'       => 'Amazon',
		'amazon.es'       => 'Amazon',
		'amazon.co'       => 'Amazon',
		'amazon.ca'       => 'Amazon',
		'amazon.com'      => 'Amazon',
		'apple.com'       => 'Apple',
		'itunes.com'      => 'Apple',
		'bandcamp.com'    => 'Bandcamp',
		'behance.net'     => 'Behance',
		'codepen.io'      => 'CodePen',
		'deviantart.com'  => 'DeviantArt',
		'digg.com'        => 'Digg',
		'dribbble.com'    => 'Dribbble',
		'dropbox.com'     => 'Dropbox',
		'etsy.com'        => 'Etsy',
		'facebook.com'    => 'Facebook',
		'/feed/'          => 'RSS',
		'flickr.com'      => 'Flickr',
		'foursquare.com'  => 'Foursquare',
		'goodreads.com'   => 'Goodreads',
		'google.com'      => 'Google',
		'plus.google.com' => 'Google Plus',
		'github.com'      => 'GitHub',
		'instagram.com'   => 'Instagram',
		'linkedin.com'    => 'LinkedIn',
		'mailto:'         => 'Email',
		'meetup.com'      => 'Meetup',
		'medium.com'      => 'Medium',
		'pinterest.com'   => 'Pinterest',
		'getpocket.com'   => 'Pocket',
		'reddit.com'      => 'Reddit',
		'skype.com'       => 'Skype',
		'skype:'          => 'Skype',
		'slideshare.net'  => 'SlideShare',
		'snapchat.com'    => 'Snapchat',
		'soundcloud.com'  => 'SoundCloud',
		'spotify.com'     => 'Spotify',
		'stumbleupon.com' => 'StumbleUpon',
		'tumblr.com'      => 'Tumblr',
		'twitch.tv'       => 'Twitch',
		'twitter.com'     => 'Twitter',
		'vimeo.com'       => 'Vimeo',
		'vk.com'          => 'VK',
		'wordpress.org'   => 'WordPress',
		'wordpress.com'   => 'WordPress',
		'yelp.com'        => 'Yelp',
		'youtube.com'     => 'YouTube',
	);

	return $social_links_labels;
}
endif;