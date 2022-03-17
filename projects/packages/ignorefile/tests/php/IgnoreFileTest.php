<?php
/**
 * Tests for IgnoreFile.
 *
 * @package automattic/ignorefile
 */

namespace Automattic\IgnoreFile\Tests;

use ArrayIterator;
use Automattic\IgnoreFile;
use Automattic\IgnoreFile\InvalidPatternException;
use Exception;
use InvalidArgumentException;
use PHPUnit\Framework\ExpectationFailedException;
use PHPUnit\Framework\TestCase;
use PHPUnit_Framework_ExpectationFailedException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use function Wikimedia\quietCall;

/** Tests for IgnoreFile. */
class IgnoreFileTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Run test cases from IgnoreFileTestData.jsonc.
	 *
	 * @dataProvider provideCases
	 * @param string|string[] $patterns Patterns to test.
	 * @param string[]        $pathmap Paths to test.
	 */
	public function testCases( $patterns, $pathmap ) {
		$ignore = new IgnoreFile();
		$ignore->add( $patterns );
		foreach ( $pathmap as $path => $expect ) {
			$ret = $ignore->test( $path );
			unset( $ret['pattern'] );
			$this->assertEquals( $expect, $ret, "Testing $path" );
		}

		$paths  = array_keys( $pathmap );
		$expect = array_filter(
			$paths,
			function ( $path ) use ( $pathmap ) {
				return ! $pathmap[ $path ]['ignored'];
			}
		);
		$this->assertSame( $expect, $ignore->filter( $paths ) );

		$iter = $ignore->filterIterator( new ArrayIterator( $paths ) );
		$this->assertSame(
			$expect,
			iterator_to_array( $ignore->filterIterator( $iter ) )
		);
	}

	/** Data provider for testCases(). */
	public function provideCases() {
		$map = array(
			'nomatch'              => array(
				'ignored'   => false,
				'unignored' => false,
			),
			'ignored'              => array(
				'ignored'   => true,
				'unignored' => false,
			),
			'unignored'            => array(
				'ignored'   => false,
				'unignored' => true,
			),
			'unignored_gitnomatch' => array(
				'ignored'   => false,
				'unignored' => true,
			),
		);

		$data = file_get_contents( __DIR__ . '/IgnoreFileTestData.jsonc' );
		$data = preg_replace( '#^\s*//.*$#m', '', $data );
		$data = json_decode( $data, true );
		foreach ( $data as $name => $obj ) {
			foreach ( $obj['expects'] as &$v ) {
				$v = $map[ $v ];
			}
			unset( $v );

			yield $name => array(
				$obj['rules'],
				$obj['expects'],
			);
		}
	}

	/**
	 * Create a temporary directory.
	 *
	 * @return string
	 * @throws RuntimeException On error.
	 */
	private function mktempdir() {
		$base = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'phpunit-IgnoreFileTest-';
		$mask = rand( 0, 0xffffff );
		for ( $i = 0; $i < 0xffffff; $i++ ) {
			$tmpdir = $base . sprintf( '%06x', $i ^ $mask );
			if ( quietCall( 'mkdir', $tmpdir, 0700 ) ) {
				return $tmpdir;
			}
		}
		throw new RuntimeException( 'Failed to create temporary directory' );
	}

	/**
	 * Delete a directory.
	 *
	 * @param string $dir Directory to remove.
	 */
	private function rmrf( $dir ) {
		$iter = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $dir, \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path ) {
			if ( is_dir( $path ) ) {
				rmdir( $path );
			} else {
				unlink( $path );
			}
		}
		rmdir( $dir );
	}

	/**
	 * Test testcases against `git`.
	 *
	 * @dataProvider provideCasesGit
	 * @param string|string[] $patterns Patterns to test.
	 * @param string[]        $pathmap Paths to test.
	 * @param bool            $skip Skip, if git does not handle the pattern according to its own docs.
	 * @throws RuntimeException If subprocess spawning fails.
	 * @throws Exception If a PHPUnit exception fails 🙄 .
	 */
	public function testCasesGit( $patterns, $pathmap, $skip = false ) {
		$tmpdir = $this->mktempdir();
		try {
			shell_exec( 'git init ' . escapeshellarg( $tmpdir ) . ' 2>&1' );
			file_put_contents( "$tmpdir/.gitignore", is_array( $patterns ) ? implode( "\n", $patterns ) . "\n" : $patterns );
			foreach ( $pathmap as $path => $expect ) {
				$p = proc_open(
					'git check-ignore -v -z --stdin',
					array(
						array( 'pipe', 'r' ),
						array( 'pipe', 'w' ),
						STDERR,
					),
					$pipes,
					$tmpdir
				);
				if ( ! is_resource( $p ) ) {
					throw new RuntimeException( 'proc_open failed' );
				}
				fwrite( $pipes[0], $path );
				fclose( $pipes[0] );
				$ret = stream_get_contents( $pipes[1] );
				fclose( $pipes[1] );
				proc_close( $p );

				$actual = array(
					'ignored'   => false,
					'unignored' => false,
				);
				if ( '' !== $ret ) {
					$ret = explode( "\0", $ret );
					$this->assertSame( '.gitignore', $ret[0], "Testing $path" );
					$this->assertSame( $path, $ret[3], "Testing $path" );
					$actual = array(
						'ignored'   => '!' !== $ret[2][0],
						'unignored' => '!' === $ret[2][0],
					);
				}
				$this->assertEquals( $expect, $actual, "Testing $path" );
			}
			if ( $skip ) {
				$this->addWarning( 'This test is marked as "nogit" but passes. Maybe the "nogit" can be removed?' );
			}
		} catch ( Exception $ex ) {
			if ( $skip && ( $ex instanceof PHPUnit_Framework_ExpectationFailedException || $ex instanceof ExpectationFailedException ) ) {
				$this->markTestSkipped( 'Git doesn\'t match its own docs' );
			} else {
				throw $ex;
			}
		} finally {
			$this->rmrf( $tmpdir );
		}
	}

	/** Data provider for testCasesGit(). */
	public function provideCasesGit() {
		$git = shell_exec( 'command -v git 2>/dev/null' );
		if ( ! $git ) {
			$this->markTestSkipped( 'Git (or a POSIX shell) is unavailable' );
		}

		$map = array(
			'nomatch'              => array(
				'ignored'   => false,
				'unignored' => false,
			),
			'ignored'              => array(
				'ignored'   => true,
				'unignored' => false,
			),
			'unignored'            => array(
				'ignored'   => false,
				'unignored' => true,
			),
			'unignored_gitnomatch' => array(
				'ignored'   => false,
				'unignored' => false,
			),
		);

		$data = file_get_contents( __DIR__ . '/IgnoreFileTestData.jsonc' );
		$data = preg_replace( '#^\s*//.*$#m', '', $data );
		$data = json_decode( $data, true );
		foreach ( $data as $name => $obj ) {
			foreach ( $obj['expects'] as &$v ) {
				$v = $map[ $v ];
			}
			unset( $v );

			yield $name => array(
				$obj['rules'],
				$obj['expects'],
				! empty( $obj['nogit'] ),
			);
		}
	}

	/** Test add() with a bad prefix. */
	public function testAdd_badPrefix() {
		$ignore = new IgnoreFile();

		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Prefix must end in `/`' );
		$ignore->add( array(), '.' );
	}

	/** Test add() with a prefix containing newlines. */
	public function testAdd_badNewlines() {
		$ignore = new IgnoreFile();

		$this->expectException( InvalidPatternException::class );
		$this->expectExceptionMessage( 'Pattern at index 1 may not contain newlines' );
		$ignore->add( array( 'foo', "bar\nbaz" ) );
	}

	/** Test add() with an empty pattern. */
	public function testAdd_emptyPattern() {
		$ignore = new IgnoreFile();

		$this->expectException( InvalidPatternException::class );
		$this->expectExceptionMessage( 'Pattern at index 3 consists of only `!`' );
		$ignore->add( array( '', '!bar', '\\!', '!' ) );
	}

	/** Test add() copying from another IgnoreFile. */
	public function testAdd_copy() {
		$ignore1 = new IgnoreFile();
		$ignore1->add( 'foo' );
		$ignore2 = new IgnoreFile();
		$ignore2->add( 'bar' );

		$ignore = new IgnoreFile();
		$ignore->add( $ignore1 );
		$this->assertTrue( $ignore->ignores( 'foo' ) );
		$this->assertFalse( $ignore->ignores( 'bar' ) );
		$this->assertFalse( $ignore->ignores( 'baz' ) );

		$ignore = new IgnoreFile();
		$ignore->add( array( 'baz', $ignore2 ) );
		$this->assertFalse( $ignore->ignores( 'foo' ) );
		$this->assertTrue( $ignore->ignores( 'bar' ) );
		$this->assertTrue( $ignore->ignores( 'baz' ) );
	}

	/** Test passing an SplFileInfo. */
	public function testTest_SplFileInfo() {
		$cwd    = getcwd();
		$tmpdir = $this->mktempdir();
		try {
			chdir( $tmpdir );

			file_put_contents( "$tmpdir/foo", '' );
			$foo = new SplFileInfo( 'foo' );

			mkdir( "$tmpdir/bar" );
			$bar = new SplFileInfo( 'bar' );

			$ignore = new IgnoreFile();
			$this->assertFalse( $ignore->ignores( $foo ) );
			$this->assertFalse( $ignore->ignores( $bar ) );
			$ignore->add( 'foo/' );
			$ignore->add( 'bar/' );
			$this->assertFalse( $ignore->ignores( $foo ) );
			$this->assertTrue( $ignore->ignores( $bar ) );
		} finally {
			chdir( $cwd );
			$this->rmrf( $tmpdir );
		}
	}

	/** Test passing a RecursiveDirectoryIterator. */
	public function testTest_RecursiveDirectoryIterator() {
		$cwd    = getcwd();
		$tmpdir = $this->mktempdir();
		try {
			chdir( $tmpdir );

			file_put_contents( "$tmpdir/ok", '' );
			file_put_contents( "$tmpdir/skip", '' );
			mkdir( "$tmpdir/a" );
			file_put_contents( "$tmpdir/a/skip", '' );
			mkdir( "$tmpdir/a/b" );
			file_put_contents( "$tmpdir/a/b/ok", '' );
			mkdir( "$tmpdir/x" );
			mkdir( "$tmpdir/x/skip" );
			file_put_contents( "$tmpdir/x/skip/nope", '' );

			$ignore = new IgnoreFile();
			$ignore->add( 'skip' );
			$files = array_keys(
				iterator_to_array(
					new RecursiveIteratorIterator(
						$ignore->filterIterator(
							new RecursiveDirectoryIterator( $tmpdir, RecursiveDirectoryIterator::SKIP_DOTS )
						)
					)
				)
			);
			sort( $files );
			$this->assertSame(
				array(
					"$tmpdir/a/b/ok",
					"$tmpdir/ok",
				),
				$files
			);
		} finally {
			chdir( $cwd );
			$this->rmrf( $tmpdir );
		}
	}

	/** Test prefix handling. */
	public function testTest_prefix() {
		$ignore = new IgnoreFile();
		$ignore->add( 'foo' );
		$ignore->add( '/bar' );
		$ignore->add( 'baz', 'subdir/' );
		$ignore->add( '/quux', 'subdir/' );

		$this->assertTrue( $ignore->ignores( 'foo' ) );
		$this->assertTrue( $ignore->ignores( 'subdir/foo' ) );
		$this->assertTrue( $ignore->ignores( 'subdir/another/foo' ) );
		$this->assertTrue( $ignore->ignores( 'subdir2/foo' ) );
		$this->assertTrue( $ignore->ignores( 'subdir2/subdir/foo' ) );

		$this->assertTrue( $ignore->ignores( 'bar' ) );
		$this->assertFalse( $ignore->ignores( 'subdir/bar' ) );
		$this->assertFalse( $ignore->ignores( 'subdir/another/bar' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/bar' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/subdir/bar' ) );

		$this->assertFalse( $ignore->ignores( 'baz' ) );
		$this->assertTrue( $ignore->ignores( 'subdir/baz' ) );
		$this->assertTrue( $ignore->ignores( 'subdir/another/baz' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/baz' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/subdir/baz' ) );

		$this->assertFalse( $ignore->ignores( 'quux' ) );
		$this->assertTrue( $ignore->ignores( 'subdir/quux' ) );
		$this->assertFalse( $ignore->ignores( 'subdir/another/quux' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/quux' ) );
		$this->assertFalse( $ignore->ignores( 'subdir2/subdir/quux' ) );
	}

	/**
	 * Test handling of bad patterns.
	 *
	 * @dataProvider provideBadPattern
	 * @param string $pattern Pattern.
	 * @param string $msg Exception message.
	 */
	public function testBadPattern( $pattern, $msg ) {
		$ignore = new IgnoreFile();
		$this->expectException( InvalidPatternException::class );
		$this->expectExceptionMessage( $msg );
		$ignore->add( array( $pattern ) );
	}

	/** Data provider for testBadPattern(). */
	public function provideBadPattern() {
		return array(
			'Collating symbol'             => array( 'foo[[.-.]]bar', 'Collating symbols (`[.` inside a bracket expression) are not supported (in pattern at index 0)' ),
			'Collating symbol (2)'         => array( 'foo[x[.-.]y]bar', 'Collating symbols (`[.` inside a bracket expression) are not supported (in pattern at index 0)' ),
			'Equivalence class'            => array( 'foo[[=a=]]bar', 'Equivalence classes (`[=` inside a bracket expression) are not supported (in pattern at index 0)' ),
			'Equivalence class (2)'        => array( 'foo[x[=a=]y]bar', 'Equivalence classes (`[=` inside a bracket expression) are not supported (in pattern at index 0)' ),
			'Unclosed character class'     => array( 'foo[[:alpha]]bar', 'Invalid character class in bracket expression near `[:alpha]]bar` (in pattern at index 0)' ),
			'Unrecognized character class' => array( 'foo[[:bogus:]]bar', 'Unrecognized character class [:bogus:] in bracket expression (in pattern at index 0)' ),
			'Trailing backslash'           => array( 'foo\\', 'Unexpected trailing backslash in pattern `foo\\` at index 0' ),
			'Trailing backslash in something looking like a character class' => array( 'foo[ab\\', 'Unexpected trailing backslash in pattern `foo[ab\\` at index 0' ),
			'Trailing backslash in something looking like a character class range' => array( 'foo[a-\\', 'Unexpected trailing backslash in pattern `foo[a-\\` at index 0' ),
		);
	}

}
