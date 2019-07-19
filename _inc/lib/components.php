<?php
/**
 * Components Library
 *
 * Load and display a pre-rendered component
 */
class Jetpack_Components {
	/**
	 * Load and display a pre-rendered component
	 *
	 * @since 7.6.0
	 *
	 * @return string The component markup
	 */
	public static function render_component( $name, $props ) {
		$markup = @file_get_contents( JETPACK__PLUGIN_DIR . "_inc/build/$name.html" );

		foreach ( $props as $key => $value ) {
			$markup = str_replace(
				"#$key#",
				$value,
				$markup
			);
		}

		return $markup;
	}
}