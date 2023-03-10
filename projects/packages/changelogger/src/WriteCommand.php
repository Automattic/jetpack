<?php
/**
 * "Write" command for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelog\Changelog;
use InvalidArgumentException;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\MissingInputException;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use function Wikimedia\quietCall;

/**
 * "Write" command for the changelogger tool CLI.
 */
class WriteCommand extends Command {

	const OK_EXIT            = 0;
	const NO_CHANGE_EXIT     = 1;
	const ASKED_EXIT         = 2;
	const FATAL_EXIT         = 3;
	const DELETE_FAILED_EXIT = 4;

	/**
	 * The default command name.
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'write';

	/**
	 * The FormatterPlugin in use.
	 *
	 * @var FormatterPlugin
	 */
	protected $formatter;

	/**
	 * The VersioningPlugin in use.
	 *
	 * @var VersioningPlugin
	 */
	protected $versioning;

	/**
	 * Whether we already asked about there being no changes.
	 *
	 * @var bool
	 */
	protected $askedNoChanges = false;

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Updates the changelog from change files' )
			->addOption( 'amend', null, InputOption::VALUE_NONE, 'Amend the latest version instead of creating a new one' )
			->addOption( 'yes', null, InputOption::VALUE_NONE, 'Default all questions to "yes" instead of "no". Particularly useful for non-interactive mode' )
			->addOption( 'use-version', null, InputOption::VALUE_REQUIRED, 'Use this version instead of determining the version automatically' )
			->addOption( 'use-significance', null, InputOption::VALUE_REQUIRED, 'When determining the new version, use this significance instead of using the actual change files' )
			->addOption( 'prerelease', 'p', InputOption::VALUE_REQUIRED, 'When determining the new version, include this prerelease suffix' )
			->addOption( 'buildinfo', 'b', InputOption::VALUE_REQUIRED, 'When fetching the next version, include this buildinfo suffix' )
			->addOption( 'release-date', null, InputOption::VALUE_REQUIRED, 'Release date, as a valid PHP date or "unreleased"', 'now' )
			->addOption( 'default-first-version', null, InputOption::VALUE_NONE, 'If the changelog is currently empty, guess a "first" version instead of erroring' )
			->addOption( 'deduplicate', null, InputOption::VALUE_REQUIRED, 'Deduplicate new changes against the last N versions. Set -1 to disable deduplication entirely.', 1 )
			->addOption( 'prologue', null, InputOption::VALUE_REQUIRED, 'Prologue text for the new changelog entry' )
			->addOption( 'epilogue', null, InputOption::VALUE_REQUIRED, 'Epilogue text for the new changelog entry' )
			->addOption( 'link', null, InputOption::VALUE_REQUIRED, 'Link for the new changelog entry' )
			->addOption( 'add-pr-num', null, InputOption::VALUE_NONE, 'Try to append the GH PR number to each entry. Commit subject must end like: (#123)' )
			->setHelp(
				<<<EOF
The <info>write</info> command adds a new changelog entry based on the changes files, and removes the changes files.

Various edge cases will interactively prompt for information if possible. Use <info>--no-interaction</info> to avoid
this, along with <info>--yes</info> if you want to proceed through all prompts instead of stopping.

Exit codes are:

* 0: Success.
* 1: No changes were found, and continuing wasn't forced.
* 2: A non-fatal error was encountered and continuing wasn't forced.
* 3: A fatal error was encountered.
* 4: Changelog was successfully updated, but changes files could not be removed.
EOF
			);

		try {
			$this->getDefinition()->addOptions( Config::formatterPlugin()->getOptions() );
		} catch ( \Exception $ex ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Will handle later.
		}
		try {
			$this->getDefinition()->addOptions( Config::versioningPlugin()->getOptions() );
		} catch ( \Exception $ex ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Will handle later.
		}
	}

	/**
	 * Ask to continue.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param string          $msg Situation being asked about.
	 * @return bool
	 */
	private function askToContinue( InputInterface $input, OutputInterface $output, $msg ) {
		$yes = (bool) $input->getOption( 'yes' );

		if ( ! $input->isInteractive() ) {
			if ( $yes ) {
				$output->writeln( "<warning>$msg</> Continuing anyway." );
				return true;
			}
			$output->writeln( "<error>$msg</>" );
			return false;
		}
		try {
			$question = new ConfirmationQuestion( "$msg Proceed? " . ( $yes ? '[Y/n] ' : '[y/N] ' ), $yes );
			return $this->getHelper( 'question' )->ask( $input, $output, $question );
		} catch ( MissingInputException $ex ) { // @codeCoverageIgnore
			$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
			return false; // @codeCoverageIgnore
		}
	}

	/**
	 * Load the changelog.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return Changelog|int Changelog if everything went fine, or an exit code.
	 */
	protected function loadChangelog( InputInterface $input, OutputInterface $output ) {
		// Load changelog.
		$file = Config::changelogFile();
		if ( ! file_exists( $file ) ) {
			if ( ! $this->askToContinue( $input, $output, "Changelog file $file does not exist!" ) ) {
				return self::ASKED_EXIT;
			}
			$changelog = new Changelog();
		} else {
			$output->writeln( "Reading changelog from $file...", OutputInterface::VERBOSITY_DEBUG );
			Utils::error_clear_last();
			$contents = quietCall( 'file_get_contents', $file );
			// @codeCoverageIgnoreStart
			if ( ! is_string( $contents ) ) {
				$err = error_get_last();
				$output->writeln( "<error>Failed to read $file: {$err['message']}</>" );
				return self::FATAL_EXIT;
			}
			// @codeCoverageIgnoreEnd
			try {
				$changelog = $this->formatter->parse( $contents );
			} catch ( \Exception $ex ) {
				$output->writeln( "<error>Failed to parse changelog: {$ex->getMessage()}</>" );
				return self::FATAL_EXIT;
			}
		}
		return $changelog;
	}

	/**
	 * Add the entry to the changelog.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @param string          $version Version.
	 * @param ChangeEntry[]   $changes Changes.
	 * @return int
	 */
	protected function addEntry( InputInterface $input, OutputInterface $output, Changelog $changelog, $version, array $changes ) {
		$output->writeln( 'Creating new changelog entry.', OutputInterface::VERBOSITY_DEBUG );
		$data = array(
			'prologue'  => (string) $input->getOption( 'prologue' ),
			'epilogue'  => (string) $input->getOption( 'epilogue' ),
			'link'      => $input->getOption( 'link' ),
			'changes'   => $changes,
			'timestamp' => (string) $input->getOption( 'release-date' ),
		);
		if ( null === $data['link'] && $changelog->getLatestEntry() ) {
			$data['link'] = Config::link( $changelog->getLatestEntry()->getVersion(), $version );
		}
		if ( 'unreleased' === $data['timestamp'] ) {
			$data['timestamp'] = null;
		}
		try {
			$changelog->addEntry( $this->formatter->newChangelogEntry( $version, $data ) );
		} catch ( InvalidArgumentException $ex ) {
			$output->writeln( "<error>Failed to create changelog entry: {$ex->getMessage()}</>" );
			return self::FATAL_EXIT;
		}
		return self::OK_EXIT;
	}

	/**
	 * Write the changelog.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @return int
	 */
	protected function writeChangelog( InputInterface $input, OutputInterface $output, Changelog $changelog ) {
		$file = Config::changelogFile();
		$output->writeln( "Writing changelog to $file...", OutputInterface::VERBOSITY_DEBUG );
		try {
			$contents = $this->formatter->format( $changelog );
		} catch ( InvalidArgumentException $ex ) {
			$output->writeln( "<error>Failed to write the changelog: {$ex->getMessage()}</>" );
			return self::FATAL_EXIT;
		}

		Utils::error_clear_last();
		$ok = quietCall( 'file_put_contents', $file, $contents );
		if ( strlen( $contents ) !== $ok ) {
			$err = error_get_last();
			$output->writeln( "<error>Failed to write $file: {$err['message']}</>" );
			return self::FATAL_EXIT;
		}

		return self::OK_EXIT;
	}

	/**
	 * Delete the change files.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param array           $files Files returned from `loadChanges()`.
	 * @return int
	 */
	protected function deleteChanges( InputInterface $input, OutputInterface $output, array $files ) {
		$dir = Config::changesDir();
		$ret = self::OK_EXIT;
		foreach ( $files as $name => $flag ) {
			if ( $flag >= 2 ) {
				continue;
			}
			Utils::error_clear_last();
			$ok = quietCall( 'unlink', $dir . DIRECTORY_SEPARATOR . $name );
			if ( $ok ) {
				$output->writeln( "Deleted change file $name.", OutputInterface::VERBOSITY_DEBUG );
			} else {
				$err = error_get_last();
				$output->writeln( "<warning>Failed to delete $name: {$err['message']}" );
				$ret = self::DELETE_FAILED_EXIT;
			}
		}
		return $ret;
	}

	/**
	 * Load the changes.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return array Array of [ $code, $changes, $files ].
	 */
	protected function loadChanges( InputInterface $input, OutputInterface $output ) {
		$dir = Config::changesDir();
		if ( ! is_dir( $dir ) ) {
			$this->askedNoChanges = true;
			if ( ! $this->askToContinue( $input, $output, 'Changes directory does not exist, so there are no changes to write!' ) ) {
				return array( self::NO_CHANGE_EXIT, null, null );
			}
			return array( self::OK_EXIT, array(), array() );
		}

		$output->writeln( "Reading changes from $dir...", OutputInterface::VERBOSITY_DEBUG );
		$files         = null; // Make phpcs happy.
		$input_options = array(
			'add-pr-num' => $input->getOption( 'add-pr-num' ),
		);
		$changes       = Utils::loadAllChanges( $dir, Config::types(), $this->formatter, $output, $files, $input_options );
		$max           = $files ? max( $files ) : 0;
		if ( $max > 0 && ! $this->askToContinue( $input, $output, ( $max > 1 ? 'Errors' : 'Warnings' ) . ' were encountered while reading changes!' ) ) {
			return array( self::ASKED_EXIT, null, null );
		}
		if ( ! $changes && ! $this->askedNoChanges ) {
			$this->askedNoChanges = true;
			if ( ! $this->askToContinue( $input, $output, 'No changes were found!' ) ) {
				return array( self::NO_CHANGE_EXIT, null, null );
			}
		}
		return array( self::OK_EXIT, $changes, $files );
	}

	/**
	 * Deduplicate changes.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @param ChangeEntry[]   $changes Changes.
	 * @return int
	 */
	protected function deduplicateChanges( InputInterface $input, OutputInterface $output, Changelog $changelog, array &$changes ) {
		// Deduplicate changes.
		if ( ! $changes ) {
			$output->writeln( 'Skipping deduplication, there are no changes.', OutputInterface::VERBOSITY_DEBUG );
			return self::OK_EXIT;
		}

		$depth = (int) $input->getOption( 'deduplicate' );
		if ( $depth < 0 ) {
			$output->writeln( "Skipping deduplication, --deduplicate is $depth.", OutputInterface::VERBOSITY_DEBUG );
			return self::OK_EXIT;
		}

		$dedup = array();
		if ( $depth > 0 ) {
			$output->writeln( "Deduplicating changes from the last $depth version(s)...", OutputInterface::VERBOSITY_DEBUG );
			foreach ( array_slice( $changelog->getEntries(), 0, $depth ) as $entry ) {
				foreach ( $entry->getChanges() as $change ) {
					$dedup[ $change->getContent() ] = true;
				}
			}
			unset( $dedup[''] );
		} else {
			$output->writeln( 'Deduplicating changes in the current version...', OutputInterface::VERBOSITY_DEBUG );
		}
		$changes = array_filter(
			$changes,
			function ( $change, $name ) use ( &$dedup, $output ) {
				if ( isset( $dedup[ $change->getContent() ] ) ) {
					$output->writeln( "Found duplicate change in $name.", OutputInterface::VERBOSITY_DEBUG );
					return false;
				}
				$dedup[ $change->getContent() ] = true;
				return true;
			},
			ARRAY_FILTER_USE_BOTH
		);
		if ( ! $changes && ! $this->askedNoChanges ) {
			$this->askedNoChanges = true;
			if ( ! $this->askToContinue( $input, $output, 'All changes were duplicates.' ) ) {
				return self::NO_CHANGE_EXIT;
			}
		}
		return self::OK_EXIT;
	}

	/**
	 * Check whether any changes have content.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param ChangeEntry[]   $changes Changes.
	 * @return bool
	 */
	protected function doChangesHaveContent( InputInterface $input, OutputInterface $output, array $changes ) {
		$output->writeln( 'Checking if any changes have content...', OutputInterface::VERBOSITY_DEBUG );
		foreach ( $changes as $name => $change ) {
			if ( $change->getContent() !== '' ) {
				$output->writeln( "Yes, $name has content.", OutputInterface::VERBOSITY_DEBUG );
				return true;
			}
		}
		return false;
	}

	/**
	 * Apply --amend if applicable.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @param ChangeEntry[]   $changes Changes.
	 * @param string|null     $amendedVersion Set to indicate the source version of the amend, if any.
	 * @return int
	 */
	protected function doAmendChanges( InputInterface $input, OutputInterface $output, Changelog $changelog, array &$changes, &$amendedVersion = null ) {
		$amendedVersion = null;
		if ( $input->getOption( 'amend' ) ) {
			$entries = $changelog->getEntries();
			if ( $entries ) {
				$latest = array_shift( $entries );
				$changelog->setEntries( $entries );
				$amendedVersion = $latest->getVersion();
				$changes        = array_merge( $latest->getChanges(), array_values( $changes ) );
				$output->writeln( "Removing changes for $amendedVersion from changelog for --amend.", OutputInterface::VERBOSITY_DEBUG );

				if ( $input->getOption( 'prologue' ) === null ) {
					$input->setOption( 'prologue', $latest->getPrologue() );
				}
				if ( $input->getOption( 'epilogue' ) === null ) {
					$input->setOption( 'epilogue', $latest->getEpilogue() );
				}
				if ( $input->getOption( 'link' ) === null ) {
					$input->setOption( 'link', $latest->getLink() );
				}
			} else {
				$output->writeln( 'No version to amend, ignoring --amend.', OutputInterface::VERBOSITY_DEBUG );
			}
		}
		return self::OK_EXIT;
	}

	/**
	 * Sort changes.
	 *
	 * @param ChangeEntry[] $changes Changes.
	 * @return array
	 */
	protected function sortChanges( array $changes ) {
		$sortConfig = array(
			'ordering'         => Config::ordering(),
			'knownSubheadings' => Config::types(),
		);
		$changes    = array_values( $changes );
		usort(
			$changes,
			function ( $a, $b ) use ( $sortConfig, $changes ) {
				$ret = ChangeEntry::compare( $a, $b, $sortConfig );
				if ( 0 === $ret ) {
					// Stability.
					$ret = array_search( $a, $changes, true ) - array_search( $b, $changes, true );
				}
				return $ret;
			}
		);
		return $changes;
	}

	/**
	 * Get the version from the command line.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @return string|int New version, or int on error.
	 */
	protected function getUseVersion( InputInterface $input, OutputInterface $output, Changelog $changelog ) {
		$version = $input->getOption( 'use-version' );
		$output->writeln( "Using version $version from command line.", OutputInterface::VERBOSITY_DEBUG );

		// Normalize it?
		try {
			$nversion = $this->versioning->normalizeVersion( $version );
		} catch ( InvalidArgumentException $ex ) {
			$nversion = $version;
			$output->writeln( "<error>Invalid --use-version: {$ex->getMessage()}</>" );
			if ( ! $this->askToContinue( $input, $output, 'The specified version is not valid. This may cause problems in the future!' ) ) {
				return self::ASKED_EXIT;
			}
		}
		if ( $version !== $nversion ) {
			if ( ! $input->isInteractive() ) {
				if ( ! $this->askToContinue( $input, $output, "The supplied version $version is not normalized, it should be $nversion." ) ) {
					return self::ASKED_EXIT;
				}
			} else {
				try {
					$question = new ChoiceQuestion(
						"The supplied version $version is not normalized.",
						array(
							'proceed'   => "Proceed with $version",
							'normalize' => "Normalize to $nversion",
							'abort'     => 'Abort',
						),
						$input->getOption( 'yes' ) ? 'proceed' : 'abort'
					);
					switch ( $this->getHelper( 'question' )->ask( $input, $output, $question ) ) {
						case 'proceed': // @codeCoverageIgnore
							break;
						case 'normalize': // @codeCoverageIgnore
							$output->writeln( "Normalizing $version to $nversion.", OutputInterface::VERBOSITY_DEBUG );
							$version = $nversion;
							break;
						default:
							return self::ASKED_EXIT;
					}
				} catch ( MissingInputException $ex ) { // @codeCoverageIgnore
					$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
					return self::ASKED_EXIT; // @codeCoverageIgnore
				}
			}
		}

		// Check that it's newer than the current version.
		$latest = $changelog->getLatestEntry();
		if ( $latest ) {
			$curver = $latest->getVersion();
			try {
				$cmp = $this->versioning->compareVersions( $version, $curver );
			} catch ( InvalidArgumentException $ex ) {
				$output->writeln( "Cannot compare $version with $curver: {$ex->getMessage()}", OutputInterface::VERBOSITY_DEBUG );
				$cmp = 1;
			}
			if ( $cmp < 0 && ! $this->askToContinue( $input, $output, "The most recent version in the changelog is $curver, which comes after $version." ) ) {
				return self::ASKED_EXIT;
			}
			if ( 0 === $cmp && ! $this->askToContinue( $input, $output, "The most recent version in the changelog is $curver, which is equivalent to $version." ) ) {
				return self::ASKED_EXIT;
			}
		}
		return $version;
	}

	/**
	 * Determine the next version.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param Changelog       $changelog Changelog.
	 * @param ChangeEntry[]   $changes Changes.
	 * @param string|null     $amendedVersion The source version of the amend, if any.
	 * @return string|int New version, or int on error.
	 */
	protected function nextVersion( InputInterface $input, OutputInterface $output, Changelog $changelog, array $changes, $amendedVersion ) {
		$extra = array(
			'prerelease' => $input->getOption( 'prerelease' ),
			'buildinfo'  => $input->getOption( 'buildinfo' ),
		);

		// Is there a version in the changelog?
		$latest = $changelog->getLatestEntry();
		if ( ! $latest ) {
			if ( null !== $amendedVersion ) {
				$output->writeln( "Amending earliest version, reusing version $amendedVersion...", OutputInterface::VERBOSITY_DEBUG );
				return $amendedVersion;
			} elseif ( $input->getOption( 'default-first-version' ) ) {
				return $this->versioning->firstVersion( $extra );
			} else {
				$output->writeln( '<error>Changelog file contains no entries! Use --use-version to specify the initial version.</>' );
				return self::FATAL_EXIT;
			}
		}

		$output->writeln( "Latest version from changelog is {$latest->getVersion()}.", OutputInterface::VERBOSITY_DEBUG );

		// If they overrode the significance, use that. Otherwise use `$changes`.
		if ( $input->getOption( 'use-significance' ) ) {
			try {
				$verchanges = array(
					$this->formatter->newChangeEntry(
						array(
							'significance' => $input->getOption( 'use-significance' ),
							'content'      => 'Dummy',
						)
					),
				);
			} catch ( \Exception $ex ) {
				$output->writeln( "<error>{$ex->getMessage()}</>" );
				return self::FATAL_EXIT;
			}
		} else {
			$verchanges = $changes;
		}

		// Get the next version from the versioning plugin.
		try {
			$version = VersionCommand::getNextVersion( $changelog->getVersions(), $verchanges, $extra );
		} catch ( InvalidArgumentException $ex ) {
			// Was it the version from the changelog that made it fail, or something else?
			try {
				$this->versioning->normalizeVersion( $latest->getVersion() );
				$output->writeln( "<error>Failed to determine new version: {$ex->getMessage()}</>" );
			} catch ( InvalidArgumentException $ex2 ) {
				$output->writeln( "<error>Changelog file contains invalid version {$latest->getVersion()}! Use --use-version to specify the new version.</>" );
			}
			return self::FATAL_EXIT;
		}
		$output->writeln( "Next version is {$version}.", OutputInterface::VERBOSITY_DEBUG );

		// When amending, if the next version turns out to be before the amended version, use the amended version.
		try {
			if ( null !== $amendedVersion && $this->versioning->compareVersions( $amendedVersion, $version ) > 0 ) {
				$output->writeln( "Amended version $amendedVersion is later, using that instead.", OutputInterface::VERBOSITY_DEBUG );
				$version = $amendedVersion;
			}
		} catch ( InvalidArgumentException $ex ) {
			$output->writeln( "Amended version $amendedVersion is was not valid. Hope it wasn't supposed to be later.", OutputInterface::VERBOSITY_DEBUG );
		}

		return $version;
	}

	/**
	 * Executes the command.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return int 0 If everything went fine, or an exit code.
	 */
	protected function execute( InputInterface $input, OutputInterface $output ) {
		try {
			$this->formatter = Config::formatterPlugin();
			$this->formatter->setIO( $input, $output );
			$this->versioning = Config::versioningPlugin();
			$this->versioning->setIO( $input, $output );
		} catch ( \Exception $ex ) {
			$output->writeln( "<error>{$ex->getMessage()}</>" );
			return self::FATAL_EXIT;
		}
		$this->askedNoChanges = false;

		// Get the changelog.
		$changelog = $this->loadChangelog( $input, $output );
		if ( is_int( $changelog ) ) {
			return $changelog;
		}

		// Get the changes.
		list( $ret, $changes, $files ) = $this->loadChanges( $input, $output, $changelog );
		if ( self::OK_EXIT !== $ret ) {
			return $ret;
		}
		$ret = $this->deduplicateChanges( $input, $output, $changelog, $changes );
		if ( self::OK_EXIT !== $ret ) {
			return $ret;
		}
		$anyChangesWithContent = $this->doChangesHaveContent( $input, $output, $changes );
		if ( ! $anyChangesWithContent && ! $this->askedNoChanges ) {
			$this->askedNoChanges = true;
			if ( ! $this->askToContinue( $input, $output, 'There are no changes with content for this write.' ) ) {
				return self::NO_CHANGE_EXIT;
			}
		}
		$amendedVersion = null; // Make phpcs happy.
		$ret            = $this->doAmendChanges( $input, $output, $changelog, $changes, $amendedVersion );
		if ( self::OK_EXIT !== $ret ) {
			return $ret; // @codeCoverageIgnore
		}
		$changes = $this->sortChanges( $changes );

		// Determine next version.
		if ( $input->getOption( 'use-version' ) !== null ) {
			$version = $this->getUseVersion( $input, $output, $changelog );
		} else {
			$version = $this->nextVersion( $input, $output, $changelog, $changes, $amendedVersion );
		}
		if ( is_int( $version ) ) {
			return $version;
		}

		// Add the new changelog entry.
		$ret = $this->addEntry( $input, $output, $changelog, $version, $changes );
		if ( self::OK_EXIT !== $ret ) {
			return $ret;
		}

		// Write the changelog.
		$ret = $this->writeChangelog( $input, $output, $changelog );
		if ( self::OK_EXIT !== $ret ) {
			return $ret;
		}

		// Delete change files and return.
		return $this->deleteChanges( $input, $output, $files );
	}
}
