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
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\ParentConnectingVisitor;
use PhpParser\ParserFactory;
use PhpParser\PrettyPrinter\Standard as PrettyPrinter;
use PHPStan\PhpDocParser\Ast\PhpDoc\InvalidTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\ParamTagValueNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocNode;
use PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTextNode;
use PHPStan\PhpDocParser\Ast\Type\IdentifierTypeNode;
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
	 * @param String $path a path to look for files in.
	 * @param String $dest a path to place the result in.
	 * @param String $output_file the name to use for the output file, optional.
	 */
	public function generate( $path, $dest, $output_file = 'phpdoc.json' ) {

		$directory   = realpath( $path );
		$destination = realpath( $dest );

		if ( false === $directory ) {
			echo "Can't find source directory at: " . $path . PHP_EOL;
			exit( 1 );
		}

		if ( false === $destination ) {
			echo "Can't find destination directory at: " . $dest . PHP_EOL;
			exit( 1 );
		}

		$destination_path = $destination . DIRECTORY_SEPARATOR . $output_file;

		// Get data from the PHPDoc.
		$json = $this->get_phpdoc_data( $directory );

		$output = json_encode( $json );

		// Write to $output_file.
		$error = ! file_put_contents( $destination_path, $output );

		if ( $error ) {
			printf(
				'Problem writing %1$s bytes of data to %2$s' . PHP_EOL,
				strlen( $output ),
				$output_file
			);
			exit( 1 );
		}

		printf( 'Data exported to %1$s' . PHP_EOL, $destination_path );
	}

	/**
	 * Generate the data from the PHPDoc markup.
	 *
	 * @param string $path Directory to scan for PHPDoc.
	 * @return string|array
	 */
	protected function get_phpdoc_data( $path ) {

		// Find the files to get the PHPDoc data from. $path can either be a folder or an absolute ref to a file.
		if ( is_file( $path ) ) {
			$files = array( $path );
			$path  = dirname( $path );

		} else {
			$files = $this->get_wp_files( $path );
		}

		// Maybe we should automatically import definitions from .gitignore.
		$ignore = array(
			'/vendor/',
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

			// Attaching parent node references to each node.
			$traverser = new NodeTraverser( new ParentConnectingVisitor() );
			$stmts     = $traverser->traverse( $stmts );

			// Find all calls to apply_filters or do_action.
			$hookCalls = $nodeFinder->find(
				$stmts,
				function ( Node $node ) {

					if ( ! $node instanceof FuncCall ) {
						return false;
					}

					return $node->name->name === 'apply_filters'
						|| $node->name->name === 'do_action'
						|| $node->name->name === 'apply_filters_ref_array'
						|| $node->name->name === 'do_action_ref_array'
						|| $node->name->name === 'apply_filters_deprecated'
						|| $node->name->name === 'do_action_deprecated';
				}
			);

			$file_blocks = $this->get_hook_calls( $hookCalls );

			$splfile = new \SplFileObject( $file );
			foreach ( $file_blocks as &$block ) {

				if ( null === $block['doc'] ) {
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
						if ( false !== strpos( $line, '/*' ) ) {
							break;
						}
					}

					$docblock = implode( '', $docblock );
				} else {
					$docblock = $block['doc']->getText();
				}

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

				foreach ( $phpDocNode->children as $entry ) {
					if ( ! $entry instanceof PhpDocTextNode ) {
						continue;
					}

					if ( ! empty( $entry->text ) ) {
						$block['doc']['description'] .=
							str_replace( array( "\r\n", "\n", "\r" ), ' ', $entry->text );
					}
				}

				$paramTags  = $this->get_param_tag_nodes( $phpDocNode );
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

		return $blocks;
	}

	/**
	 * Returns all param tag nodes. Tries to recover any parsing errors because of invalid markup.
	 *
	 * @param PhpDocNode $phpdocnode the parsed PHPDoc node.
	 * @return array an array of PhpDocTagNode objects.
	 */
	public function get_param_tag_nodes( PhpDocNode $phpdocnode ): array {
		$tags = $phpdocnode->getParamTagValues();

		// Looking for invalid param tags.
		foreach ( $phpdocnode->getTags() as $tag ) {
			'@phan-var \PHPStan\PhpDocParser\Ast\PhpDoc\PhpDocTagNode $tag';

			if ( $tag->name === '@param' && $tag->value instanceof InvalidTagValueNode ) {
				$tag_value = $tag->value;
				'@phan-var InvalidTagvalueNode $tag_value';

				$pieces      = explode( ' ', $tag_value->value );
				$type        = new IdentifierTypeNode( $pieces[0] );
				$name        = $pieces[1] ?? 'argument';
				$description = implode( ' ', array_slice( $pieces, 2 ) );
				$tags[]      = new ParamTagValueNode( $type, true, $name, $description, false );
			}
		}

		return $tags;
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

		foreach ( $iterableFiles as $file ) {
			if ( 'php' !== $file->getExtension() ) {
				continue;
			}

			$files[] = $file->getPathname();
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
	public function get_hook_calls( $nodes ): array {

		$blocks = array();

		foreach ( $nodes as $node ) {

			$arguments   = $node->getArgs();
			$hook_name   = array_shift( $arguments );
			$name_string = $this->pretty_print_hook_name( $hook_name );

			if ( false === $name_string ) {
				continue;
			}

			// Purging any comments that could have been attributed to this argument.
			$hook_name->setAttribute( 'comments', null );

			// Traversing up the parent tree to get a comment block related to this call.
			$n          = $node;
			$docComment = $n->getDocComment();
			while ( ! $docComment && $n && ! $n instanceof \PhpParser\Node\Stmt ) {
				$n          = $n->getAttribute( 'parent' );
				$docComment = $n->getDocComment();
			}

			$new_block = array(
				'type'      => $node->name->name === 'apply_filters' ? 'filter' : 'action',
				'line'      => $node->getLine(),
				'end_line'  => $node->getEndLine() > 0 ? $node->getEndLine() : $node->getLine(),
				'name'      => $this->pretty_print_hook_name( $hook_name ),
				'arguments' => array(),
				'doc'       => $docComment,
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
	 * @return false|String pretty printed argument name, or false in case this call has to be skipped.
	 * @throws \UnexpectedValueException On an unexpected argument component.
	 */
	public function pretty_print_hook_name( Node\Arg $argument ): false|string {

		if (
			$argument->value instanceof Node\Scalar\String_
				|| $argument->value instanceof Node\Expr\ConstFetch
				|| $argument->value instanceof Node\Expr\ClassConstFetch
		) {
			return trim( $this->printer->prettyPrint( array( $argument ) ), '\'' );

		} elseif ( $argument->value instanceof Node\Scalar\InterpolatedString ) {

			$value = $argument->value;
			'@phan-var Node\Scalar\InterpolatedString $value';

			$result = '';

			$parts = $value->parts;
			'@phan-var (Node\Expr|Node\InterpolatedStringPart)[] $parts';

			foreach ( $parts as $part ) {
				if ( $part instanceof Node\InterpolatedStringPart ) {
					$result .= $part->value;
				} elseif ( $part instanceof Node\Expr ) {
					$result .= '{' . $this->printer->prettyPrint( array( $part ) ) . '}';
				} else {
					throw new \UnexpectedValueException( 'Unexpected interpolated string component of type ' . get_class( $part ) );
				}
			}
			return $result;

		} elseif ( $argument->value instanceof Node\Expr\BinaryOp\Concat ) {

			$value = $argument->value;
			'@phan-var Node\Expr\BinaryOp\Concat $value';

			$result = '';
			foreach ( array( 'left', 'right' ) as $property ) {
				$part = $value->{$property};
				if ( $part instanceof Node\Scalar\String_ ) {
					$result .= $part->value;
				} elseif ( $part instanceof Node\Expr ) { // @phan-suppress-current-line PhanRedundantConditionInLoop
					$result .= '{' . $this->printer->prettyPrint( array( $part ) ) . '}';
				} else {
					throw new \UnexpectedValueException( 'Unexpected concatenated string component of type ' . get_class( $part ) );
				}
			}
			return $result;
		} elseif ( $argument->value instanceof Node\Expr\Variable ) {

			// We don't care about variable names, we can't really document them.
			return false;
		}

		throw new \UnexpectedValueException( 'Unexpected function call argument of type ' . get_class( $argument->value ) );
	}
}
