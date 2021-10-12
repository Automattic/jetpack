<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * "Version" command for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use function Wikimedia\quietCall;

/**
 * "Version" command for the changelogger tool CLI.
 */
class VersionCommand extends Command {

	/**
	 * The default command name
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'version';

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Displays versions from the changelog and change files' )
			->addArgument( 'which', InputArgument::REQUIRED, 'Version to fetch: <info>previous</>, <info>current</>, or <info>next</>' )
			->addOption( 'use-version', null, InputOption::VALUE_REQUIRED, 'When fetching the next version, use this instead of the current version in the changelog' )
			->addOption( 'use-significance', null, InputOption::VALUE_REQUIRED, 'When fetching the next version, use this significance instead of using the actual change files' )
			->addOption( 'prerelease', 'p', InputOption::VALUE_REQUIRED, 'When fetching the next version, include this prerelease suffix' )
			->addOption( 'buildinfo', 'b', InputOption::VALUE_REQUIRED, 'When fetching the next version, include this buildinfo suffix' )
			->addOption( 'default-first-version', null, InputOption::VALUE_NONE, 'If the changelog is currently empty, guess a "first" version instead of erroring. When used with <info>current</>, makes it work as <info>next</> in that situation.' )
			->setHelp(
				<<<EOF
The <info>version</info> command reads the versions from the changelog, and outputs the previous, current, or next version based on the change files.
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
	 * Executes the command.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return int 0 if everything went fine, or an exit code.
	 */
	protected function execute( InputInterface $input, OutputInterface $output ) {
		try {
			$formatter = Config::formatterPlugin();
			$formatter->setIO( $input, $output );
			$versioning = Config::versioningPlugin();
			$versioning->setIO( $input, $output );
		} catch ( \Exception $ex ) {
			$output->writeln( "<error>{$ex->getMessage()}</>" );
			return 1;
		}

		$which = (string) $input->getArgument( 'which' );
		$l     = '' === $which ? 1 : strlen( $which );
		$ok    = false;
		foreach ( array( 'previous', 'current', 'next' ) as $w ) {
			if ( substr( $w, 0, $l ) === $which ) {
				$which = $w;
				$ok    = true;
			}
		}
		if ( ! $ok ) {
			$output->writeln( "<error>Don't know how to fetch the \"$which\" version</>" );
			return 1;
		}

		// Read current versions, either from command line or changelog.
		if ( 'next' === $which && $input->getOption( 'use-version' ) !== null ) {
			$versions = array( $input->getOption( 'use-version' ) );
		} else {
			$file = Config::changelogFile();
			if ( ! file_exists( $file ) ) {
				$output->writeln( "<error>Changelog file $file does not exist</>" );
				return 1;
			}

			Utils::error_clear_last();
			$contents = quietCall( 'file_get_contents', $file );
			// @codeCoverageIgnoreStart
			if ( ! is_string( $contents ) ) {
				$err = error_get_last();
				$output->writeln( "<error>Failed to read $file: {$err['message']}</>" );
				return 1;
			}
			// @codeCoverageIgnoreEnd

			try {
				$versions = $formatter->parse( $contents )->getVersions();
			} catch ( \Exception $ex ) {
				$output->writeln( "<error>Failed to parse changelog: {$ex->getMessage()}</>" );
				return 1;
			}

			if ( count( $versions ) === 0 && ! $input->getOption( 'default-first-version' ) ) {
				$output->writeln( '<error>Changelog file contains no entries</>' );
				return 1;
			}
		}

		// If we want the previous, return it from the changelog.
		if ( 'previous' === $which ) {
			if ( count( $versions ) < 2 ) {
				$output->writeln( '<error>Changelog file contains no previous version</>' );
				return 1;
			}
			$output->writeln( $versions[1], OutputInterface::VERBOSITY_QUIET );
			return 0;
		}

		// For current and next, if the changelog was empty of versions (and it didn't error out
		// earlier) then guess the first version.
		$extra = array(
			'prerelease' => $input->getOption( 'prerelease' ),
			'buildinfo'  => $input->getOption( 'buildinfo' ),
		);
		if ( ! $versions ) {
			try {
				$output->writeln( $versioning->firstVersion( $extra ), OutputInterface::VERBOSITY_QUIET );
				return 0;
			} catch ( \Exception $ex ) {
				$output->writeln( "<error>{$ex->getMessage()}</>" );
				return 1;
			}
		}

		// Otherwise, for current, return the current version.
		if ( 'current' === $which ) {
			$output->writeln( $versions[0], OutputInterface::VERBOSITY_QUIET );
			return 0;
		}

		// We want the next version. Determine it based on changes or command line.
		if ( $input->getOption( 'use-significance' ) ) {
			try {
				$changes = array(
					$formatter->newChangeEntry(
						array(
							'significance' => $input->getOption( 'use-significance' ),
							'content'      => 'Dummy',
						)
					),
				);
			} catch ( \Exception $ex ) {
				$output->writeln( "<error>{$ex->getMessage()}</>" );
				return 1;
			}
		} else {
			$dir = Config::changesDir();
			if ( is_dir( $dir ) ) {
				$changes = Utils::loadAllChanges( Config::changesDir(), Config::types(), $formatter, $output );
			} else {
				$output->writeln( '<warning>Changes directory does not exist</>' );
				$changes = array();
			}
		}
		try {
			$curversion     = $versions[0];
			$releaseversion = null;
			foreach ( $versions as $v ) {
				try {
					$parsed = $versioning->parseVersion( $v );
				} catch ( \Exception $ex ) {
					$output->writeln( "<warning>Failed to parse version $v from changelog</>", OutputInterface::VERBOSITY_VERBOSE );
					break;
				}
				if ( null === $parsed['prerelease'] ) {
					$releaseversion = $parsed['version'];
					break;
				}
			}

			// Simple case, current version is a release version.
			if ( $curversion === $releaseversion ) {
				$output->writeln( $versioning->nextVersion( $curversion, $changes, $extra ), OutputInterface::VERBOSITY_QUIET );
				return 0;
			}

			// Some DWIM going on here, when the current version is a prerelease:
			// 1. First, find the most recent non-prerelease version and calculate "next" based on that.
			// 2. If the above returned a version earlier than the most recent version, re-normalize with the new $extra.
			// 3. If that returned an earlier version too, try a patch bump.
			$newversion = null;
			if ( null !== $releaseversion ) {
				$newversion = $versioning->nextVersion( $releaseversion, $changes, $extra );
				if ( $versioning->compareVersions( $curversion, $newversion ) >= 0 ) {
					$newversion = null;
				}
			}
			if ( null === $newversion ) {
				$newversion = $versioning->normalizeVersion( $curversion, $extra );
				if ( $versioning->compareVersions( $curversion, $newversion ) >= 0 ) {
					$newversion = null;
				}
			}
			if ( null === $newversion ) {
				$newversion = $versioning->nextVersion( $curversion, array(), $extra );
			}
			$output->writeln( $newversion, OutputInterface::VERBOSITY_QUIET );
			return 0;
		} catch ( \Exception $ex ) {
			$output->writeln( "<error>{$ex->getMessage()}</>" );
			return 1;
		}
	}
}
