<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack-classic-theme-helper
 */

if ( ! function_exists( 'twentyfourteen_featured_content_post_ids' ) ) {
	/**
	 * A last try to show posts, in case the Featured Content plugin returns no IDs.
	 *
	 * @param array $featured_ids Array of 'featured' post IDs.
	 * @return array
	 */
	function twentyfourteen_featured_content_post_ids( $featured_ids ) {
		if ( empty( $featured_ids ) ) {
			$featured_ids = array_slice( get_option( 'sticky_posts', array() ), 0, 6 );
		}

		return $featured_ids;
	}
	add_action( 'featured_content_post_ids', 'twentyfourteen_featured_content_post_ids' );
}

if ( ! function_exists( 'twentyfourteen_customizer_default' ) ) {
	/**
	 * Set the default tag name for Featured Content.
	 *
	 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
	 * @return void
	 */
	function twentyfourteen_customizer_default( $wp_customize ) {
		$wp_customize->get_setting( 'featured-content[tag-name]' )->default = 'featured';
	}
	add_action( 'customize_register', 'twentyfourteen_customizer_default' );
}

if ( ! function_exists( 'twentyfourteen_featured_content_default_settings' ) ) {
	/**
	 * Sets a default tag of 'featured' for Featured Content.
	 *
	 * @param array $settings Featured content settings.
	 * @return array
	 */
	function twentyfourteen_featured_content_default_settings( $settings ) {
		$settings['tag-name'] = 'featured';

		return $settings;
	}
	add_action( 'featured_content_default_settings', 'twentyfourteen_featured_content_default_settings' );
}
