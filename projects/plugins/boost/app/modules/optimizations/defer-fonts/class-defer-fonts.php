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
	 * Check if the feature is available.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return true;
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
		list( $fonts, $excluded ) = self::split_excluded( \WP_Font_Face_Resolver::get_fonts_from_theme_json() );
		if ( ! empty( $excluded ) ) {
			wp_print_font_faces( $excluded );
		}
		if ( empty( $fonts ) ) {
			return;
		}

		ob_start();
		( new \WP_Font_Face() )->generate_and_print( self::with_swap( $fonts ) );
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
	 * Split font families into those to defer and those left to core, such as icon fonts that must not flash.
	 *
	 * @param array $fonts Font families, each a list of font faces, as WP_Font_Face_Resolver returns them.
	 * @return array The families to defer, then the excluded ones.
	 */
	public static function split_excluded( array $fonts ) {
		/**
		 * Filters the font-family names Defer Web Fonts loads normally, matched case-insensitively as a prefix.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $prefixes Font-family name prefixes. Defaults to Font Awesome's names.
		 */
		$prefixes = (array) apply_filters( 'jetpack_boost_defer_fonts_excluded_families', array( 'Font Awesome', 'FontAwesome' ) );

		$deferred = array();
		$excluded = array();
		foreach ( $fonts as $key => $faces ) {
			$family = strtolower( trim( (string) ( reset( $faces )['font-family'] ?? '' ), "\"' " ) );

			$is_excluded = false;
			foreach ( $prefixes as $prefix ) {
				if ( '' !== (string) $prefix && str_starts_with( $family, strtolower( (string) $prefix ) ) ) {
					$is_excluded = true;
					break;
				}
			}

			if ( $is_excluded ) {
				$excluded[ $key ] = $faces;
			} else {
				$deferred[ $key ] = $faces;
			}
		}

		return array( $deferred, $excluded );
	}

	/**
	 * Set `font-display: swap` on every font face resolved from theme.json.
	 *
	 * @param array $fonts Font families, each a list of font faces, as WP_Font_Face_Resolver returns them.
	 * @return array
	 */
	public static function with_swap( array $fonts ) {
		foreach ( $fonts as $family => $faces ) {
			foreach ( array_keys( $faces ) as $index ) {
				$fonts[ $family ][ $index ]['font-display'] = 'swap';
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
