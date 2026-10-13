<?php
/**
 * Archive canonical tags on WordPress.com Simple.
 *
 * Elsewhere the Jetpack `canonical-urls` module prints these. Simple runs no modules, so its
 * switch is a plain option and the package prints the tag with the module's own resolver.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Status\Host;

/**
 * Prints `<link rel="canonical">` on archive pages of Simple sites that switched it on.
 */
class Canonical_Urls {

	/**
	 * Simple's on/off switch; missing means off. WordPress.com maps it to the
	 * `canonical-urls` module when a site moves to Atomic, so keep the name.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_canonical_urls_enabled';

	/**
	 * Hook the printer on Simple only, so module-backed hosts never get a second tag.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			add_action( 'wp_head', array( __CLASS__, 'print_tag' ) );
		}
	}

	/**
	 * Whether Simple's switch is on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) get_option( self::OPTION, false );
	}

	/**
	 * Print the archive canonical tag. Core's `rel_canonical()` already covers singular pages.
	 *
	 * @return void
	 */
	public static function print_tag() {
		if ( is_singular() || ! self::is_enabled() || ! self::load_resolver() ) {
			return;
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- The resolver lives in plugins/jetpack and is guarded by load_resolver().
		$url = \Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		if ( ! empty( $url ) ) {
			echo '<link rel="canonical" href="' . esc_url( $url ) . '" />' . "\n";
		}
	}

	/**
	 * Load the Jetpack plugin's resolver without its module file, which fatals on Simple.
	 *
	 * @return bool Whether the resolver is available.
	 */
	private static function load_resolver() {
		if ( ! class_exists( 'Jetpack_Canonical_Urls_Resolver' ) && defined( 'JETPACK__PLUGIN_DIR' ) ) {
			$file = JETPACK__PLUGIN_DIR . 'modules/canonical-urls/class-jetpack-canonical-urls-resolver.php';
			if ( is_readable( $file ) ) {
				require_once $file;
			}
		}

		return class_exists( 'Jetpack_Canonical_Urls_Resolver' );
	}
}
