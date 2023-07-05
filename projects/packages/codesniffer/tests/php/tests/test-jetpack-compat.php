<?php
/**
 * Tests for the Jetpack-Compat-* phpcs standards.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\Tests;

use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Files\DummyFile;
use PHP_CodeSniffer\Reporter;
use PHP_CodeSniffer\Ruleset;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Jetpack-Compat-* phpcs standards.
 */
class JetpackCompatTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	const SRC = <<<'EOF'
<?php
function bad_in_56( bool $b ) {}
try {} catch ( Bad | In70 $e ) {}
function bad_in_71( object $o ) {}
bad_in_72( $a, $b, );
$bad_in_73 ??= true;
// TODO: More stuff for 8.0+ once PHPCompatibility 10 finally releases.
EOF;

	/**
	 * Test the sniffs by running phpcs or phpcbf against a file.
	 *
	 * @dataProvider provide_standards
	 * @param string $standard Standard to run with.
	 * @param string $expect Expected output.
	 */
	public function test_phpcs( $standard, $expect ) {
		$config = new Config();

		$config->standards   = array( $standard );
		$config->files       = array( 'dummy.php' );
		$config->encoding    = 'utf-8';
		$config->reports     = array( 'full' => null );
		$config->colors      = false;
		$config->reportWidth = PHP_INT_MAX;
		$config->showSources = true;
		$config->tabWidth    = 4;
		$config->exclude     = array(
			'Generic.PHP.Syntax', // Shells out to `php -l`, which is kind of slow.
			'Jetpack.Functions.I18n', // Needs config.
			// Don't care to make our simple test code pass these.
			'Generic.CodeAnalysis.EmptyStatement',
			'Generic.Files.EndFileNewline',
			'Squiz.Commenting.EmptyCatchComment',
			'Squiz.Commenting.FileComment',
			'Squiz.Commenting.FunctionComment',
			'Squiz.ControlStructures.ControlSignature',
			'VariableAnalysis.CodeAnalysis.VariableAnalysis',
			'WordPress.WhiteSpace.ControlStructureSpacing',
		);
		Config::setConfigData( 'testVersion', '5.6-' );

		$ruleset = new Ruleset( $config );
		$dummy   = new DummyFile( self::SRC, $ruleset, $config );
		$dummy->process();

		$reporter = new Reporter( $config );
		$reporter->cacheFileReport( $dummy );
		ob_start();
		$reporter->printReport( 'full' );
		$result = ob_get_clean();

		// Clean up output.
		$result = preg_replace( '/[\r\n]+ +\| +\| /', ' ', $result );
		$actual = preg_split( '/[\r\n]+/', $result, -1, PREG_SPLIT_NO_EMPTY );
		$actual = preg_grep( '/^-*$|^(?:Time:|FILE:|FOUND|PHPCBF) /', $actual, PREG_GREP_INVERT );
		$actual = array_values( $actual );

		$this->assertEquals( $expect, $actual );
	}

	/**
	 * Provide arguments for `test_phpcs()`.
	 *
	 * @return array
	 */
	public function provide_standards() {
		$lines = array(
			' 2 | ERROR | \'bool\' type declaration is not present in PHP version 5.6 or earlier (PHPCompatibility.FunctionDeclarations.NewParamTypeDeclarations.boolFound)',
			' 3 | ERROR | Catching multiple exceptions within one statement is not supported in PHP 7.0 or earlier. (PHPCompatibility.ControlStructures.NewMultiCatch.Found)',
			' 4 | ERROR | \'object\' type declaration is not present in PHP version 7.1 or earlier (PHPCompatibility.FunctionDeclarations.NewParamTypeDeclarations.objectFound)',
			' 5 | ERROR | Trailing comma\'s are not allowed in function calls in PHP 7.2 or earlier (PHPCompatibility.Syntax.NewFunctionCallTrailingComma.FoundInFunctionCall)',
			' 6 | ERROR | null coalesce equal operator (??=) is not present in PHP version 7.3 or earlier (PHPCompatibility.Operators.NewOperators.t_coalesce_equalFound)',
		);

		yield array( 'Jetpack', $lines );
		yield array( 'Jetpack-Compat-70', array_slice( $lines, 1 ) );
		yield array( 'Jetpack-Compat-71', array_slice( $lines, 2 ) );
		yield array( 'Jetpack-Compat-72', array_slice( $lines, 3 ) );
		yield array( 'Jetpack-Compat-73', array_slice( $lines, 4 ) );
		yield array( 'Jetpack-Compat-74', array_slice( $lines, 5 ) );
		yield array( 'Jetpack-Compat-80', array_slice( $lines, 5 ) );
		yield array( 'Jetpack-Compat-81', array_slice( $lines, 5 ) );
		yield array( 'Jetpack-Compat-82', array_slice( $lines, 5 ) );
	}

}
