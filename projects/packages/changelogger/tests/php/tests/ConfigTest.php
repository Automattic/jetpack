<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger config.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Config;
use Symfony\Component\Console\Output\BufferedOutput;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger config.
 *
 * @covers \Automattic\Jetpack\Changelogger\Config
 */
class ConfigTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test that calling load() before setOutput() throws.
	 */
	public function testLoadBeforeSetOutput() {
		$this->resetConfigCache();

		$this->expectException( \LogicException::class );
		$this->expectExceptionMessage( 'Must call Config::setOutput() before Config::load()' );
		TestingAccessWrapper::newFromClass( Config::class )->load();
	}

	/**
	 * Test parsing composer.json.
	 *
	 * @dataProvider provideLoad
	 * @param string|false $composer Value for COMPOSER environment variable.
	 * @param string       $expectOut Expected console output.
	 * @param array        $expectConfig Expected configuration data.
	 */
	public function testLoad( $composer, $expectOut, $expectConfig ) {
		$this->resetConfigCache();
		putenv( false === $composer ? 'COMPOSER' : "COMPOSER=$composer" );
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$w = TestingAccessWrapper::newFromClass( Config::class );
		$w->load();
		$this->assertSame( $expectOut, $out->fetch() );
		$this->assertEquals( $expectConfig, $w->config );

		// Second load call should do nothing.
		putenv( 'COMPOSER=' . __DIR__ . '../fixtures/doesnotexist.json' );
		$w->load();
		$this->assertSame( '', $out->fetch() );
		$this->assertEquals( $expectConfig, $w->config );
	}

	/**
	 * Data provider for testLoad.
	 */
	public function provideLoad() {
		$defaultConfig = TestingAccessWrapper::newFromClass( Config::class )->defaultConfig;
		$fixtures      = dirname( __DIR__ ) . '/fixtures';

		return array(
			'default'                 => array(
				false,
				'',
				array(
					'base' => getcwd(),
				) + $defaultConfig,
			),
			'Alternate composer.json' => array(
				"$fixtures/no-types.json",
				'',
				array(
					'types'  => array(),
					'foobar' => 'baz',
					'base'   => $fixtures,
				) + $defaultConfig,
			),
			'missing composer.json'   => array(
				"$fixtures/missing.json",
				"File $fixtures/missing.json (as specified by the COMPOSER environment variable) is not found.\n",
				array(
					'base' => getcwd(),
				) + $defaultConfig,
			),
			'broken composer.json'    => array(
				"$fixtures/bogus.json",
				"File $fixtures/bogus.json (as specified by the COMPOSER environment variable) could not be parsed.\n",
				array(
					'base' => getcwd(),
				) + $defaultConfig,
			),
		);
	}

	/**
	 * Test the base method.
	 */
	public function testBase() {
		$this->resetConfigCache();
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$this->assertSame( getcwd(), Config::base() );

		$this->resetConfigCache();
		putenv( 'COMPOSER=' . dirname( __DIR__ ) . '/fixtures/no-types.json' );
		Config::setOutput( $out );
		$this->assertSame( dirname( __DIR__ ) . '/fixtures', Config::base() );

	}

	/**
	 * Test the types method.
	 */
	public function testTypes() {
		$this->resetConfigCache();
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$w = TestingAccessWrapper::newFromClass( Config::class );

		$this->assertSame( $w->defaultConfig['types'], Config::types() );

		$w->config = array(
			'types' => array(
				'FOO' => 'Stuff',
				'bAr' => 'More stuff',
			),
		);

		// No change because of caching.
		$this->assertSame( $w->defaultConfig['types'], Config::types() );

		// Clear cache, now it changes.
		$w->cache = array();
		$this->assertSame(
			array(
				'foo' => 'Stuff',
				'bar' => 'More stuff',
			),
			Config::types()
		);
	}

}
