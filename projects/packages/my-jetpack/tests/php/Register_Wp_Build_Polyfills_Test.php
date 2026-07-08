<?php
/**
 * Tests for Initializer::register_wp_build_polyfills().
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

/**
 * Verifies My Jetpack requests the wp-build-polyfills shim for the script handles
 * its app bundle depends on but older WordPress (< 7.0, no Gutenberg) does not ship.
 *
 * @see \Automattic\Jetpack\My_Jetpack\Initializer::register_wp_build_polyfills
 */
class Register_Wp_Build_Polyfills_Test extends TestCase {

	/**
	 * The app bundle's polyfill-provided handles that must be requested.
	 */
	const EXPECTED_HANDLES = array( 'wp-notices', 'wp-private-apis', 'wp-theme' );

	/**
	 * Reset the WP_Build_Polyfills static registrar so tests do not inherit state.
	 */
	public function tearDown(): void {
		foreach ( array(
			'requested'            => array(),
			'hooked'               => false,
			'wp_version_threshold' => '7.0',
		) as $name => $value ) {
			$prop = new ReflectionProperty( WP_Build_Polyfills::class, $name );
			if ( PHP_VERSION_ID < 80100 ) {
				$prop->setAccessible( true );
			}
			$prop->setValue( null, $value );
		}
		parent::tearDown();
	}

	/**
	 * Registering requests each required handle for the `my-jetpack` consumer.
	 */
	public function test_registers_required_polyfill_handles() {
		Initializer::register_wp_build_polyfills();

		$consumers = WP_Build_Polyfills::get_consumers();

		foreach ( self::EXPECTED_HANDLES as $handle ) {
			$this->assertArrayHasKey( $handle, $consumers, "$handle should be requested" );
			$this->assertContains( 'my-jetpack', $consumers[ $handle ], "$handle should list the my-jetpack consumer" );
		}
	}

	/**
	 * Guards against bundle drift: if a future `@wordpress/*` bump makes the app
	 * depend on another polyfill-covered handle (e.g. `wp-views`) that we do not
	 * request, that page would blank out with no console error. Fail here instead.
	 *
	 * Skips when the package has not been built (no asset file to inspect).
	 */
	public function test_requested_handles_cover_polyfilled_bundle_dependencies() {
		$asset_file = dirname( __DIR__, 2 ) . '/build/index.asset.php';
		if ( ! is_readable( $asset_file ) ) {
			$this->markTestSkipped( 'my_jetpack_main_app build asset not found; run the package build first.' );
		}

		$asset      = require $asset_file;
		$deps       = $asset['dependencies'] ?? array();
		$polyfilled = array_values( array_intersect( $deps, WP_Build_Polyfills::SCRIPT_HANDLES ) );
		$missing    = array_values( array_diff( $polyfilled, self::EXPECTED_HANDLES ) );

		$this->assertSame(
			array(),
			$missing,
			'The app bundle depends on polyfill-covered handle(s) not requested by register_wp_build_polyfills(): ' . implode( ', ', $missing )
		);
	}
}
