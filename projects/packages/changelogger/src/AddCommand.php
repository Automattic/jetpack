<?php
/**
 * "Add" command for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\MissingInputException;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Question\Question;
use function Wikimedia\quietCall;

/**
 * "Add" command for the changelogger tool CLI.
 */
class AddCommand extends Command {

	/**
	 * Bad characters for filenames.
	 *
	 * @var array
	 */
	private static $badChars = array(
		'<'  => 'angle brackets',
		'>'  => 'angle brackets',
		':'  => 'colons',
		'"'  => 'double quotes',
		'/'  => 'slashes',
		'\\' => 'backslashes',
		'|'  => 'pipes',
		'?'  => 'question marks',
		'*'  => 'asterisks',
	);

	/**
	 * Significance values and descriptions.
	 *
	 * @var array
	 */
	private static $significances = array(
		'patch' => 'Backwards-compatible bug fixes.',
		'minor' => 'Added (or deprecated) functionality in a backwards-compatible manner.',
		'major' => 'Broke backwards compatibility in some way.',
	);

	/**
	 * The default command name
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'add';

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$joiner = function ( $arr ) {
			return implode(
				"\n",
				array_map(
					function ( $k, $v ) {
						return " - $k: $v";
					},
					array_keys( $arr ),
					$arr
				)
			);
		};

		$this->setDescription( 'Adds a change file' )
			->addOption( 'filename', 'f', InputOption::VALUE_REQUIRED, 'Name for the change file. If not provided, a default will be determined from the current timestamp or git branch name.' )
			->addOption( 'filename-auto-suffix', null, InputOption::VALUE_NONE, 'If the specified file already exists in non-interactive mode, add a numeric suffix so the new entry can be created.' )
			->addOption( 'significance', 's', InputOption::VALUE_REQUIRED, "Significance of the change, in the style of semantic versioning. One of the following:\n" . $joiner( self::$significances ) )
			->addOption( 'type', 't', InputOption::VALUE_REQUIRED, Config::types() ? "Type of change. One of the following:\n" . $joiner( Config::types() ) : 'Normally this would be used to indicate the type of change, but this project does not use types. Do not use.' )
			->addOption( 'comment', 'c', InputOption::VALUE_REQUIRED, 'Optional comment to include in the file.' )
			->addOption( 'entry', 'e', InputOption::VALUE_REQUIRED, 'Changelog entry. May be empty if the significance is "patch".' )
			->setHelp(
				<<<EOF
The <info>add</info> command adds a new change file to the changelog directory.

By default this is an interactive process: the user will be queried for the necessary
information, with command line arguments supplying default values. Use <info>--no-interaction</info>
to create an entry non-interactively.
EOF
			);
	}

	/**
	 * Validate a filename.
	 *
	 * @param string $filename Filename.
	 * @return string $filename
	 * @throws \RuntimeException On error.
	 */
	public function validateFilename( $filename ) {
		if ( '' === $filename ) {
			throw new \RuntimeException( 'Filename may not be empty.' );
		}

		if ( '.' === $filename[0] ) {
			throw new \RuntimeException( 'Filename may not begin with a dot.' );
		}

		$bad = array();
		foreach ( self::$badChars as $c => $name ) {
			if ( strpos( $filename, $c ) !== false ) {
				$bad[ $name ] = true;
			}
		}
		if ( $bad ) {
			$bad = array_keys( $bad );
			if ( count( $bad ) > 1 ) {
				$bad[ count( $bad ) - 1 ] = 'or ' . $bad[ count( $bad ) - 1 ];
			}
			throw new \RuntimeException( 'Filename may not contain ' . implode( count( $bad ) > 2 ? ', ' : ' ', $bad ) . '.' );
		}

		$path = Config::changesDir() . "/$filename";
		if ( file_exists( $path ) ) {
			throw new \RuntimeException( "File \"$path\" already exists. If you want to replace it, delete it manually." );
		}

		return $filename;
	}

	/**
	 * Get the default filename.
	 *
	 * @param OutputInterface $output OutputInterface.
	 * @return string
	 */
	protected function getDefaultFilename( OutputInterface $output ) {
		static $non_feature_branches = array( 'current', 'default', 'develop', 'latest', 'main', 'master', 'next', 'production', 'support', 'tip', 'trunk' );

		try {
			$process = Utils::runCommand( array( 'git', 'rev-parse', '--abbrev-ref', 'HEAD' ), $output, $this->getHelper( 'debug_formatter' ) );
			if ( $process->isSuccessful() ) {
				$ret = trim( $process->getOutput() );
				if ( ! in_array( $ret, $non_feature_branches, true ) ) {
					return strtr( $ret, array_fill_keys( array_keys( self::$badChars ), '-' ) );
				}
			}
		} catch ( \Exception $ex ) { // @codeCoverageIgnore
			$output->writeln( "Command failed: {$ex->getMessage()}", OutputInterface::VERBOSITY_DEBUG ); // @codeCoverageIgnore
		}

		$date = new \DateTime( 'now', new \DateTimeZone( 'UTC' ) );
		return $date->format( 'Y-m-d-H-i-s-u' );
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
			$dir = Config::changesDir();
			if ( ! is_dir( $dir ) ) {
				Utils::error_clear_last();
				if ( ! quietCall( 'mkdir', $dir, 0775, true ) ) {
					$err = error_get_last();
					$output->writeln( "<error>Could not create directory $dir: {$err['message']}</>" );
					return 1;
				}
			}

			$isInteractive = $input->isInteractive();

			// Determine the changelog entry filename.
			$filename = $input->getOption( 'filename' );
			if ( null === $filename ) {
				$filename = $this->getDefaultFilename( $output );
			}
			if ( $isInteractive ) {
				$question = new Question( "Name your changelog file <info>[default: $filename]</> > ", $filename );
				$question->setValidator( array( $this, 'validateFilename' ) );
				$filename = $this->getHelper( 'question' )->ask( $input, $output, $question );
				if ( null === $filename ) { // non-interactive.
					$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
					return 1;
				}
			} else {
				if ( null === $input->getOption( 'filename' ) ) {
					$output->writeln( "Using default filename \"$filename\".", OutputInterface::VERBOSITY_VERBOSE );
				}
				if ( file_exists( "$dir/$filename" ) && $input->getOption( 'filename-auto-suffix' ) ) {
					$i = 2;
					while ( file_exists( "$dir/$filename#$i" ) ) {
						$i++;
					}
					$output->writeln( "File \"$filename\" already exists. Creating \"$filename#$i\" instead.", OutputInterface::VERBOSITY_VERBOSE );
					$filename = "$filename#$i";
				}
				try {
					$this->validateFilename( $filename );
				} catch ( \RuntimeException $ex ) {
					$output->writeln( "<error>{$ex->getMessage()}</>" );
					return 1;
				}
			}

			$contents = '';

			// Determine the change significance and add to the file contents.
			$significance = $input->getOption( 'significance' );
			if ( null !== $significance ) {
				$significance = strtolower( $significance );
			}
			if ( $isInteractive ) {
				$question     = new ChoiceQuestion( 'Significance of the change, in the style of semantic versioning.', self::$significances, $significance );
				$significance = $this->getHelper( 'question' )->ask( $input, $output, $question );
				if ( null === $significance ) { // non-interactive.
					$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
					return 1;
				}
			} else {
				if ( null === $significance ) {
					$output->writeln( '<error>Significance must be specified in non-interactive mode.</>' );
					return 1;
				}
				if ( ! isset( self::$significances[ $significance ] ) ) {
					$output->writeln( "<error>Significance value \"$significance\" is not valid.</>" );
					return 1;
				}
			}
			$contents .= "Significance: $significance\n";

			// Determine the change type and add to the file contents, if applicable.
			$types = Config::types();
			if ( $types ) {
				$type = $input->getOption( 'type' );
				if ( null !== $type ) {
					$type = strtolower( $type );
				}
				if ( $isInteractive ) {
					$question = new ChoiceQuestion( 'Type of change.', $types, $type );
					$type     = $this->getHelper( 'question' )->ask( $input, $output, $question );
					if ( null === $type ) { // non-interactive.
						$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
						return 1;
					}
				} else {
					if ( null === $type ) {
						$output->writeln( '<error>Type must be specified in non-interactive mode.</>' );
						return 1;
					}
					if ( ! isset( $types[ $type ] ) ) {
						$output->writeln( "<error>Type \"$type\" is not valid.</>" );
						return 1;
					}
				}
				$contents .= "Type: $type\n";
			} elseif ( null !== $input->getOption( 'type' ) ) {
				$output->writeln( '<warning>This project does not use types. Do not specify --type.</>' );
			}

			// Determine the changelog entry and add to the file contents.
			$entry = $input->getOption( 'entry' );
			if ( $isInteractive ) {
				if ( 'patch' === $significance ) {
					$question = new Question( "Changelog entry. May be left empty if this change is particularly insignificant.\n > ", (string) $entry );
				} else {
					$question = new Question( "Changelog entry. May not be empty.\n > ", $entry );
					$question->setValidator(
						function ( $v ) {
							if ( trim( (string) $v ) === '' ) {
								throw new \RuntimeException( 'An empty changelog entry is only allowed when the significance is "patch".' );
							}
							return $v;
						}
					);
				}
				$entry = $this->getHelper( 'question' )->ask( $input, $output, $question );
				if ( null === $entry ) {
					$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
					return 1;
				}
			} else {
				if ( null === $entry ) {
					$output->writeln( '<error>Entry must be specified in non-interactive mode.</>' );
					return 1;
				}
				if ( 'patch' !== $significance && '' === $entry ) {
					$output->writeln( '<error>An empty changelog entry is only allowed when the significance is "patch".</>' );
					return 1;
				}
			}

			// Ask if a change comment is desired, if they left the change entry itself empty.
			$comment = (string) $input->getOption( 'comment' );
			if ( $isInteractive && '' === $entry ) {
				$question = new Question( "You omitted the changelog entry, which is fine. But please comment as to why no entry is needed.\n > ", $comment );
				$comment  = $this->getHelper( 'question' )->ask( $input, $output, $question );
				if ( null === $comment ) {
					$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
					return 1; // @codeCoverageIgnore
				}
			}
			$comment = trim( preg_replace( '/\s+/', ' ', $comment ) );
			if ( '' !== $comment ) {
				$contents .= "Comment: $comment\n";
			}

			$contents .= "\n$entry";

			// Ok! Write the file.
			// Use fopen/fwrite/fclose instead of file_put_contents because the latter doesn't support 'x'.
			$output->writeln(
				"<info>Creating changelog entry $dir/$filename:\n" . preg_replace( '/^/m', '  ', $contents ) . '</>',
				OutputInterface::VERBOSITY_DEBUG
			);
			$contents .= "\n";
			Utils::error_clear_last();
			$fp = quietCall( 'fopen', "$dir/$filename", 'x' );
			if ( ! $fp ||
				quietCall( 'fwrite', $fp, $contents ) !== strlen( $contents ) ||
				! quietCall( 'fclose', $fp )
			) {
				// @codeCoverageIgnoreStart
				$err = error_get_last();
				$output->writeln( "<error>Failed to write file \"$dir/$filename\": {$err['message']}.</>" );
				quietCall( 'fclose', $fp );
				quietCall( 'unlink', "$dir/$filename" );
				return 1;
				// @codeCoverageIgnoreEnd
			}

			return 0;
		} catch ( MissingInputException $ex ) { // @codeCoverageIgnore
			$output->writeln( 'Got EOF when attempting to query user, aborting.', OutputInterface::VERBOSITY_VERBOSE ); // @codeCoverageIgnore
			return 1; // @codeCoverageIgnore
		}
	}
}
