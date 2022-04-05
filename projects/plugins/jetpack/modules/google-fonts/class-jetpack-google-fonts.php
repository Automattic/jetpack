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
	 * The Google fonts that we're registered after
	 * running the `jetpack_google_fonts_list`.
	 *
	 * @var array
	 */
	private $registered_google_fonts = array();

	/**
	 * Hook into WordPress to register
	 * and enqueue webfonts.
	 */
	public function __construct() {
		$this->register_google_fonts_provider();

		add_action( 'after_setup_theme', array( $this, 'register_google_fonts' ) );

		/**
		 * We are already enqueueing all registered fonts by default when loading the block editor,
		 * so we only need to scan for webfonts when browsing as a guest.
		 */
		if ( ! is_admin() ) {
			add_filter( 'pre_render_block', array( $this, 'scan_block_for_google_fonts' ), 10, 2 );
		}
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

			$slug = wp_webfonts()->get_font_slug( $font_family );

			/**
			 * When introspecting, all we have is the slug,
			 * so we need to keep track of the registered families
			 * to check whether the font was filtered after
			 * running the `jetpack_google_fonts_list` hook.
			 */
			$this->registered_google_fonts[ $slug ] = $font_family;
		}
	}

	/**
	 * Scan block for Google fonts.
	 *
	 * @param string $content The block content.
	 * @param array  $parsed_block The parsed block attributes.
	 *
	 * @return string The block content.
	 */
	public function scan_block_for_google_fonts( $content, $parsed_block ) {
		if ( isset( $parsed_block['attrs']['fontFamily'] ) ) {
			$this->maybe_enqueue_font_family( $parsed_block['attrs']['fontFamily'] );
		}

		return $content;
	}

	/**
	 * Enqueue a font family if it was not removed from the curated list.
	 *
	 * @param string $font_family_slug The block content.
	 */
	private function maybe_enqueue_font_family( $font_family_slug ) {
		if ( ! isset( $this->registered_google_fonts[ $font_family_slug ] ) ) {
			// Font not allow-listed.
			return;
		}

		wp_enqueue_webfont( $font_family_slug );
	}
}
