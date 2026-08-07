<?php
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadGenerator;
use Composer\IO\NullIO;
use Composer\Package\Package;
use PHPUnit\Framework\TestCase;

/**
 * Tests that the generator turns a root package's exclude-from-classmap config
 * into the regex fragments AutoloadProcessor consumes.
 */
class AutoloadGeneratorTest extends TestCase {

	/**
	 * Runs the protected parseExcludeFromClassmap() against a package whose
	 * autoload config carries the given exclude-from-classmap value.
	 *
	 * @param array|null $exclude The exclude-from-classmap entries, or null to omit the key.
	 *
	 * @return string[]
	 */
	private function parse_exclude( $exclude ) {
		$package = new Package( 'test/package', '1.0.0.0', '1.0.0' );
		if ( null !== $exclude ) {
			$package->setAutoload( array( 'exclude-from-classmap' => $exclude ) );
		}

		$generator = new AutoloadGenerator( new NullIO() );

		$method = new ReflectionMethod( AutoloadGenerator::class, 'parseExcludeFromClassmap' );
		// setAccessible() is required to invoke a protected method on PHP < 8.1,
		// but is a deprecated no-op from 8.1 onward.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $generator, $package );
	}

	/**
	 * A plain path is escaped into a regex fragment matching that path.
	 */
	public function test_escapes_plain_path() {
		$this->assertSame(
			array( 'vendor/wp\-php\-toolkit/data\-liberation/vendor\-patched/psr/log' ),
			$this->parse_exclude( array( 'vendor/wp-php-toolkit/data-liberation/vendor-patched/psr/log/' ) )
		);
	}

	/**
	 * `*` matches a single path segment and `**` matches across segments.
	 */
	public function test_expands_wildcards() {
		$this->assertSame(
			array( 'vendor/[^/]+?/tests', 'vendor/.+?/build' ),
			$this->parse_exclude( array( 'vendor/*/tests', 'vendor/**/build' ) )
		);
	}

	/**
	 * Missing exclude-from-classmap config produces no patterns.
	 */
	public function test_returns_empty_without_config() {
		$this->assertSame( array(), $this->parse_exclude( null ) );
	}
}
