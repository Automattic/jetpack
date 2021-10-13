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
 * @covers \Automattic\Jetpack\Changelogger\VersionCommand
 */
class VersionCommandTest extends CommandTestCase {
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
			file_put_contents( 'composer.json', json_encode( array( 'extra' => array( 'changelogger' => $options['composer.json'] ) ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
			unset( $options['composer.json'] );
		}
		if ( isset( $options['CHANGELOG.md'] ) ) {
			file_put_contents( 'CHANGELOG.md', $options['CHANGELOG.md'] );
			unset( $options['CHANGELOG.md'] );
		}
		if ( isset( $options['significances'] ) ) {
			foreach ( $options['significances'] as $significance ) {
				file_put_contents( "changelog/$significance", "Significance: $significance\nType: added\n\nEntry.\n" );
			}
			unset( $options['significances'] );
		}

		$tester = $this->getTester( 'version' );
		$code   = $tester->execute( $args, $options );
		$output = str_replace( getcwd() . '/', '/base/path/', rtrim( $tester->getDisplay() ) );
		$this->assertSame( $expectOutput, $output );
		$this->assertSame( $expectExitCode, $code );
	}

	/**
	 * Data provider for testExecute.
	 */
	public function provideExecute() {
		$changelog = "## 2.0.0 - 2021-02-22\n\n## 1.0.0 - 2021-02-21\n";

		return array(
			'Run for previous'                           => array(
				array( 'which' => 'previous' ),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'1.0.0',
			),
			'Run for previous, abbreviated'              => array(
				array( 'which' => 'prev' ),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'1.0.0',
			),
			'Run for current'                            => array(
				array( 'which' => 'current' ),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.0',
			),
			'Run for current, abbreviated'               => array(
				array( 'which' => 'cur' ),
				array( 'CHANGELOG.md' => "## 8.0.00 - 2021-02-22\n" ),
				0,
				'8.0.00',
			),
			'Run for next, no entries'                   => array(
				array( 'which' => 'next' ),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.1',
			),
			'Run for next, no directory at all'          => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => $changelog,
					'composer.json' => array( 'changes-dir' => 'doesnotexist' ),
				),
				0,
				"<warning>Changes directory does not exist\n2.0.1",
			),
			'Run for next, some entries'                 => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => $changelog,
					'significances' => array( 'major', 'minor', 'bogus' ),
				),
				0,
				"bogus: Automattic\\Jetpack\\Changelog\\ChangeEntry::setSignificance: Significance must be 'patch', 'minor', or 'major' (or null)\n3.0.0",
			),
			'Run for previous, quiet'                    => array(
				array( 'which' => 'previous' ),
				array(
					'CHANGELOG.md' => $changelog,
					'verbosity'    => OutputInterface::VERBOSITY_QUIET,
				),
				0,
				'1.0.0',
			),
			'Run for current, quiet'                     => array(
				array( 'which' => 'current' ),
				array(
					'CHANGELOG.md' => $changelog,
					'verbosity'    => OutputInterface::VERBOSITY_QUIET,
				),
				0,
				'2.0.0',
			),
			'Run for next, some entries, quiet'          => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => $changelog,
					'significances' => array( 'major', 'minor', 'bogus' ),
					'verbosity'     => OutputInterface::VERBOSITY_QUIET,
				),
				0,
				'3.0.0',
			),
			'Run for next, --use-version'                => array(
				array(
					'which'         => 'next',
					'--use-version' => '100.200.300',
				),
				array(),
				0,
				'100.200.301',
			),
			'Run for next, --use-significance'           => array(
				array(
					'which'              => 'next',
					'--use-significance' => 'minor',
				),
				array(
					'CHANGELOG.md'  => $changelog,
					'significances' => array( 'major' ),
				),
				0,
				'2.1.0',
			),
			'Run for next, --use-significance bad'       => array(
				array(
					'which'              => 'next',
					'--use-significance' => 'bad',
				),
				array(
					'CHANGELOG.md'  => $changelog,
					'significances' => array( 'major' ),
				),
				1,
				"Automattic\\Jetpack\\Changelog\\ChangeEntry::setSignificance: Significance must be 'patch', 'minor', or 'major' (or null)",
			),
			'Run for next, --prerelease'                 => array(
				array(
					'which'        => 'next',
					'--prerelease' => 'beta',
				),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.1-beta',
			),
			'Run for next, --buildinfo'                  => array(
				array(
					'which'       => 'next',
					'--buildinfo' => 'g12345678',
				),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.1+g12345678',
			),
			'Run for next, --prerelease and --buildinfo' => array(
				array(
					'which'        => 'next',
					'--prerelease' => 'dev',
					'--buildinfo'  => 'g12345678',
				),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.1-dev+g12345678',
			),
			'Run for current, ignored options'           => array(
				array(
					'which'              => 'current',
					'--use-version'      => '100.200.300',
					'--use-significance' => 'minor',
					'--prerelease'       => 'dev',
					'--buildinfo'        => 'g12345678',
				),
				array( 'CHANGELOG.md' => $changelog ),
				0,
				'2.0.0',
			),

			'Invalid base version, current'              => array(
				array( 'which' => 'cur' ),
				array( 'CHANGELOG.md' => "## 1.0 - 2021-02-22\n" ),
				0,
				'1.0',
			),
			'Invalid base version, next'                 => array(
				array( 'which' => 'next' ),
				array( 'CHANGELOG.md' => "## 1.0 - 2021-02-22\n" ),
				1,
				'Version number "1.0" is not in a recognized format.',
			),

			'Invalid formatter'                          => array(
				array( 'which' => 'cur' ),
				array(
					'CHANGELOG.md'  => $changelog,
					'composer.json' => array( 'formatter' => 'bogus' ),
				),
				1,
				'Unknown formatter plugin "bogus"',
			),
			'Invalid versioning'                         => array(
				array( 'which' => 'cur' ),
				array(
					'CHANGELOG.md'  => $changelog,
					'composer.json' => array( 'versioning' => 'bogus' ),
				),
				1,
				'Unknown versioning plugin "bogus"',
			),
			'Invalid "which"'                            => array(
				array( 'which' => 'bogus' ),
				array( 'CHANGELOG.md' => $changelog ),
				1,
				'Don\'t know how to fetch the "bogus" version',
			),
			'No changelog'                               => array(
				array( 'which' => 'current' ),
				array(),
				1,
				'Changelog file /base/path/CHANGELOG.md does not exist',
			),
			'Invalid changelog'                          => array(
				array( 'which' => 'current' ),
				array( 'CHANGELOG.md' => "## Bogus\n" ),
				1,
				'Failed to parse changelog: Invalid heading: ## Bogus',
			),
			'Empty changelog'                            => array(
				array( 'which' => 'current' ),
				array( 'CHANGELOG.md' => '' ),
				1,
				'Changelog file contains no entries',
			),
			'Empty changelog, --default-first-version'   => array(
				array(
					'which'                   => 'current',
					'--default-first-version' => true,
				),
				array( 'CHANGELOG.md' => '' ),
				0,
				'0.1.0',
			),
			'Empty changelog, --default-first-version and --prerelease' => array(
				array(
					'which'                   => 'next',
					'--default-first-version' => true,
					'--prerelease'            => 'alpha',
				),
				array( 'CHANGELOG.md' => '' ),
				0,
				'0.1.0-alpha',
			),
			'Empty changelog, --default-first-version and invalid --prerelease' => array(
				array(
					'which'                   => 'next',
					'--default-first-version' => true,
					'--prerelease'            => '???',
				),
				array( 'CHANGELOG.md' => '' ),
				1,
				'Invalid prerelease data',
			),
			'Previous, only one entry in changelog'      => array(
				array( 'which' => 'prev' ),
				array( 'CHANGELOG.md' => '## 1.0.0 - 2021-02-22' ),
				1,
				'Changelog file contains no previous version',
			),

			'Next, changelog has a prerelease version, no --prerelease' => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => "## 1.0.1-alpha - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'patch' ),
				),
				0,
				'1.0.1',
			),
			'Next, changelog has a prerelease version, no --prerelease, major' => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => "## 1.0.1-alpha - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'major' ),
				),
				0,
				'2.0.0',
			),
			'Next, changelog has a prerelease version, --prerelease is later' => array(
				array(
					'which'        => 'next',
					'--prerelease' => 'beta',
				),
				array(
					'CHANGELOG.md'  => "## 1.0.1-alpha - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'patch' ),
				),
				0,
				'1.0.1-beta',
			),
			'Next, changelog has a prerelease version, --prerelease is earlier' => array(
				array(
					'which'        => 'next',
					'--prerelease' => 'alpha',
				),
				array(
					'CHANGELOG.md'  => "## 1.0.1-beta - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'patch' ),
				),
				0,
				'1.0.2-alpha',
			),
			'Next, changelog has a prerelease version, --prerelease is earlier, major' => array(
				array(
					'which'        => 'next',
					'--prerelease' => 'alpha',
				),
				array(
					'CHANGELOG.md'  => "## 2.0.0-beta - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'major' ),
				),
				0,
				'2.0.1-alpha',
			),
			'Next, changelog has a prerelease version, no --prerelease but current is later anyway' => array(
				array( 'which' => 'next' ),
				array(
					'CHANGELOG.md'  => "## 2.0.0-alpha - 2021-10-12\n## 1.0.0 - 2021-10-11",
					'significances' => array( 'patch' ),
				),
				0,
				'2.0.0',
			),
		);
	}

}
