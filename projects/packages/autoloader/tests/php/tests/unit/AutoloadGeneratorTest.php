<?php
/**
 * Autoload Generator test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadGenerator;
use Composer\IO\NullIO;
use Composer\Package\RootPackage;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoload generator.
 */
class AutoloadGeneratorTest extends TestCase {

	/**
	 * The AutoloadGenerator instance being tested.
	 *
	 * @var AutoloadGenerator
	 */
	private $generator;

	/**
	 * Setup runs before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->generator = new AutoloadGenerator( new NullIO() );
	}

	/**
	 * Tests that parseExcludeFromClassmap returns an empty array when no exclusions are defined.
	 */
	public function test_parse_exclude_from_classmap_returns_empty_array_when_no_exclusions() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload( array( 'classmap' => array( 'src' ) ) );

		$method = new ReflectionMethod( $this->generator, 'parseExcludeFromClassmap' );

		$result = $method->invoke( $this->generator, $package );

		$this->assertEquals( array(), $result );
	}

	/**
	 * Tests that parseExcludeFromClassmap extracts exclusions from autoload config.
	 */
	public function test_parse_exclude_from_classmap_extracts_from_autoload() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'            => array( 'src' ),
				'exclude-from-classmap' => array( 'src/Excluded.php', 'src/tests/' ),
			)
		);

		$method = new ReflectionMethod( $this->generator, 'parseExcludeFromClassmap' );

		$result = $method->invoke( $this->generator, $package );

		$this->assertEquals( array( 'src/Excluded.php', 'src/tests/' ), $result );
	}

	/**
	 * Tests that parseExcludeFromClassmap extracts exclusions from dev autoload config.
	 */
	public function test_parse_exclude_from_classmap_extracts_from_dev_autoload() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload( array( 'classmap' => array( 'src' ) ) );
		$package->setDevAutoload(
			array(
				'exclude-from-classmap' => array( 'tests/fixtures/' ),
			)
		);

		$method = new ReflectionMethod( $this->generator, 'parseExcludeFromClassmap' );

		$result = $method->invoke( $this->generator, $package );

		$this->assertEquals( array( 'tests/fixtures/' ), $result );
	}

	/**
	 * Tests that parseExcludeFromClassmap merges exclusions from both autoload and dev autoload.
	 */
	public function test_parse_exclude_from_classmap_merges_autoload_and_dev_autoload() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'            => array( 'src' ),
				'exclude-from-classmap' => array( 'src/Excluded.php' ),
			)
		);
		$package->setDevAutoload(
			array(
				'exclude-from-classmap' => array( 'tests/fixtures/' ),
			)
		);

		$method = new ReflectionMethod( $this->generator, 'parseExcludeFromClassmap' );

		$result = $method->invoke( $this->generator, $package );

		$this->assertEquals( array( 'src/Excluded.php', 'tests/fixtures/' ), $result );
	}

	/**
	 * Tests that parseExcludeFromClassmap removes duplicates.
	 */
	public function test_parse_exclude_from_classmap_removes_duplicates() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'            => array( 'src' ),
				'exclude-from-classmap' => array( 'src/Excluded.php', 'common/' ),
			)
		);
		$package->setDevAutoload(
			array(
				'exclude-from-classmap' => array( 'common/', 'tests/' ),
			)
		);

		$method = new ReflectionMethod( $this->generator, 'parseExcludeFromClassmap' );

		$result = $method->invoke( $this->generator, $package );

		$this->assertEquals( array( 'src/Excluded.php', 'common/', 'tests/' ), array_values( $result ) );
	}

	/**
	 * Tests that parseAutoloads includes exclude-from-classmap in the returned array.
	 */
	public function test_parse_autoloads_includes_exclude_from_classmap() {
		$package = new RootPackage( 'test/package', '1.0.0', '1.0.0' );
		$package->setAutoload(
			array(
				'classmap'            => array( 'src' ),
				'exclude-from-classmap' => array( 'src/Excluded.php' ),
			)
		);

		$packageMap = array( array( $package, '' ) );

		$result = $this->generator->parseAutoloads( $packageMap, $package );

		$this->assertArrayHasKey( 'exclude-from-classmap', $result );
		$this->assertEquals( array( 'src/Excluded.php' ), $result['exclude-from-classmap'] );
	}
}
