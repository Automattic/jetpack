<?php

class Jetpack_Custom_CSS_Customizer {
	static $theme_mod_update_counter = 0;
	static $update_theme_mods = array();
	static $setting_order = array();

	public static function init() {
	//	if ( ! CustomDesign::is_active_or_preview() ) {
	//		return;
	//	}

		if ( ! apply_filters( 'enable_custom_customizer', true ) ) {
			return;
		}

		add_filter( 'theme_mod_jetpack_custom_css', array( __CLASS__, 'theme_mod_override_jetpack_custom_css' ), 100 );
		add_filter( 'pre_update_option_theme_mods_' . get_stylesheet(), array( __CLASS__, 'set_theme_mod_override' ), 10, 2 );

		add_action( 'customize_register', array( __CLASS__, 'customize_register' ) );
		add_action( 'customize_preview_init', array( __CLASS__, 'customizer_preview_init' ) );

		add_action( 'wp_ajax_jetpack_custom_css_preprocess', array( __CLASS__, 'ajax_preprocess' ) );

		add_action( 'customize_controls_enqueue_scripts', array( __CLASS__, 'customize_controls_enqueue_scripts' ) );

		add_filter( 'safecss_skip_stylesheet', array( __CLASS__, 'preview_skip_stylesheet' ) );

		self::preview_content_width();
	}

	/**
	 * Add Custom CSS section and controls.
	 */
	public static function customize_register( $wp_customize ) {
		jetpack_custom_css_control_class();

		$wp_customize->add_setting( new Jetpack_Custom_Css_Setting( $wp_customize, 'jetpack_custom_css[css]', array(
			'default' => '',
			'transport' => 'postMessage',
		) ) );

		self::$setting_order[] = 'css';

		$wp_customize->add_setting( 'jetpack_custom_css[preprocessor]', array(
			'default' => '',
			'transport' => 'postMessage',
		) );

		self::$setting_order[] = 'preprocessor';

		$wp_customize->add_setting( 'jetpack_custom_css[replace]', array(
			'default' => false,
			'transport' => 'refresh',
		) );

		self::$setting_order[] = 'replace';

		$wp_customize->add_setting( 'jetpack_custom_css[content_width]', array(
			'default' => '',
			'transport' => 'refresh',
		) );

		self::$setting_order[] = 'content_width';

		$section = new WP_Customize_Section( $wp_customize, 'jetpack_custom_css', array(
			'title' => __( 'CSS', 'jetpack' ),
			'priority' => 100,
		) );

		$section->category = 'cat-design';

		$wp_customize->add_section( $section );

		$wp_customize->add_control( new Jetpack_Custom_CSS_Control( $wp_customize, 'jetpack_custom_css_control', array(
			'label' => __( 'Custom CSS', 'jetpack' ),
			'section' => 'jetpack_custom_css',
			'settings' => 'jetpack_custom_css[css]',
		) ) );

		$wp_customize->add_control( 'wpcom_custom_css_content_width_control', array(
			'type' => 'text',
			'label' => __( 'Media Width', 'jetpack' ),
			'section' => 'jetpack_custom_css',
			'settings' => 'jetpack_custom_css[content_width]',
		) );


		$wp_customize->add_control( 'jetpack_css_mode_control', array(
			'type' => 'checkbox',
			'label' => __( 'Don\'t use the theme\'s original CSS.', 'jetpack' ),
			'section' => 'jetpack_custom_css',
			'settings' => 'jetpack_custom_css[replace]',
		) );

		do_action( 'jetpack_custom_css_customizer_controls', $wp_customize );

		$preprocessors = apply_filters( 'jetpack_custom_css_preprocessors', array() );

		if ( ! empty( $preprocessors ) ) {
			$preprocessor_choices = array(
				'' => __( 'None', 'jetpack' ),
			);

			foreach ( $preprocessors as $preprocessor_key => $processor )
				$preprocessor_choices[$preprocessor_key] = $processor['name'];

			$wp_customize->add_control( 'jetpack_css_preprocessors_control', array(
				'type' => 'select',
				'choices' => $preprocessor_choices,
				'label' => __( 'Preprocessor', 'jetpack' ),
				'section' => 'jetpack_custom_css',
				'settings' => 'jetpack_custom_css[preprocessor]',
			) );
		}
	}

	/**
	 * JS needed for the admin portion of the Customizer.
	 */
	public static function customize_controls_enqueue_scripts() {
		wp_register_style( 'jetpack-css-codemirror', plugins_url( 'custom-css/css/codemirror.css', __FILE__ ), array(), '20120905' );
		wp_enqueue_style( 'jetpack-css-customizer-control', plugins_url( 'custom-css/css/customizer-control.css', __FILE__ ), array( 'jetpack-css-codemirror' ), '20140728' );

		wp_register_script( 'jetpack-css-codemirror', plugins_url( 'custom-css/js/codemirror.min.js', __FILE__ ), array(), '3.16', true );
		wp_enqueue_script( 'jetpack-css-customizer-control', plugins_url( 'custom-css/js/customizer-control.js', __FILE__ ), array( 'customize-controls', 'underscore', 'jetpack-css-codemirror' ), '20140728', true );

		$content_help = __( 'Set a different content width for full size images.', 'jetpack' );
		if ( ! empty( $GLOBALS['content_width'] ) ) {
			$current_theme = ( function_exists( 'wp_get_theme' ) ) ? wp_get_theme()->Name : get_current_theme();
			$content_help .= sprintf( __( ' The default content width for the <strong>%s</strong> theme is %d pixels.' ), $current_theme, intval( $GLOBALS['content_width'] ) );
		}

		wp_localize_script( 'jetpack-css-customizer-control', '_jp_css_settings', array(
			'useRichEditor' => ! jetpack_is_mobile() /*&& ! Jetpack_User_Agent_Info::is_ipad() */ && apply_filters( 'safecss_use_ace', true ),
			'areThereCssRevisions' => self::are_there_css_revisions(),
			'revisionsUrl' => admin_url( 'themes.php?page=editcss' ),
			'cssHelpUrl' => '//en.support.wordpress.com/custom-design/editing-css/',
			'l10n' => array(
				'mode' => __( 'Start Fresh' ),
				'mobile' => __( 'On Mobile' ),
				'contentWidth' => $content_help,
				'revisions' => __( 'CSS Revisions' ),
				'css_help_title' => __( 'CSS Help' )
			)
		));
	}

	public static function are_there_css_revisions() {
		$safecss_post = Jetpack_Custom_CSS::get_post();
		return ( ! empty( $safecss_post ) && 0 < $safecss_post['ID'] && wp_get_post_revisions( $safecss_post['ID'] ) );
	}

	/**
	 * JS needed for the preview portion of the Customizer.
	 */
	public static function customizer_preview_init() {
		wp_enqueue_script( 'jetpack-custom-css-customizer', plugins_url( 'custom-css/js/customize-frontend.js', __FILE__ ), array( 'customize-preview', 'underscore' ), '', true );
	}

	/**
	 * API for processing Sass/LESS.
	 */
	public static function ajax_preprocess() {
		echo Jetpack_Custom_CSS::minify( stripslashes( $_POST['css'] ), $_POST['preprocessor'] );
		die;
	}

	/**
	 * Override $content_width in customizer previews.
	 */
	public static function preview_content_width() {
		if ( isset( $GLOBALS['wp_customize'] ) ) {
			if ( isset( $_POST['customized'] ) && isset( $_POST['customize_messenger_channel'] ) ) {
				$customizations = json_decode( stripslashes( $_POST['customized'] ) );

				if ( isset( $customizations->{'jetpack_custom_css[content_width]'} ) ) {
					$width = (int) $customizations->{'jetpack_custom_css[content_width]'};

					if ( $width ) {
						$GLOBALS['content_width'] = $width;
					}
				}
			}
		}
	}

	/**
	 * Override $content_width in customizer previews.
	 */
	public static function preview_skip_stylesheet( $skip_value ) {
		if ( isset( $GLOBALS['wp_customize'] ) ) {
			if ( isset( $_POST['customized'] ) && isset( $_POST['customize_messenger_channel'] ) ) {
				$customizations = json_decode( stripslashes( $_POST['customized'] ) );

				if ( isset( $customizations->{'jetpack_custom_css[replace]'} ) ) {
					return $customizations->{'jetpack_custom_css[replace]'};
				}
			}
		}

		return $skip_value;
	}

	/**
	 * Because the Customizer only uses theme_mods or options to store
	 * settings, we have to do some fancy footwork to still use the custom css
	 * post to store all of the settings.
	 *
	 * This method overrides all calls to get_theme_mod for the jetpack_custom_css array.
	 */
	public static function theme_mod_override_jetpack_custom_css( $value ) {
		$custom_css_post_ID = Jetpack_Custom_CSS::post_id();

		$custom_content_width = get_post_meta( $custom_css_post_ID, 'content_width', true );

		// If custom content width hasn't been overridden and the theme has a content_width value, use that as a default.
		if ( $custom_content_width <= 0 && ! empty( $GLOBALS['content_width'] ) )
			$custom_content_width = $GLOBALS['content_width'];

		if ( ! $custom_content_width || ( isset( $GLOBALS['content_width'] ) && $custom_content_width == $GLOBALS['content_width'] ) )
			$custom_content_width = '';

		return array(
			'css' => Jetpack_Custom_CSS::get_css(),
			'replace' => ( get_post_meta( $custom_css_post_ID, 'custom_css_add', true ) == 'no' ),
			'preprocessor' => get_post_meta( $custom_css_post_ID, 'custom_css_preprocessor', true ),
			'content_width' => $custom_content_width,
		);
	}

	/**
	 * Like the above override for get_theme_mod, this method intercepts all calls to
	 * save the settings in theme_mods.
	 */
	public static function set_theme_mod_override( $newvalue, $oldvalue ) {
		static $initial_css_settings = null;

		if ( isset( $newvalue['jetpack_custom_css'] ) ) {

			if ( is_null( $initial_css_settings ) ) {
				add_action( 'customize_save_after', array( __CLASS__, 'complete_theme_mod_override' ), 1, 1 );
				$initial_css_settings = self::theme_mod_override_jetpack_custom_css( true ); // Argument is required but meaningless.
				self::$update_theme_mods = $initial_css_settings;
			}

			// Because the Customizer makes separate calls to set_theme_mod
			// for each key in the jetpack_custom_css array, and in each call,
			// only one of the values has changed, we have to track which
			// key is currently populated with the new value.

			foreach ( $initial_css_settings as $key => $initial_value ) {
				if ( $newvalue['jetpack_custom_css'][$key] != $initial_value ) {
					self::$update_theme_mods[$key] = $newvalue['jetpack_custom_css'][$key];
					break;
				}
			}

			unset( $newvalue['jetpack_custom_css'] );
		}

		return $newvalue;
	}

	/**
	 * After all of the CSS options have been intercepted, save the result.
	 */
	public static function complete_theme_mod_override( $customizer ) {
		if ( ! empty( self::$update_theme_mods ) ) {
			// All values have been set; save them for good.
			Jetpack_Custom_CSS::save( array(
				'css' => self::$update_theme_mods['css'],
				'preprocessor' => self::$update_theme_mods['preprocessor'],
				'add_to_existing' => ! self::$update_theme_mods['replace'],
				'content_width' => self::$update_theme_mods['content_width'],
			) );
		}
	}
}

function jetpack_custom_css_control_class() {
	if ( class_exists( 'Jetpack_Custom_CSS_Control' ) )
		return;

	class Jetpack_Custom_CSS_Control extends WP_Customize_Control {
		public $type = 'jetpackCss';

		public function __construct( $manager, $id, $args = array() ) {
			parent::__construct( $manager, $id, $args );
		}

		public function render_content() {
			// silence is golden. do it in JS.
		}
	}

	class Jetpack_Custom_Css_Setting extends WP_Customize_Setting {
		/**
		 * Override this method to prevent egregious stripslashes that are actually harmful
		 * to saving CSS.
		 * @param  string $value
		 * @return string
		 */
		public function sanitize( $value ) {
			return $value;
		}
	}
}



add_action( 'init', array( 'Jetpack_Custom_CSS_Customizer', 'init' ) );
