<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
 */

namespace Jetpack\Assets;

/**
 * Create and render a Jetpack logo.
 */
class Logo {
	/**
	 * Absolute URL of the Jetpack logo.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Constructor.
	 * You can optionally pass a URL to override the default one.
	 *
	 * @param string $url New URL of the Jetpack logo.
	 */
	public function __construct( $url = '' ) {
		if ( ! $url ) {
			$url = plugins_url( 'assets/logo.svg', __DIR__ );
		}

		$this->url = $url;
	}

	/**
	 * Build and retrieve an <img /> tag with the Jetpack logo.
	 *
	 * @return string The Jetpack logo.
	 */
	public function get_image() {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			esc_url( $this->url ),
			esc_attr__(
				'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
				'jetpack'
			)
		);
	}

	/**
	 * Create a new `Logo` instance and render it.
	 *
	 * @static
	 *
	 * @param string $url Optional custom URL of a Jetpack logo.
	 * @return string The Jetpack logo.
	 */
	public static function render( $url = '' ) {
		$logo = new self( $url );

		return $logo->get_image();
	}
}
