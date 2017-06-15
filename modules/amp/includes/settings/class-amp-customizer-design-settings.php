<?php

class AMP_Customizer_Design_Settings {
	const DEFAULT_HEADER_COLOR = '#fff';
	const DEFAULT_HEADER_BACKGROUND_COLOR = '#0a89c0';
	const DEFAULT_COLOR_SCHEME = 'light';

	public static function init() {
		add_action( 'amp_customizer_init', array( __CLASS__, 'init_customizer' ) );

		add_filter( 'amp_customizer_get_settings', array( __CLASS__, 'append_settings' ) );
	}

	public static function init_customizer() {
		add_action( 'amp_customizer_register_settings', array( __CLASS__, 'register_customizer_settings' ) );
		add_action( 'amp_customizer_register_ui', array( __CLASS__, 'register_customizer_ui' ) );
		add_action( 'amp_customizer_enqueue_preview_scripts', array( __CLASS__, 'enqueue_customizer_preview_scripts' ) );
	}

	public static function register_customizer_settings( $wp_customize ) {
		// Header text color setting
		$wp_customize->add_setting( 'amp_customizer[header_color]', array(
			'type'              => 'option',
			'default'           => self::DEFAULT_HEADER_COLOR,
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'postMessage'
		) );

		// Header background color
		$wp_customize->add_setting( 'amp_customizer[header_background_color]', array(
			'type'              => 'option',
			'default'           => self::DEFAULT_HEADER_BACKGROUND_COLOR,
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'postMessage'
		) );

		// Background color scheme
		$wp_customize->add_setting( 'amp_customizer[color_scheme]', array(
			'type'              => 'option',
			'default'           => self::DEFAULT_COLOR_SCHEME,
			'sanitize_callback' => array( __CLASS__ , 'sanitize_color_scheme' ),
			'transport'         => 'postMessage'
		) );
	}

	public static function register_customizer_ui( $wp_customize ) {
		$wp_customize->add_section( 'amp_design', array(
			'title' => __( 'Design', 'amp' ),
			'panel' => AMP_Template_Customizer::PANEL_ID,
		) );

		// Header text color control.
		$wp_customize->add_control(
			new WP_Customize_Color_Control( $wp_customize, 'amp_header_color', array(
				'settings'   => 'amp_customizer[header_color]',
				'label'    => __( 'Header Text Color', 'amp' ),
				'section'  => 'amp_design',
				'priority' => 10
			) )
		);

		// Header background color control.
		$wp_customize->add_control(
			new WP_Customize_Color_Control( $wp_customize, 'amp_header_background_color', array(
				'settings'   => 'amp_customizer[header_background_color]',
				'label'    => __( 'Header Background & Link Color', 'amp' ),
				'section'  => 'amp_design',
				'priority' => 20
			) )
		);

		// Background color scheme
		$wp_customize->add_control( 'amp_color_scheme', array(
			'settings'   => 'amp_customizer[color_scheme]',
			'label'      => __( 'Color Scheme', 'amp' ),
			'section'    => 'amp_design',
			'type'       => 'radio',
			'priority'   => 30,
			'choices'    => self::get_color_scheme_names(),
		));
	}

	public static function enqueue_customizer_preview_scripts() {
		wp_enqueue_script(
			'amp-customizer-design-preview',
			amp_get_asset_url( 'js/amp-customizer-design-preview.js' ),
			array( 'amp-customizer' ),
			false,
			true
		);
		wp_localize_script( 'amp-customizer-design-preview', 'amp_customizer_design', array(
			'color_schemes' => self::get_color_schemes(),
		) );
	}

	public static function append_settings( $settings ) {
		$settings = wp_parse_args( $settings, array(
			'header_color' => self::DEFAULT_HEADER_COLOR,
			'header_background_color' => self::DEFAULT_HEADER_BACKGROUND_COLOR,
			'color_scheme' => self::DEFAULT_COLOR_SCHEME,
		) );

		$theme_colors = self::get_colors_for_color_scheme( $settings['color_scheme'] );

		return array_merge( $settings, $theme_colors, array(
			'link_color' => $settings['header_background_color'],
		) );
	}

	protected static function get_color_scheme_names() {
		return array(
			'light'   => __( 'Light', 'amp'),
			'dark'    => __( 'Dark', 'amp' ),
		);
	}

	protected static function get_color_schemes() {
		return array(
			'light' => array(
				// Convert colors to greyscale for light theme color; see http://goo.gl/2gDLsp
				'theme_color'      => '#fff',
				'text_color'       => '#353535',
				'muted_text_color' => '#696969',
				'border_color'     => '#c2c2c2',
			),
			'dark' => array(
				// Convert and invert colors to greyscale for dark theme color; see http://goo.gl/uVB2cO
				'theme_color'      => '#0a0a0a',
				'text_color'       => '#dedede',
				'muted_text_color' => '#b1b1b1',
				'border_color'     => '#707070',
			)
		);
	}

	protected static function get_colors_for_color_scheme( $scheme ) {
		$color_schemes = self::get_color_schemes();

		if ( isset( $color_schemes[ $scheme ] ) ) {
			return $color_schemes[ $scheme ];
		}

		return $color_schemes[ self::DEFAULT_COLOR_SCHEME ];
	}

	public static function sanitize_color_scheme( $value ) {
		$schemes = self::get_color_scheme_names();
		$scheme_slugs = array_keys( $schemes );

		if ( ! in_array( $value, $scheme_slugs ) ) {
			$value = self::DEFAULT_COLOR_SCHEME;
		}

		return $value;
	}
}
