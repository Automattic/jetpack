<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
 */

namespace Automattic\Jetpack\Assets;

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
	 * Build and render an <img /> tag with the Jetpack logo.
	 *
	 * @param string $type If empty, the color version is used. If it's 'gray', a gray version of the logo will be displayed.
	 *                     The gray it's actually the blueish gray version used in Calypso's colophon found in Stats.
	 *
	 * @return string The Jetpack logo in an <img /> tag.
	 */
	public function render( $type = '' ) {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="Jetpack" />',
			esc_url(
				empty( $type )
					? $this->url
					: str_replace( 'logo.svg', "logo-$type.svg", $this->url )
			)
		);
	}
}
