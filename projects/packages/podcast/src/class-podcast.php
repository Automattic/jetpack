<?php
/**
 * Main loader for the Jetpack Podcast package.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Status\Host;

/**
 * Loads Jetpack Podcast on Simple and Atomic sites, gated behind the
 * `jetpack_podcast_untangle` feature filter.
 *
 * Until the filter returns true, `init()` is a no-op so the legacy podcasting
 * code (`Automattic_Podcasting` from the wpcom mu-plugin and the
 * at-pressable-podcasting bridge plugin) keeps running unchanged. Subsequent
 * PRs in the untangle train fill this in.
 */
class Podcast {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package.
	 *
	 * Bails on hosts other than Simple and Atomic, and again unless the
	 * `jetpack_podcast_untangle` filter returns true.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$host = new Host();
		if ( ! $host->is_wpcom_simple() && ! $host->is_woa_site() ) {
			return;
		}

		/**
		 * Master switch for the Podcast untangle.
		 *
		 * While the legacy podcasting code is still the source of truth on
		 * Simple and Atomic sites, this filter stays false. Subsequent PRs
		 * layer the new wp-admin SPA, REST integration, and feed
		 * customization on top of this gate.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether to enable the new Podcast package.
		 */
		if ( ! apply_filters( 'jetpack_podcast_untangle', false ) ) {
			return;
		}

		// Subsequent PRs in the untangle train wire the new package up here.
	}
}
