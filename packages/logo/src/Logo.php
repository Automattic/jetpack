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
	 * @return string The Jetpack logo in an <img /> tag.
	 */
	public function render() {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			esc_url( $this->url ),
			esc_attr( 'Jetpack.' )
		);
	}
}
