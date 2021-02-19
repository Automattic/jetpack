<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test base class for changelog parsers.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\Changelog;
use Automattic\Jetpack\Changelog\Parser;
use Exception;
use PHPUnit\Framework\TestCase;

/**
 * Test base class for changelog parsers.
 */
class ParserTestCase extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Parser class being tested.
	 *
	 * @var string
	 */
	protected $className;

	/**
	 * Fixture file glob.
	 *
	 * @var string
	 */
	protected $fixtures;

	/**
	 * Set to update fixture files instead of running tests.
	 *
	 * @var bool
	 */
	protected $updateFixtures = false;

	/**
	 * Create the parser object to test.
	 *
	 * @param array $args Arguments to pass to the constructor.
	 * @return Parser
	 */
	protected function newParser( array $args ) {
		$class = $this->className;
		return new $class( ...$args );
	}

	/**
	 * Write a fixture file.
	 *
	 * @param string $filename Filename to write.
	 * @param array  $data Fixture data.
	 *   - args: (array) Arguments to pass to the constructor.
	 *   - changelog: (string) Changelog file. Required for testing `parse()`.
	 *   - object: (Changelog) Changelog object. Required for testing `format()`.
	 *   - parse-output: (Changelog) Changelog object to expect from `parse()`. If this and `parse-exception` are omitted, `object` will be expected.
	 *   - format-output: (string|Exception) Changelog text or Exception to expect from `format()`. If omitted, `changelog` will be expected.
	 */
	protected function writeFixture( $filename, array $data ) {
		$this->assertTrue( defined( 'JSON_THROW_ON_ERROR' ) );
		$this->assertTrue( isset( $data['changelog'] ) || isset( $data['object'] ), 'Must provide at least one of "changelog" or "object"' );
		$this->assertFalse( isset( $data['parse-output'] ) && isset( $data['parse-exception'] ), 'Cannot provide both "parse-output" and "parse-exception".' );
		$this->assertFalse( isset( $data['format-output'] ) && isset( $data['format-exception'] ), 'Cannot provide both "format-output" and "format-exception".' );
		$jsonFlags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR; // phpcs:ignore PHPCompatibility.Constants.NewConstants.json_throw_on_errorFound

		$contents = "# Parser text fixture file\n";
		if ( ! empty( $data['args'] ) ) {
			$this->assertIsArray( $data['args'] );
			$contents .= "\n## Constructor args\n";
			$contents .= "  ~~~~~~~~json args\n";
			$contents .= '  ' . str_replace( "\n", "\n  ", json_encode( $data['args'], $jsonFlags ) ) . "\n";
			$contents .= "  ~~~~~~~~\n";
		}
		if ( isset( $data['changelog'] ) ) {
			$this->assertIsString( $data['changelog'] );
			$contents .= "\n## Changelog file\n";
			$contents .= "  ~~~~~~~~markdown changelog\n";
			$contents .= '  ' . str_replace( "\n", "\n  ", $data['changelog'] ) . "\n";
			$contents .= "  ~~~~~~~~\n";
		}
		if ( isset( $data['object'] ) ) {
			$this->assertInstanceOf( Changelog::class, $data['object'] );
			$contents .= "\n## Changelog object\n";
			$contents .= "  ~~~~~~~~json object\n";
			$contents .= '  ' . str_replace( "\n", "\n  ", json_encode( $data['object'], $jsonFlags ) ) . "\n";
			$contents .= "  ~~~~~~~~\n";
		}
		if ( isset( $data['changelog'] ) ) {
			if ( isset( $data['parse-exception'] ) ) {
				$this->assertInstanceOf( Exception::class, $data['parse-exception'] );
				$contents .= "\n## Expected exception from `parse()`\n";
				$contents .= "  ~~~~~~~~text parse-exception\n";
				$contents .= '  ' . get_class( $data['parse-exception'] ) . "\n";
				$contents .= '  ' . str_replace( "\n", "\n  ", $data['parse-exception']->getMessage() ) . "\n";
				$contents .= "  ~~~~~~~~\n";
			} elseif ( isset( $data['parse-output'] ) && ! ( isset( $data['object'] ) && $data['object'] == $data['parse-output'] ) ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				$this->assertInstanceOf( Changelog::class, $data['parse-output'] );
				$contents .= "\n## Expected output from `parse()`\n";
				$contents .= "  ~~~~~~~~json parse-output\n";
				$contents .= '  ' . str_replace( "\n", "\n  ", json_encode( $data['parse-output'], $jsonFlags ) ) . "\n";
				$contents .= "  ~~~~~~~~\n";
			} elseif ( ! isset( $data['object'] ) ) {
				$this->fail( 'At least one of "object", "parse-output", or "parse-exception" is required when "changelog" is given.' );
			}
		}
		if ( isset( $data['object'] ) ) {
			if ( isset( $data['format-exception'] ) ) {
				$this->assertInstanceOf( Exception::class, $data['format-exception'] );
				$contents .= "\n## Expected exception from `format()`\n";
				$contents .= "  ~~~~~~~~text format-exception\n";
				$contents .= '  ' . get_class( $data['format-exception'] ) . "\n";
				$contents .= '  ' . str_replace( "\n", "\n  ", $data['format-exception']->getMessage() ) . "\n";
				$contents .= "  ~~~~~~~~\n";
			} elseif ( isset( $data['format-output'] ) && ! ( isset( $data['changelog'] ) && $data['changelog'] == $data['format-output'] ) ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				$this->assertIsString( $data['format-output'] );
				$contents .= "\n## Expected output from `format()`\n";
				$contents .= "  ~~~~~~~~markdown format-output\n";
				$contents .= '  ' . str_replace( "\n", "\n  ", $data['format-output'] ) . "\n";
				$contents .= "  ~~~~~~~~\n";
			} elseif ( ! isset( $data['changelog'] ) ) {
				$this->fail( 'At least one of "changelog", "format-output", or "format-exception" is required when "object" is given.' );
			}
		}

		file_put_contents( $filename, $contents );
	}

	/**
	 * Run tests using fixture files.
	 *
	 * @dataProvider provideFixture
	 * @param string $filename Fixture file name.
	 * @throws Exception On all sorts of failures. Duh.
	 */
	public function testFixture( $filename ) {
		$contents = file_get_contents( $filename );
		$this->assertIsString( $contents, 'Fixture contents cannot be fetched' );
		if ( ! preg_match_all( '/^( {0,3})~~~~~~~~\S* (\S+)\n(.*?)\n {0,3}~~~~~~~~$/sm', $contents, $m, PREG_SET_ORDER ) ) {
			$this->fail( 'Fixture is invalid' );
		}
		$data = array( 'args' => array() );
		foreach ( $m as list( , $indent, $key, $value ) ) {
			if ( strlen( $indent ) > 0 ) {
				$value = preg_replace( '/^ {0,' . strlen( $indent ) . '}/m', '', $value );
			}
			switch ( $key ) {
				case 'args':
					$data[ $key ] = json_decode( $value, true );
					$this->assertIsArray( $data[ $key ] );
					break;
				case 'object':
				case 'parse-output':
					$data[ $key ] = Changelog::jsonUnserialize( json_decode( $value, true ) );
					break;
				case 'parse-exception':
				case 'format-exception':
					list( $class, $message ) = explode( "\n", $value, 2 );
					$this->assertTrue( is_a( $class, Exception::class, true ), "$class is not an Exception" );
					$data[ $key ] = new $class( $message );
					break;
				case 'changelog':
				case 'format-output':
					$data[ $key ] = $value;
					break;
				default:
					$this->fail( "Unknown fixture key $key" );
			}
		}
		$this->assertTrue( isset( $data['changelog'] ) || isset( $data['object'] ), 'Must provide at least one of "changelog" or "object"' );
		$this->assertFalse( isset( $data['parse-output'] ) && isset( $data['parse-exception'] ), 'Cannot provide both "parse-output" and "parse-exception".' );
		$this->assertFalse( isset( $data['format-output'] ) && isset( $data['format-exception'] ), 'Cannot provide both "format-output" and "format-exception".' );

		$parser = $this->newParser( $data['args'] );

		try {
			if ( isset( $data['changelog'] ) ) {
				if ( isset( $data['parse-exception'] ) ) {
					try {
						$parser->parse( $data['changelog'] );
						$this->fail( 'Expected exception not thrown from parse()' );
					} catch ( Exception $ex ) {
						$this->assertInstanceOf( get_class( $data['parse-exception'] ), $ex, 'Expected exception from parse()' );
						$this->assertStringContainsString( $data['parse-exception']->getMessage(), $ex->getMessage(), 'Expected exception from parse()' );
					}
				} else {
					$expect = isset( $data['parse-output'] ) ? $data['parse-output'] : $data['object'];
					$this->assertEquals( $expect, $parser->parse( $data['changelog'] ), 'Output from parse()' );
				}
			}
			if ( isset( $data['object'] ) ) {
				if ( isset( $data['format-exception'] ) ) {
					try {
						$parser->format( $data['object'] );
						$this->fail( 'Expected exception not thrown from format()' );
					} catch ( Exception $ex ) {
						$this->assertInstanceOf( get_class( $data['format-exception'] ), $ex, 'Expected exception from format()' );
						$this->assertStringContainsString( $data['format-exception']->getMessage(), $ex->getMessage(), 'Expected exception from format()' );
					}
				} else {
					$expect = isset( $data['format-output'] ) ? $data['format-output'] : $data['changelog'];
					$this->assertEquals( $expect, $parser->format( $data['object'] ), 'Output from format()' );
				}
			}
		} catch ( Exception $ex ) {
			if ( $this->updateFixtures ) {
				unset( $data['parse-output'], $data['parse-exception'], $data['format-output'], $data['format-exception'] );
				if ( isset( $data['changelog'] ) ) {
					try {
						$data['parse-output'] = $parser->parse( $data['changelog'] );
					} catch ( Exception $ex ) {
						$data['parse-exception'] = $ex;
					}
				}
				if ( isset( $data['object'] ) ) {
					try {
						$data['format-output'] = $parser->format( $data['object'] );
					} catch ( Exception $ex ) {
						$data['format-exception'] = $ex;
					}
				}
				$this->writeFixture( $filename, $data );
			}
			throw $ex;
		}
		if ( $this->updateFixtures ) {
			$this->writeFixture( $filename, $data );
		}
	}

	/**
	 * Data provider for testFixture.
	 */
	public function provideFixture() {
		$ret = array();
		foreach ( glob( $this->fixtures ) as $filename ) {
			$ret[ basename( $filename ) ] = array( $filename );
		}
		return $ret;
	}

	/**
	 * Test that updateFixtures is not set, so CI will not allow merge if it is.
	 */
	public function testUpdateFixtures() {
		$this->assertFalse( $this->updateFixtures );
	}

}
