<?php
/**
 * Our Site Logo class for managing a theme-agnostic logo through the Customizer.
 *
 * @package Jetpack
 */
class Site_Logo {
	/**
	 * Stores our single instance.
	 */
	private static $instance;

	/**
	 * Stores our current logo settings.
	 */
	public $logo;

	/**
	 * Return our instance, creating a new one if necessary.
	 *
	 * @uses Site_Logo::$instance
	 * @return object Site_Logo
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Site_Logo;
			self::$instance->register_hooks();
		}

		return self::$instance;
	}

	/**
	 * Get our current logo settings stored in options.
	 *
	 * @uses get_option()
	 */
	private function __construct() {
		$this->logo = get_option( 'site_logo', null );
	}

	/**
	 * Register our actions and filters.
	 *
	 * @uses Site_Logo::head_text_styles()
	 * @uses Site_Logo::customize_register()
	 * @uses Site_Logo::preview_enqueue()
	 * @uses Site_Logo::body_classes()
	 * @uses Site_Logo::media_manager_image_sizes()
	 * @uses add_action
	 * @uses add_filter
	 */
	public function register_hooks() {
		add_action( 'wp_head', array( $this, 'head_text_styles' ) );
		add_action( 'customize_register', array( $this, 'customize_register' ) );
		add_action( 'customize_preview_init', array( $this, 'preview_enqueue' ) );
		add_action( 'delete_attachment', array( $this, 'reset_on_attachment_delete' ) );
		add_filter( 'body_class', array( $this, 'body_classes' ) );
		add_filter( 'image_size_names_choose', array( $this, 'media_manager_image_sizes' ) );
		add_filter( 'display_media_states', array( $this, 'add_media_state' ) );
	}

	/**
	 * Add our logo uploader to the Customizer.
	 *
	 * @param object $wp_customize Customizer object.
	 * @uses current_theme_supports()
	 * @uses current_theme_supports()
	 * @uses WP_Customize_Manager::add_setting()
	 * @uses WP_Customize_Manager::add_control()
	 * @uses Site_Logo::sanitize_checkbox()
	 */
	public function customize_register( $wp_customize ) {
		// Include our custom control.
		require( dirname( __FILE__ ) . '/class-site-logo-control.php' );

		//Update the Customizer section title for discoverability.
		$wp_customize->get_section('title_tagline')->title = __( 'Site Title, Tagline, and Logo', 'jetpack' );

		// Add a setting to hide header text if the theme isn't supporting the feature itself
		if ( ! current_theme_supports( 'custom-header' ) ) {
			$wp_customize->add_setting( 'site_logo_header_text', array(
				'default'           => 1,
				'sanitize_callback' => array( $this, 'sanitize_checkbox' ),
				'transport'         => 'postMessage',
			) );

			$wp_customize->add_control( new WP_Customize_Control( $wp_customize, 'site_logo_header_text', array(
			    'label'    => __( 'Display Header Text', 'jetpack' ),
			    'section'  => 'title_tagline',
			    'settings' => 'site_logo_header_text',
			    'type'     => 'checkbox',
			) ) );
		}

		// Add the setting for our logo value.
		$wp_customize->add_setting( 'site_logo', array(
			'capability'        => 'manage_options',
			'default'           => array(
				'id'    => 0,
				'sizes' => array(),
				'url'   => false,
			),
			'sanitize_callback' => array( $this, 'sanitize_logo_setting' ),
			'transport'         => 'postMessage',
			'type'              => 'option',
		) );

		// Add our image uploader.
		$wp_customize->add_control( new Site_Logo_Image_Control( $wp_customize, 'site_logo', array(
		    'label'    => __( 'Logo', 'jetpack' ),
		    'section'  => 'title_tagline',
		    'settings' => 'site_logo',
		) ) );
	}

	/**
	 * Enqueue scripts for the Customizer live preview.
	 *
	 * @uses wp_enqueue_script()
	 * @uses plugins_url()
	 * @uses current_theme_supports()
	 * @uses Site_Logo::header_text_classes()
	 * @uses wp_localize_script()
	 */
	public function preview_enqueue() {
		wp_enqueue_script( 'site-logo-preview', plugins_url( '../js/site-logo.js', __FILE__ ), array( 'media-views' ), '', true );

		// Don't bother passing in header text classes if the theme supports custom headers.
		if ( ! current_theme_supports( 'custom-header' ) ) {
			$classes = jetpack_sanitize_header_text_classes( $this->header_text_classes() );
			wp_enqueue_script( 'site-logo-header-text', plugins_url( '../js/site-logo-header-text.js', __FILE__ ), array( 'media-views' ), '', true );
			wp_localize_script( 'site-logo-header-text', 'site_logo_header_classes', $classes );
		}
	}

	/**
	 * Get header text classes. If not defined in add_theme_support(), defaults from Underscores will be used.
	 *
	 * @uses get_theme_support
	 * @return string String of classes to hide
	 */
	public function header_text_classes() {
		$args = get_theme_support( 'site-logo' );

		if ( isset( $args[0][ 'header-text' ] ) ) {
			// Use any classes defined in add_theme_support().
			$classes = $args[0][ 'header-text' ];
		} else {
			// Otherwise, use these defaults, which will work with any Underscores-based theme.
			$classes = array(
				'site-title',
				'site-description',
			);
		}

		// If we've got an array, reduce them to a string for output
		if ( is_array( $classes ) ) {
			$classes = (string) '.' . implode( ', .', $classes );
		} else {
			$classes = (string) '.' . $classes;
		}

		return $classes;
	}

	/**
	 * Hide header text on front-end if necessary.
	 *
	 * @uses current_theme_supports()
	 * @uses get_theme_mod()
	 * @uses Site_Logo::header_text_classes()
	 * @uses esc_html()
	 */
	public function head_text_styles() {
		// Bail if our theme supports custom headers.
		if ( current_theme_supports( 'custom-header' ) ) {
			return;
		}

		// Is Display Header Text unchecked? If so, we need to hide our header text.
		if ( ! get_theme_mod( 'site_logo_header_text', 1 ) ) {
			$classes = $this->header_text_classes();
			?>
			<!-- Site Logo: hide header text -->
			<style type="text/css">
			<?php echo jetpack_sanitize_header_text_classes( $classes ); ?> {
				position: absolute;
				clip: rect(1px, 1px, 1px, 1px);
			}
			</style>
			<?php
		}
	}

	/**
	 * Determine image size to use for the logo.
	 *
	 * @uses get_theme_support()
	 * @return string Size specified in add_theme_support declaration, or 'thumbnail' default
	 */
	public function theme_size() {
		$args = get_theme_support( 'site-logo' );
		$valid_sizes = get_intermediate_image_sizes();

		// Add 'full' to the list of accepted values.
		$valid_sizes[] = 'full';

		// If the size declared in add_theme_support is valid, use it; otherwise, just go with 'thumbnail'.
		$size = ( isset( $args[0]['size'] ) && in_array( $args[0]['size'], $valid_sizes ) ) ? $args[0]['size'] : 'thumbnail';

		return $size;
	}

	/**
	 * Make custom image sizes available to the media manager.
	 *
	 * @param array $sizes
	 * @uses get_intermediate_image_sizes()
	 * @return array All default and registered custom image sizes.
	 */
	public function media_manager_image_sizes( $sizes ) {
		// Get an array of all registered image sizes.
		$intermediate = get_intermediate_image_sizes();

		// Have we got anything fun to work with?
		if ( is_array( $intermediate ) && ! empty( $intermediate ) ) {
			foreach ( $intermediate as $key => $size ) {
				// If the size isn't already in the $sizes array, add it.
				if ( ! array_key_exists( $size, $sizes ) ) {
					$sizes[ $size ] = $size;
				}
			}
		}

		return $sizes;
	}

	/**
	 * Add site logos to media states in the Media Manager.
	 *
	 * @return array The current attachment's media states.
	 */
	public function add_media_state( $media_states ) {
		// Only bother testing if we have a site logo set.
		if ( $this->has_site_logo() ) {
			global $post;

			// If our attachment ID and the site logo ID match, this image is the site logo.
			if ( $post->ID == $this->logo['id'] ) {
				$media_states[] = __( 'Site Logo', 'jetpack' );
			}
		}

		return $media_states;
	}

	/**
	 * Reset the site logo if the current logo is deleted in the media manager.
	 *
	 * @param int $site_id
	 * @uses Site_Logo::remove_site_logo()
	 */
	public function reset_on_attachment_delete( $post_id ) {
		if ( $this->logo['id'] == $post_id ) {
			$this->remove_site_logo();
		}
	}

	/**
	 * Determine if a site logo is assigned or not.
	 *
	 * @uses Site_Logo::$logo
	 * @return boolean True if there is an active logo, false otherwise
	 */
	public function has_site_logo() {
		return ( isset( $this->logo['id'] ) && 0 !== $this->logo['id'] ) ? true : false;
	}

	/**
	 * Reset the site logo option to zero (empty).
	 *
	 * @uses update_option()
	 */
	public function remove_site_logo() {
		update_option( 'site_logo', array(
			'id' => (int) 0,
			'sizes' => array(),
			'url' => '',
		) );
	}

	/**
	 * Adds custom classes to the array of body classes.
	 *
	 * @uses Site_Logo::has_site_logo()
	 * @return array Array of <body> classes
	 */
	public function body_classes( $classes ) {
		// Add a class if a Site Logo is active
		if ( $this->has_site_logo() ) {
			$classes[] = 'has-site-logo';
		}

		return $classes;
	}

	/**
	 * Sanitize our header text Customizer setting.
	 *
	 * @param $input
	 * @return mixed 1 if checked, empty string if not checked.
	 */
	public function sanitize_checkbox( $input ) {
		return ( 1 == $input ) ? 1 : '';
	}

	/**
	 * Validate and sanitize a new site logo setting.
	 *
	 * @param $input
	 * @return mixed 1 if checked, empty string if not checked.
	 */
	public function sanitize_logo_setting( $input ) {
		$input['id']  = absint( $input['id'] );
		$input['url'] = esc_url_raw( $input['url'] );

		// If the new setting doesn't point to a valid attachment, just reset the whole thing.
		if ( false == wp_get_attachment_image_src( $input['id'] ) ) {
			$input = array(
				'id'    => (int) 0,
				'sizes' => array(),
				'url'   => '',
			);
		}

		return $input;
	}
}

/**
 * Allow themes and plugins to access Site_Logo methods and properties.
 *
 * @uses Site_Logo::instance()
 * @return object Site_Logo
 */
function site_logo() {
	return Site_Logo::instance();
}

/**
 * One site logo, please.
 */
site_logo();
