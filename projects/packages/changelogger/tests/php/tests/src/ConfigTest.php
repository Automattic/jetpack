<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger config.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv, WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName

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
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		$this->useTempDir();

		file_put_contents( 'bogus.json', "bogus\n" );
		$this->writeComposerJson(
			array(
				'types'  => (object) array(),
				'foobar' => 'baz',
			),
			'no-types.json'
		);
	}

	/**
	 * Write a composer.json file.
	 *
	 * @param array  $config Contents for `.extra.changelogger`.
	 * @param string $file Filename.
	 */
	public function writeComposerJson( array $config, $file = 'composer.json' ) {
		file_put_contents(
			$file,
			json_encode(
				array( 'extra' => array( 'changelogger' => $config ) ),
				JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);
	}

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
		$expectConfig['base'] = getcwd();

		$this->resetConfigCache();
		putenv( false === $composer ? 'COMPOSER' : "COMPOSER=$composer" );
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$w = TestingAccessWrapper::newFromClass( Config::class );
		$w->load();
		$this->assertSame( $expectOut, $out->fetch() );
		$this->assertEquals( $expectConfig, $w->config );

		// Second load call should do nothing.
		putenv( 'COMPOSER=./doesnotexist.json' );
		$w->load();
		$this->assertSame( '', $out->fetch() );
		$this->assertEquals( $expectConfig, $w->config );
	}

	/**
	 * Data provider for testLoad.
	 */
	public function provideLoad() {
		$defaultConfig = TestingAccessWrapper::newFromClass( Config::class )->defaultConfig;

		return array(
			'default'                 => array(
				false,
				'',
				$defaultConfig,
			),
			'Alternate composer.json' => array(
				'no-types.json',
				'',
				array(
					'types'  => array(),
					'foobar' => 'baz',
				) + $defaultConfig,
			),
			'missing composer.json'   => array(
				'missing.json',
				"File missing.json (as specified by the COMPOSER environment variable) is not found.\n",
				$defaultConfig,
			),
			'broken composer.json'    => array(
				'bogus.json',
				"File bogus.json (as specified by the COMPOSER environment variable) could not be parsed.\n",
				$defaultConfig,
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
		putenv( 'COMPOSER=' . __DIR__ . '/../../../../composer.json' );
		Config::setOutput( $out );
		$this->assertSame( dirname( dirname( dirname( dirname( __DIR__ ) ) ) ), Config::base() );
	}

	/**
	 * Test the changelogFile method.
	 */
	public function testChangelogFile() {
		$this->resetConfigCache();
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'CHANGELOG.md', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => 'changes.txt' ) );
		Config::setOutput( $out );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changes.txt', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => '/tmp/changes.md' ) );
		Config::setOutput( $out );
		$this->assertSame( '/tmp/changes.md', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => 'c:\\changes.md' ) );
		Config::setOutput( $out );
		$this->assertSame( 'c:\\changes.md', Config::changelogFile() );
	}

	/**
	 * Test the changesDir method.
	 */
	public function testChangesDir() {
		$this->resetConfigCache();
		$out = new BufferedOutput();
		Config::setOutput( $out );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changelog', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => 'changes' ) );
		Config::setOutput( $out );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changes', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => '/tmp/changes' ) );
		Config::setOutput( $out );
		$this->assertSame( '/tmp/changes', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => 'c:\\changes' ) );
		Config::setOutput( $out );
		$this->assertSame( 'c:\\changes', Config::changesDir() );
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
