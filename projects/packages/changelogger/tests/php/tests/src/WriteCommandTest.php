<?php
/**
 * Tests for the changelogger write command.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelog\Changelog;
use Automattic\Jetpack\Changelogger\FormatterPlugin;
use Automattic\Jetpack\Changelogger\WriteCommand;
use InvalidArgumentException;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger write command.
 *
 * @covers \Automattic\Jetpack\Changelogger\WriteCommand
 */
class WriteCommandTest extends CommandTestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

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
	 * @param bool|array  $expectChangesDeleted Whether change files should have been deleted, or an array of files that should have been deleted.
	 * @param string|null $expectChangelog Expected changelog file contents, or null if it should be the same as $options['changelog'].
	 */
	public function testExecute( array $args, array $options, array $inputs, $expectExitCode, $expectOutputRegexes = array(), $expectChangesDeleted = false, $expectChangelog = null ) {
		$options += array(
			'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			'changes'   => array(
				'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
			),
		);

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

		$expectExisting = array( '.gitkeep' );
		$expectDeleted  = array();
		if ( false === $expectChangesDeleted ) {
			$expectExisting = array_merge( $expectExisting, array_keys( $changes ) );
		} elseif ( true === $expectChangesDeleted ) {
			$expectDeleted = array_merge( $expectDeleted, array_keys( $changes ) );
		} else {
			$expectExisting = array_merge( $expectExisting, array_diff( array_keys( $changes ), $expectChangesDeleted ) );
			$expectDeleted  = array_merge( $expectDeleted, array_intersect( array_keys( $changes ), $expectChangesDeleted ) );
		}
		foreach ( $expectDeleted as $name ) {
			$this->assertFileDoesNotExist( "changelog/$name" );
		}
		foreach ( $expectExisting as $name ) {
			$this->assertFileExists( "changelog/$name" );
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
		$date = gmdate( 'Y-m-d' );

		return array(
			'Normal run'                                   => array(
				array(),
				array(),
				array(),
				0,
				array( '/^$/' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Debug run'                                    => array(
				array(),
				array( 'verbosity' => OutputInterface::VERBOSITY_DEBUG ),
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
			'Run with extra command line args'             => array(
				array(
					'--prerelease'   => 'dev',
					'--buildinfo'    => 'g1234567',
					'--prologue'     => 'Prologue for the new entry',
					'--epilogue'     => 'Epilogue for the new entry',
					'--link'         => 'https://example.org/link',
					'--release-date' => '2021-02-06',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				true,
				"# Changelog\n\n## [1.0.2-dev+g1234567] - 2021-02-06\n\nPrologue for the new entry\n\n### Fixed\n- Fixed a thing.\n\nEpilogue for the new entry\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n\n[1.0.2-dev+g1234567]: https://example.org/link\n",
			),
			'Run with extra command line args (2)'         => array(
				array(
					'--prerelease'   => 'alpha',
					'--release-date' => 'unreleased',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				true,
				"# Changelog\n\n## 1.0.2-alpha - unreleased\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Invalid formatter'                            => array(
				array(),
				array( 'composer.json' => array( 'formatter' => 'bogus' ) ),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^Unknown formatter plugin "bogus"$/' ),
			),
			'Invalid versioning'                           => array(
				array(),
				array( 'composer.json' => array( 'versioning' => 'bogus' ) ),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^Unknown versioning plugin "bogus"$/' ),
			),

			'No changelog file, interactive'               => array(
				array(),
				array( 'changelog' => null ),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[y/N\]}m' ),
			),
			'No changelog file, interactive (2)'           => array(
				array(),
				array( 'changelog' => null ),
				array( 'Y' ),
				WriteCommand::FATAL_EXIT,
				array( '/Changelog file contains no entries! Use --use-version to specify the initial version\.$/m' ),
			),
			'No changelog file, interactive (3)'           => array(
				array(
					'--default-first-version' => true,
					'--prerelease'            => 'beta',
				),
				array( 'changelog' => null ),
				array( 'Y' ),
				0,
				array(),
				true,
				"## 0.1.0-beta - $date\n### Fixed\n- Fixed a thing.\n",
			),
			'No changelog file, non-interactive'           => array(
				array(),
				array(
					'interactive' => false,
					'changelog'   => null,
				),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist!$}m' ),
			),
			'No changelog file, non-interactive, --yes'    => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changelog'   => null,
				),
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
				),
				array(),
				0,
				array(
					'{^<warning>Changelog file /.*/CHANGELOG\.md does not exist! Continuing anyway\.$}m',
				),
				true,
				"## 1.0.0 - $date\n### Fixed\n- Fixed a thing.\n",
			),

			'Unparseable changelog'                        => array(
				array(),
				array( 'changelog' => "## bogus\n" ),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '{^Failed to parse changelog: Invalid heading: ## bogus$}' ),
			),

			'No changes directory'                         => array(
				array(),
				array( 'composer.json' => array( 'changes-dir' => 'changes' ) ),
				array( 'N' ),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^Changes directory does not exist, so there are no changes to write! Proceed\? \[y/N\]}m' ),
			),
			'No changes directory (2)'                     => array(
				array(),
				array( 'composer.json' => array( 'changes-dir' => 'changes' ) ),
				array( 'Y' ),
				0,
				array( '{^Changes directory does not exist, so there are no changes to write! Proceed\? \[y/N\]}m' ),
				false,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'No changes directory, non-interactive'        => array(
				array(),
				array(
					'composer.json' => array( 'changes-dir' => 'changes' ),
					'interactive'   => false,
				),
				array(),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^Changes directory does not exist, so there are no changes to write!$}m' ),
			),
			'No changes directory, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'composer.json' => array( 'changes-dir' => 'changes' ),
					'interactive'   => false,
				),
				array(),
				0,
				array( '{^<warning>Changes directory does not exist, so there are no changes to write! Continuing anyway\.$}m' ),
				false,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Change files with warnings'                   => array(
				array(),
				array(
					'changes' => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
					),
				),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^Warnings were encountered while reading changes! Proceed\? \[y/N\]}m' ),
			),
			'Change files with warnings (2)'               => array(
				array(),
				array(
					'changes' => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
					),
				),
				array( 'Y' ),
				0,
				array( '{^Warnings were encountered while reading changes! Proceed\? \[y/N\]}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Did a thing.\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Change files with warnings, non-interactive'  => array(
				array(),
				array(
					'interactive' => false,
					'changes'     => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
					),
				),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^Warnings were encountered while reading changes!$}m' ),
			),
			'Change files with warnings, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changes'     => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
					),
				),
				array(),
				0,
				array( '{^<warning>Warnings were encountered while reading changes! Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Did a thing.\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Change files with errors'                     => array(
				array(),
				array(
					'changes' => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
						'error'    => "Bogus\n",
					),
				),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^Errors were encountered while reading changes! Proceed\? \[y/N\]}m' ),
			),
			'Change files with errors (2)'                 => array(
				array(),
				array(
					'changes' => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
						'error'    => "Bogus\n",
					),
				),
				array( 'Y' ),
				0,
				array( '{^Errors were encountered while reading changes! Proceed\? \[y/N\]}m' ),
				array( 'a-change', 'b-change' ),
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Did a thing.\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Change files with errors, non-interactive'    => array(
				array(),
				array(
					'interactive' => false,
					'changes'     => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
						'error'    => "Bogus\n",
					),
				),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^Errors were encountered while reading changes!$}m' ),
			),
			'Change files with errors, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changes'     => array(
						'a-change' => "Significance: patch\nType: fixed\n\nFixed a thing.\n",
						'b-change' => "Significance: patch\nType: fixed\nType: fixed\n\nDid a thing.\n",
						'error'    => "Bogus\n",
					),
				),
				array(),
				0,
				array( '{^<warning>Errors were encountered while reading changes! Continuing anyway\.$}m' ),
				array( 'a-change', 'b-change' ),
				"# Changelog\n\n## 1.0.2 - $date\n### Fixed\n- Did a thing.\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'No changes'                                   => array(
				array(),
				array( 'changes' => array() ),
				array( 'N' ),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^No changes were found! Proceed\? \[y/N\]}m' ),
			),
			'No changes (2)'                               => array(
				array(),
				array( 'changes' => array() ),
				array( 'Y' ),
				0,
				array( '{^No changes were found! Proceed\? \[y/N\]}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'No changes, non-interactive'                  => array(
				array(),
				array(
					'interactive' => false,
					'changes'     => array(),
				),
				array(),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^No changes were found!$}m' ),
			),
			'No changes, non-interactive, --yes'           => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changes'     => array(),
				),
				array(),
				0,
				array( '{^<warning>No changes were found! Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Deduplication'                                => array(
				array(),
				array(
					'changes' => array(
						'initial-release' => "Significance: patch\nType: added\n\nInitial release.\n",
						'added-stuff'     => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-dup' => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-2'   => "Significance: patch\nType: added\n\nStuff. And more stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Added\n- Initial release.\n- Stuff. And more stuff.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Deduplication, --dedupliacte=0'               => array(
				array( '--deduplicate' => '0' ),
				array(
					'changes' => array(
						'initial-release' => "Significance: patch\nType: added\n\nInitial release.\n",
						'added-stuff'     => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-dup' => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-2'   => "Significance: patch\nType: added\n\nStuff. And more stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Added\n- Initial release.\n- Stuff.\n- Stuff. And more stuff.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Deduplication, --dedupliacte=-1'              => array(
				array( '--deduplicate' => '-1' ),
				array(
					'changes' => array(
						'initial-release' => "Significance: patch\nType: added\n\nInitial release.\n",
						'added-stuff'     => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-dup' => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-2'   => "Significance: patch\nType: added\n\nStuff. And more stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Added\n- Initial release.\n- Stuff.\n- Stuff.\n- Stuff. And more stuff.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Deduplication, --dedupliacte=2'               => array(
				array( '--deduplicate' => '2' ),
				array(
					'changes' => array(
						'initial-release' => "Significance: patch\nType: added\n\nInitial release.\n",
						'added-stuff'     => "Significance: patch\nType: added\n\nStuff.\n",
						'added-stuff-2'   => "Significance: patch\nType: added\n\nStuff. And more stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n### Added\n- Stuff. And more stuff.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Deduplication removes all changes'            => array(
				array(),
				array(
					'changes' => array(
						'added-stuff' => "Significance: patch\nType: added\n\nStuff.\n",
					),
				),
				array( 'N' ),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^All changes were duplicates\. Proceed\? \[y/N\]}m' ),
			),
			'Deduplication removes all changes (2)'        => array(
				array(),
				array(
					'changes' => array(
						'added-stuff' => "Significance: patch\nType: added\n\nStuff.\n",
					),
				),
				array( 'Y' ),
				0,
				array( '{^All changes were duplicates\. Proceed\? \[y/N\]}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Deduplication removes all changes, non-interactive' => array(
				array(),
				array(
					'interactive' => false,
					'changes'     => array(
						'added-stuff' => "Significance: patch\nType: added\n\nStuff.\n",
					),
				),
				array(),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^All changes were duplicates\.$}m' ),
			),
			'Deduplication removes all changes, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changes'     => array(
						'added-stuff' => "Significance: patch\nType: added\n\nStuff.\n",
					),
				),
				array(),
				0,
				array( '{^<warning>All changes were duplicates\. Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'All changes are empty'                        => array(
				array(),
				array(
					'changes' => array(
						'duplicate' => "Significance: patch\nType: added\n\nStuff.\n",
						'error'     => "Bogus\n",
						'empty'     => "Significance: patch\nType: fixed\n\n",
					),
				),
				array( 'Y', 'N' ),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{There are no changes with content for this write\. Proceed\? \[y/N\]}m' ),
			),
			'All changes are empty (2)'                    => array(
				array(),
				array(
					'changes' => array(
						'duplicate' => "Significance: patch\nType: added\n\nStuff.\n",
						'error'     => "Bogus\n",
						'empty'     => "Significance: patch\nType: fixed\n\n",
					),
				),
				array( 'Y', 'Y' ),
				0,
				array( '{There are no changes with content for this write\. Proceed\? \[y/N\]}m' ),
				array( 'duplicate', 'empty' ),
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'All changes are empty, non-interactive'       => array(
				array(),
				array(
					'interactive' => false,
					'changes'     => array(
						'duplicate' => "Significance: patch\nType: added\n\nStuff.\n",
						'empty'     => "Significance: patch\nType: fixed\n\n",
					),
				),
				array(),
				WriteCommand::NO_CHANGE_EXIT,
				array( '{^There are no changes with content for this write\.$}m' ),
			),
			'All changes are empty, non-interactive, --yes' => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changes'     => array(
						'duplicate' => "Significance: patch\nType: added\n\nStuff.\n",
						'error'     => "Bogus\n",
						'empty'     => "Significance: patch\nType: fixed\n\n",
					),
				),
				array(),
				0,
				array( '{^<warning>There are no changes with content for this write\. Continuing anyway\.$}m' ),
				array( 'duplicate', 'empty' ),
				"# Changelog\n\n## 1.0.2 - $date\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Amend'                                        => array(
				array( '--amend' => true ),
				array(
					'changes' => array(
						'added'  => "Significance: patch\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 1.0.1 - $date\n\nPrologue for v1.0.1\n\n### Added\n- New stuff.\n- Stuff.\n- ZZZ.\n\n### Removed\n- Other stuff.\n\n### Fixed\n- Broken stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Amend, upgrade version'                       => array(
				array( '--amend' => true ),
				array(
					'changes' => array(
						'added'  => "Significance: minor\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 1.1.0 - $date\n\nPrologue for v1.0.1\n\n### Added\n- New stuff.\n- Stuff.\n- ZZZ.\n\n### Removed\n- Other stuff.\n\n### Fixed\n- Broken stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Amend, no downgrade version'                  => array(
				array( '--amend' => true ),
				array(
					'changes'   => array(
						'added'  => "Significance: minor\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
					'changelog' => "# Changelog\n\n## 2.0.0 - 2021-02-23\n### Changed\n- Stuff.\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 2.0.0 - $date\n### Added\n- New stuff.\n- ZZZ.\n\n### Changed\n- Stuff.\n\n### Fixed\n- Broken stuff.\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'Amend initial release'                        => array(
				array( '--amend' => true ),
				array(
					'changes'   => array(
						'added'  => "Significance: minor\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
					'changelog' => "# Changelog\n\n## [1.0.0] - 2021-02-23\n\n- Initial release.\n\n### Added\n- Everything.\n\n[1.0.0]: https://example.org/new-thing\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## [1.0.0] - $date\n\n- Initial release.\n\n### Added\n- Everything.\n- New stuff.\n- ZZZ.\n\n### Fixed\n- Broken stuff.\n\n[1.0.0]: https://example.org/new-thing\n",
			),
			'Amend empty changelog'                        => array(
				array(
					'--amend'       => true,
					'--use-version' => '0.1.0',
				),
				array(
					'changes'   => array(
						'added'  => "Significance: minor\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
					'changelog' => '',
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"## 0.1.0 - $date\n### Added\n- New stuff.\n- ZZZ.\n\n### Fixed\n- Broken stuff.\n",
			),
			'Amend and options'                            => array(
				array(
					'--amend'    => true,
					'--prologue' => 'New prologue',
					'--link'     => 'https://example.org/new-link',
				),
				array(
					'changes' => array(
						'added'  => "Significance: patch\nType: added\n\nNew stuff.\n",
						'added2' => "Significance: patch\nType: added\n\nZZZ.\n",
						'fixed'  => "Significance: patch\nType: fixed\n\nBroken stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## [1.0.1] - $date\n\nNew prologue\n\n### Added\n- New stuff.\n- Stuff.\n- ZZZ.\n\n### Removed\n- Other stuff.\n\n### Fixed\n- Broken stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n\n[1.0.1]: https://example.org/new-link\n",
			),
			'Amend without sorting by content'             => array(
				array( '--amend' => true ),
				array(
					'composer.json' => array( 'ordering' => array( 'subheading' ) ),
					'changes'       => array(
						'added'   => "Significance: patch\nType: added\n\nZZZ.\n",
						'removed' => "Significance: patch\nType: removed\n\nBroken stuff.\n",
					),
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 1.0.1 - $date\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n- ZZZ.\n\n### Removed\n- Other stuff.\n- Broken stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'--use-version invalid'                        => array(
				array( '--use-version' => '2.0' ),
				array(),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^The specified version is not valid\. This may cause problems in the future! Proceed\? \[y/N\]}m',
				),
			),
			'--use-version invalid (2)'                    => array(
				array( '--use-version' => '2.0' ),
				array(),
				array( 'Y' ),
				0,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^The specified version is not valid\. This may cause problems in the future! Proceed\? \[y/N\]}m',
				),
				true,
				"# Changelog\n\n## 2.0 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-version invalid, non-interactive'       => array(
				array( '--use-version' => '2.0' ),
				array( 'interactive' => false ),
				array(),
				WriteCommand::ASKED_EXIT,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^The specified version is not valid\. This may cause problems in the future!$}m',
				),
			),
			'--use-version invalid, non-interactive, --yes' => array(
				array(
					'--use-version' => '2.0',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^<warning>The specified version is not valid\. This may cause problems in the future! Continuing anyway\.$}m',
				),
				true,
				"# Changelog\n\n## 2.0 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'--use-version not normalized'                 => array(
				array( '--use-version' => '2.0.00' ),
				array(),
				array( 'abort' ),
				WriteCommand::ASKED_EXIT,
				array(
					'{^The supplied version 2.0.00 is not normalized\.$}m',
					'{^\s*\[proceed\s*\] Proceed with 2\.0\.00$}m',
					'{^\s*\[normalize\s*\] Normalize to 2\.0\.0$}m',
					'{^\s*\[abort\s*\] Abort$}m',
				),
			),
			'--use-version not normalized, proceed'        => array(
				array( '--use-version' => '2.0.00' ),
				array(),
				array( 'proceed' ),
				0,
				array(
					'{^The supplied version 2.0.00 is not normalized\.$}m',
					'{^\s*\[proceed\s*\] Proceed with 2\.0\.00$}m',
					'{^\s*\[normalize\s*\] Normalize to 2\.0\.0$}m',
					'{^\s*\[abort\s*\] Abort$}m',
				),
				true,
				"# Changelog\n\n## 2.0.00 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-version not normalized, normalize'      => array(
				array( '--use-version' => '2.0.00' ),
				array(),
				array( 'normalize' ),
				0,
				array(
					'{^The supplied version 2.0.00 is not normalized\.$}m',
					'{^\s*\[proceed\s*\] Proceed with 2\.0\.00$}m',
					'{^\s*\[normalize\s*\] Normalize to 2\.0\.0$}m',
					'{^\s*\[abort\s*\] Abort$}m',
				),
				true,
				"# Changelog\n\n## 2.0.0 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-version not normalized, non-interactive' => array(
				array( '--use-version' => '2.0.00' ),
				array( 'interactive' => false ),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^The supplied version 2.0.00 is not normalized, it should be 2.0.0\.$}m' ),
			),
			'--use-version not normalized, non-interactive, --yes' => array(
				array(
					'--use-version' => '2.0.00',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array( '{^<warning>The supplied version 2.0.00 is not normalized, it should be 2.0.0\. Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 2.0.00 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'--use-version older'                          => array(
				array( '--use-version' => '1.0.1-dev' ),
				array(),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.1, which comes after 1\.0\.1-dev\. Proceed\? \[y/N\]}m' ),
			),
			'--use-version older (2)'                      => array(
				array( '--use-version' => '1.0.1-dev' ),
				array(),
				array( 'Y' ),
				0,
				array( '{^The most recent version in the changelog is 1\.0\.1, which comes after 1\.0\.1-dev\. Proceed\? \[y/N\]}m' ),
				true,
				"# Changelog\n\n## 1.0.1-dev - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-version older, non-interactive'         => array(
				array( '--use-version' => '1.0.1-dev' ),
				array( 'interactive' => false ),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.1, which comes after 1\.0\.1-dev\.$}m' ),
			),
			'--use-version older, non-interactive, --yes'  => array(
				array(
					'--use-version' => '1.0.1-dev',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array( '{^<warning>The most recent version in the changelog is 1\.0\.1, which comes after 1\.0\.1-dev\. Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 1.0.1-dev - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'--use-version equal'                          => array(
				array( '--use-version' => '1.0.1' ),
				array(),
				array( 'N' ),
				WriteCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.1, which is equivalent to 1\.0\.1\. Proceed\? \[y/N\]}m' ),
			),
			'--use-version equal (2)'                      => array(
				array( '--use-version' => '1.0.1' ),
				array(),
				array( 'Y' ),
				0,
				array( '{^The most recent version in the changelog is 1\.0\.1, which is equivalent to 1\.0\.1\. Proceed\? \[y/N\]}m' ),
				true,
				"# Changelog\n\n## 1.0.1 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-version equal, non-interactive'         => array(
				array( '--use-version' => '1.0.1' ),
				array( 'interactive' => false ),
				array(),
				WriteCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.1, which is equivalent to 1\.0\.1\.$}m' ),
			),
			'--use-version equal, non-interactive, --yes'  => array(
				array(
					'--use-version' => '1.0.1',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array( '{^<warning>The most recent version in the changelog is 1\.0\.1, which is equivalent to 1\.0\.1\. Continuing anyway\.$}m' ),
				true,
				"# Changelog\n\n## 1.0.1 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'--use-significance'                           => array(
				array( '--use-significance' => 'major' ),
				array(),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 2.0.0 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),
			'--use-significance invalid'                   => array(
				array( '--use-significance' => 'bogus' ),
				array(),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^' . preg_quote( "Automattic\\Jetpack\\Changelog\\ChangeEntry::setSignificance: Significance must be 'patch', 'minor', or 'major' (or null)", '/' ) . '$/' ),
			),

			'--prerelease invalid'                         => array(
				array( '--prerelease' => '???' ),
				array(),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '{^Failed to determine new version: Invalid prerelease data$}m' ),
			),
			'Version in changelog invalid'                 => array(
				array(),
				array(
					'changelog' => "## 2.0 - 2021-02-24\n\nThis is the \"problem in the future\" that comes of ignoring the warning about an invalid --use-version...\n",
				),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '{^Changelog file contains invalid version 2\.0! Use --use-version to specify the new version\.$}m' ),
			),
			'Version in changelog invalid, amending'       => array(
				array( '--amend' => true ),
				array(
					'changelog' => "## 2.0 - 2021-02-24\n\nThis is the \"problem in the future\" that comes of ignoring the warning about an invalid --use-version...\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
				),
				array(),
				0,
				array( '{^$}m' ),
				true,
				"## 1.0.1 - $date\n\nThis is the \"problem in the future\" that comes of ignoring the warning about an invalid --use-version...\n\n### Fixed\n- Fixed a thing.\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n",
			),

			'Entry creation fail'                          => array(
				array( '--link' => '???' ),
				array(),
				array(),
				WriteCommand::FATAL_EXIT,
				array( '/^' . preg_quote( 'Failed to create changelog entry: Automattic\\Jetpack\\Changelog\\ChangelogEntry::setLink: Invalid URL', '/' ) . '$/' ),
			),
			'Link template'                                => array(
				array(),
				array(
					'composer.json' => array( 'link-template' => 'https://example.org/diff/${old}..${new}' ),
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## [1.0.2] - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n\n[1.0.2]: https://example.org/diff/1.0.1..1.0.2\n",
			),
			'Link template, initial version'               => array(
				array( '--use-version' => '1.0.0' ),
				array(
					'composer.json' => array( 'link-template' => 'https://example.org/diff/${old}..${new}' ),
					'changelog'     => "# Changelog\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				"# Changelog\n\n## 1.0.0 - $date\n### Fixed\n- Fixed a thing.\n",
			),

			'Interactive defaulting'                       => array(
				array(),
				array( 'changelog' => null ),
				array( '' ),
				WriteCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[y/N\]}m' ),
			),
			'Interactive defaulting, --yes'                => array(
				array( '--yes' => true ),
				array( 'changelog' => null ),
				array( '' ),
				WriteCommand::FATAL_EXIT,
				array(
					'{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[Y/n\]}m',
					'/Changelog file contains no entries! Use --use-version to specify the initial version\.$/m',
				),
			),

			'Options from versioning plugin'               => array(
				array( '--point-release' => true ),
				array(
					'composer.json' => array( 'versioning' => 'wordpress' ),
					'changelog'     => "# Changelog\n\n## 1.0 - 2021-02-24\n\n- Initial release\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				'changelog' => "# Changelog\n\n## 1.0.1 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0 - 2021-02-24\n\n- Initial release\n",
			),

			'Writing a new prerelease based on an old one' => array(
				array( '--prerelease' => 'beta.2' ),
				array(
					'changelog' => "# Changelog\n\n## 1.0.1-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				'changelog' => "# Changelog\n\n## 1.0.1-beta.2 - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
			),
			'Writing a new prerelease based on an old one (2)' => array(
				array( '--prerelease' => 'beta.2' ),
				array(
					'changelog' => "# Changelog\n\n## 2.0.0-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				'changelog' => "# Changelog\n\n## 2.0.0-beta.2 - $date\n### Fixed\n- Fixed a thing.\n\n## 2.0.0-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
			),
			'Writing a new prerelease based on an old one (3)' => array(
				array( '--prerelease' => 'alpha' ),
				array(
					'changelog' => "# Changelog\n\n## 1.0.1-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
				),
				array(),
				0,
				array( '{^$}' ),
				true,
				'changelog' => "# Changelog\n\n## 1.0.2-alpha - $date\n### Fixed\n- Fixed a thing.\n\n## 1.0.1-beta - 2021-10-12\n\n- Beta\n\n## 1.0.0 - 2021-02-24\n\n- Initial release\n",
			),
		);
	}

	/**
	 * Test failure to format changelog.
	 */
	public function testWriteChangelog_formatError() {
		$formatter = $this->getMockBuilder( FormatterPlugin::class )
			->setMethodsExcept( array() )
			->getMock();
		$formatter->expects( $this->never() )->method( $this->logicalNot( $this->matches( 'format' ) ) );
		$formatter->method( 'format' )->willThrowException( new InvalidArgumentException( 'Exception for test.' ) );

		$w            = TestingAccessWrapper::newFromObject( $this->getCommand( 'write' ) );
		$w->formatter = $formatter;

		$input  = new ArrayInput( array() );
		$output = new BufferedOutput();
		$ret    = $w->writeChangelog( $input, $output, new Changelog() );
		$this->assertSame( WriteCommand::FATAL_EXIT, $ret );
		$this->assertSame( "Failed to write the changelog: Exception for test.\n", $output->fetch() );
	}

	/**
	 * Test failure to write changelog.
	 */
	public function testWriteChangelog_writeError() {
		mkdir( 'CHANGELOG.md' );

		$formatter = $this->getMockBuilder( FormatterPlugin::class )
			->setMethodsExcept( array() )
			->getMock();
		$formatter->expects( $this->never() )->method( $this->logicalNot( $this->matches( 'format' ) ) );
		$formatter->method( 'format' )->willReturn( "Changelog!\n" );

		$w            = TestingAccessWrapper::newFromObject( $this->getCommand( 'write' ) );
		$w->formatter = $formatter;

		$input  = new ArrayInput( array() );
		$output = new BufferedOutput();
		$ret    = $w->writeChangelog( $input, $output, new Changelog() );
		$this->assertSame( WriteCommand::FATAL_EXIT, $ret );
		$cwd = getcwd();
		$this->assertStringContainsString( "Failed to write $cwd/CHANGELOG.md: ", $output->fetch() );
	}

	/**
	 * Test delete changes failure.
	 */
	public function testDeleteChanges_error() {
		$w = TestingAccessWrapper::newFromObject( $this->getCommand( 'write' ) );

		$input  = new ArrayInput( array() );
		$output = new BufferedOutput();
		$ret    = $w->deleteChanges(
			$input,
			$output,
			array(
				'doesnotexist' => 0,
				'.gitkeep'     => 0,
			)
		);
		$this->assertSame( WriteCommand::DELETE_FAILED_EXIT, $ret );
		$out = $output->fetch();
		$this->assertStringContainsString( 'Failed to delete doesnotexist: ', $out );
		$this->assertStringNotContainsString( 'Failed to delete .gitkeep: ', $out );
	}

	/**
	 * Test execute handling of writeChangelog failing.
	 */
	public function testExecute_writeChangelog_fail() {
		$command = $this->getMockBuilder( WriteCommand::class )
			->setMethods( array( 'writeChangelog', 'deleteChanges' ) )
			->getMock();
		$command->setApplication( $this->getCommand( 'write' )->getApplication() );
		$command->method( 'writeChangelog' )->willReturn( WriteCommand::FATAL_EXIT );
		$command->expects( $this->never() )->method( 'deleteChanges' );

		file_put_contents( 'CHANGELOG.md', "# Changelog\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n" );
		file_put_contents( 'changelog/a-change', "Significance: patch\nType: fixed\n\nFixed a thing.\n" );

		$tester = new CommandTester( $command );
		$code   = $tester->execute( array() );
		$this->assertSame( WriteCommand::FATAL_EXIT, $code );
	}

}
