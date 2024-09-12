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

	const SRC1 = <<<'EOF'
<?php
try {} catch ( Bad | In70 $e ) {}
function bad_in_71( object $o ) {}
bad_in_72( $a, $b, );
$bad_in_73 ??= true;
// TODO: More stuff for 8.0+ once PHPCompatibility 10 finally releases.

EOF;

	const SRC2 = <<<'EOF'
<?php
ini_get( 'assert.exception' );
ini_get( 'hard_timeout' );
ini_get( 'imap.enable_insecure_rsh' );
ini_get( 'session.cookie_samesite' );
ini_get( 'opcache.cache_id' );
ini_get( 'zend.exception_string_param_max_len' );
ini_get( 'fiber.stack_size' );
ini_get( 'error_log_mode' );
ini_get( 'zend.max_allowed_stack_size' );

EOF;

	/**
	 * Test the sniffs by running phpcs or phpcbf against a file.
	 *
	 * @dataProvider provide_standards
	 * @param string $standard Standard to run with.
	 * @param string $src Source to check.
	 * @param string $expect Expected output.
	 */
	public function test_phpcs( $standard, $src, $expect ) {
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
		Config::setConfigData( 'testVersion', '7.0-' );

		$ruleset = new Ruleset( $config );
		$dummy   = new DummyFile( $src, $ruleset, $config );
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
	 * @return \Generator<array>
	 */
	public function provide_standards() {
		$lines1 = array(
			' 2 | ERROR | Catching multiple exceptions within one statement is not supported in PHP 7.0 or earlier. (PHPCompatibility.ControlStructures.NewMultiCatch.Found)',
			' 3 | ERROR | \'object\' type declaration is not present in PHP version 7.1 or earlier (PHPCompatibility.FunctionDeclarations.NewParamTypeDeclarations.objectFound)',
			' 4 | ERROR | Trailing comma\'s are not allowed in function calls in PHP 7.2 or earlier (PHPCompatibility.Syntax.NewFunctionCallTrailingComma.FoundInFunctionCall)',
			' 5 | ERROR | null coalesce equal operator (??=) is not present in PHP version 7.3 or earlier (PHPCompatibility.Operators.NewOperators.t_coalesce_equalFound)',
		);

		yield array( 'Jetpack', self::SRC1, $lines1 );
		yield array( 'Jetpack-Compat-71', self::SRC1, array_slice( $lines1, 1 ) );
		yield array( 'Jetpack-Compat-72', self::SRC1, array_slice( $lines1, 2 ) );
		yield array( 'Jetpack-Compat-73', self::SRC1, array_slice( $lines1, 3 ) );
		yield array( 'Jetpack-Compat-74', self::SRC1, array_slice( $lines1, 4 ) );
		yield array( 'Jetpack-Compat-80', self::SRC1, array_slice( $lines1, 5 ) );
		yield array( 'Jetpack-Compat-81', self::SRC1, array_slice( $lines1, 6 ) );
		yield array( 'Jetpack-Compat-82', self::SRC1, array_slice( $lines1, 7 ) );
		yield array( 'Jetpack-Compat-83', self::SRC1, array_slice( $lines1, 8 ) );

		$lines2 = array(
			' 3 | WARNING | INI directive \'hard_timeout\' is not present in PHP version 7.0 or earlier (PHPCompatibility.IniDirectives.NewIniDirectives.hard_timeoutFound)',
			' 4 | WARNING | INI directive \'imap.enable_insecure_rsh\' is not present in PHP version 7.1.24 or earlier (PHPCompatibility.IniDirectives.NewIniDirectives.imap_enable_insecure_rshFound)',
			' 5 | WARNING | INI directive \'session.cookie_samesite\' is not present in PHP version 7.2 or earlier (PHPCompatibility.IniDirectives.NewIniDirectives.session_cookie_samesiteFound)',
			' 6 | WARNING | INI directive \'opcache.cache_id\' is not present in PHP version 7.3 or earlier (PHPCompatibility.IniDirectives.NewIniDirectives.opcache_cache_idFound)',
			// TODO: More lines for 8.0+ once PHPCompatibility 10 finally releases.
		);

		yield array( 'Jetpack', self::SRC2, $lines2 );
		yield array( 'Jetpack-Compat-71', self::SRC2, array_slice( $lines2, 1 ) );
		yield array( 'Jetpack-Compat-72', self::SRC2, array_slice( $lines2, 2 ) );
		yield array( 'Jetpack-Compat-73', self::SRC2, array_slice( $lines2, 3 ) );
		yield array( 'Jetpack-Compat-74', self::SRC2, array_slice( $lines2, 4 ) );
		yield array( 'Jetpack-Compat-80', self::SRC2, array_slice( $lines2, 5 ) );
		yield array( 'Jetpack-Compat-81', self::SRC2, array_slice( $lines2, 6 ) );
		yield array( 'Jetpack-Compat-82', self::SRC2, array_slice( $lines2, 7 ) );
		yield array( 'Jetpack-Compat-83', self::SRC2, array_slice( $lines2, 8 ) );
	}
}
