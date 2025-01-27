<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-doc-parser
 */

namespace Automattic\Jetpack;

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
	 * Constructor for the Doc_Parser class.
	 */
	public function __construct() {
		$config          = new ParserConfig( array() );
		$this->lexer     = new Lexer( $config );
		$constExprParser = new ConstExprParser( $config );
		$typeParser      = new TypeParser( $config, $constExprParser );
		$this->pdparser  = new PhpDocParser( $config, $typeParser, $constExprParser );
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
			$json[] = $this->get_phpdoc_data( $directory, 'raw' );
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
		printf( 'Extracting PHPDoc from %1$s.' . PHP_EOL, $path );

		// Find the files to get the PHPDoc data from. $path can either be a folder or an absolute ref to a file.
		if ( is_file( $path ) ) {
			$files = array( $path );
			$path  = dirname( $path );

		} else {
			ob_start();
			$files = \WP_Parser\get_wp_files( $path );
			$error = ob_get_clean();

			if ( $error ) {
				printf( 'Problem with %1$s: %2$s' . PHP_EOL, $path, $error );
				exit( 1 );
			}
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

		// Extract PHPDoc.
		$blocks = array();

		foreach ( $files as $file ) {
			$file_blocks = array();

			$ast = \ast\parse_file( $file, 110 );
			$this->get_filter_calls( $ast, $file_blocks );

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

				try {
					$tokens     = new TokenIterator( $this->lexer->tokenize( $docblock ) );
					$phpDocNode = $this->pdparser->parse( $tokens );
				} catch ( ParserException $e ) {
					continue;
				}

				$paramTags = $phpDocNode->getParamTagValues();

				$block['doc']                = array();
				$block['doc']['description'] = '';
				foreach ( $phpDocNode->children as $entry ) {
					if ( ! $entry instanceof PhpDocTextNode ) {
						continue;
					}

					$block['doc']['description'] .= $entry->text;
				}

				$parameters = array();
				foreach ( $paramTags as $paramTag ) {
					$parameters[] = (string) $paramTag . PHP_EOL;
				}

				if ( ! empty( $parameters ) ) {
					$block['doc']['description'] .= "\n\n" . implode( "\n", $parameters );
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
							'name'  => substr( $tagType, 1 ),
							'value' => (string) $sinceTag->value,
						);
					}
				}
			}

			$blocks[] = array(
				'file'  => $file,
				'hooks' => $file_blocks,
			);
		}

		if ( 'json' === $format ) {
			$blocks = json_encode( $blocks, JSON_PRETTY_PRINT );
		}

		return $blocks;
	}

	/**
	 * Returns a "flattened" string representation of an AST node.
	 *
	 * @param \ast\Node $node the node to be flattened.
	 * @return string a string representation of the node.
	 */
	public function flatten_ast_node( $node ): string {
		if ( $node instanceof \ast\Node ) {
			$node_kind = \ast\get_kind_name( $node->kind );

			$result = '';

			switch ( $node_kind ) {
				case 'AST_ARRAY':
					$result .= 'array( ';
					$first   = true;
					foreach ( $node->children as $item ) {
						if ( $first ) {
							$first = false;
						} else {
							$result .= ', ';
						}
						$result .= $this->flatten_ast_node( $item );
					}
					$result .= ' )';
					break;
				case 'AST_VAR':
					$children = $node->children;
					'@phan-var array<string, string> $children';

					$result .= ' $' . $children['name'];
					break;
				case 'AST_CALL':
					$children = $node->children;
					'@phan-var array<string, \ast\Node> $children';

					$expression_children = $children['expr']->children;
					'@phan-var array<string, string> $expression_children';

					$result .= $expression_children['name'] . '(';
					$first   = true;

					foreach ( $children['args']->children as $argument ) {
						if ( $first ) {
							$first = false;
						} else {
							$result .= ', ';
						}
						$result .= $this->flatten_ast_node( $argument );
					}
					$result .= ')';

					break;
				case 'AST_STATIC_CALL':
					$children = $node->children;
					'@phan-var array<string, \ast\Node> $children';

					$expression_children = $children['class']->children;
					'@phan-var array<string, string> $expression_children';

					$result .= $expression_children['name'] . '::' . $children['method'] . '(';
					$first   = true;

					foreach ( $children['args']->children as $argument ) {
						if ( $first ) {
							$first = false;
						} else {
							$result .= ', ';
						}
						$result .= $this->flatten_ast_node( $argument );
					}
					$result .= ')';

					break;
				case 'AST_PROP':
					$children = $node->children;
					'@phan-var array<string, \ast\Node> $children';

					$child_kind = \ast\get_kind_name( $children['expr']->kind );

					// This is incorrect, needs to be changed to an inverse if.
					if ( 'AST_PROP' === $child_kind ) {
						$result .= $this->flatten_ast_node( $children['expr'] ) . '->' . $children['prop'];
					} else {
						$expression_children = $children['expr']->children;
						'@phan-var array<string, string> $expression_children';

						$result .= $expression_children['name'] . '->' . $children['prop'];
					}
					break;

				case 'AST_BINARY_OP':
					$flags = $this->format_flags( $node->kind, $node->flags );
					if ( false !== strpos( 'BINARY_CONCAT', $flags ) ) {
						$result .=
							$this->flatten_ast_node( $node->children['left'] )
							. '.'
							. $this->flatten_ast_node( $node->children['right'] );
						break;
					}
					// Break intentionally omitted.
				default:
					foreach ( $node->children as $i => $child ) {
						if ( $i === 'docComment' ) {
							continue;
						}
						$result .= $this->flatten_ast_node( $child );
					}
			}

			return $result;
		} elseif ( $node === null ) {
			return ' null ';

		} elseif ( is_string( $node ) && 'null' === $node ) {
			return ' null ';
		} elseif ( is_string( $node ) && 'true' === $node ) {
			return ' true ';
		} elseif ( is_string( $node ) && 'false' === $node ) {
			return ' false ';
		} elseif ( is_string( $node ) ) {
			return '\'' . $node . '\'';
		} else {
			return (string) $node;
		}
	}

	/**
	 * Returns an array of docblock annotations for apply_filter function calls, with keys being names of filters
	 * used.
	 *
	 * @param mixed $tree Abstract syntax tree, or nodes of it.
	 * @param array $blocks An array to gather code blocks into.
	 * @return void
	 */
	public function get_filter_calls( $tree, &$blocks ) {
		if ( $tree instanceof \ast\Node ) {
			$result = \ast\get_kind_name( $tree->kind );

			if ( 'AST_CALL' === $result ) {
				$children = $tree->children;
				'@phan-var array<string, \ast\Node> $children';

				$expression_children = $children['expr']->children;
				'@phan-var array<string, string> $expression_children';

				$name = $expression_children['name'];

				if ( 'apply_filters' === $name ) {

					$arguments = $children['args']->children;
					'@phan-var array<int, \ast\Node|string> $arguments';

					$argument = array_shift( $arguments );

					if ( $argument instanceof \ast\Node ) {
						$argument = $this->flatten_ast_node( $argument );
					}
					$new_block = array(
						'type'     => 'filter',
						'line'     => $tree->lineno,
						'end_line' => $tree->endLineno ?? $tree->lineno,
						'name'     => $argument,
					);

					$new_block['arguments'] = array();
					foreach ( $arguments as $argument ) {
						if ( $argument instanceof \ast\Node ) {
							$argument = $this->flatten_ast_node( $argument );
						}
						array_push( $new_block['arguments'], $argument );
					}

					$blocks[] = $new_block;
				}

				if ( 'do_action' === $name ) {
					$arguments = $children['args']->children;
					'@phan-var array<int, \ast\Node|string> $arguments';

					$argument = array_shift( $arguments );

					$new_block = array(
						'type'     => 'action',
						'line'     => $tree->lineno,
						'end_line' => $tree->endLineno ?? $tree->lineno,
						'name'     => $argument,
					);

					$blocks[] = $new_block;
				}
			}

			foreach ( $tree->children as $child ) {
				$this->get_filter_calls( $child, $blocks );
			}
		}
	}

	/**
	 * Utility for getting AST flag info.
	 *
	 * @see https://github.com/nikic/php-ast/blob/master/util.php
	 * @return array AST flags.
	 * */
	protected function get_flag_info(): array {
		static $info;
		if ( $info !== null ) {
			return $info;
		}

		foreach ( \ast\get_metadata() as $data ) {
			if ( empty( $data->flags ) ) {
				continue;
			}

			$flagMap = array();
			foreach ( $data->flags as $fullName ) {
				$shortName                        = substr( $fullName, strrpos( $fullName, '\\' ) + 1 );
				$flagMap[ constant( $fullName ) ] = $shortName;
			}

			$info[ (int) $data->flagsCombinable ][ $data->kind ] = $flagMap;
		}

		return $info;
	}

	/**
	 * Utility for getting combinable flag factor.
	 *
	 * @see https://github.com/nikic/php-ast/blob/master/util.php
	 *
	 * @param int $kind the flag identifier.
	 * @return boolean if flag is combinable.
	 */
	protected function is_combinable_flag( int $kind ): bool {
		return isset( $this->get_flag_info()[1][ $kind ] );
	}

	/**
	 * Utility to return formatted flag strings.
	 *
	 * @param int $kind  the flag identifier.
	 * @param int $flags the flags for which to get the string.
	 * @return string formatted flags value.
	 */
	protected function format_flags( int $kind, int $flags ): string {
		list( $exclusive, $combinable ) = $this->get_flag_info();
		if ( isset( $exclusive[ $kind ] ) ) {
			$flagInfo = $exclusive[ $kind ];
			if ( isset( $flagInfo[ $flags ] ) ) {
				return $flagInfo[ $flags ];
			}
		} elseif ( isset( $combinable[ $kind ] ) ) {
			$flagInfo = $combinable[ $kind ];
			$names    = array();
			foreach ( $flagInfo as $flag => $name ) {
				if ( $flags & $flag ) {
					$names[] = $name;
				}
			}
			if ( ! empty( $names ) ) {
				return implode( ' | ', $names );
			}
		}
		return (string) $flags;
	}
}
