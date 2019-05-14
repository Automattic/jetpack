<?php

namespace Jetpack\V7\Utils;

class Jetpack_Logo {
	/**
	 * Return an img HTML tag pointing to the Jetpack logo. Includes alt text.
	 *
	 * @since 7.2
	 *
	 * @return string
	 */
	public static function render() {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			esc_url( plugins_url( 'images/jetpack-logo-green.svg', JETPACK__PLUGIN_FILE ) ),
			esc_attr__(
				'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
				'jetpack'
			)
		);
	}
}