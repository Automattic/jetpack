<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-doc-parser
 */

namespace Automattic\Jetpack;

use PhpParser\Node;
use PhpParser\Node\Expr\FuncCall;
use PhpParser\NodeFinder;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTextNode;
use PHPStan\PhpDocParser\Lexer\Lexer;
use PHPStan\PhpDocParser\Parser\ConstExprParser;
use PHPStan\PhpDocParser\Parser\ParserException;
use PHPStan\PhpDocParser\Parser\PhpDocParser;
use PHPStan\PhpDocParser\Parser\TokenIterator;
use PHPStan\PhpDocParser\Parser\TypeParser;
use PHPStan\PhpDocParser\ParserConfig;

/**
 * Converts PHPDoc markup into a template ready for import to a WordPress blog.
 */
class Doc_Parser {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * The PhpDocParser library lexer object for processing comment blocks.
	 *
	 * @var Lexer
	 * */
	public $lexer;

	/**
	 * The parser object to be used for parsing PHPDoc comments.
	 *
	 * @var PhpDocParser
	 * */
	public $pdparser;

	/**
	 * The PHP parser object to be used for parsing code.
	 *
	 * @var \PhpParser\ParserAbstract
	 */
	public $parser;

	/**
	 * The PrettyPrinter object.
	 *
	 * @var PrettyPrinter
	 */
	public $printer;

	/**
	 * Constructor for the Doc_Parser class.
	 */
	public function __construct() {
		$config          = new ParserConfig( array() );
		$this->lexer     = new Lexer( $config );
		$constExprParser = new ConstExprParser( $config );
		$typeParser      = new TypeParser( $config, $constExprParser );
		$this->pdparser  = new PhpDocParser( $config, $typeParser, $constExprParser );
		$this->parser    = ( new ParserFactory() )->createForHostVersion();
		$this->printer   = new PrettyPrinter();
	}

	/**
	 * Generate a JSON file containing the PHPDoc markup, and save to filesystem.
	 *
	 * @param Array $args this function takes a path as its argument,
	 * as well as optionally an output file name.
	 */
	public function generate( $args ) {
		list( $directories, $output_file ) = $args;

		if ( empty( $output_file ) ) {
			$output_file = 'phpdoc.json';
		}

		$json = array();
		foreach ( $directories as $directory ) {
			$directory = realpath( $directory );
			echo PHP_EOL;

			// Get data from the PHPDoc
			$json = array(
				...$json,
				...$this->get_phpdoc_data( $directory, 'raw' ),
			);
		}

		$output = json_encode( $json );
		// Write to $output_file
		$error = ! file_put_contents( $output_file, $output );

		if ( $error ) {
			printf(
				'Problem writing %1$s bytes of data to %2$s' . PHP_EOL,
				strlen( $output ),
				$output_file
			);
			exit( 1 );
		}

		printf( 'Data exported to %1$s' . PHP_EOL, $output_file );
	}

	/**
	 * Generate the data from the PHPDoc markup.
	 *
	 * @param string $path Directory to scan for PHPDoc.
	 * @param string $format Optional. What format the data is returned in: [json*|array].
	 * @return string
	 */
	protected function get_phpdoc_data( $path, $format = 'json' ) {

		// Find the files to get the PHPDoc data from. $path can either be a folder or an absolute ref to a file.
		if ( is_file( $path ) ) {
			$files = array( $path );
			$path  = dirname( $path );

		} else {
			$files = $this->get_wp_files( $path );
		}

		// Maybe we should automatically import definitions from .gitignore.
		$ignore = array(
			'/.sass-cache/',
			'/node_modules',
			'vendor/',
			'jetpack_vendor/',
			'/.nova/',
			'/.vscode/',
			'/logs',
			'/allure-results/',
			'tests/',
			'wordpress/',
		);

		$files = array_filter(
			$files,
			function ( $item ) use ( $ignore ) {
				foreach ( $ignore as $path_chunk ) {
					if ( false !== strpos( $item, $path_chunk ) ) {
						return false;
					}
				}
				return true;
			}
		);

		$nodeFinder = new NodeFinder();

		// Extract PHPDoc.
		$blocks = array();

		foreach ( $files as $file ) {
			printf( 'Extracting PHPDoc from %1$s.' . PHP_EOL, $file );

			$stmts = $this->parser->parse( file_get_contents( $file ) );
			if ( empty( $stmts ) ) {
				continue;
			}

			// Find all calls to apply_filters or do_action.
			$hookCalls = $nodeFinder->find(
				$stmts,
				function ( Node $node ) {

					if ( ! $node instanceof FuncCall ) {
						return false;
					}

					return $node->name->name === 'apply_filters'
						|| $node->name->name === 'do_action';
				}
			);

			$file_blocks = $this->get_filter_calls( $hookCalls );

			$splfile = new \SplFileObject( $file );
			foreach ( $file_blocks as &$block ) {

				$docblock = array();

				// Lines are zero indexed.
				$start = $block['line'] - 2;

				$first = true;
				while ( ! $splfile->eof() && $start >= 0 ) {
					$splfile->seek( $start-- );
					$line = $splfile->current();

					if ( $first && false === strpos( $line, '*/' ) ) {

						break;
					} else {
						$first = false;
					}

					array_unshift( $docblock, $line );
					if ( false !== strpos( $line, '/**' ) ) {
						break;
					}
				}
				$docblock = implode( '', $docblock );

				$block['doc']                     = array();
				$block['doc']['description']      = '';
				$block['doc']['long_description'] = '';
				$block['doc']['tags']             = array();

				try {
					$tokens     = new TokenIterator( $this->lexer->tokenize( $docblock ) );
					$phpDocNode = $this->pdparser->parse( $tokens );
				} catch ( ParserException $e ) {
					continue;
				}

				$paramTags = $phpDocNode->getParamTagValues();

				foreach ( $phpDocNode->children as $entry ) {
					if ( ! $entry instanceof PhpDocTextNode ) {
						continue;
					}

					if ( ! empty( $entry->text ) ) {
						$block['doc']['description'] .=
							'<p>'
							. str_replace( array( "\r\n", "\n", "\r" ), '</p><p>', $entry->text )
							. '</p>';
					}
				}

				$parameters = array();
				foreach ( $paramTags as $paramTag ) {
					$block['doc']['tags'][] = array(
						'name'     => 'param',
						'content'  => $paramTag->description,
						'types'    => array(
							(string) $paramTag->type,
						),
						'variable' => $paramTag->parameterName,
					);

					$parameters[] = (string) $paramTag . PHP_EOL;
				}

				foreach (
					array(
						'@since',
						'@module',
						'@deprecated',
						'@see',
						'@uses',
						'@link',
						'@type',
					) as $tagType
				) {
					$sinceTags = $phpDocNode->getTagsByName( $tagType );
					foreach ( $sinceTags as $sinceTag ) {
						$block['doc']['tags'][] = array(
							'name'    => substr( $tagType, 1 ),
							'content' => (string) $sinceTag->value,
						);
					}
				}
			}

			$filepath = ltrim( substr( $file, strlen( $path ) ), DIRECTORY_SEPARATOR );
			$blocks[] = array(
				'path'    => $filepath,
				'root'    => $path,
				'classes' => array(
					array(
						'methods' => array(
							array(
								'hooks' => $file_blocks,
							),
						),
					),
				),
			);
		}

		if ( 'json' === $format ) {
			$blocks = json_encode( $blocks, JSON_PRETTY_PRINT );
		}

		return $blocks;
	}

	/**
	 * Returns a list of PHP files in a folder, recursing into subfolders. Heavily inspired by
	 * the WordPress PHPDoc parser.
	 *
	 * @see https://github.com/WordPress/phpdoc-parser/blob/7fc2227d2d4fb73f9f0b6e233413f3f9f9840e80/lib/runner.php#L17
	 *
	 * @param string $directory the folder to look in.
	 *
	 * @return array an array of filenames.
	 * @throws \Exception $e If unable to traverse the filesystem.
	 */
	public function get_wp_files( $directory ) {
		$iterableFiles = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $directory )
		);
		$files         = array();

		try {
			foreach ( $iterableFiles as $file ) {
				if ( 'php' !== $file->getExtension() ) {
					continue;
				}

				$files[] = $file->getPathname();
			}
		} catch ( \UnexpectedValueException $exc ) {
			throw new \Exception( sprintf( 'Directory [%s] contained a directory we can not recurse into', $directory ) );
		}

		return $files;
	}

	/**
	 * Returns an array of docblock annotations for apply_filter function calls, with keys being names of filters
	 * used.
	 *
	 * @param array $nodes  Parser node objects for hook calls.
	 * @return array docblock annotations.
	 */
	public function get_filter_calls( $nodes ): array {

		$blocks = array();

		foreach ( $nodes as $node ) {

			$arguments = $node->getArgs();
			$hook_name = array_shift( $arguments );

			$new_block = array(
				'type'     => $node->name->name === 'apply_filters' ? 'filter' : 'action',
				'line'     => $node->getLine(),
				'end_line' => $node->getEndLine() > 0 ? $node->getEndLine() : $node->getLine(),
				'name'     => $this->pretty_print_hook_name( $hook_name ),
			);

			foreach ( $arguments as $argument ) {
				$new_block['arguments'][] = $this->printer->prettyPrint( array( $argument ) );
			}
			$blocks[] = $new_block;
		}

		return $blocks;
	}

	/**
	 * Pretty prints the name for the hook, taking an argument object as input.
	 *
	 * @param Node\Arg $argument the first argument to the apply_filter or do_action call.
	 * @return String pretty printed argument name.
	 * @throws Exception On an unexpected argument component.
	 */
	public function pretty_print_hook_name( Node\Arg $argument ): string {

		if (
			$argument->value instanceof Node\Scalar\String_
				|| $argument->value instanceof Node\Expr\ConstFetch
		) {
			return trim( $this->printer->prettyPrint( array( $argument ) ), '\'' );

		} elseif ( $argument->value instanceof Node\Scalar\InterpolatedString ) {
			$result = '';
			foreach ( $argument->value->parts as $part ) {
				if ( $part instanceof Node\InterpolatedStringPart ) {
					$result .= $part->value;
				} elseif ( $part instanceof Node\Expr ) {
					$result .= '{' . $this->printer->prettyPrint( array( $part ) ) . '}';
				} else {
					throw new Exception( 'Unexpected interpolated string component of type ' . get_class( $part ) );
				}
			}
			return $result;

		} elseif ( $argument->value instanceof Node\Expr\BinaryOp\Concat ) {
			$result = '';
			foreach ( array( 'left', 'right' ) as $property ) {
				$part = $argument->value->{$property};
				if ( $part instanceof Node\Scalar\String_ ) {
					$result .= $part->value;
				} elseif ( $part instanceof Node\Expr ) {
					$result .= '{' . $this->printer->prettyPrint( array( $part ) ) . '}';
				} else {
					throw new Exception( 'Unexpected concatenated string component of type ' . get_class( $part ) );
				}
			}
			return $result;
		}

		throw new Exception( 'Unexpected function call argument of type ' . get_class( $argument->value ) );
	}
}
