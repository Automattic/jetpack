<?php
/**
 * Module: Jetpack Google Fonts
 *
 * @package automattic/jetpack
 */

/**
 * Manages Google fonts registration, introspection and enqueueing.
 */
class Jetpack_Google_Fonts {
	/**
	 * Hook into WordPress to register
	 * and enqueue webfonts.
	 */
	public function __construct() {
		$this->register_google_fonts_provider();

		add_action( 'after_setup_theme', array( $this, 'register_google_fonts' ) );
	}

	/**
	 * Register the provider for Google fonts registration.
	 */
	private function register_google_fonts_provider() {
		if ( ! function_exists( 'wp_register_webfont_provider' ) ) {
			return;
		}

		wp_register_webfont_provider( 'jetpack-google-fonts', '\Automattic\Jetpack\Fonts\Google_Fonts_Provider' );
	}

	/**
	 * Register Google fonts.
	 */
	public function register_google_fonts() {
		if ( ! function_exists( 'wp_register_webfonts' ) ) {
			return;
		}

		/**
		 * Curated list of Google Fonts.
		 *
		 * @module google-fonts
		 *
		 * @since 10.8
		 *
		 * @param array $fonts_to_register Array of Google Font names to register.
		 */
		$fonts_to_register = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );

		foreach ( $fonts_to_register as $font_family ) {
			wp_register_webfonts(
				array(
					array(
						'font-family'  => $font_family,
						'font-weight'  => '100 900',
						'font-style'   => 'normal',
						'font-display' => 'fallback',
						'provider'     => 'jetpack-google-fonts',
					),
					array(
						'font-family'  => $font_family,
						'font-weight'  => '100 900',
						'font-style'   => 'italic',
						'font-display' => 'fallback',
						'provider'     => 'jetpack-google-fonts',
					),
				)
			);
		}
	}
}
