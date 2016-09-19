<?php

// Exit if file is accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class to include elements to modify Related Posts look in Customizer.
 *
 * @since 4.2.0
 */

class Jetpack_Related_Posts_Customize {

	/**
	 * Key for panel, section and prefix for options. Same option name than in Options > Reading.
	 *
	 * @var string
	 */
	var $prefix = 'jetpack_relatedposts';

	/**
	 * @var string Control to focus when customizer loads.
	 */
	var $focus = '';

	/**
	 * Class initialization.
	 *
	 * @since 4.2.0
	 */
	function __construct() {
		add_action( 'customize_register', array( $this, 'customize_register' ) );
	}

	/**
	 * Initialize Customizer controls.
	 *
	 * @since 4.2.0
	 *
	 * @param WP_Customize_Manager $wp_customize Customizer instance.
	 */
	function customize_register( $wp_customize ) {

		$wp_customize->add_section( $this->prefix,
			array(
				'title' 	  => esc_html__( 'Related Posts', 'jetpack' ),
				'description' => esc_html__( 'Customize related post elements.', 'jetpack' ),
				'capability'  => 'edit_theme_options',
				'priority' 	  => 89,

			)
		);

		$selective_options = array();

		foreach ( $this->get_options( $wp_customize ) as $key => $field ) {
			$selective_options[] = "$this->prefix[$key]";
			$wp_customize->add_setting( "$this->prefix[$key]",
				array(
					'default' 	 => isset( $field['default'] ) ? $field['default'] : '',
					'type' 		 => isset( $field['setting_type'] ) ? $field['setting_type'] : 'option',
					'capability' => isset( $field['capability'] ) ? $field['capability'] : 'edit_theme_options',
					'transport'  => isset( $field['transport'] ) ? $field['transport'] : 'postMessage',
				)
			);
			$control_settings = array(
				'label' 	  => isset( $field['label'] ) ? $field['label'] : '',
				'description' => isset( $field['description'] ) ? $field['description'] : '',
				'settings' 	  => "$this->prefix[$key]",
				'type' 	      => isset( $field['control_type'] ) ? $field['control_type'] : 'text',
				'section' 	  => $this->prefix,
				'priority' 	  => 10,
				'active_callback' => __CLASS__ . '::is_single',
			);
			switch ( $field['control_type'] ) {
				case 'text':
				case 'checkbox':
				default:
					$wp_customize->add_control( new WP_Customize_Control( $wp_customize, $key, $control_settings ) );
					break;
				case 'select':
					if ( isset( $field['choices'] ) ) {
						$control_settings['choices'] = $field['choices'];
						$wp_customize->add_control( new WP_Customize_Control( $wp_customize, $key, $control_settings ) );
					}
					break;
				case 'message':
					$control_settings['active_callback'] = __CLASS__ . '::is_not_single';
					$wp_customize->add_control( new Jetpack_Message_Control( $wp_customize, $key, $control_settings ) );
					break;
			}
		}

		// If selective refresh is available, implement it.
		if ( isset( $wp_customize->selective_refresh ) ) {
			$wp_customize->selective_refresh->add_partial( "$this->prefix", array(
				'selector'            => '.jp-relatedposts',
				'settings'            => $selective_options,
				'render_callback'     => __CLASS__ . '::render_callback',
				'container_inclusive' => false,
			) );
		}

	}

	/**
	 * Callback that outputs the headline based on user choice.
	 *
	 * @since 4.2.0
	 */
	public static function render_callback() {
		echo Jetpack_RelatedPosts::init()->get_headline();
	}

	/**
	 * Check that we're in a single post view.
	 *
	 * @since 4.2.0
	 *
	 * @return bool
	 */
	public static function is_single() {
		return is_single();
	}

	/**
	 * Check that we're not in a single post view.
	 *
	 * @since 4.2.0
	 *
	 * @return bool
	 */
	public static function is_not_single() {
		return ! is_single();
	}

	/**
	 * Return list of options to modify.
	 *
	 * @since 4.2.0
	 */
	function get_options( $wp_customize ) {
		$transport = isset( $wp_customize->selective_refresh ) ? 'postMessage' : 'refresh';
		return apply_filters(
			'jetpack_related_posts_customize_options', array(
			'show_headline'   => array(
				'label'        => esc_html__( 'Show a "Related" header', 'jetpack' ),
				'description'  => esc_html__( 'This helps to clearly separate the related posts from post content.', 'jetpack' ),
				'control_type' => 'checkbox',
				'default'      => 1,
				'setting_type' => 'option',
				'transport'    => $transport,
			),
			'show_thumbnails' => array(
				'label'        => esc_html__( 'Show thumbnails', 'jetpack' ),
				'description'  => esc_html__( 'Use a large and visually striking layout.', 'jetpack' ),
				'control_type' => 'checkbox',
				'default'      => 1,
				'setting_type' => 'option',
				'transport'    => $transport,
			),
			'show_date' => array(
				'label'        => esc_html__( 'Show date', 'jetpack' ),
				'description'  => esc_html__( 'Display date when entry was published.', 'jetpack' ),
				'control_type' => 'checkbox',
				'default'      => 1,
				'setting_type' => 'option',
				'transport'    => $transport,
			),
			'show_context' => array(
				'label'        => esc_html__( 'Show context', 'jetpack' ),
				'description'  => esc_html__( "Display entry's category or tag.", 'jetpack' ),
				'control_type' => 'checkbox',
				'default'      => 1,
				'setting_type' => 'option',
				'transport'    => $transport,
			),
			'rp_message' => array(
				'description'  => esc_html__( 'Please visit a single post view to reveal the customization options.', 'jetpack' ),
				'control_type' => 'message',
			),
		)
		);
	}

} // class end

/**
 * Control that displays a message in Customizer.
 *
 * @since 4.4
 */
class Jetpack_Message_Control extends WP_Customize_Control {

	/**
	 * Render the message.
	 *
	 * @since 4.4
	 */
	public function render_content() {
		echo '<p class="description">' . esc_html( $this->description ) . '</p>';
	}
} // class end

// Initialize controls
new Jetpack_Related_Posts_Customize;