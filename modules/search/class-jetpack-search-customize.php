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
require_once dirname( __FILE__ ) . '/customize-controls/class-label-control.php';
require_once dirname( __FILE__ ) . '/customize-controls/class-excluded-post-types-control.php';

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
				'title'      => esc_html__( 'Jetpack Search', 'jetpack' ),
				'capability' => 'edit_theme_options',
				'priority'   => 200,
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
				'description' => __( 'Select a theme for your search overlay.', 'jetpack' ),
				'section'     => $section_id,
				'type'        => 'radio',
				'choices'     => array(
					'light' => __( 'Light', 'jetpack' ),
					'dark'  => __( 'Dark', 'jetpack' ),
				),
			)
		);

		$id = $setting_prefix . 'default_sort';
		$wp_customize->add_setting(
			$id,
			array(
				'default' => 'relevance',
				'type'    => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'choices'     => array(
					'relevance' => __( 'Relevance (recommended)', 'jetpack' ),
					'newest'    => __( 'Newest first', 'jetpack' ),
					'oldest'    => __( 'Oldest first', 'jetpack' ),
				),
				'description' => __( 'Pick the initial sort for your search results.', 'jetpack' ),
				'label'       => __( 'Default Sort', 'jetpack' ),
				'section'     => $section_id,
				'type'        => 'select',
			)
		);

		$id = $setting_prefix . 'overlay_trigger';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => 'results',
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'       => __( 'Search Overlay Trigger', 'jetpack' ),
				'description' => __( 'Select when your overlay should appear.', 'jetpack' ),
				'section'     => $section_id,
				'type'        => 'select',
				'choices'     => array(
					'immediate' => __( 'Open immediately', 'jetpack' ),
					'results'   => __( 'Open when results are available', 'jetpack' ),
				),
			)
		);

		$id = $setting_prefix . 'excluded_post_types';
		$wp_customize->add_setting(
			$id,
			array(
				'default' => '',
				'type'    => 'option',
			)
		);
		$wp_customize->add_control(
			new Excluded_Post_Types_Control(
				$wp_customize,
				$id,
				array(
					'description' => __( 'Choose post types to exclude from search results.', 'jetpack' ),
					'label'       => __( 'Excluded Post Types', 'jetpack' ),
					'section'     => $section_id,
				)
			)
		);

		$id = $setting_prefix . 'result_format';
		$wp_customize->add_setting(
			$id,
			array(
				'default'   => 'minimal',
				'transport' => 'postMessage',
				'type'      => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'       => __( 'Result Format', 'jetpack' ),
				'description' => __( 'Choose how the search results look.', 'jetpack' ),
				'section'     => $section_id,
				'type'        => 'select',
				'choices'     => array(
					'minimal'  => __( 'Minimal', 'jetpack' ),
					'expanded' => __( 'Expanded', 'jetpack' ),
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
				'description' => __( 'Select an opacity for your search overlay.', 'jetpack' ),
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

		$id = $setting_prefix . 'additional_settings_placeholder';
		$wp_customize->add_setting(
			$id,
			array( 'type' => 'option' )
		);
		$wp_customize->add_control(
			new Label_Control(
				$wp_customize,
				$id,
				array(
					'label'   => __( 'Additional Jetpack Search Settings', 'jetpack' ),
					'section' => $section_id,
				)
			)
		);

		$id = $setting_prefix . 'enable_sort';
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '1',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'transport'         => 'postMessage',
				'type'              => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'   => __( 'Show sort selector', 'jetpack' ),
				'section' => $section_id,
				'type'    => 'checkbox',
			)
		);

		$id = $setting_prefix . 'inf_scroll';
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '1',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'transport'         => 'postMessage',
				'type'              => 'option',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'type'    => 'checkbox',
				'section' => $section_id,
				'label'   => __( 'Enable infinite scrolling', 'jetpack' ),
			)
		);

		$id = $setting_prefix . 'show_powered_by';
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '1',
				'sanitize_callback' => 'rest_sanitize_boolean',
				'transport'         => 'postMessage',
				'type'              => 'option',
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

