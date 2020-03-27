<?php
/**
 * Jetpack Search Overlay Customization
 *
 * @package jetpack
 */

// Exit if file is accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once dirname( __FILE__ ) . '/class-jetpack-search-options.php';

/**
 * Class to customize search on the site.
 *
 * @since 8.3.0
 */
class Jetpack_Search_Customize {

	/**
	 * Class initialization.
	 *
	 * @since 8.3.0
	 */
	public function __construct() {
		add_action( 'customize_register', array( $this, 'customize_register' ) );
	}

	/**
	 * Initialize Customizer controls.
	 *
	 * @since 8.3.0
	 *
	 * @param WP_Customize_Manager $wp_customize Customizer instance.
	 */
	public function customize_register( $wp_customize ) {
		$section_id     = 'jetpack_search';
		$setting_prefix = Jetpack_Search_Options::OPTION_PREFIX;

		$wp_customize->add_section(
			$section_id,
			array(
				'title'       => esc_html__( 'Jetpack Search', 'jetpack' ),
				'description' => __( 'Use these settings to customize the search overlay.', 'jetpack' ),
				'capability'  => 'edit_theme_options',
				'priority'    => 200,
			)
		);

		$id = $setting_prefix . 'color_theme';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => 'light',
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'       => __( 'Theme', 'jetpack' ),
				'description' => __( 'A light or dark theme for your search overlay.', 'jetpack' ),
				'section'     => $section_id,
				'type'        => 'radio',
				'choices'     => array(
					'light' => __( 'Light', 'jetpack' ),
					'dark'  => __( 'Dark', 'jetpack' ),
				),
			)
		);

		$id = $setting_prefix . 'opacity';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => 97,
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'type'        => 'range',
				'section'     => $section_id,
				'label'       => __( 'Background Opacity', 'jetpack' ),
				'description' => __( 'Select an opacity for the search overlay.', 'jetpack' ),
				'input_attrs' => array(
					'min'  => 85,
					'max'  => 100,
					'step' => 0.5,
				),
			)
		);

		$id = $setting_prefix . 'highlight_color';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => '#FFC',
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				$id,
				array(
					'label'       => __( 'Highlight Search Terms', 'jetpack' ),
					'description' => __( 'Choose a color to highlight matching search terms.', 'jetpack' ),
					'section'     => $section_id,
				)
			)
		);

		$id = $setting_prefix . 'inf_scroll';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => true,
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'type'    => 'checkbox',
				'section' => $section_id,
				'label'   => __( 'Infinite Scroll Results', 'jetpack' ),
			)
		);

		$id = $setting_prefix . 'show_powered_by';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => true,
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'type'    => 'checkbox',
				'section' => $section_id,
				'label'   => __( 'Display "Powered by Jetpack"', 'jetpack' ),
			)
		);

	}

}

