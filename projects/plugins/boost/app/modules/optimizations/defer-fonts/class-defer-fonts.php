<?php
/**
 * Defers the web fonts WordPress prints from theme.json and the Font Library until the page has loaded.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Defer_Fonts;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Data_Sync\Minify_Excludes_State_Entry;

/**
 * Prints core's @font-face rules with `font-display: swap` and injects them after the `load` event.
 */
class Defer_Fonts implements Feature, Changes_Output_On_Activation, Changes_Output_After_Activation, Optimization, Has_Data_Sync {

	/**
	 * Key in sessionStorage remembering which font set this visit has already downloaded.
	 *
	 * Not localStorage: it outlives the HTTP cache, and a stale hash would load uncached fonts alongside the LCP image.
	 */
	const STORAGE_KEY = 'jetpack-boost-defer-fonts';

	/**
	 * Font-family name prefixes left to load normally until the site owner edits the list.
	 */
	const DEFAULT_EXCLUDES = array( 'Font Awesome', 'FontAwesome' );

	/**
	 * Milliseconds to wait for `load` before adding the fonts anyway, for pages a slow embed holds back.
	 */
	const LOAD_WAIT_MS = 3000;

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
	 * Register the data sync entry holding the font families left to load normally.
	 *
	 * @param Data_Sync $instance The data sync instance.
	 */
	public function register_data_sync( Data_Sync $instance ) {
		$instance->register(
			'defer_fonts_excludes',
			Schema::as_array( Schema::as_string() )->fallback( self::DEFAULT_EXCLUDES ),
			new Minify_Excludes_State_Entry( 'defer_fonts_excludes' )
		);
	}

	/**
	 * Cached pages need to be invalidated when the exclusion list changes.
	 *
	 * @return string[] Action names fired when the exclusion list is saved.
	 */
	public static function get_change_output_action_names() {
		$option = JETPACK_BOOST_DATASYNC_NAMESPACE . '_defer_fonts_excludes';

		return array(
			'add_option_' . $option,
			'update_option_' . $option,
		);
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
	 *
	 * Falls back to core's output when a Content-Security-Policy header set from PHP would block the loader.
	 * A policy sent by the web server or a <meta> tag can't be seen here, so such sites should leave the module off.
	 */
	public function print_deferred_font_faces() {
		list( $fonts, $excluded ) = self::split_excluded( \WP_Font_Face_Resolver::get_fonts_from_theme_json(), self::get_excluded_families() );

		$css = '';
		if ( ! empty( $fonts ) ) {
			ob_start();
			( new \WP_Font_Face() )->generate_and_print( self::with_swap( $fonts ) );
			$css = self::extract_css( (string) ob_get_clean() );
		}

		/** This filter is documented in app/modules/optimizations/render-blocking-js/class-render-blocking-js.php */
		$ignore_attribute = apply_filters( 'jetpack_boost_render_blocking_js_ignore_attribute', 'data-jetpack-boost' );

		$loader = '' === $css ? '' : wp_get_inline_script_tag(
			self::get_loader_script( $css ),
			array(
				'id'              => 'jetpack-boost-defer-fonts',
				$ignore_attribute => 'ignore',
			)
		);

		if ( '' !== $loader && self::csp_blocks_inline_script( $this->get_response_headers(), $loader ) ) {
			wp_print_font_faces();
			return;
		}

		if ( ! empty( $excluded ) ) {
			wp_print_font_faces( $excluded );
		}
		if ( '' === $loader ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS generated and escaped by WP_Font_Face.
		echo '<noscript><style class="wp-fonts-local">' . $css . "</style></noscript>\n";
		echo $loader; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Built by wp_get_inline_script_tag().
	}

	/**
	 * Response headers set so far, as headers_list() returns them.
	 *
	 * @return string[]
	 */
	protected function get_response_headers() {
		return headers_list();
	}

	/**
	 * Whether an enforced Content-Security-Policy header would stop the inline loader from running.
	 *
	 * @param string[] $headers Response headers, as headers_list() returns them.
	 * @param string   $tag     The loader's <script> tag, including any nonce WordPress added.
	 * @return bool
	 */
	public static function csp_blocks_inline_script( array $headers, $tag ) {
		$nonce = preg_match( '/\snonce=["\']([^"\']+)["\']/', $tag, $match ) ? $match[1] : null;

		foreach ( $headers as $header ) {
			// Report-Only policies don't block, and don't match: their header name continues past "Policy".
			if ( ! preg_match( '/^content-security-policy\s*:(.*)$/i', $header, $policy ) ) {
				continue;
			}

			$directives = array();
			foreach ( explode( ';', $policy[1] ) as $directive ) {
				$parts = preg_split( '/\s+/', trim( $directive ), -1, PREG_SPLIT_NO_EMPTY );
				$name  = strtolower( (string) array_shift( $parts ) );
				if ( '' !== $name && ! isset( $directives[ $name ] ) ) {
					$directives[ $name ] = $parts;
				}
			}

			$sources = $directives['script-src-elem'] ?? $directives['script-src'] ?? $directives['default-src'] ?? null;
			if ( null === $sources || ( null !== $nonce && in_array( "'nonce-{$nonce}'", $sources, true ) ) ) {
				continue;
			}

			// A nonce, hash or 'strict-dynamic' makes browsers ignore 'unsafe-inline'.
			$keywords = array_map( 'strtolower', $sources );
			if ( preg_grep( "/^'(nonce-|sha256-|sha384-|sha512-|strict-dynamic')/", $keywords ) || ! in_array( "'unsafe-inline'", $keywords, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * The font-family name prefixes the site owner saved, such as icon fonts that must not flash.
	 *
	 * @return string[]
	 */
	public static function get_excluded_families() {
		$saved = function_exists( 'jetpack_boost_ds_get' ) ? jetpack_boost_ds_get( 'defer_fonts_excludes' ) : self::DEFAULT_EXCLUDES;

		/**
		 * Filters the font-family names Defer Web Fonts loads normally, matched case-insensitively as a prefix.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $prefixes Font-family name prefixes from the module's settings.
		 */
		return (array) apply_filters( 'jetpack_boost_defer_fonts_excluded_families', is_array( $saved ) ? $saved : self::DEFAULT_EXCLUDES );
	}

	/**
	 * Split font families into those to defer and those whose name starts with an excluded prefix.
	 *
	 * @param array    $fonts    Font families, each a list of font faces, as WP_Font_Face_Resolver returns them.
	 * @param string[] $prefixes Font-family name prefixes to leave to core, matched case-insensitively.
	 * @return array The families to defer, then the excluded ones.
	 */
	public static function split_excluded( array $fonts, array $prefixes ) {
		$normalize = static function ( $name ) {
			return strtolower( trim( (string) $name, "\"' " ) );
		};
		$prefixes  = array_filter( array_map( $normalize, $prefixes ), 'strlen' );

		$deferred = array();
		$excluded = array();
		foreach ( $fonts as $key => $faces ) {
			$family = $normalize( reset( $faces )['font-family'] ?? '' );

			$is_excluded = false;
			foreach ( $prefixes as $prefix ) {
				if ( str_starts_with( $family, $prefix ) ) {
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
			// Adds once: on `load`, after LOAD_WAIT_MS at the latest, or at once if `load` already fired (delayed-JS plugins).
			// Waits a frame before fonts.ready so the new fonts are pending when it is checked.
			'(function(css,key,hash,wait){var d=document,stored,done;function add(){if(done){return}done=1;var s=d.createElement("style");s.className="wp-fonts-local";s.textContent=css;d.head.appendChild(s);d.fonts&&requestAnimationFrame(function(){d.fonts.ready.then(function(){try{sessionStorage.setItem(key,hash)}catch(e){}})})}try{stored=sessionStorage.getItem(key)}catch(e){}if(stored===hash||d.readyState==="complete"){add()}else{addEventListener("load",add);setTimeout(add,wait)}})(%s,%s,%s,%d);',
			$encode( $css ),
			$encode( self::STORAGE_KEY . '-' . get_current_blog_id() ),
			$encode( substr( md5( $css ), 0, 12 ) ),
			self::LOAD_WAIT_MS
		);
	}
}
