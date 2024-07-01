<?php
/**
 * Tests for stdin-bootstrap.php.
 *
 * @package automattic/jetpack-phpcs-filter
 */

namespace Automattic\Jetpack\PhpcsFilter\Tests;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

/**
 * Tests for stdin-bootstrap.php.
 */
class StdinBootstrapTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	private function runPhpcs( $args, $content ) {
		$args = array_merge(
			array(
				'--report=json',
				'--bootstrap=' . __DIR__ . '/../../stdin-bootstrap.php',
				'--filter=' . __DIR__ . '/../../src/PhpcsFilter.php',
			),
			$args
		);

		$phpcs = __DIR__ . '/../../vendor/bin/phpcs';
		if ( PHP_VERSION_ID >= 70400 ) {
			$cmd = array_merge( array( $phpcs ), $args );
		} else {
			$cmd = $phpcs;
			foreach ( $args as $arg ) {
				$cmd .= ' ' . escapeshellarg( $arg );
			}
		}
		$p = proc_open(
			$cmd,
			array(
				array( 'pipe', 'r' ),
				array( 'pipe', 'w' ),
				STDERR,
			),
			$pipes,
			__DIR__ . '/../fixtures/perdir'
		);
		if ( ! is_resource( $p ) ) {
			throw new RuntimeException( 'proc_open failed' );
		}
		fwrite( $pipes[0], $content );
		fclose( $pipes[0] );
		$ret = stream_get_contents( $pipes[1] );
		fclose( $pipes[1] );
		proc_close( $p );

		$data = json_decode( $ret, true );
		$this->assertIsArray( $data, 'phpcs output contains a JSON object' );

		$fileData = array_values( $data['files'] );
		$messages = $fileData[0]['messages'] ?? array();

		$actual = array();
		foreach ( $messages as $m ) {
			$actual[] = "Line {$m['line']}: {$m['source']}";
		}
		return $actual;
	}

	/**
	 * @dataProvider provideFiles
	 */
	public function testStdinPath( $file, $contents, $expect ) {
		$ret = $this->runPhpcs(
			array(
				"--stdin-path=$file",
			),
			$contents
		);

		$this->assertSame( $expect, $ret );
	}

	/**
	 * @dataProvider provideFiles
	 */
	public function testOldMethod( $file, $contents, $expect ) {
		$ret = $this->runPhpcs(
			array(),
			"phpcs_input_file:$file\n$contents"
		);

		$this->assertSame( $expect, $ret );
	}

	public function provideFiles() {
		$dir = __DIR__ . '/../fixtures/perdir';

		$expect = json_decode( file_get_contents( "$dir/expect.json" ), true );
		$this->assertIsArray( $expect, 'expect.json contains a JSON object' );

		$l    = strlen( $dir ) + 1;
		$iter = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS | RecursiveDirectoryIterator::CURRENT_AS_PATHNAME ) );
		foreach ( $iter as $path ) {
			$file = substr( $path, $l );
			if ( $file === 'excludedfile.php' || $file === 'exclude-pattern/excluded1.php' || substr( $file, -4 ) !== '.php' ) {
				continue;
			}
			$contents = file_get_contents( $path );
			yield array( $file, $contents, $expect[ $file ] ?? array() );
		}
	}
}
