<?php

/**
 * Class Jetpack_Custom_CSS_Enhancements
 */
class Jetpack_Custom_CSS_Enhancements {
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'init' ) );
		add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
		add_action( 'customize_controls_enqueue_scripts', array( __CLASS__, 'customize_controls_enqueue_scripts' ) );
		add_action( 'customize_register', array( __CLASS__, 'customize_register' ) );
		add_filter( 'map_meta_cap', array( __CLASS__, 'map_meta_cap' ), 20, 2 );
        add_action( 'customize_preview_init', array( __CLASS__, 'customize_preview_init' ) );

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'wp_enqueue_scripts' ) );

		// Handle Sass/LESS
		add_filter( 'customize_value_custom_css', array( __CLASS__, 'customize_value_custom_css' ), 10, 2 );
		add_filter( 'customize_update_custom_css_post_content_args', array( __CLASS__, 'customize_update_custom_css_post_content_args' ), 10, 3 );

		// Stuff for stripping out the theme's default stylesheet...
		add_filter( 'stylesheet_uri', array( __CLASS__, 'style_filter' ) );
		add_filter( 'safecss_skip_stylesheet', array( __CLASS__, 'preview_skip_stylesheet' ) );

		// Stuff for overriding content width...
		add_action( 'customize_preview_init', array( __CLASS__, 'preview_content_width' ) );
		add_filter( 'jetpack_content_width', array( __CLASS__, 'jetpack_content_width' ) );
		add_filter( 'editor_max_image_size', array( __CLASS__, 'editor_max_image_size' ), 10, 3 );
		add_action( 'template_redirect', array( __CLASS__, 'set_content_width' ) );
		add_action( 'admin_init', array( __CLASS__, 'set_content_width' ) );

		// Stuff?
	}

	public static function init() {
		self::register_legacy_post_type();
		add_post_type_support( 'custom_css', 'revisions' );

		$min = '.min';
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$min = '';
		}

		wp_register_style( 'jetpack-codemirror',      plugins_url( "custom-css/css/codemirror{$min}.css", __FILE__ ), array(), '20120905' );
		wp_register_style( 'jetpack-customizer-css',  plugins_url( 'custom-css/css/customizer-control.css', __FILE__ ), array( 'jetpack-codemirror' ), '20140728' );
		wp_register_script( 'jetpack-codemirror',     plugins_url( "custom-css/js/codemirror{$min}.js", __FILE__ ), array(), '3.16', true );
		wp_register_script( 'jetpack-customizer-css', plugins_url( 'custom-css/js/core-customizer-css.js', __FILE__ ), array(  'customize-controls', 'underscore', 'jetpack-codemirror' ), JETPACK__VERSION, true );

		wp_register_script( 'jetpack-customizer-css-preview', plugins_url( 'custom-css/js/core-customizer-css-preview.js', __FILE__ ), array( 'customize-selective-refresh' ), JETPACK__VERSION, true );
	}

	public static function customize_preview_init() {
        add_filter( 'wp_get_custom_css', array( __CLASS__, 'customize_preview_wp_get_custom_css' ) );
    }

	public static function map_meta_cap( $caps, $cap ) {
		if ( 'edit_css' === $cap ) {
			$caps = array( 'edit_theme_options' );
		}
		return $caps;
	}

	public static function register_legacy_post_type() {
		// Register safecss as a custom post_type
		// Explicit capability definitions are largely unnecessary because the posts are manipulated in code via an options page, managing CSS revisions does check the capabilities, so let's ensure that the proper caps are checked.
		register_post_type( 'safecss', array(
			'label'        => 'Custom CSS',
			'supports'     => array( 'revisions' ),
			'can_export'   => false,
			'rewrite'      => false,
			'capabilities' => array(
				'edit_post'          => 'edit_theme_options',
				'read_post'          => 'read',
				'delete_post'        => 'edit_theme_options',
				'edit_posts'         => 'edit_theme_options',
				'edit_others_posts'  => 'edit_theme_options',
				'publish_posts'      => 'edit_theme_options',
				'read_private_posts' => 'read',
			),
		) );
	}

	public static function admin_menu() {
		$hook = add_theme_page( __( 'CSS', 'jetpack' ), __( 'Edit CSS', 'jetpack' ), 'edit_theme_options', 'editcss', array( __CLASS__, 'admin_page' ) );
	}

	public static function prettify_post_revisions() {
		add_filter( 'the_title', array( __CLASS__, 'post_title' ), 10, 2 );
	}

	/**
	 * Get the published custom CSS post.
	 *
	 * @param string $stylesheet Optional. A theme object stylesheet name. Defaults to the current theme.
	 *
	 * @return WP_Post|null
	 */
	public static function get_css_post( $stylesheet = '' ) {
		return wp_get_custom_css_post( $stylesheet );
	}

	public static function post_id( $stylesheet = '' ) {
		$post = self::get_css_post( $stylesheet );
		if ( $post instanceof WP_Post ) {
			return $post->ID;
		}
		return 0;
	}

	public static function echo_custom_css_partial() {
		echo wp_get_custom_css();
	}

	public static function admin_page() {
		?>
		<div class="wrap">
			<h1>
				<?php esc_html_e( 'Custom CSS', 'jetpack' );
				if ( current_user_can( 'customize' ) ) {
					printf(
						' <a class="page-title-action hide-if-no-customize" href="%1$s">%2$s</a>',
						esc_url( add_query_arg(
							array(
								array( 'autofocus' => array( 'section' => 'custom_css' ) ),
								'return' => urlencode( wp_unslash( $_SERVER['REQUEST_URI'] ) )
							),
							admin_url( 'customize.php' )
						) ),
						__( 'Manage with Live Preview', 'jetpack' )
					);
				}
				?>
			</h1>
			<p><?php esc_html_e( 'Custom CSS is now managed in the Customizer.', 'jetpack' ); ?></p>
		</div>
		<?php
	}

	public static function customize_controls_enqueue_scripts() {
		wp_enqueue_style( 'jetpack-customizer-css' );
		wp_enqueue_script( 'jetpack-customizer-css' );

		$content_help = __( 'Set a different content width for full size images.', 'jetpack' );
		if ( ! empty( $GLOBALS['content_width'] ) ) {
			$content_help .= sprintf( __( ' The default content width for the <strong>%s</strong> theme is %d pixels.' ), wp_get_theme()->Name, intval( $GLOBALS['content_width'] ) );
		}

		wp_localize_script( 'jetpack-customizer-css', '_jp_css_settings', array(
			/** This filter is documented in modules/custom-css/custom-css.php */
			'useRichEditor' => ! jetpack_is_mobile() && apply_filters( 'safecss_use_ace', true ),
			'areThereCssRevisions' => false, // self::are_there_css_revisions(),
			'revisionsUrl' => admin_url( 'themes.php?page=editcss' ),
			'cssHelpUrl' => '//en.support.wordpress.com/custom-design/editing-css/',
			'l10n' => array(
				'mode'           => __( 'Start Fresh' ),
				'mobile'         => __( 'On Mobile' ),
				'contentWidth'   => $content_help,
				'revisions'      => __( 'CSS Revisions' ),
				'css_help_title' => __( 'CSS Help' )
			)
		));
	}

	public static function wp_enqueue_scripts() {
		if ( is_customize_preview() ) {
			wp_enqueue_script( 'jetpack-customizer-css-preview' );
			wp_localize_script( 'jetpack-customizer-css-preview', 'jpCustomizerCssPreview', array(
				/** This filter is documented in modules/custom-css/custom-css.php */
				'preprocessors' => apply_filters( 'jetpack_custom_css_preprocessors', array() ),
			));
		}
	}

	public static function sanitize_css( $css, $force = false ) {
		if ( $force || ! current_user_can( 'unfiltered_html' ) ) {

			$warnings = array();

			safecss_class();
			$csstidy = new csstidy();
			$csstidy->optimise = new safecss( $csstidy );

			$csstidy->set_cfg( 'remove_bslash',              false );
			$csstidy->set_cfg( 'compress_colors',            false );
			$csstidy->set_cfg( 'compress_font-weight',       false );
			$csstidy->set_cfg( 'optimise_shorthands',        0 );
			$csstidy->set_cfg( 'remove_last_;',              false );
			$csstidy->set_cfg( 'case_properties',            false );
			$csstidy->set_cfg( 'discard_invalid_properties', true );
			$csstidy->set_cfg( 'css_level',                  'CSS3.0' );
			$csstidy->set_cfg( 'preserve_css',               true );
			$csstidy->set_cfg( 'template',                   dirname( __FILE__ ) . '/csstidy/wordpress-standard.tpl' );

			// Test for some preg_replace stuff.
			{
				$prev = $css;
				$css = preg_replace( '/\\\\([0-9a-fA-F]{4})/', '\\\\\\\\$1', $css );
				// prevent content: '\3434' from turning into '\\3434'
				$css = str_replace( array( '\'\\\\', '"\\\\' ), array( '\'\\', '"\\' ), $css );
				if ( $css !== $prev ) {
					$warnings[] = 'preg_replace found stuff';
				}
			}

			// Some people put weird stuff in their CSS, KSES tends to be greedy
			$css = str_replace( '<=', '&lt;=', $css );

			// Test for some kses stuff.
			{
				$prev = $css;
				// Why KSES instead of strip_tags?  Who knows?
				$css = wp_kses_split( $css, array(), array() );
				$css = str_replace( '&gt;', '>', $css ); // kses replaces lone '>' with &gt;
				// Why both KSES and strip_tags?  Because we just added some '>'.
				$css = strip_tags( $css );

				if ( $css != $prev ) {
					$warnings[] = 'kses found stuff';
				}
			}

			// if we're not using a preprocessor
			if ( ! $args['preprocessor'] ) {

				/**
				 * Fires before parsing the css with CSSTidy, but only if
				 * the preprocessor is not configured for use.
				 *
				 * @module custom-css
				 *
				 * @since 1.7.0
				 *
				 * @param obj $csstidy The csstidy object.
				 * @param string $css Custom CSS.
				 * @param array $args Array of custom CSS arguments.
				 */
				do_action( 'safecss_parse_pre', $csstidy, $css, $args );

				$csstidy->parse( $css );

				/**
				 * Fires after parsing the css with CSSTidy, but only if
				 * the preprocessor is not configured for use.
				 *
				 * @module custom-css
				 *
				 * @since 1.7.0
				 *
				 * @param obj $csstidy The csstidy object.
				 * @param array $warnings Array of warnings.
				 * @param array $args Array of custom CSS arguments.
				 */
				do_action( 'safecss_parse_post', $csstidy, $warnings, $args );

				$css = $csstidy->print->plain();
			}
		}
		return $css;
	}

	/**
	 * Override $content_width in customizer previews.
	 */
	public static function preview_content_width() {
		global $wp_customize;
		if ( ! is_customize_preview() ) {
			return;
		}

		$setting = $wp_customize->get_setting( 'jetpack_custom_css[content_width]' );
		if ( ! $setting ) {
			return;
		}

		$customized_content_width = (int) $setting->post_value();
		if ( ! empty( $customized_content_width ) ) {
			$GLOBALS['content_width'] = $customized_content_width;
		}
	}

	static function style_filter( $current ) {
		if ( is_admin() ) {
			return $current;
		} elseif ( self::is_freetrial() && ( ! self::is_preview() || ! current_user_can( 'switch_themes' ) ) ) {
			return $current;
		} elseif ( self::skip_stylesheet() ) {
			/** This filter is documented in modules/custom-css/custom-css.php */
			return apply_filters( 'safecss_style_filter_url', plugins_url( 'custom-css/css/blank.css', __FILE__ ) );
		}

		return $current;
	}

	/**
	 * Determine whether or not we should have the theme skip its main stylesheet.
	 *
	 * @return mixed The truthiness of this value determines whether the stylesheet should be skipped.
	 */
	static function skip_stylesheet() {
		/** This filter is documented in modules/custom-css/custom-css.php */
		$skip_stylesheet = apply_filters( 'safecss_skip_stylesheet', null );
		if ( ! is_null( $skip_stylesheet ) ) {
			return $skip_stylesheet;
		}

		$jetpack_custom_css = get_theme_mod( 'jetpack_custom_css', array() );
		if ( isset( $jetpack_custom_css['replace'] ) ) {
			return $jetpack_custom_css['replace'];
		}

		return false;
	}

	/**
	 * Override $content_width in customizer previews.
	 *
	 * Runs on `safecss_skip_stylesheet` filter.
	 */
	public static function preview_skip_stylesheet( $skip_value ) {
		global $wp_customize;
		if ( ! is_customize_preview() ) {
			return $skip_value;
		}

		$setting = $wp_customize->get_setting( 'jetpack_custom_css[replace]' );
		if ( ! $setting ) {
			return $skip_value;
		}

		$customized_replace = $setting->post_value();
		if ( null !== $customized_replace ) {
			return $customized_replace;
		}

		return $skip_value;
	}

	/**
	 * Add Custom CSS section and controls.
	 */
	public static function customize_register( $wp_customize ) {

		// SETTINGS

		$wp_customize->add_setting( 'jetpack_custom_css[preprocessor]', array(
			'default' => '',
			'transport' => 'postMessage',
			'sanitize_callback' => array( __CLASS__, 'sanitize_preprocessor' ),
		) );

		$wp_customize->add_setting( 'jetpack_custom_css[replace]', array(
			'default' => false,
			'transport' => 'refresh',
		) );

		$wp_customize->add_setting( 'jetpack_custom_css[content_width]', array(
			'default' => '',
			'transport' => 'refresh',
			'sanitize_callback' => array( $wp_customize, 'intval_base10' ),
		) );

		// Add custom sanitization to the core css customizer setting.
		foreach ( $wp_customize->settings() as $setting ) {
			if ( $setting instanceof WP_Customize_Custom_CSS_Setting ) {
				add_filter( "customize_sanitize_{$setting->id}", array( __CLASS__, 'sanitize_css' ) );
			}
		}

		// CONTROLS

		// Overwrite the Core Control.
		$core_custom_css = $wp_customize->get_control( 'custom_css' );
		if ( $core_custom_css ) {
			$wp_customize->remove_control( 'custom_css' );
			$core_custom_css->type = 'jetpackCss';
			$wp_customize->add_control( $core_custom_css );
		}

		$wp_customize->selective_refresh->add_partial( 'custom_css', array(
			'type'                => 'custom_css',
			'selector'            => '#wp-custom-css',
			'container_inclusive' => false,
			'fallback_refresh'    => false,
			'settings'            => array(
				'custom_css[' . $wp_customize->get_stylesheet() . ']',
				'jetpack_custom_css[preprocessor]',
			),
			'render_callback' => array( __CLASS__, 'echo_custom_css_partial' ),
		) );

		$wp_customize->add_control( 'wpcom_custom_css_content_width_control', array(
			'type'     => 'text',
			'label'    => __( 'Media Width', 'jetpack' ),
			'section'  => 'custom_css',
			'settings' => 'jetpack_custom_css[content_width]',
		) );

		$wp_customize->add_control( 'jetpack_css_mode_control', array(
			'type'     => 'checkbox',
			'label'    => __( 'Don\'t use the theme\'s original CSS.', 'jetpack' ),
			'section'  => 'custom_css',
			'settings' => 'jetpack_custom_css[replace]',
		) );

		do_action( 'jetpack_custom_css_customizer_controls', $wp_customize );

		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		if ( ! empty( $preprocessors ) ) {
			$preprocessor_choices = array(
				'' => __( 'None', 'jetpack' ),
			);

			foreach ( $preprocessors as $preprocessor_key => $processor ) {
				$preprocessor_choices[$preprocessor_key] = $processor['name'];
			}

			$wp_customize->add_control( 'jetpack_css_preprocessors_control', array(
				'type'     => 'select',
				'choices'  => $preprocessor_choices,
				'label'    => __( 'Preprocessor', 'jetpack' ),
				'section'  => 'custom_css',
				'settings' => 'jetpack_custom_css[preprocessor]',
			) );
		}

	}

	public static function is_freetrial() {
		return false;
	}
	public static function is_preview() {
		return false;
	}
	public static function is_customizer_preview() {
		return false;
	}

	public static function customize_preview_wp_get_custom_css( $css ) {
		global $wp_customize;

		$preprocessor = $wp_customize->get_setting('jetpack_custom_css[preprocessor]')->value();

		// If it's empty, just return.
		if ( empty( $preprocessor ) ) {
			return $css;
		}

		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		if ( isset( $preprocessors[ $preprocessor ] ) ) {
			return call_user_func( $preprocessors[ $preprocessor ]['callback'], $css );
		}

		return $css;
	}

	public static function customize_value_custom_css( $css, $setting ) {
		// Find the current preprocessor
		$jetpack_custom_css = get_theme_mod( 'jetpack_custom_css', array() );
		if ( isset( $jetpack_custom_css['preprocessor'] ) ) {
			$preprocessor = $jetpack_custom_css['preprocessor'];
		}

		// If it's not supported, just return.
		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		if ( ! isset( $preprocessors[ $preprocessor ] ) ) {
			return $css;
		}

		// Swap it for the `post_content_filtered` instead.
		$post = wp_get_custom_css_post( $setting->stylesheet );
		if ( $post && ! empty( $post->post_content_filtered ) ) {
			$css = $post->post_content_filtered;
		}

		return $css;
	}

	public static function customize_update_custom_css_post_content_args( $args, $css, $setting ) {
		// Find the current preprocessor
		$jetpack_custom_css = get_theme_mod( 'jetpack_custom_css', array() );
		if ( empty( $jetpack_custom_css['preprocessor'] ) ) {
			return $args;
		}

		$preprocessor = $jetpack_custom_css['preprocessor'];
		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );

		// If it's empty, just return.
		if ( empty( $preprocessor ) ) {
			return $args;
		}

		if ( isset( $preprocessors[ $preprocessor ] ) ) {
			$args['post_content_filtered'] = $css;
			$args['post_content'] = call_user_func( $preprocessors[ $preprocessor ]['callback'], $css );
		}

		return $args;
	}

	/**
	 * When on the edit screen, make sure the custom content width
	 * setting is applied to the large image size.
	 */
	static function editor_max_image_size( $dims, $size = 'medium', $context = null ) {
		list( $width, $height ) = $dims;

		if ( 'large' === $size && 'edit' === $context ) {
			$width = Jetpack::get_content_width();
		}

		return array( $width, $height );
	}

	/**
	 * Override the content_width with a custom value if one is set.
	 */
	static function jetpack_content_width( $content_width ) {
		$custom_content_width = 0;

		$jetpack_custom_css = get_theme_mod( 'jetpack_custom_css', array() );
		if ( isset( $jetpack_custom_css['content_width'] ) ) {
			$custom_content_width = $jetpack_custom_css['content_width'];
		}

		if ( $custom_content_width > 0 ) {
			return $custom_content_width;
		}

		return $content_width;
	}

	/**
	 * Currently this filter function gets called on
	 * 'template_redirect' action and
	 * 'admin_init' action
	 */
	static function set_content_width(){
		// Don't apply this filter on the Edit CSS page
		if ( isset( $_GET['page'] ) && 'editcss' === $_GET['page'] && is_admin() ) {
			return;
		}

		$GLOBALS['content_width'] = Jetpack::get_content_width();
	}

	/**
	 * Make sure the preprocessor we're saving is one we know about.
	 *
	 * @param $preprocessor The preprocessor to sanitize.
	 * @return null|string
	 */
	public static function sanitize_preprocessor( $preprocessor ) {
		/** This filter is documented in modules/custom-css/custom-css.php */
		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );
		if ( array_key_exists( $preprocessor, $preprocessors ) ) {
			return $preprocessor;
		}
		return null;
	}
}

Jetpack_Custom_CSS_Enhancements::add_hooks();

function safecss_class() {
	// Wrapped so we don't need the parent class just to load the plugin
	if ( class_exists('safecss') ) {
		return;
	}

	require_once( dirname( __FILE__ ) . '/csstidy/class.csstidy.php' );

	class safecss extends csstidy_optimise {

		function postparse() {

			/**
			 * Fires after parsing the css.
			 *
			 * @module custom-css
			 *
			 * @since 1.8.0
			 *
			 * @param obj $this CSSTidy object.
			 */
			do_action( 'csstidy_optimize_postparse', $this );

			return parent::postparse();
		}

		function subvalue() {

			/**
			 * Fires before optimizing the Custom CSS subvalue.
			 *
			 * @module custom-css
			 *
			 * @since 1.8.0
			 *
			 * @param obj $this CSSTidy object.
			 **/
			do_action( 'csstidy_optimize_subvalue', $this );

			return parent::subvalue();
		}
	}
}