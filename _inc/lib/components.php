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
		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'jetpack-components', plugins_url( "_inc/build/static{$rtl}.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );

		ob_start();
		require JETPACK__PLUGIN_DIR . "_inc/build/$name.html";
		$markup = ob_get_clean();

		foreach ( $props as $key => $value ) {
			$markup = str_replace(
				"%($key)s",
				$value,
				$markup
			);
		}

		return $markup;
	}
}