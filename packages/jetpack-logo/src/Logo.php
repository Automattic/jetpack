<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
 */

namespace Jetpack\Assets;

use Jetpack\Assets\Renderable_Interface;

/**
 * Create and render a Jetpack logo.
 */
class Logo implements Renderable_Interface {
	/**
	 * Absolute URL of the Jetpack logo.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Instance of Logo
	 *
	 * @var Logo
	 */
	private static $instance;

	/**
	 * Default image url
	 *
	 * @var string
	 */
	private $default_url;

	/**
	 * Private constructor guarantees singleton behavior.
	 */
	private function __construct() {
	}

	/**
	 * Build and retrieve an <img /> tag with the Jetpack logo.
	 *
	 * @return string The Jetpack logo.
	 */
	private function get_image() {
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
	 * Set the image url
	 *
	 * @param $url Custom URL of a Jetpack logo.
	 */
	private function set_url( $url ) {
		$this->url = $url;
	}

	/**
	 * Get the instantiated Logo instance or create one if it doesn't exist yet
	 *
	 * @param $url URL of a Jetpack logo.
	 *
	 * @return Logo
	 */
	private static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
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
		$logo = self::get_instance();
		if ( ! $url ) {
			$logo->set_url( $logo->default_url );
		} else {
			$logo->set_url( $url );
		}
		return $logo->get_image();
	}
}
