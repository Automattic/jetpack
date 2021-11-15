<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger config.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv, WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Config;
use Automattic\Jetpack\Changelogger\ConfigException;
use Automattic\Jetpack\Changelogger\PluginTrait;
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
	 * Test parsing composer.json, default locating.
	 */
	public function testLoad() {
		$this->resetConfigCache();

		$w            = TestingAccessWrapper::newFromClass( Config::class );
		$expectConfig = array( 'base' => getcwd() ) + $w->defaultConfig;

		putenv( 'COMPOSER' );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );

		// Second load call should do nothing.
		putenv( 'COMPOSER=./doesnotexist.json' );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );
	}

	/**
	 * Test parsing composer.json, from environment variable.
	 */
	public function testLoad_env() {
		$this->resetConfigCache();

		$w            = TestingAccessWrapper::newFromClass( Config::class );
		$expectConfig = array(
			'base'   => getcwd(),
			'types'  => array(),
			'foobar' => 'baz',
		) + $w->defaultConfig;

		putenv( 'COMPOSER=no-types.json' );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );

		// Second load call should do nothing.
		putenv( 'COMPOSER=./doesnotexist.json' );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );
	}

	/**
	 * Test parsing composer.json, explicit set.
	 */
	public function testLoad_explicit() {
		$this->resetConfigCache();

		$w            = TestingAccessWrapper::newFromClass( Config::class );
		$expectConfig = array(
			'base'   => getcwd(),
			'types'  => array(),
			'foobar' => 'baz',
		) + $w->defaultConfig;

		putenv( 'COMPOSER=./doesnotexist.json' );
		Config::setComposerJsonPath( 'no-types.json' );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );

		// Second load call should do nothing.
		putenv( 'COMPOSER=./doesnotexist.json' );
		Config::setComposerJsonPath( null );
		$w->load();
		$this->assertEquals( $expectConfig, $w->config );
	}

	/**
	 * Test parsing composer.json, missing file.
	 */
	public function testLoad_missing() {
		$this->resetConfigCache();

		$w = TestingAccessWrapper::newFromClass( Config::class );
		Config::setComposerJsonPath( 'missing.json' );
		$this->expectException( ConfigException::class );
		$this->expectExceptionMessage( 'File missing.json is not found.' );
		$w->load();
	}

	/**
	 * Test parsing composer.json, bogus file.
	 */
	public function testLoad_bogus() {
		$this->resetConfigCache();

		$w = TestingAccessWrapper::newFromClass( Config::class );
		Config::setComposerJsonPath( 'bogus.json' );
		$this->expectException( ConfigException::class );
		$this->expectExceptionMessage( 'File bogus.json could not be parsed.' );
		$w->load();
	}

	/**
	 * Test the base method.
	 */
	public function testBase() {
		$this->resetConfigCache();
		$this->assertSame( getcwd(), Config::base() );

		$this->resetConfigCache();
		putenv( 'COMPOSER=' . __DIR__ . '/../../../../composer.json' );
		$this->assertSame( dirname( dirname( dirname( dirname( __DIR__ ) ) ) ), Config::base() );
	}

	/**
	 * Test the changelogFile method.
	 */
	public function testChangelogFile() {
		$this->resetConfigCache();
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'CHANGELOG.md', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => 'changes.txt' ) );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changes.txt', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => '/tmp/changes.md' ) );
		$this->assertSame( '/tmp/changes.md', Config::changelogFile() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changelog' => 'c:\\changes.md' ) );
		$this->assertSame( 'c:\\changes.md', Config::changelogFile() );
	}

	/**
	 * Test the changesDir method.
	 */
	public function testChangesDir() {
		$this->resetConfigCache();
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changelog', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => 'changes' ) );
		$this->assertSame( getcwd() . DIRECTORY_SEPARATOR . 'changes', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => '/tmp/changes' ) );
		$this->assertSame( '/tmp/changes', Config::changesDir() );

		$this->resetConfigCache();
		$this->writeComposerJson( array( 'changes-dir' => 'c:\\changes' ) );
		$this->assertSame( 'c:\\changes', Config::changesDir() );
	}

	/**
	 * Test the link method.
	 */
	public function testLink() {
		$this->resetConfigCache();
		$w = TestingAccessWrapper::newFromClass( Config::class );

		$this->assertNull( Config::link( '1.2.3+A', '4.5.6+B' ) );

		$w->config = array(
			'link-template' => 'https://example.com/diff/${old}..${new}',
		);
		$this->assertSame(
			'https://example.com/diff/1.2.3%2BA..4.5.6%2BB',
			Config::link( '1.2.3+A', '4.5.6+B' )
		);
	}

	/**
	 * Test the ordering method.
	 */
	public function testOrdering() {
		$this->resetConfigCache();
		$w = TestingAccessWrapper::newFromClass( Config::class );

		$this->assertSame( $w->defaultConfig['ordering'], Config::ordering() );

		$w->config = array(
			'ordering' => array(
				'subheading',
				'bogus',
				123,
				'x' => 'y',
			),
		);

		// No change because of caching.
		$this->assertSame( $w->defaultConfig['ordering'], Config::ordering() );

		// Clear cache, now it changes.
		$w->cache = array();
		$this->assertSame(
			array(
				'subheading',
				'bogus',
				'123',
				'x' => 'y',
			),
			Config::ordering()
		);

		// Not really supported, but DWIM.
		$w->config = array(
			'ordering' => 'content',
		);
		$w->cache  = array();
		$this->assertSame( array( 'content' ), Config::ordering() );
	}

	/**
	 * Test the types method.
	 */
	public function testTypes() {
		$this->resetConfigCache();
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

	/**
	 * Test the getPlugin method.
	 */
	public function testGetPlugin() {
		$w = TestingAccessWrapper::newFromClass( Config::class );

		// Get plugin by class.
		$ret = $w->getPlugin(
			array(
				'class'  => DummyPluginImpl::class,
				'option' => 'value',
			),
			'Dummy',
			DummyPlugin::class
		);
		$this->assertInstanceOf( DummyPluginImpl::class, $ret );
		$this->assertSame(
			array(
				'class'  => DummyPluginImpl::class,
				'option' => 'value',
			),
			$ret->config
		);

		// Get plugin by name.
		class_alias( DummyPluginImpl::class, \Automattic\Jetpack\Changelogger\Plugins\FooDummy::class );
		$ret = $w->getPlugin( 'foo', 'Dummy', DummyPlugin::class );
		$this->assertInstanceOf( DummyPluginImpl::class, $ret );
		$this->assertSame( array( 'name' => 'foo' ), $ret->config );
		$ret = $w->getPlugin(
			array(
				'name'   => 'foo',
				'option' => 'value',
			),
			'Dummy',
			DummyPlugin::class
		);
		$this->assertInstanceOf( DummyPluginImpl::class, $ret );
		$this->assertSame(
			array(
				'name'   => 'foo',
				'option' => 'value',
			),
			$ret->config
		);

		// Get by loading file, valid file.
		$ns        = __NAMESPACE__;
		$classBody = 'implements \\' . DummyPlugin::class . " {\n\tuse \\" . PluginTrait::class . ";\n\tpublic function __construct( \$c ) { \$this->c = \$c; }\n}";
		file_put_contents(
			'dummy.php',
			"<?php\nnamespace $ns;\nclass TestFromFile $classBody\n"
		);
		$ret = $w->getPlugin(
			array(
				'filename' => 'dummy.php',
				'option'   => 'value',
			),
			'Dummy',
			DummyPlugin::class
		);
		$this->assertInstanceOf( __NAMESPACE__ . '\\TestFromFile', $ret );
		$this->assertSame(
			array(
				'filename' => 'dummy.php',
				'option'   => 'value',
			),
			$ret->c
		);

		// Get by loading file, file with no classes.
		file_put_contents( 'dummy2.php', "<?php\n" );
		$this->assertNull( $w->getPlugin( array( 'filename' => 'dummy2.php' ), 'Dummy', DummyPlugin::class ) );

		// Get by loading file, file with no valid classes.
		file_put_contents(
			'dummy3.php',
			"<?php\nnamespace $ns;\nclass TestFromFile3 {}\n"
		);
		$this->assertNull( $w->getPlugin( array( 'filename' => 'dummy3.php' ), 'Dummy', DummyPlugin::class ) );

		// Get by loading file, file with one valid class.
		file_put_contents(
			'dummy4.php',
			"<?php\nnamespace $ns;\nclass TestFromFile4a {}\nclass TestFromFile4b $classBody\n"
		);
		$ret = $w->getPlugin( array( 'filename' => 'dummy4.php' ), 'Dummy', DummyPlugin::class );
		$this->assertInstanceOf( __NAMESPACE__ . '\\TestFromFile4b', $ret );

		// Get by loading file, file with two valid class.
		file_put_contents(
			'dummy5.php',
			"<?php\nnamespace $ns;\nclass TestFromFile5a $classBody\nclass TestFromFile5b $classBody\n"
		);
		$this->assertNull( $w->getPlugin( array( 'filename' => 'dummy5.php' ), 'Dummy', DummyPlugin::class ) );

		// Test invalid class handling.
		$this->assertNull( $w->getPlugin( 'baz', 'Dummy', DummyPlugin::class ) );

		// Test a config array with no valid plugin specifier.
		$this->assertNull( $w->getPlugin( array(), 'Dummy', DummyPlugin::class ) );
	}

	/**
	 * Test the formatterPlugin method.
	 */
	public function testFormatterPlugin() {
		$this->resetConfigCache();

		$this->assertInstanceOf(
			\Automattic\Jetpack\Changelogger\Plugins\KeepachangelogFormatter::class,
			Config::formatterPlugin()
		);
	}

	/**
	 * Test the formatterPlugin method error case.
	 */
	public function testFormatterPlugin_error() {
		$this->resetConfigCache();
		$this->writeComposerJson( array( 'formatter' => array( 'class' => 'foobar' ) ) );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( "Unknown formatter plugin {\n    \"class\": \"foobar\"\n}" );
		Config::formatterPlugin();
	}

	/**
	 * Test the versioningPlugin method.
	 */
	public function testVersioningPlugin() {
		$this->resetConfigCache();

		$this->assertInstanceOf(
			\Automattic\Jetpack\Changelogger\Plugins\SemverVersioning::class,
			Config::versioningPlugin()
		);
	}

	/**
	 * Test the versioningPlugin method error case.
	 */
	public function testVersioningPlugin_error() {
		$this->resetConfigCache();
		$this->writeComposerJson( array( 'versioning' => array( 'class' => 'foobar' ) ) );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( "Unknown versioning plugin {\n    \"class\": \"foobar\"\n}" );
		Config::versioningPlugin();
	}

}
