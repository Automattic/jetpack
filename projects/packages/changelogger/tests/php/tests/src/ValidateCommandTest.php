<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger validate command.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelogger\Tests;

use Symfony\Component\Console\Output\OutputInterface;

/**
 * Tests for the changelogger validate command.
 *
 * @covers \Automattic\Jetpack\Changelogger\ValidateCommand
 */
class ValidateCommandTest extends CommandTestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;

	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		$this->useTempDir();

		mkdir( 'changelog' );
		file_put_contents( 'changelog/.gitkeep', '' );
		file_put_contents( 'changelog/good', "Significance: minor\nType: added\nComment: This is a comment\n\nEntry.\n" );
		file_put_contents( 'changelog/no-entry-is-patch', "Significance: patch\nType: added\nComment: This is a comment\n\n" );
		file_put_contents( 'changelog/unknown-header', "Significance: minor\nType: added\nBogus: foo\n\nEntry.\n" );
		file_put_contents( 'changelog/no-entry-not-patch', "Significance: minor\nType: added\nComment: This is a comment\n\n" );
		file_put_contents( 'changelog/wrong-headers', "Significants: patch\nTypo: added\nComment: This is a comment\n\nEntry." );
		file_put_contents( 'changelog/wrong-header-values', "Significance: bogus\nType: bogus" );
		file_put_contents( 'changelog/duplicate-headers', "Significance: patch\nType: fixed\nType: added\n\nOk?" );
		file_put_contents( 'changelog/custom-type', "Significance: patch\nType: foo\n\nOk?" );
		file_put_contents( 'changelog/no-type', "Significance: patch\n\nOk?" );
	}

	/**
	 * Test the command.
	 *
	 * @dataProvider provideExecute
	 * @param string[] $args Command line arguments.
	 * @param array    $options Options for the test and CommandTester.
	 * @param int      $expectExitCode Expected exit code.
	 * @param string   $expectOutput Expected output.
	 */
	public function testExecute( array $args, array $options, $expectExitCode, $expectOutput ) {
		if ( isset( $options['composer.json'] ) ) {
			file_put_contents( 'composer.json', json_encode( $options['composer.json'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
			unset( $options['composer.json'] );
		}

		if ( isset( $args['--basedir'] ) && true === $args['--basedir'] ) {
			$args['--basedir'] = getcwd();
		}

		$tester = $this->getTester( 'validate' );
		$code   = $tester->execute( $args, $options );
		$output = str_replace( getcwd() . '/', '/base/path/', rtrim( $tester->getDisplay() ) );
		if ( preg_match( '/^XXX \d+$/', $expectOutput ) ) {
			$tmp = file_get_contents( __FILE__ );
			$tmp = preg_replace( "/^$expectOutput$/m", $output, $tmp );
			file_put_contents( __FILE__, $tmp );
		}
		$this->assertSame( $expectOutput, $output );
		$this->assertSame( $expectExitCode, $code );
	}

	/**
	 * Data provider for testExecute.
	 */
	public function provideExecute() {
		$composerWithTypes   = array(
			'extra' => array(
				'changelogger' => array(
					'types' => array(
						'foo' => 'Foo',
						'bar' => 'Bar',
					),
				),
			),
		);
		$composerWithNoTypes = array(
			'extra' => array(
				'changelogger' => array(
					'types' => (object) array(),
				),
			),
		);

		return array(
			'Normal run'                     => array(
				array(),
				array(),
				1,
				<<<'EOF'
/base/path/changelog/custom-type:2: Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
<warning>/base/path/changelog/duplicate-headers:3: Duplicate header "Type", previously seen on line 2.
/base/path/changelog/no-entry-not-patch:5: Changelog entry may only be empty when Significance is "patch".
/base/path/changelog/no-type: File does not contain a Type header.
<warning>/base/path/changelog/unknown-header:3: Unrecognized header "Bogus".
/base/path/changelog/wrong-header-values:1: Significance must be "patch", "minor", or "major".
/base/path/changelog/wrong-header-values:2: Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
/base/path/changelog/wrong-headers: File does not contain a Significance header.
/base/path/changelog/wrong-headers: File does not contain a Type header.
<warning>/base/path/changelog/wrong-headers:1: Unrecognized header "Significants".
<warning>/base/path/changelog/wrong-headers:2: Unrecognized header "Typo".
EOF
				,
			),
			'Verbose run'                    => array(
				array( '-v' ),
				array( 'verbosity' => OutputInterface::VERBOSITY_VERBOSE ),
				1,
				<<<'EOF'
Checking /base/path/changelog/custom-type...
/base/path/changelog/custom-type:2: Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
Checking /base/path/changelog/duplicate-headers...
<warning>/base/path/changelog/duplicate-headers:3: Duplicate header "Type", previously seen on line 2.
Checking /base/path/changelog/good...
Checking /base/path/changelog/no-entry-is-patch...
Checking /base/path/changelog/no-entry-not-patch...
/base/path/changelog/no-entry-not-patch:5: Changelog entry may only be empty when Significance is "patch".
Checking /base/path/changelog/no-type...
/base/path/changelog/no-type: File does not contain a Type header.
Checking /base/path/changelog/unknown-header...
<warning>/base/path/changelog/unknown-header:3: Unrecognized header "Bogus".
Checking /base/path/changelog/wrong-header-values...
/base/path/changelog/wrong-header-values:1: Significance must be "patch", "minor", or "major".
/base/path/changelog/wrong-header-values:2: Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
Checking /base/path/changelog/wrong-headers...
/base/path/changelog/wrong-headers: File does not contain a Significance header.
/base/path/changelog/wrong-headers: File does not contain a Type header.
<warning>/base/path/changelog/wrong-headers:1: Unrecognized header "Significants".
<warning>/base/path/changelog/wrong-headers:2: Unrecognized header "Typo".
Found 7 error(s) and 4 warning(s)
EOF
				,
			),
			'Specific file'                  => array(
				array( 'files' => array( 'changelog/good' ) ),
				array(),
				0,
				'',
			),
			'Only warnings'                  => array(
				array( 'files' => array( 'changelog/unknown-header' ) ),
				array(),
				1,
				'<warning>changelog/unknown-header:3: Unrecognized header "Bogus".',
			),
			'Only warnings, non-strict'      => array(
				array(
					'--no-strict' => true,
					'files'       => array( 'changelog/unknown-header' ),
				),
				array(),
				0,
				'<warning>changelog/unknown-header:3: Unrecognized header "Bogus".',
			),
			'Multiple specific files'        => array(
				array( 'files' => array( 'changelog/.', 'changelog/..', 'changelog/.gitkeep' ) ),
				array(),
				1,
				<<<'EOF'
changelog/.: Expected a file, got dir.
changelog/..: Expected a file, got dir.
changelog/.gitkeep: File does not contain a Significance header.
changelog/.gitkeep: File does not contain a Type header.
EOF
				,
			),
			'Custom types'                   => array(
				array( 'files' => array( 'changelog/good', 'changelog/custom-type', 'changelog/no-type' ) ),
				array( 'composer.json' => $composerWithTypes ),
				1,
				<<<'EOF'
changelog/good:2: Type must be "foo" or "bar".
changelog/no-type: File does not contain a Type header.
EOF
				,
			),
			'No types'                       => array(
				array( 'files' => array( 'changelog/good', 'changelog/custom-type', 'changelog/no-type' ) ),
				array( 'composer.json' => $composerWithNoTypes ),
				0,
				'',
			),
			'GH Actions output'              => array(
				array( '--gh-action' => true ),
				array(),
				1,
				<<<'EOF'
::error file=/base/path/changelog/custom-type,line=2::Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
::warning file=/base/path/changelog/duplicate-headers,line=3::Duplicate header "Type", previously seen on line 2.
::error file=/base/path/changelog/no-entry-not-patch,line=5::Changelog entry may only be empty when Significance is "patch".
::error file=/base/path/changelog/no-type::File does not contain a Type header.
::warning file=/base/path/changelog/unknown-header,line=3::Unrecognized header "Bogus".
::error file=/base/path/changelog/wrong-header-values,line=1::Significance must be "patch", "minor", or "major".
::error file=/base/path/changelog/wrong-header-values,line=2::Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
::error file=/base/path/changelog/wrong-headers::File does not contain a Significance header.
::error file=/base/path/changelog/wrong-headers::File does not contain a Type header.
::warning file=/base/path/changelog/wrong-headers,line=1::Unrecognized header "Significants".
::warning file=/base/path/changelog/wrong-headers,line=2::Unrecognized header "Typo".
EOF
				,
			),
			'GH Actions output with basedir' => array(
				array(
					'--gh-action' => true,
					'--basedir'   => true,
				),
				array( 'verbosity' => OutputInterface::VERBOSITY_VERBOSE ),
				1,
				<<<'EOF'
Checking changelog/custom-type...
::error file=changelog/custom-type,line=2::Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
Checking changelog/duplicate-headers...
::warning file=changelog/duplicate-headers,line=3::Duplicate header "Type", previously seen on line 2.
Checking changelog/good...
Checking changelog/no-entry-is-patch...
Checking changelog/no-entry-not-patch...
::error file=changelog/no-entry-not-patch,line=5::Changelog entry may only be empty when Significance is "patch".
Checking changelog/no-type...
::error file=changelog/no-type::File does not contain a Type header.
Checking changelog/unknown-header...
::warning file=changelog/unknown-header,line=3::Unrecognized header "Bogus".
Checking changelog/wrong-header-values...
::error file=changelog/wrong-header-values,line=1::Significance must be "patch", "minor", or "major".
::error file=changelog/wrong-header-values,line=2::Type must be "security", "added", "changed", "deprecated", "removed", or "fixed".
Checking changelog/wrong-headers...
::error file=changelog/wrong-headers::File does not contain a Significance header.
::error file=changelog/wrong-headers::File does not contain a Type header.
::warning file=changelog/wrong-headers,line=1::Unrecognized header "Significants".
::warning file=changelog/wrong-headers,line=2::Unrecognized header "Typo".
Found 7 error(s) and 4 warning(s)
EOF
				,
			),
		);
	}

}
