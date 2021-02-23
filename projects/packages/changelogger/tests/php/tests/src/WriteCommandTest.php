<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger write command.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\WriteCommand;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Tests for the changelogger write command.
 *
 * @covers \Automattic\Jetpack\Changelogger\WriteCommand
 */
class WriteCommandTest extends CommandTestCase {
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
	 * @param string[]    $args Command line arguments.
	 * @param array       $options Options for the test and CommandTester.
	 * @param string[]    $inputs User inputs.
	 * @param int         $expectExitCode Expected exit code.
	 * @param string[]    $expectOutputRegexes Regexes to run against the output.
	 * @param bool        $expectChangesDeleted Whether change files should have been deleted.
	 * @param string|null $expectChangelog Expected changelog file contents, or null if it should be the same as $options['changelog'].
	 */
	public function testExecute( array $args, array $options, array $inputs, $expectExitCode, $expectOutputRegexes = array(), $expectChangesDeleted = false, $expectChangelog = null ) {
		if ( isset( $options['composer.json'] ) ) {
			file_put_contents( 'composer.json', json_encode( array( 'extra' => array( 'changelogger' => $options['composer.json'] ) ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
			unset( $options['composer.json'] );
		}
		$changelog = isset( $options['changelog'] ) ? $options['changelog'] : null;
		$changes   = isset( $options['changes'] ) ? $options['changes'] : array();
		unset( $options['changelog'], $options['changes'] );
		if ( null !== $changelog ) {
			file_put_contents( 'CHANGELOG.md', $changelog );
		}
		foreach ( $changes as $name => $change ) {
			file_put_contents( "changelog/$name", $change );
		}

		$tester = $this->getTester( 'write' );
		$tester->setInputs( $inputs );
		$code = $tester->execute( $args, $options );
		foreach ( $expectOutputRegexes as $re ) {
			$this->assertMatchesRegularExpression( $re, $tester->getDisplay() );
		}
		$this->assertSame( $expectExitCode, $code );

		$this->assertFileExists( 'changelog/.gitkeep' );
		if ( $expectChangesDeleted ) {
			foreach ( $changes as $name => $change ) {
				$this->assertFileDoesNotExist( "changelog/$name" );
			}
		} else {
			foreach ( $changes as $name => $change ) {
				$this->assertFileExists( "changelog/$name" );
			}
		}

		if ( null === $expectChangelog ) {
			$expectChangelog = $changelog;
		}
		if ( null === $expectChangelog ) {
			$this->assertFileDoesNotExist( 'CHANGELOG.md' );
		} else {
			$this->assertFileExists( 'CHANGELOG.md' );
			$this->assertSame( $expectChangelog, file_get_contents( 'CHANGELOG.md' ) );
		}
	}

	/**
	 * Data provider for testExecute.
	 */
	public function provideExecute() {
		$date           = gmdate( 'Y-m-d' );
		$defaultOptions = array(
			'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			'changes'   => array(
				'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
			),
		);

		return array(
			'Normal run'                                => array(
				array(),
				$defaultOptions,
				array(),
				0,
				array( '/^$/' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Debug run'                                 => array(
				array(),
				array( 'verbosity' => OutputInterface::VERBOSITY_DEBUG ) + $defaultOptions,
				array(),
				0,
				array(
					'{^Reading changelog from /.*/CHANGELOG.md\\.\\.\\.$}m',
					'{^Reading changes from /.*/changelog\\.\\.\\.$}m',
					'{^Deduplicating changes from the last 1 version\\(s\\)\\.\\.\\.$}m',
					'{^Checking if any changes have content\\.\\.\\.$}m',
					'{^Yes, a-change has content\\.$}m',
					'{^Latest version from changelog is 1\\.0\\.1\\.$}m',
					'{^Next version is 1\\.0\\.2\\.$}m',
					'{^Creating new changelog entry\\.$}m',
					'{^Writing changelog to /.*/CHANGELOG.md\\.\\.\\.$}m',
					'{^Deleted change file a-change\\.$}m',
				),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Run with extra command line args'          => array(
				array(
					'--prerelease' => 'dev',
					'--buildinfo'  => 'g1234567',
					'--prologue'   => 'Prologue for the new entry',
					'--epilogue'   => 'Epilogue for the new entry',
					'--link'       => 'https://example.org/link',
				),
				$defaultOptions,
				array(),
				0,
				array( '/^$/' ),
				true,
				"# Changelog\n\n## [1.0.2-dev+g1234567] - $date\n\nPrologue for the new entry\n\n### Fixed\n- Fixed a thing.\n\nEpilogue for the new entry\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n\n[1.0.2-dev+g1234567]: https://example.org/link\n",
			),

			'Invalid formatter'                         => array(
				array(),
				array( 'composer.json' => array( 'formatter' => 'bogus' ) ),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^Unknown formatter plugin "bogus"$/' ),
			),
			'Invalid versioning'                        => array(
				array(),
				array( 'composer.json' => array( 'versioning' => 'bogus' ) ),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^Unknown versioning plugin "bogus"$/' ),
			),

			'No changelog file, interactive'            => array(
				array(),
				array( 'changelog' => null ) + $defaultOptions,
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[y/N\]}m' ),
			),
			'No changelog file, interactive (2)'        => array(
				array(),
				array( 'changelog' => null ) + $defaultOptions,
				array( 'Y' ),
				WriteCommand::FATAL_EXIT,
				array( '/Changelog file contains no entries! Use --use-version to specify the initial version\.$/m' ),
			),
			'No changelog file, interactive (3)'        => array(
				array( '--use-version' => '1.0.0' ),
				array( 'changelog' => null ) + $defaultOptions,
				array( 'Y' ),
				0,
				array(),
				true,
				"## 1.0.0 - $date\n### Fixed\n- Fixed a thing.\n",
			),
			'No changelog file, non-interactive'        => array(
				array(),
				array(
					'interactive' => false,
					'changelog'   => null,
				) + $defaultOptions,
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist!$}m' ),
			),
			'No changelog file, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changelog'   => null,
				) + $defaultOptions,
				array(),
				WriteCommand::FATAL_EXIT,
				array(
					'{^<warning>Changelog file /.*/CHANGELOG\.md does not exist! Continuing anyway\.$}m',
					'/Changelog file contains no entries! Use --use-version to specify the initial version\.$/m',
				),
			),
			'No changelog file, non-interactive, --yes (2)' => array(
				array(
					'--yes'         => true,
					'--use-version' => '1.0.0',
				),
				array(
					'interactive' => false,
					'changelog'   => null,
				) + $defaultOptions,
				array(),
				0,
				array(
					'{^<warning>Changelog file /.*/CHANGELOG\.md does not exist! Continuing anyway\.$}m',
				),
				true,
				"## 1.0.0 - $date\n### Fixed\n- Fixed a thing.\n",
			),

			// TODO: More tests.
		);
	}

}
