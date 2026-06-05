<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use JsonException;
use ParseError;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Utils\GetTokensAsString;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\Attributes\TestWithJson;

/**
 * Attribute/annotation handler for '@testWith'.
 */
class TestWithHandler extends Handler {

	/**
	 * Tokens that we can deal with for TestWith.
	 *
	 * @var array|null
	 */
	private static $testWithTokens = null;

	/**
	 * Get the tokens we can deal with for TestWith.
	 *
	 * @return array<int|string,int|string> List of tokens. Key and value are the same.
	 */
	private static function testWithTokens() {
		self::$testWithTokens ??= array(
			\T_NULL                     => \T_NULL,
			\T_TRUE                     => \T_TRUE,
			\T_FALSE                    => \T_FALSE,
			\T_LNUMBER                  => \T_LNUMBER,
			\T_DNUMBER                  => \T_DNUMBER,
			\T_CONSTANT_ENCAPSED_STRING => \T_CONSTANT_ENCAPSED_STRING,
			\T_BOOLEAN_NOT              => \T_BOOLEAN_NOT,
			\T_BITWISE_NOT              => \T_BITWISE_NOT,
			\T_ARRAY                    => \T_ARRAY,
			\T_OPEN_SHORT_ARRAY         => \T_OPEN_SHORT_ARRAY,
			\T_CLOSE_SHORT_ARRAY        => \T_CLOSE_SHORT_ARRAY,
			\T_NOWDOC                   => \T_NOWDOC,
			\T_START_NOWDOC             => \T_START_NOWDOC,
			\T_END_NOWDOC               => \T_END_NOWDOC,
			\T_OPEN_PARENTHESIS         => \T_OPEN_PARENTHESIS,
			\T_CLOSE_PARENTHESIS        => \T_CLOSE_PARENTHESIS,
			\T_COMMA                    => \T_COMMA,
			\T_DOUBLE_ARROW             => \T_DOUBLE_ARROW,
		) + Tokens::$emptyTokens
			+ Tokens::$arithmeticTokens
			+ Tokens::$comparisonTokens
			+ Tokens::$operators
			+ Tokens::$booleanOperators;

		return self::$testWithTokens;
	}

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_METHOD;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array( TestWith::class, TestWithJson::class );
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@testWith' );
	}

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! isset( $data['params'][1] ) ) {
			$this->addAttributeMissingParameterError( $phpcsFile, $data, $data['name'] === TestWithJson::class ? 'json' : 'data' );
			return null;
		}

		// Don't really parse here. Handle it in `process()` below.
		return $data['ptr'];
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Don't really parse here. Handle it in `process()` below.
		return $data['ptr'];
	}

	/** {@inheritdoc} */
	public function process( File $phpcsFile, $stackPtr, array $attributes, array $annotations, $applies, $keepAnnotations ) {
		// If there are no annotations and we're not supposed to add them, no need to do anything.
		if ( $annotations === array() && ! $keepAnnotations ) {
			return array();
		}

		// Must be only one `@testWith` annotation. Complain if more than one.
		if ( count( $annotations ) > 1 ) {
			$anns = array_values( $annotations );
			array_shift( $anns );
			foreach ( $anns as $ann ) {
				$phpcsFile->addError(
					'This method has multiple `@testWith` annotations. PHPUnit will ignore all but the first.',
					$ann['ptr'],
					'MultipleTestWithAnnotationsFound'
				);
			}
			return array();
		}

		$isFixable = true;

		// Process the annotation.
		$anndata = array();
		if ( $annotations ) {
			$ann = reset( $annotations );

			if ( $ann['content'] !== '' ) {
				// This doesn't quite match PHPUnit's logic, their star removal is buggy. But the mismatches don't make much difference:
				// - We may flag some newlines they ignore.
				// - We don't flag a newline at the start, but they throw for that so the user will have to fix that anyway.
				$getline = static function () use ( $phpcsFile, $ann ) {
					// To report the error on the correct line, we need to know which line the annotation content starts on.
					$tokens = $phpcsFile->getTokens();
					for ( $i = $ann['ptr'] + 1; $i <= $ann['endptr']; $i++ ) {
						$lineno = $tokens[ $i ]['line'];
						if ( $tokens[ $i ]['code'] === T_DOC_COMMENT_STRING && preg_match( '/^(\s*)\S/', $phpcsFile->fixer->getTokenContent( $i ), $m ) ) {
							return $lineno + substr_count( $m[1], "\n" );
						}
					}
					// Should never get here.
					return $lineno ?? $tokens[ $ann['ptr'] ]['line']; // @codeCoverageIgnore
				};
				foreach ( explode( "\n", $ann['content'] ) as $n => $line ) {
					$line = trim( $line );
					if ( ! str_starts_with( $line, '[' ) ) {
						$phpcsFile->addErrorOnLine(
							'Annotation `@testWith` has invalid data. PHPUnit will ignore everything after this line.',
							$getline() + $n,
							'TestWithAnnotationBadData'
						);
						$isFixable = false;
						break;
					}
					try {
						$anndata[] = json_decode( $line, true, 512, JSON_THROW_ON_ERROR );
					} catch ( JsonException $ex ) {
						$phpcsFile->addErrorOnLine(
							'Annotation `@testWith` has invalid data. PHPUnit will reject the annotation.',
							$getline() + $n,
							'TestWithAnnotationBadData'
						);
						$isFixable = false;
						break;
					}
				}
			}
		}

		// Process the attributes.
		$attdata = array();
		foreach ( $attributes as $att ) {
			if ( $att['name'] === TestWithJson::class ) {
				$value = $this->parseAttributeStringParameter( $phpcsFile, $att, 1, 'json' );
				if ( $value === null ) {
					$isFixable = false;
					continue;
				}
				try {
					$value = json_decode( $value, true, 512, JSON_THROW_ON_ERROR );
				} catch ( JsonException $ex ) {
					$phpcsFile->addError(
						'Attribute `TestWithJson` has invalid JSON.',
						$att['ptr'],
						'TestWithAttributeBadData'
					);
					$isFixable = false;
					continue;
				}
			} else {
				$idx = $phpcsFile->findNext( self::testWithTokens(), $att['params'][1]['start'], $att['params'][1]['end'] + 1, true );
				if ( $idx !== false && $idx <= $att['params'][1]['end'] ) {
					$phpcsFile->addWarning(
						'Attribute `TestWith` has data that this sniff cannot interpret (found %s). Please manually verify that the annotation and attribute data match.',
						$att['ptr'],
						'TestWithAttributeNonStatic',
						array( $phpcsFile->getTokens()[ $idx ]['type'] )
					);
					$isFixable = false;
					continue;
				}
				$code = GetTokensAsString::compact( $phpcsFile, $att['params'][1]['start'], $att['params'][1]['end'], true );
				try {
					// Should be safe since we verified the tokens are safe.
					// phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval
					$value = eval( "return {$code};" . PHP_EOL );
				} catch ( ParseError $ex ) {
					$phpcsFile->addError(
						'Attribute `TestWith` has unparseable data.',
						$att['ptr'],
						'TestWithAttributeBadData'
					);
					$isFixable = false;
					continue;
				}
			}
			if ( ! is_array( $value ) ) {
				$phpcsFile->addError(
					'Attribute `%s` requires an array, got %s.',
					$att['ptr'],
					'TestWithAttributeBadData',
					array( preg_replace( '!^.*\\\\!', '', $att['name'] ), gettype( $value ) )
				);
				$isFixable = false;
				continue;
			}
			if ( ! self::array_is_list( $value ) ) {
				if ( $keepAnnotations ) {
					$phpcsFile->addError(
						'Attribute `%s` is being passed %s, which cannot be represented as a `@testWith` annotation.',
						$att['ptr'],
						'TestWithAttributeBadData',
						array(
							preg_replace( '!^.*\\\\!', '', $att['name'] ),
							$att['name'] === TestWithJson::class ? 'a JSON object' : 'an associative array',
						)
					);
				} else {
					$phpcsFile->addWarning(
						'Attribute `%s` is being passed %s, which cannot be represented as a `@testWith` annotation. Please manually verify that the annotation and attribute data match.',
						$att['ptr'],
						'TestWithAttributeNonJson',
						array(
							preg_replace( '!^.*\\\\!', '', $att['name'] ),
							$att['name'] === TestWithJson::class ? 'a JSON object' : 'an associative array',
						)
					);
				}
				$isFixable = false;
				continue;
			}
			$attdata[] = $value;
		}

		// If we ran into anything unparseable above, don't try to do anything more.
		if ( ! $isFixable ) {
			return array();
		}

		// If the data matches, we're good! Remove annotations if appropriate and return.
		if ( $anndata === $attdata ) {
			$ops = array();
			if ( ! $keepAnnotations ) {
				foreach ( $annotations as $ann ) {
					$ops[] = array(
						'op'   => self::OP_MESSAGE,
						'msg'  => 'Annotation `%s` is removed in PHPUnit 12.',
						'ptr'  => $ann['ptr'],
						'code' => 'RedundantAnnotationFound',
						'data' => array( $ann['name'] ),
					);
					$ops[] = array(
						'op'  => self::OP_ANN_REMOVE,
						'ann' => $ann,
					);
				}
			}
			return $ops;
		}

		// Data doesn't match. If we have both annotations and attributes, don't try to mess with it.
		if ( $annotations && $attributes ) {
			$phpcsFile->addWarning(
				'The data in the `@testWith` annotation on this method does not match the data from `TestWith` and `TestWithJson` annotations.',
				$stackPtr,
				'TestWithDataMismatch'
			);
			return array();
		}

		// We have either annotation without attributes or attributes without annotation. Handle that.
		$ops = array();
		if ( $annotations ) {
			$ann   = reset( $annotations );
			$ops[] = array(
				'op'   => self::OP_MESSAGE,
				'msg'  => $keepAnnotations
					? 'Annotation `@testWith` is removed in PHPUnit 12. Add attributes `TestWith` or `TestWithJson` for compatibility with that and later versions.'
					: 'Annotation `@testWith` is removed in PHPUnit 12. Replace it with attributes `TestWith` or `TestWithJson`.',
				'ptr'  => $ann['ptr'],
				'code' => 'AnnotationFoundMissingAttribute',
			);
			foreach ( $anndata as $data ) {
				$ops[] = array(
					'op'     => self::OP_ATT_ADD,
					'class'  => TestWith::class,
					'params' => sprintf( '( %s )', $this->formatArray( $data ) ),
				);
			}
			if ( ! $keepAnnotations ) {
				$ops[] = array(
					'op'  => self::OP_ANN_REMOVE,
					'ann' => $ann,
				);
			}
		} else {
			$ops[] = array(
				'op'   => self::OP_MESSAGE,
				'msg'  => 'For compatibility with older PHPUnit versions, add annotation `@testWith` to match the `TestWith` or `TestWithJson` attributes on this method.',
				'ptr'  => $stackPtr,
				'code' => 'AttributeFoundMissingAnnotation',
			);
			$ops[] = array(
				'op'      => self::OP_ANN_ADD,
				'tag'     => '@testWith',
				'content' => "\n" . implode( "\n", array_map( fn ( $v ) => json_encode( $v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR ), $attdata ) ),
			);
		}

		return $ops;
	}

	/**
	 * Polyfill for `array_is_list`
	 *
	 * @todo Remove when we drop support for PHP <8.1.
	 * @codeCoverageIgnore
	 * @param array $arr Array to check.
	 * @return bool
	 */
	private static function array_is_list( array $arr ) {
		if ( function_exists( 'array_is_list' ) ) {
			// phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.array_is_listFound -- Checked before use.
			return array_is_list( $arr );
		}
		return array_values( $arr ) === $arr;
	}

	/**
	 * Format an array for TestWith's parameter.
	 *
	 * @param array $arr Array to format.
	 * @return string Formatted array.
	 */
	protected function formatArray( array $arr ) {
		if ( $arr === array() ) {
			return '[]';
		}

		$fmt  = self::array_is_list( $arr ) ? '%2$s' : '%s => %s';
		$elts = array();
		foreach ( $arr as $k => $v ) {
			$elts[] = sprintf( $fmt, var_export( $k, true ), is_array( $v ) ? $this->formatArray( $v ) : var_export( $v, true ) );
		}
		return '[ ' . implode( ', ', $elts ) . ' ]';
	}
}
