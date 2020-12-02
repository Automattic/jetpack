<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the Jetpack phpcs standard.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\Tests;

use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Files\DummyFile;
use PHP_CodeSniffer\Reporter;
use PHP_CodeSniffer\Ruleset;
use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;

/**
 * Tests for the Jetpack phpcs standard.
 */
class JetpackStandardTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * Run phpcs on a file.
	 *
	 * @param string $file File to process. Actual data will be read from "$file.tolint".
	 * @param bool   $fix Run in fix mode, returning the fixed file.
	 * @return string If `$fix` is false, the phpcs report. If `$fix` is true,
	 *   the fixed file.
	 */
	private function run_phpcs( $file, $fix ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$contents = file_get_contents( "{$file}.tolint" );
		$this->assertIsString( $contents );

		$config = new Config();

		$config->standards   = array( __DIR__ . '/../../../Jetpack/ruleset.xml' );
		$config->files       = array( $file );
		$config->encoding    = 'utf-8';
		$config->reports     = array( 'full' => null );
		$config->colors      = false;
		$config->reportWidth = PHP_INT_MAX; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$config->showSources = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$config->tabWidth    = 4; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$config->exclude     = array(
			'Generic.PHP.Syntax', // Tries to use `PHP_BINARY` to shell out to `php -l`, which breaks if tests are being run under phpdbg for coverage.
		);

		$ruleset = new Ruleset( $config );
		$dummy   = new DummyFile( $contents, $ruleset, $config );
		$dummy->process();

		if ( ! $fix ) {
			$reporter = new Reporter( $config );
			$reporter->cacheFileReport( $dummy );
			ob_start();
			$reporter->printReport( 'full' );
			$result = ob_get_clean();

			// Clean up output.
			$lines = preg_split( '/[\r\n]+/', $result, -1, PREG_SPLIT_NO_EMPTY );
			$lines = preg_grep( '/^-*$|^(?:Time:|FILE:|FOUND|PHPCBF) /', $lines, PREG_GREP_INVERT );
			return implode( "\n", $lines ) . "\n";
		} elseif ( $dummy->getFixableCount() ) {
			$dummy->fixer->fixFile();
			return $dummy->fixer->getContents();
		} else {
			return $contents;
		}
	}

	/**
	 * Test the sniffs by running phpcs or phpcbf against a file.
	 *
	 * @dataProvider provide_files
	 * @param string $file Base filename, without the ".tolint", ".report", or ".fixed" extension.
	 * @param bool   $fix Run as phpcbf rather than phpcs.
	 */
	public function test_phpcs( $file, $fix ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$expect = file_get_contents( $fix ? "$file.fixed" : "$file.report" );
		$this->assertIsString( $expect );
		$this->assertEquals( $expect, $this->run_phpcs( $file, $fix ) );
	}

	/**
	 * Provide arguments for `test_phpcs()`.
	 *
	 * @return array
	 */
	public function provide_files() {
		$dir_iterator = new RecursiveDirectoryIterator( __DIR__ . '/files', RecursiveDirectoryIterator::CURRENT_AS_PATHNAME );
		$iterator     = new RegexIterator(
			new RecursiveIteratorIterator( $dir_iterator ),
			'/\.(?:tolint|report|fixed)$/'
		);
		$files        = iterator_to_array( $iterator );

		$ret = array();
		foreach ( $files as $file => $dummy ) {
			$i    = strrpos( $file, '.' );
			$ext  = substr( $file, $i );
			$file = substr( $file, 0, $i );

			switch ( $ext ) {
				case '.tolint':
					if ( ! isset( $files[ "$file.report" ] ) && ! isset( $files[ "$file.fixed" ] ) ) {
						fprintf( STDERR, "%s: %s.tolint exists, but both %s.report and %s.fixed are missing.\n", __METHOD__, $file, $file, $file );
					}
					break;

				case '.report':
				case '.fixed':
					if ( isset( $files[ "$file.tolint" ] ) ) {
						$ret[ "$file$ext" ] = array( $file, '.fixed' === $ext );
					} else {
						fprintf( STDERR, "%s: %s exists, but %s.tolint is missing.\n", __METHOD__, $file . $ext, $file );
					}
					break;
			}
		}

		return $ret;
	}

}
