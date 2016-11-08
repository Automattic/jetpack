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
	 * @return array
	 */
	static function get_post() {
		$custom_css_post_id = get_theme_mod( 'custom_css_post_id' );

		if ( $custom_css_post_id ) {
			return get_post( $custom_css_post_id, ARRAY_A );
		}

		return array();
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

	/**
	 * Add Custom CSS section and controls.
	 */
	public static function customize_register( $wp_customize ) {

		$wp_customize->add_setting( 'jetpack_custom_css[preprocessor]', array(
			'default' => '',
			'transport' => 'postMessage',
		) );

		$wp_customize->add_setting( 'jetpack_custom_css[replace]', array(
			'default' => false,
			'transport' => 'refresh',
		) );

		$wp_customize->add_setting( 'jetpack_custom_css[content_width]', array(
			'default' => '',
			'transport' => 'refresh',
		) );


		$wp_customize->add_control( 'wpcom_custom_css_content_width_control', array(
			'type'     => 'text',
			'label'    => __( 'Media Width', 'jetpack' ),
			'section'  => 'custom_css',
			'settings' => 'jetpack_custom_css[content_width]',
			'priority' => 1,
		) );


		$wp_customize->add_control( 'jetpack_css_mode_control', array(
			'type'     => 'checkbox',
			'label'    => __( 'Don\'t use the theme\'s original CSS.', 'jetpack' ),
			'section'  => 'custom_css',
			'settings' => 'jetpack_custom_css[replace]',
			'priority' => 2,
		) );

		do_action( 'jetpack_custom_css_customizer_controls', $wp_customize );

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
				'priority' => 3,
			) );
		}

		// Overwrite the Core Control.
		$core_custom_css = $wp_customize->get_control( 'custom_css' );
		if ( $core_custom_css ) {
			$wp_customize->remove_control( 'custom_css' );
			$core_custom_css->type = 'jetpackCss';
			$wp_customize->add_control( $core_custom_css );
		}

	}

}

Jetpack_Custom_CSS_Enhancements::add_hooks();
