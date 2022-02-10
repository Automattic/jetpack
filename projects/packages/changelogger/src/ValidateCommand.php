<?php
/**
 * "Validate" command for the changelogger tool CLI.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * "Validate" command for the changelogger tool CLI.
 */
class ValidateCommand extends Command {

	/**
	 * The default command name
	 *
	 * @var string|null
	 */
	protected static $defaultName = 'validate';

	/**
	 * The InputInterface to use.
	 *
	 * @var InputInterface|null
	 */
	private $input;

	/**
	 * The OutputInterface to use.
	 *
	 * @var OutputInterface|null
	 */
	private $output;

	/**
	 * Counts of errors and warnings output.
	 *
	 * @var int[]
	 */
	private $counts;

	/**
	 * Base directory regex.
	 *
	 * @var string
	 */
	private $basedirRegex;

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this->setDescription( 'Validates changelog entry files' )
			->addOption( 'gh-action', null, InputOption::VALUE_NONE, 'Output validation issues using GitHub Action command syntax.' )
			->addOption( 'basedir', null, InputOption::VALUE_REQUIRED, 'Output file paths in this directory relative to it.' )
			->addOption( 'no-strict', null, InputOption::VALUE_NONE, 'Do not exit with a failure code if only warnings are found.' )
			->addArgument( 'files', InputArgument::OPTIONAL | InputArgument::IS_ARRAY, 'Files to check. By default, all change files in the changelog directory are checked.' )
			->setHelp(
				<<<EOF
The <info>validate</info> command validates change files.
EOF
			);
	}

	/**
	 * Output an error or warning.
	 *
	 * @param string   $type 'error' or 'warning'.
	 * @param string   $file Filename with the error/warning.
	 * @param int|null $line Line number of the error/warning.
	 * @param string   $msg Error message.
	 */
	private function msg( $type, $file, $line, $msg ) {
		$file = preg_replace( $this->basedirRegex, '', $file );
		if ( $this->input->getOption( 'gh-action' ) ) {
			$prefix = "::$type file=$file";
			if ( null !== $line ) {
				$prefix .= ",line=$line";
			}
			$prefix .= '::';
			$postfix = '';
		} else {
			$prefix = "<$type>$file";
			if ( null !== $line ) {
				$prefix .= ":$line";
			}
			$prefix .= ': ';
			$postfix = '</>';
		}
		$this->output->writeln( $prefix . $msg . $postfix );
		$this->counts[ $type ]++;
	}

	/**
	 * Validate a file.
	 *
	 * @param string $filename Filename.
	 */
	public function validateFile( $filename ) {
		try {
			$diagnostics = null; // Make phpcs happy.
			$data        = Utils::loadChangeFile( $filename, $diagnostics );
		} catch ( \RuntimeException $ex ) {
			$this->msg( 'error', $filename, $ex->fileLine, $ex->getMessage() );
			return false;
		}

		$messages = array();

		foreach ( $diagnostics['warnings'] as list( $msg, $line ) ) {
			$messages[] = array( 'warning', $msg, $line );
		}

		foreach ( $diagnostics['lines'] as $header => $line ) {
			if ( ! in_array( $header, array( 'Significance', 'Type', 'Comment', '' ), true ) ) {
				$messages[] = array( 'warning', "Unrecognized header \"$header\".", $line );
			}
		}

		if ( ! isset( $data['Significance'] ) ) {
			$messages[] = array( 'error', 'File does not contain a Significance header.', null );
		} elseif ( ! in_array( $data['Significance'], array( 'patch', 'minor', 'major' ), true ) ) {
			$messages[] = array( 'error', 'Significance must be "patch", "minor", or "major".', $diagnostics['lines']['Significance'] );
		} elseif ( 'patch' !== $data['Significance'] && '' === $data[''] ) {
			$messages[] = array( 'error', 'Changelog entry may only be empty when Significance is "patch".', $diagnostics['lines'][''] );
		}

		$types = Config::types();
		if ( $types ) {
			if ( ! isset( $data['Type'] ) ) {
				$messages[] = array( 'error', 'File does not contain a Type header.', null );
			} elseif ( ! isset( $types[ $data['Type'] ] ) ) {
				$list = array_map(
					function ( $v ) {
						return "\"$v\"";
					},
					array_keys( $types )
				);
				if ( count( $list ) > 1 ) {
					$list[ count( $list ) - 1 ] = 'or ' . $list[ count( $list ) - 1 ];
				}
				$messages[] = array( 'error', 'Type must be ' . implode( count( $list ) > 2 ? ', ' : ' ', $list ) . '.', $diagnostics['lines']['Type'] );
			}
		}

		usort(
			$messages,
			function ( $a, $b ) {
				// @codeCoverageIgnoreStart
				if ( $a[2] !== $b[2] ) {
					return $a[2] - $b[2];
				}
				if ( $a[0] !== $b[0] ) {
					return strcmp( $a[0], $b[0] );
				}
				return strcmp( $a[1], $b[1] );
				// @codeCoverageIgnoreEnd
			}
		);
		foreach ( $messages as list( $type, $msg, $line ) ) {
			$this->msg( $type, $filename, $line, $msg );
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
		$this->input  = $input;
		$this->output = $output;
		$this->counts = array(
			'error'   => 0,
			'warning' => 0,
		);

		if ( $input->getOption( 'basedir' ) ) {
			$basedir            = rtrim( $input->getOption( 'basedir' ), '/' );
			$basedir            = rtrim( $basedir, DIRECTORY_SEPARATOR );
			$this->basedirRegex = '#^' . preg_quote( $basedir, '#' ) . '[/' . preg_quote( DIRECTORY_SEPARATOR, '#' ) . ']#';
		} else {
			$this->basedirRegex = '/(?!)/';
		}

		$files = $input->getArgument( 'files' );
		if ( ! $files ) {
			$files = array();
			foreach ( new \DirectoryIterator( Config::changesDir() ) as $file ) {
				$name = $file->getBasename();
				if ( '.' !== $name[0] ) {
					$files[] = $file->getPathname();
				}
			}
			sort( $files );
		}

		foreach ( $files as $filename ) {
			$file = preg_replace( $this->basedirRegex, '', $filename );
			$output->writeln( "Checking $file...", OutputInterface::VERBOSITY_VERBOSE );
			$this->validateFile( $filename );
		}

		$output->writeln( sprintf( 'Found %d error(s) and %d warning(s)', $this->counts['error'], $this->counts['warning'] ), OutputInterface::VERBOSITY_VERBOSE );
		return $this->counts['error'] || $this->counts['warning'] && ! $input->getOption( 'no-strict' ) ? 1 : 0;
	}
}
