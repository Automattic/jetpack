<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger squash command.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelog\Changelog;
use Automattic\Jetpack\Changelogger\FormatterPlugin;
use Automattic\Jetpack\Changelogger\SquashCommand;
use InvalidArgumentException;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger squash command.
 *
 * @covers \Automattic\Jetpack\Changelogger\SquashCommand
 */
class SquashCommandTest extends CommandTestCase {
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
	 * @param string|null $expectChangelog Expected changelog file contents, or null if it should be the same as $options['changelog'].
	 */
	public function testExecute( array $args, array $options, array $inputs, $expectExitCode, $expectOutputRegexes = array(), $expectChangelog = null ) {
		$options += array(
			'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.1-beta - 2021-02-22\n\n### Added\n- A Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\n## 1.0.1+alpha - 2021-02-21\nPrologue for v1.0.1+alpha\n\n### Added\n- B Stuff.\n- Y Stuff.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
		);

		if ( isset( $options['composer.json'] ) ) {
			file_put_contents( 'composer.json', json_encode( array( 'extra' => array( 'changelogger' => $options['composer.json'] ) ), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
			unset( $options['composer.json'] );
		}
		$changelog = isset( $options['changelog'] ) ? $options['changelog'] : null;
		unset( $options['changelog'] );
		if ( null !== $changelog ) {
			file_put_contents( 'CHANGELOG.md', $changelog );
		}

		$tester = $this->getTester( 'squash' );
		$tester->setInputs( $inputs );
		$code = $tester->execute( $args, $options );
		foreach ( $expectOutputRegexes as $re ) {
			$this->assertMatchesRegularExpression( $re, $tester->getDisplay() );
		}
		$this->assertSame( $expectExitCode, $code );

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
		return array(
			'Normal run'                                  => array(
				array(),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Debug run'                                   => array(
				array(),
				array( 'verbosity' => OutputInterface::VERBOSITY_DEBUG ),
				array(),
				0,
				array(
					'{^Reading changelog from /.*/CHANGELOG.md\\.\\.\\.$}m',
					'{^Looking for entries matching version 1\\.0\\.1$}m',
					'{^Will squash version 1\\.0\\.1$}m',
					'{^Will squash version 1\\.0\\.1-beta}m',
					'{^Will squash version 1\\.0\\.1\\+alpha$}m',
					'{^No match at 1\\.0\\.0, stopping there$}m',
					'{^Deduplicating changes\\.\\.\\.$}m',
					'{^Found duplicate change \'Other stuff\\.\'\\.$}m',
					'{^Creating new changelog entry\\.$}m',
					'{^Writing changelog to /.*/CHANGELOG.md\\.\\.\\.$}m',
				),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Run with extra command line args'            => array(
				array(
					'--use-version'  => '1.0.2-dev+g1234567',
					'--prologue'     => 'Prologue for the new entry',
					'--epilogue'     => 'Epilogue for the new entry',
					'--link'         => 'https://example.org/link',
					'--release-date' => '2021-02-06',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## [1.0.2-dev+g1234567] - 2021-02-06\n\nPrologue for the new entry\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for the new entry\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n\n[1.0.2-dev+g1234567]: https://example.org/link\n",
			),
			'Run with extra command line args (2)'        => array(
				array(
					'--release-date' => 'unreleased',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - unreleased\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Run with only one matching version'          => array(
				array(),
				array(
					'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\n\n- Second release.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
				),
				array(),
				SquashCommand::NO_CHANGE_EXIT,
				array( '/^Only a single entry matched, not squashing$/' ),
			),

			'Squash by count'                             => array(
				array(
					'--count' => '2',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- A Stuff.\n- Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.1+alpha - 2021-02-21\n\nPrologue for v1.0.1+alpha\n\n### Added\n- B Stuff.\n- Y Stuff.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Squash by count (2)'                         => array(
				array(
					'--count' => '10',
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n- Initial release.\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n",
			),
			'Squash by count, invalid count "foo"'        => array(
				array(
					'--count' => 'foo',
				),
				array(),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '/^Count must be a positive integer$/' ),
			),
			'Squash by count, invalid count "0"'          => array(
				array(
					'--count' => '0',
				),
				array(),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '/^Count must be a positive integer$/' ),
			),
			'Squash by count, invalid count "1"'          => array(
				array(
					'--count' => '1',
				),
				array(),
				array(),
				SquashCommand::NO_CHANGE_EXIT,
				array( '/^Only a single entry matched, not squashing$/' ),
			),

			'Squash by regex'                             => array(
				array(
					'--regex' => '/^1\.0\.1(?:-|$)/',
				),
				array( 'verbosity' => OutputInterface::VERBOSITY_DEBUG ),
				array(),
				0,
				array(
					'{^Reading changelog from /.*/CHANGELOG.md\\.\\.\\.$}m',
					'{^Looking for entries matching regex ' . preg_quote( '/^1\\.0\\.1(?:-|$)/', '{}' ) . '$}m',
					'{^Will squash version 1\\.0\\.1$}m',
					'{^Will squash version 1\\.0\\.1-beta}m',
					'{^No match at 1\\.0\\.1\\+alpha, stopping there$}m',
					'{^Deduplicating changes\\.\\.\\.$}m',
					'{^Found duplicate change \'Other stuff\\.\'\\.$}m',
					'{^Creating new changelog entry\\.$}m',
					'{^Writing changelog to /.*/CHANGELOG.md\\.\\.\\.$}m',
				),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\n### Added\n- A Stuff.\n- Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.1+alpha - 2021-02-21\n\nPrologue for v1.0.1+alpha\n\n### Added\n- B Stuff.\n- Y Stuff.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Squash by regex, invalid regex'              => array(
				array(
					'--regex' => 'foo',
				),
				array(),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '{^Regex match failed: Delimiter must not be alphanumeric or backslash$}' ),
			),
			'Squash by regex, regex matches nothing'      => array(
				array(
					'--regex' => '/1\.0\.0/',
				),
				array(),
				array(),
				SquashCommand::NO_CHANGE_EXIT,
				array( '{^No entries to squash$}' ),
			),
			'Squash by regex, regex matches just one change' => array(
				array(
					'--regex' => '/^1\.0\.1$/',
				),
				array(),
				array(),
				SquashCommand::NO_CHANGE_EXIT,
				array( '/^Only a single entry matched, not squashing$/' ),
			),

			'Invalid formatter'                           => array(
				array(),
				array( 'composer.json' => array( 'formatter' => 'bogus' ) ),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '/^Unknown formatter plugin "bogus"$/' ),
			),
			'Invalid versioning'                          => array(
				array(),
				array( 'composer.json' => array( 'versioning' => 'bogus' ) ),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '/^Unknown versioning plugin "bogus"$/' ),
			),

			'No changelog file, interactive'              => array(
				array(),
				array( 'changelog' => null ),
				array( 'N' ),
				SquashCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[y/N\]}m' ),
			),
			'No changelog file, interactive (2)'          => array(
				array(),
				array( 'changelog' => null ),
				array( 'Y' ),
				SquashCommand::FATAL_EXIT,
				array(
					'{^Changelog file /.*/CHANGELOG\.md does not exist! Proceed\? \[y/N\]}m',
					'/Changelog contains no entries, cannot squash$/m',
				),
			),
			'No changelog file, non-interactive'          => array(
				array(),
				array(
					'interactive' => false,
					'changelog'   => null,
				),
				array(),
				SquashCommand::ASKED_EXIT,
				array( '{^Changelog file /.*/CHANGELOG\.md does not exist!$}m' ),
			),
			'No changelog file, non-interactive, --yes'   => array(
				array( '--yes' => true ),
				array(
					'interactive' => false,
					'changelog'   => null,
				),
				array(),
				SquashCommand::FATAL_EXIT,
				array(
					'{^<warning>Changelog file /.*/CHANGELOG\.md does not exist! Continuing anyway\.$}m',
					'/Changelog contains no entries, cannot squash$/m',
				),
			),

			'Unparseable changelog'                       => array(
				array(),
				array( 'changelog' => "## bogus\n" ),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '{^Failed to parse changelog: Invalid heading: ## bogus$}' ),
			),

			'Changlog with no change entries'             => array(
				array(),
				array(
					'changelog' => '',
				),
				array(),
				SquashCommand::FATAL_EXIT,
				array(
					'/Changelog contains no entries, cannot squash$/m',
				),
			),

			'Changlog with no changes'                    => array(
				array(),
				array(
					'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\nPrologue for v1.0.1\n\n## 1.0.1-beta - 2021-02-22\n\n## 1.0.1+alpha - 2021-02-21\nPrologue for v1.0.1+alpha\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
				),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'No deduplication'                            => array(
				array(
					'--no-deduplicate' => true,
				),
				array(),
				array(),
				0,
				array( '/^$/' ),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'--use-version invalid'                       => array(
				array( '--use-version' => '2.0' ),
				array(),
				array( 'N' ),
				SquashCommand::ASKED_EXIT,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^The specified version is not valid\. This may cause problems in the future! Proceed\? \[y/N\]}m',
				),
			),
			'--use-version invalid (2)'                   => array(
				array( '--use-version' => '2.0' ),
				array(),
				array( 'Y' ),
				0,
				array(
					'{^Invalid --use-version: Version number "2.0" is not in a recognized format\.$}m',
					'{^The specified version is not valid\. This may cause problems in the future! Proceed\? \[y/N\]}m',
				),
				"# Changelog\n\n## 2.0 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'--use-version invalid, non-interactive'      => array(
				array( '--use-version' => '2.0' ),
				array( 'interactive' => false ),
				array(),
				SquashCommand::ASKED_EXIT,
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
				"# Changelog\n\n## 2.0 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'--use-version not normalized'                => array(
				array( '--use-version' => '2.0.00' ),
				array(),
				array( 'abort' ),
				SquashCommand::ASKED_EXIT,
				array(
					'{^The supplied version 2.0.00 is not normalized\.$}m',
					'{^\s*\[proceed\s*\] Proceed with 2\.0\.00$}m',
					'{^\s*\[normalize\s*\] Normalize to 2\.0\.0$}m',
					'{^\s*\[abort\s*\] Abort$}m',
				),
			),
			'--use-version not normalized, proceed'       => array(
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
				"# Changelog\n\n## 2.0.00 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'--use-version not normalized, normalize'     => array(
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
				"# Changelog\n\n## 2.0.0 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'--use-version not normalized, non-interactive' => array(
				array( '--use-version' => '2.0.00' ),
				array( 'interactive' => false ),
				array(),
				SquashCommand::ASKED_EXIT,
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
				"# Changelog\n\n## 2.0.00 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'--use-version older'                         => array(
				array( '--use-version' => '1.0.0-dev' ),
				array(),
				array( 'N' ),
				SquashCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.0, which comes after 1\.0\.0-dev\. Proceed\? \[y/N\]}m' ),
			),
			'--use-version older (2)'                     => array(
				array( '--use-version' => '1.0.0-dev' ),
				array(),
				array( 'Y' ),
				0,
				array( '{^The most recent version in the changelog is 1\.0\.0, which comes after 1\.0\.0-dev\. Proceed\? \[y/N\]}m' ),
				"# Changelog\n\n## 1.0.0-dev - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'--use-version older, non-interactive'        => array(
				array( '--use-version' => '1.0.0-dev' ),
				array( 'interactive' => false ),
				array(),
				SquashCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.0, which comes after 1\.0\.0-dev\.$}m' ),
			),
			'--use-version older, non-interactive, --yes' => array(
				array(
					'--use-version' => '1.0.0-dev',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array( '{^<warning>The most recent version in the changelog is 1\.0\.0, which comes after 1\.0\.0-dev\. Continuing anyway\.$}m' ),
				"# Changelog\n\n## 1.0.0-dev - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'--use-version equal'                         => array(
				array( '--use-version' => '1.0.0' ),
				array(),
				array( 'N' ),
				SquashCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.0, which is equivalent to 1\.0\.0\. Proceed\? \[y/N\]}m' ),
			),
			'--use-version equal (2)'                     => array(
				array( '--use-version' => '1.0.0' ),
				array(),
				array( 'Y' ),
				0,
				array( '{^The most recent version in the changelog is 1\.0\.0, which is equivalent to 1\.0\.0\. Proceed\? \[y/N\]}m' ),
				"# Changelog\n\n## 1.0.0 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'--use-version equal, non-interactive'        => array(
				array( '--use-version' => '1.0.0' ),
				array( 'interactive' => false ),
				array(),
				SquashCommand::ASKED_EXIT,
				array( '{^The most recent version in the changelog is 1\.0\.0, which is equivalent to 1\.0\.0\.$}m' ),
			),
			'--use-version equal, non-interactive, --yes' => array(
				array(
					'--use-version' => '1.0.0',
					'--yes'         => true,
				),
				array( 'interactive' => false ),
				array(),
				0,
				array( '{^<warning>The most recent version in the changelog is 1\.0\.0, which is equivalent to 1\.0\.0\. Continuing anyway\.$}m' ),
				"# Changelog\n\n## 1.0.0 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'Version in changelog invalid'                => array(
				array(),
				array(
					'changelog' => "## 2.0 - 2021-02-24\n\nThis is the \"problem in the future\" that comes of ignoring the warning about an invalid --use-version...\n",
				),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '{^Cannot parse version number 2\\.0$}m' ),
			),
			'Version in changelog invalid, by count'      => array(
				array(
					'--count' => 3,
				),
				array(
					'changelog' => "# Changelog\n\n## 1.0 - 2021-02-23\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\n## 1.0-beta - 2021-02-22\n\n### Added\n- A Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\n## 1.0+alpha - 2021-02-21\n### Added\n- B Stuff.\n- Y Stuff.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
				),
				array(),
				0,
				array( '{^$}' ),
				"# Changelog\n\n## 1.0 - 2021-02-23\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\n## 1.0.0 - 2021-02-20\n\n- Initial release.\n",
			),
			'Non-first version in changelog invalid'      => array(
				array(),
				array(
					'changelog' => "# Changelog\n\n## 1.0.1 - 2021-02-23\nPrologue for v1.0.1\n\n### Added\n- Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0.1-beta - 2021-02-22\n\n### Added\n- A Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\n## 1.0.1+alpha - 2021-02-21\nPrologue for v1.0.1+alpha\n\n### Added\n- B Stuff.\n- Y Stuff.\n\n## 1.0 - 2021-02-20\n\n- Initial release.\n",
					'verbosity' => OutputInterface::VERBOSITY_DEBUG,
				),
				array(),
				0,
				array(
					'{^Cannot parse version number 1\\.0, stopping there$}m',
				),
				"# Changelog\n\n## 1.0.1 - 2021-02-23\n\nPrologue for v1.0.1\n\nPrologue for v1.0.1+alpha\n\n### Added\n- A Stuff.\n- B Stuff.\n- Stuff.\n- Y Stuff.\n- Z Stuff.\n\n### Removed\n- Other stuff.\n\nEpilogue for v1.0.1\n\n## 1.0 - 2021-02-20\n\n- Initial release.\n",
			),

			'Entry creation fail'                         => array(
				array( '--link' => '???' ),
				array(),
				array(),
				SquashCommand::FATAL_EXIT,
				array( '/^' . preg_quote( 'Failed to create changelog entry: Automattic\\Jetpack\\Changelog\\ChangelogEntry::setLink: Invalid URL', '/' ) . '$/' ),
			),

			'Options from versioning plugin'              => array(
				array( '--point-release' => true ),
				array(
					'composer.json' => array( 'versioning' => 'wordpress' ),
					'changelog'     => "# Changelog\n\n## 1.0 - 2021-02-24\n\n- Initial release\n\n## 1.0-alpha - 2021-02-23\n\n- Initial alpha.\n",
				),
				array(),
				0,
				array( '{^$}' ),
				"# Changelog\n\n## 1.0 - 2021-02-24\n\n- Initial alpha.\n- Initial release\n",
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

		$w            = TestingAccessWrapper::newFromObject( $this->getCommand( 'squash' ) );
		$w->formatter = $formatter;

		$input  = new ArrayInput( array() );
		$output = new BufferedOutput();
		$ret    = $w->writeChangelog( $input, $output, new Changelog() );
		$this->assertSame( SquashCommand::FATAL_EXIT, $ret );
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

		$w            = TestingAccessWrapper::newFromObject( $this->getCommand( 'squash' ) );
		$w->formatter = $formatter;

		$input  = new ArrayInput( array() );
		$output = new BufferedOutput();
		$ret    = $w->writeChangelog( $input, $output, new Changelog() );
		$this->assertSame( SquashCommand::FATAL_EXIT, $ret );
		$cwd = getcwd();
		$this->assertStringContainsString( "Failed to write $cwd/CHANGELOG.md: ", $output->fetch() );
	}

	/**
	 * Test execute handling of writeChangelog failing.
	 */
	public function testExecute_writeChangelog_fail() {
		$command = $this->getMockBuilder( SquashCommand::class )
			->setMethods( array( 'writeChangelog', 'deleteChanges' ) )
			->getMock();
		$command->setApplication( $this->getCommand( 'squash' )->getApplication() );
		$command->method( 'writeChangelog' )->willReturn( SquashCommand::FATAL_EXIT );
		$command->expects( $this->never() )->method( 'deleteChanges' );

		file_put_contents( 'CHANGELOG.md', "# Changelog\n\n## 1.0.0 - 2021-02-23\n\n- Initial release.\n\n## 1.0.0-beta - 2021-02-23\n\n- Initial beta.\n" );

		$tester = new CommandTester( $command );
		$code   = $tester->execute( array() );
		$this->assertSame( SquashCommand::FATAL_EXIT, $code );
	}

}
