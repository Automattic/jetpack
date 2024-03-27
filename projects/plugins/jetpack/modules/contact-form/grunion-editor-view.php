<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Forms\ContactForm\Editor_View;

/*
 * A prototype to allow inline editing / editor views for contact forms.\
 *
 * Originally developed in: https://github.com/automattic/gm2016-grunion-editor
 * Authors: Michael Arestad, Andrew Ozz, and George Stephanis
 */

/**
 * Grunion editor view class.
 *
 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View
 */
class Grunion_Editor_View {

	/**
	 * Add hooks according to screen.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks
	 * @param WP_Screen $screen Data about current screen.
	 */
	public static function add_hooks( $screen ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks' );

		return Editor_View::add_hooks( $screen );
	}

	/**
	 * Admin header.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::admin_head
	 */
	public static function admin_head() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::admin_head' );

		return Editor_View::admin_head();
	}

	/**
	 * Render the grunion media button.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::grunion_media_button
	 */
	public static function grunion_media_button() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::grunion_media_button' );

		return Editor_View::grunion_media_button();
	}

	/**
	 * Get external plugins.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::mce_external_plugins
	 * @param array $plugin_array - the plugin array.
	 * @return array
	 */
	public static function mce_external_plugins( $plugin_array ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::mce_external_plugins' );

		return Editor_View::mce_external_plugins( $plugin_array );
	}

	/**
	 * MCE buttons.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::mce_buttons
	 * @param array $buttons - the buttons.
	 * @return array
	 */
	public static function mce_buttons( $buttons ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::mce_buttons' );

		return Editor_View::mce_buttons( $buttons );
	}

	/**
	 * WordPress Shortcode Editor View JS Code
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::handle_editor_view_js
	 */
	public static function handle_editor_view_js() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::handle_editor_view_js' );

		return Editor_View::handle_editor_view_js();
	}

	/**
	 * JS Templates.
	 *
	 * @deprecated 13.3 Use Automattic\Jetpack\Forms\ContactForm\Editor_View::editor_view_js_templates
	 */
	public static function editor_view_js_templates() {
		_deprecated_function( __METHOD__, 'jetpack-13.3', 'Automattic\Jetpack\Forms\ContactForm\Editor_View::editor_view_js_templates' );

		return Editor_View::editor_view_js_templates();
	}
}

add_action( 'current_screen', array( 'Grunion_Editor_View', 'add_hooks' ) );
