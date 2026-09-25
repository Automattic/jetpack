<?php
/**
 * Tests for the SDK module registration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/sdk-module.php';

/**
 * The SDK package name resolves to the facade module wp-build builds.
 *
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_sdk_module_registration
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_sdk_module_registration' )]
class Sdk_Module_Test extends TestCase {

	const BUILD_URL = 'https://example.test/build/';

	/**
	 * A build directory holding only the facade's asset file.
	 *
	 * @var string
	 */
	private $build_dir;

	protected function setUp(): void {
		parent::setUp();

		$this->build_dir = sys_get_temp_dir() . '/jpa-sdk-' . uniqid();
		mkdir( $this->build_dir . '/modules/sdk', 0777, true );
		file_put_contents(
			$this->build_dir . '/modules/sdk/index.min.asset.php',
			"<?php return array( 'module_dependencies' => array( '@jetpack-premium-analytics/widgets-toolkit' ), 'version' => 'abc123' );"
		);
	}

	protected function tearDown(): void {
		unlink( $this->build_dir . '/modules/sdk/index.min.asset.php' );
		rmdir( $this->build_dir . '/modules/sdk' );
		rmdir( $this->build_dir . '/modules' );
		rmdir( $this->build_dir );

		parent::tearDown();
	}

	/**
	 * A module registry as wp-build writes it, with the facade among other modules.
	 *
	 * @return array[]
	 */
	private function modules() {
		return array(
			array(
				'id'    => '@jetpack-premium-analytics/init',
				'path'  => 'init/index',
				'asset' => 'init/index.min.asset.php',
			),
			array(
				'id'    => SDK_FACADE_MODULE_ID,
				'path'  => 'sdk/index',
				'asset' => 'sdk/index.min.asset.php',
			),
		);
	}

	public function test_resolves_the_sdk_name_to_the_facade_bundle() {
		$registration = get_sdk_module_registration( $this->modules(), array( 'build_url' => self::BUILD_URL ), $this->build_dir );

		$this->assertSame( self::BUILD_URL . 'modules/sdk/index.min.js', $registration['src'] );
		$this->assertSame( array( '@jetpack-premium-analytics/widgets-toolkit' ), $registration['deps'] );
		$this->assertSame( 'abc123', $registration['version'] );
	}

	public function test_serves_the_unminified_bundle_when_asked() {
		$registration = get_sdk_module_registration( $this->modules(), array( 'build_url' => self::BUILD_URL ), $this->build_dir, false );

		$this->assertSame( self::BUILD_URL . 'modules/sdk/index.js', $registration['src'] );
	}

	public function test_returns_null_when_the_registry_has_no_facade() {
		$this->assertNull( get_sdk_module_registration( array( $this->modules()[0] ), array( 'build_url' => self::BUILD_URL ), $this->build_dir ) );
	}

	public function test_the_facade_id_is_the_one_wp_build_gives_the_sdk_package() {
		// wp-build names a module after the package namespace and the folder under `packages/`.
		$package = json_decode( file_get_contents( __DIR__ . '/../../package.json' ), true );

		$this->assertSame( SDK_FACADE_MODULE_ID, '@' . $package['wpPlugin']['packageNamespace'] . '/sdk' );
		$this->assertFileExists( __DIR__ . '/../../packages/sdk/package.json' );
	}
}
