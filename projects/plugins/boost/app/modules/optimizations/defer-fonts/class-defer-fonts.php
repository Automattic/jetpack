<?php
/**
 * Defers the web fonts WordPress prints from theme.json and the Font Library until the page has loaded.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Defer_Fonts;

use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Optimization;

/**
 * Prints core's @font-face rules with `font-display: swap` and injects them after the `load` event.
 */
class Defer_Fonts implements Feature, Changes_Output_On_Activation, Optimization {

	/**
	 * Key in localStorage remembering which font set the visitor's browser has already downloaded.
	 */
	const STORAGE_KEY = 'jetpack-boost-defer-fonts';

	/**
	 * Get the slug for this module.
	 *
	 * @return string
	 */
	public static function get_slug() {
		return 'defer_fonts';
	}

	/**
	 * The module works on any site using the WordPress Font API (WordPress 6.4+).
	 *
	 * @return bool
	 */
	public static function is_available() {
		return class_exists( '\WP_Font_Face_Resolver' ) && class_exists( '\WP_Font_Face' );
	}

	/**
	 * Setup the module. This runs on every page load.
	 */
	public function setup() {
		if ( jetpack_boost_page_optimize_bail() ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'replace_core_font_faces' ), 0 );
	}

	/**
	 * Swap core's font-face printer for the deferred one, keeping its position in the head.
	 */
	public function replace_core_font_faces() {
		$priority = has_action( 'wp_head', 'wp_print_font_faces' );
		if ( false === $priority ) {
			return;
		}

		remove_action( 'wp_head', 'wp_print_font_faces', $priority );
		add_action( 'wp_head', array( $this, 'print_deferred_font_faces' ), $priority );
	}

	/**
	 * Print the theme's font faces as a deferred loader, with a <noscript> fallback.
	 */
	public function print_deferred_font_faces() {
		$fonts = \WP_Font_Face_Resolver::get_fonts_from_theme_json();
		if ( empty( $fonts ) ) {
			return;
		}

		ob_start();
		( new \WP_Font_Face() )->generate_and_print( self::with_font_display( $fonts, 'swap' ) );
		$css = self::extract_css( (string) ob_get_clean() );
		if ( '' === $css ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS generated and escaped by WP_Font_Face.
		echo '<noscript><style class="wp-fonts-local">' . $css . "</style></noscript>\n";

		/** This filter is documented in app/modules/optimizations/render-blocking-js/class-render-blocking-js.php */
		$ignore_attribute = apply_filters( 'jetpack_boost_render_blocking_js_ignore_attribute', 'data-jetpack-boost' );

		wp_print_inline_script_tag(
			self::get_loader_script( $css ),
			array(
				'id'              => 'jetpack-boost-defer-fonts',
				$ignore_attribute => 'ignore',
			)
		);
	}

	/**
	 * Set `font-display` on every font face resolved from theme.json.
	 *
	 * @param array  $fonts   Font families, each a list of font faces, as WP_Font_Face_Resolver returns them.
	 * @param string $display The font-display value to apply.
	 * @return array
	 */
	public static function with_font_display( array $fonts, $display ) {
		foreach ( $fonts as $family => $faces ) {
			foreach ( (array) $faces as $index => $face ) {
				if ( is_array( $face ) ) {
					$fonts[ $family ][ $index ]['font-display'] = $display;
				}
			}
		}

		return $fonts;
	}

	/**
	 * Pull the CSS out of the <style> element WP_Font_Face prints.
	 *
	 * @param string $html Printed markup.
	 * @return string
	 */
	public static function extract_css( $html ) {
		if ( ! preg_match( '#<style\b[^>]*>(.*)</style>#is', $html, $matches ) ) {
			return '';
		}

		return trim( $matches[1] );
	}

	/**
	 * Script that adds the font faces after `load`, or straight away once this browser has them cached.
	 *
	 * @param string $css The @font-face rules.
	 * @return string
	 */
	public static function get_loader_script( $css ) {
		$encode = static function ( $value ) {
			return wp_json_encode( $value, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES );
		};

		return sprintf(
			'(function(css,key,hash){var d=document,stored;function add(){var s=d.createElement("style");s.className="wp-fonts-local";s.textContent=css;d.head.appendChild(s);d.fonts&&d.fonts.ready.then(function(){try{localStorage.setItem(key,hash)}catch(e){}})}try{stored=localStorage.getItem(key)}catch(e){}if(stored===hash){add()}else{addEventListener("load",add)}})(%s,%s,%s);',
			$encode( $css ),
			$encode( self::STORAGE_KEY ),
			$encode( substr( md5( $css ), 0, 12 ) )
		);
	}
}
