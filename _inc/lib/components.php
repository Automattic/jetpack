<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Components Library
 *
 * @deprecated 9.3.0
 *
 * Load and display a pre-rendered component
 */
class Jetpack_Components {
	/**
	 * Load and display a pre-rendered component
	 *
	 * @deprecated 9.3.0
	 *
	 * @since 7.7.0
	 *
	 * @param string $name  Component name.
	 * @param array  $props Component properties.
	 *
	 * @return string The component markup
	 */
	public static function render_component( $name, $props ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', '' );
		return '';
	}

	/**
	 * Load and display a pre-rendered component
	 *
	 * @deprecated 9.3.0
	 *
	 * @since 7.7.0
	 *
	 * @param array $props Component properties.
	 *
	 * @return string The component markup
	 */
	public static function render_upgrade_nudge( $props ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', '' );
		return '';
	}
}
