<?php
/**
 * Subclass that swaps in stub seams for Licensing_Abilities tests.
 *
 * Lets the tests drive `attach_licenses`, `last_error`, and the underlying
 * `fetch_user_licenses` hook without depending on a real Jetpack connection
 * or hitting WordPress.com over the network.
 *
 * @package automattic/jetpack-licensing
 */

namespace Automattic\Jetpack\Licensing\Abilities;

use Automattic\Jetpack\Licensing;
use WP_Error;

/**
 * Test stub for Licensing_Abilities.
 */
class Licensing_Abilities_Test_Stub extends Licensing_Abilities {

	/**
	 * Optional WP_Error injection for the fetch seam. When set, overrides any
	 * value in `Licensing_Abilities_Test::$stub_license_items`.
	 *
	 * @var WP_Error|null
	 */
	public static $stub_fetch_error = null;

	/**
	 * Return a minimal anonymous Licensing-compatible object that proxies
	 * `attach_licenses` and `last_error` to test-controlled scalars.
	 *
	 * @return Licensing
	 */
	protected static function get_licensing(): Licensing {
		// Anonymous subclass keeps the type contract (`extends Licensing`)
		// without instantiating the parent's hook surface.
		return new class() extends Licensing {
			// phpcs:disable Squiz.Commenting.FunctionComment.Missing
			public function attach_licenses( array $licenses ) {
				unset( $licenses ); // Stub: tests assert on caller, not arg shape.
				return Licensing_Abilities_Test::$stub_attach_return;
			}

			public function last_error() {
				return Licensing_Abilities_Test::$stub_last_error;
			}
			// phpcs:enable Squiz.Commenting.FunctionComment.Missing
		};
	}

	/**
	 * Override the WP.com fetch with the test fixture.
	 *
	 * @return array|WP_Error
	 */
	protected static function fetch_user_licenses() {
		if ( null !== self::$stub_fetch_error ) {
			return self::$stub_fetch_error;
		}
		return Licensing_Abilities_Test::$stub_license_items;
	}
}
