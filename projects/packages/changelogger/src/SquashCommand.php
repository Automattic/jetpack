<?php
/**
 * "Squash" command for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Automattic\Jetpack\Changelog\ChangeEntry;
use InvalidArgumentException;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use function Wikimedia\quietCall;

/**
 * "Squash" command for the changelogger tool CLI.
 */
class SquashCommand extends WriteCommand {

	/**
	 * The default command name.
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'squash';

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Squash changelog entries in the changelog file' )
			->addOption( 'regex', null, InputOption::VALUE_REQUIRED, 'PCRE regex to match the versions to squash, including delimiters' )
			->addOption( 'count', null, InputOption::VALUE_REQUIRED, 'Number of versions to squash' )
			->addOption( 'use-version', null, InputOption::VALUE_REQUIRED, 'Use this version instead of determining the version automatically' )
			->addOption( 'release-date', null, InputOption::VALUE_REQUIRED, 'Release date, as a valid PHP date or "unreleased"' )
			->addOption( 'prologue', null, InputOption::VALUE_REQUIRED, 'Prologue text for the new changelog entry' )
			->addOption( 'epilogue', null, InputOption::VALUE_REQUIRED, 'Epilogue text for the new changelog entry' )
			->addOption( 'link', null, InputOption::VALUE_REQUIRED, 'Link for the new changelog entry' )
			->addOption( '--no-deduplicate', null, InputOption::VALUE_NONE, 'Do not deduplicate the changes' )
			->addOption( 'yes', null, InputOption::VALUE_NONE, 'Default all questions to "yes" instead of "no". Particularly useful for non-interactive mode' )
			->setHelp(
				<<<EOF
The <info>squash</info> command combines multiple existing changelog entries into one.

The default behavior is to combine all entries that differ from the first only by prerelease
and/or buildinfo. If <info>--regex</info> is used, instead all entries up to the first not matching
the regex are merged. If <info>--count</info> is used, instead that many entries are merged.

The default behavior is to combine the entries under the version number, date, and link of the
first entry, with prologue and epilogue texts concatenated. This may be overridden using
<info>--use-version</info>, <info>--release-date</info>, <info>--link</info>, <info>--prologue</info>,
and <info>--epilogue</info>.
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
	 * Deduplicate changes.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @param ChangeEntry[]   $changes Changes.
	 * @return int
	 */
	protected function deduplicateChanges2( InputInterface $input, OutputInterface $output, array &$changes ) {
		// Deduplicate changes.
		if ( ! $changes ) {
			$output->writeln( 'Skipping deduplication, there are no changes.', OutputInterface::VERBOSITY_DEBUG );
			return self::OK_EXIT;
		}

		if ( $input->getOption( 'no-deduplicate' ) ) {
			$output->writeln( 'Skipping deduplication, --no-deduplicate was specified.', OutputInterface::VERBOSITY_DEBUG );
			return self::OK_EXIT;
		}

		$output->writeln( 'Deduplicating changes...', OutputInterface::VERBOSITY_DEBUG );
		$seen = array();
		foreach ( $changes as $k => $change ) {
			if ( isset( $seen[ $change->getContent() ] ) ) {
				$output->writeln( "Found duplicate change '{$change->getContent()}'.", OutputInterface::VERBOSITY_DEBUG );
				unset( $changes[ $k ] );
			} else {
				$seen[ $change->getContent() ] = true;
			}
		}
		return self::OK_EXIT;
	}

	/**
	 * Merge changes.
	 *
	 * @param ChangeEntry[] $a Changes.
	 * @param ChangeEntry[] $b Changes.
	 * @return ChangeEntry[]
	 */
	protected function mergeChanges( array $a, array $b ) {
		$sortConfig = array(
			'ordering'         => Config::ordering(),
			'knownSubheadings' => Config::types(),
		);

		$a   = $this->sortChanges( $a );
		$b   = $this->sortChanges( $b );
		$ret = array();
		while ( $a && $b ) {
			if ( ChangeEntry::compare( $a[0], $b[0], $sortConfig ) <= 0 ) {
				$ret[] = array_shift( $a );
			} else {
				$ret[] = array_shift( $b );
			}
		}
		return array_merge( $ret, $a, $b );
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

		// Get the changelog.
		$changelog = $this->loadChangelog( $input, $output );
		if ( is_int( $changelog ) ) {
			return $changelog;
		}
		$inEntries = $changelog->getEntries();
		if ( ! $inEntries ) {
			$output->writeln( '<error>Changelog contains no entries, cannot squash</>' );
			return self::FATAL_EXIT;
		}

		// Extract the entries to squash.
		$entries = array();
		if ( $input->getOption( 'regex' ) !== null ) {
			$regex = $input->getOption( 'regex' );
			$output->writeln( "Looking for entries matching regex $regex", OutputInterface::VERBOSITY_DEBUG );
			while ( $inEntries ) {
				$ret = quietCall( 'preg_match', $regex, $inEntries[0]->getVersion() );
				if ( false === $ret ) {
					$err = error_get_last()['message'];
					if ( substr( $err, 0, 14 ) === 'preg_match(): ' ) {
						$err = substr( $err, 14 );
					}
					$output->writeln( "<error>Regex match failed: $err</>" );
					return self::FATAL_EXIT;
				} elseif ( $ret ) {
					$output->writeln( "Will squash version {$inEntries[0]->getVersion()}", OutputInterface::VERBOSITY_DEBUG );
					$entries[] = array_shift( $inEntries );
				} else {
					$output->writeln( "No match at {$inEntries[0]->getVersion()}, stopping there", OutputInterface::VERBOSITY_DEBUG );
					break;
				}
			}
		} elseif ( $input->getOption( 'count' ) !== null ) {
			$count = $input->getOption( 'count' );
			if ( ! preg_match( '/^\d+$/', $count ) || 0 === (int) $count ) {
				$output->writeln( '<error>Count must be a positive integer</>' );
				return self::FATAL_EXIT;
			}
			$output->writeln( "Squashing first $count entries", OutputInterface::VERBOSITY_DEBUG );
			$entries = array_splice( $inEntries, 0, $count );
		} else {
			$entries[] = array_shift( $inEntries );
			try {
				$version = $this->versioning->parseVersion( $entries[0]->getVersion() )['version'];
			} catch ( InvalidArgumentException $ex ) {
				$output->writeln( "<error>Cannot parse version number {$entries[0]->getVersion()}</>" );
				return self::FATAL_EXIT;
			}
			$output->writeln( "Looking for entries matching version $version", OutputInterface::VERBOSITY_DEBUG );
			$output->writeln( "Will squash version {$entries[0]->getVersion()}", OutputInterface::VERBOSITY_DEBUG );
			while ( $inEntries ) {
				try {
					$version2 = $this->versioning->parseVersion( $inEntries[0]->getVersion() )['version'];
				} catch ( InvalidArgumentException $ex ) {
					$output->writeln( "Cannot parse version number {$inEntries[0]->getVersion()}, stopping there", OutputInterface::VERBOSITY_DEBUG );
					break;
				}
				if ( $version2 === $version ) {
					$output->writeln( "Will squash version {$inEntries[0]->getVersion()}", OutputInterface::VERBOSITY_DEBUG );
					$entries[] = array_shift( $inEntries );
				} else {
					$output->writeln( "No match at {$inEntries[0]->getVersion()}, stopping there", OutputInterface::VERBOSITY_DEBUG );
					break;
				}
			}
		}
		if ( count( $entries ) <= 0 ) {
			$output->writeln( '<error>No entries to squash</>' );
			return self::NO_CHANGE_EXIT;
		} elseif ( count( $entries ) <= 1 ) {
			$output->writeln( '<error>Only a single entry matched, not squashing</>' );
			return self::NO_CHANGE_EXIT;
		}
		$changelog->setEntries( $inEntries );

		$changes   = array();
		$prologues = array();
		$epilogues = array();
		foreach ( $entries as $e ) {
			$changes = $this->mergeChanges( $changes, $e->getChanges() );
			if ( trim( $e->getPrologue() ) !== '' ) {
				$prologues[] = trim( $e->getPrologue() );
			}
			if ( trim( $e->getEpilogue() ) !== '' ) {
				$epilogues[] = trim( $e->getEpilogue() );
			}
		}

		$ret = $this->deduplicateChanges2( $input, $output, $changes );
		if ( self::OK_EXIT !== $ret ) {
			return $ret; // @codeCoverageIgnore
		}

		// Determine next version.
		if ( $input->getOption( 'use-version' ) !== null ) {
			$version = $this->getUseVersion( $input, $output, $changelog );
		} else {
			$version = $entries[0]->getVersion();
		}
		if ( is_int( $version ) ) {
			return $version;
		}

		if ( $input->getOption( 'release-date' ) === null ) {
			$input->setOption( 'release-date', $entries[0]->getTimestamp()->format( 'Y-m-d\TH:i:sO' ) );
		}
		if ( $input->getOption( 'link' ) === null ) {
			$input->setOption( 'link', $entries[0]->getLink() );
		}
		if ( $input->getOption( 'prologue' ) === null ) {
			$input->setOption( 'prologue', join( "\n\n", $prologues ) );
		}
		if ( $input->getOption( 'epilogue' ) === null ) {
			$input->setOption( 'epilogue', join( "\n\n", $epilogues ) );
		}

		// Add the new changelog entry.
		$ret = $this->addEntry( $input, $output, $changelog, $version, $changes );
		if ( self::OK_EXIT !== $ret ) {
			return $ret;
		}

		// Write the changelog.
		return $this->writeChangelog( $input, $output, $changelog );
	}
}
