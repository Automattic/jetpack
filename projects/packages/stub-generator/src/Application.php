<?php
/**
 * User interface for the jetpack-stub-generator tool.
 *
 * @package automattic/jetpack-stub-generator
 */

namespace Automattic\Jetpack\StubGenerator;

use Automattic\Jetpack\StubGenerator\PhpParser\PhpDocNameResolver;
use Automattic\Jetpack\StubGenerator\PhpParser\StripDocsNodeVisitor;
use Automattic\Jetpack\StubGenerator\PhpParser\StubNodeVisitor;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;
use PhpParser\NodeVisitor\ParentConnectingVisitor;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter_Standard;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\SingleCommandApplication;
use Throwable;

/**
 * User interface for the jetpack-stub-generator tool.
 */
class Application extends SingleCommandApplication {

	const VERSION = '1.0.0';

	/**
	 * Exit code to use.
	 *
	 * @var int
	 */
	private $exitCode = 0;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->setName( 'Jetpack Stub Generator' );
		$this->setVersion( self::VERSION );
	}

	/**
	 * Test if a path is absolute.
	 *
	 * @param string $path Path.
	 * @return bool Whether it's absolute.
	 */
	private static function is_absolute( string $path ): bool {
		return preg_match( '#^[a-z]:|^[a-z0-9.+-]+://|^[/\\\\]#i', $path );
	}

	/**
	 * Configures the command.
	 */
	protected function configure() {
		$this
			->addArgument( 'stub-definition', InputArgument::REQUIRED, 'Stub definition file.' )
			->addOption( 'json', null, InputOption::VALUE_NONE, 'Definition file is a JSON file.' )
			->addOption( 'output', null, InputOption::VALUE_REQUIRED, 'Write output to this file rather than standard output.' )
			->setHelp(
				<<<EOF
				Generate stubs for specific functions/classes/etc from a codebase.

				The <info>file</info> specifies which files to scan and which functions,
				classes, and such to extract from each one. By default this should be a PHP
				file which returns an associative array; passing <info>--json</info> will
				instead parse it as a JSON file.
				EOF
			);
	}

	/**
	 * Executes the command.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return int 0 if everything went fine, or an exit code.
	 */
	protected function execute( InputInterface $input, OutputInterface $output ): int {
		$output->getFormatter()->setStyle( 'warning', new OutputFormatterStyle( 'black', 'yellow' ) );
		// @phan-suppress-next-line PhanUndeclaredMethod,PhanUndeclaredMethodInCallable -- Being checked before being called. See also https://github.com/phan/phan/issues/1204.
		$errout = is_callable( array( $output, 'getErrorOutput' ) ) ? $output->getErrorOutput() : $output;

		$definition = $this->loadDefinition( $input, $errout );
		if ( $definition === null ) {
			return 1;
		}

		$stmts = $this->generateStubs( $definition, $errout );

		if ( ! empty( $definition['strip-docs'] ) ) {
			$stmts = $this->stripDocs( $stmts, $errout );
		}

		$code = "<?php\n";
		if ( ! empty( $definition['header'] ) ) {
			$code .= $definition['header'] . "\n\n";
		}
		$code .= ( new PrettyPrinter_Standard() )->prettyPrint( $stmts );
		$code .= "\n";
		if ( ! empty( $definition['footer'] ) ) {
			$code .= "\n" . $definition['footer'] . "\n";
		}

		$outfile = $input->getOption( 'output' );
		if ( empty( $outfile ) ) {
			$output->write( $code );
		} else {
			error_clear_last();
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- We're using error_get_last() to handle it.
			if ( @file_put_contents( $outfile, $code ) !== false ) {
				$errout->writeln( "Output written to $outfile" );
			} else {
				$errmsg = error_get_last()['message'] ?? 'Unknown error';
				$errout->writeln( "<error>Failed to write $outfile: $errmsg</>" );
				return 1;
			}
		}

		return $this->exitCode;
	}

	/**
	 * Load the definition file.
	 *
	 * @param InputInterface  $input InputInterface.
	 * @param OutputInterface $output OutputInterface.
	 * @return ?array Definition.
	 */
	protected function loadDefinition( InputInterface $input, OutputInterface $output ): ?array {
		$definitionFile = $input->getArgument( 'stub-definition' );
		if ( ! is_readable( $definitionFile ) ) {
			$output->writeln( "<error>File $definitionFile does not exist or is not readable</>" );
			return null;
		}

		if ( $input->getOption( 'json' ) ) {
			error_clear_last();
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- We're using error_get_last() to handle it.
			$contents = @file_get_contents( $definitionFile );
			if ( $contents === false ) {
				$errmsg = error_get_last()['message'] ?? 'Unknown error';
				$output->writeln( "<error>Failed to read $definitionFile: $errmsg</>" );
				return null;
			}
			try {
				$definition = json_decode( $contents, true, 512, JSON_THROW_ON_ERROR );
			} catch ( Throwable $t ) {
				$output->writeln( "<error>Invalid JSON data in $definitionFile: {$t->getMessage()}</>" );
				$output->writeln( $t->__toString(), OutputInterface::VERBOSITY_DEBUG );
				return null;
			}
			if ( ! is_array( $definition ) ) {
				$output->writeln( "<error>$definitionFile did not contain a JSON object</>" );
				return null;
			}
		} else {
			try {
				$definition = require $definitionFile;
			} catch ( Throwable $t ) {
				$output->writeln( "<error>Exception thrown when loading $definitionFile: {$t->getMessage()}</>" );
				$output->writeln( $t->__toString(), OutputInterface::VERBOSITY_DEBUG );
				return null;
			}
			if ( ! is_array( $definition ) ) {
				$output->writeln( "<error>$definitionFile did not return an array</>" );
				return null;
			}
		}

		if ( empty( $definition['basedir'] ) || ! is_string( $definition['basedir'] ) ) {
			$definition['basedir'] = dirname( $definitionFile );
		} elseif ( ! self::is_absolute( $definition['basedir'] ) ) {
			$definition['basedir'] = realpath( dirname( $definitionFile ) . DIRECTORY_SEPARATOR . $definition['basedir'] );
		}

		return $definition;
	}

	/**
	 * Generate stubs from a definition file.
	 *
	 * @param array           $definition Definition file.
	 * @param OutputInterface $output OutputInterface.
	 * @return \PhpParser\Node[] Stubs.
	 */
	protected function generateStubs( array $definition, OutputInterface $output ): array {
		if ( empty( $definition['files'] ) ) {
			$output->writeln( 'No files in definition', OutputInterface::VERBOSITY_VERBOSE );
			return array();
		}

		$parser = ( new ParserFactory() )->createForHostVersion();

		$traverser    = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );
		$traverser->addVisitor( new PhpDocNameResolver( $nameResolver->getNameContext(), $output ) );
		$traverser->addVisitor( new ParentConnectingVisitor() );
		$visitor = new StubNodeVisitor( $output );
		$traverser->addVisitor( $visitor );

		foreach ( $definition['files'] as $file => $defs ) {
			if ( ! self::is_absolute( $file ) ) {
				$file = $definition['basedir'] . DIRECTORY_SEPARATOR . $file;
			}
			$output->writeln( "Processing $file...", OutputInterface::VERBOSITY_VERBOSE );

			if ( ! is_readable( $file ) ) {
				$output->writeln( "<warning>File $file does not exist or is not readable</>" );
				$this->exitCode = 2;
				continue;
			}

			error_clear_last();
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- We're using error_get_last() to handle it.
			$contents = @file_get_contents( $file );
			if ( $contents === false ) {
				$errmsg = error_get_last()['message'] ?? 'Unknown error';
				$output->writeln( "<warning>Failed to read $file: $errmsg</>" );
				$this->exitCode = 2;
				continue;
			}

			try {
				$stmts = $parser->parse( $contents );
			} catch ( Throwable $t ) {
				$output->writeln( "<warning>Failed to parse $file: {$t->getMessage()}</>" );
				$output->writeln( $t->__toString(), OutputInterface::VERBOSITY_DEBUG );
				$this->exitCode = 2;
				continue;
			}

			if ( $stmts ) {
				$visitor->setDefs( $file, $defs );
				$traverser->traverse( $stmts );
			}
		}

		ksort( $visitor->namespaces );
		$stmts = array_values( $visitor->namespaces );
		if ( count( $stmts ) === 1 && ! $stmts[0]->name ) {
			$stmts = $stmts[0]->stmts;
		}
		return $stmts;
	}

	/**
	 * Strip descriptions and unrecognized tags from doc comments.
	 *
	 * @param \PhpParser\Node[] $stmts Stubs.
	 * @param OutputInterface   $output OutputInterface.
	 * @return \PhpParser\Node[] $stmts, with attributes modified.
	 */
	protected function stripDocs( array $stmts, OutputInterface $output ): array {
		$traverser = new NodeTraverser();
		$traverser->addVisitor( new StripDocsNodeVisitor( $output ) );
		return $traverser->traverse( $stmts );
	}
}
