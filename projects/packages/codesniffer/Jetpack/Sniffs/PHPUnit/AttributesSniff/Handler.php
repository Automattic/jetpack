<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use Automattic\Jetpack\Codesniffer\Utils\NamespaceInfo;
use PHP_CodeSniffer\Files\File;

/**
 * Attribute/annotation handler base class for AttributesSniff.
 */
abstract class Handler {

	/** The attribute/annotation applies at the class level. */
	public const APPLIES_CLASS = 1;

	/** The attribute/annotation applies at the test method level. */
	public const APPLIES_METHOD = 2;

	/** The attribute/annotation applies at both the class and test method levels. */
	public const APPLIES_BOTH = self::APPLIES_CLASS | self::APPLIES_METHOD;

	/**
	 * Issue an error or warning.
	 *
	 * Corresponding parameters:
	 *  - msg: (string) Warning/error message.
	 *  - ptr: (int) Stack pointer.
	 *  - code: (string) Sniff code.
	 *  - severity?: (int) Custom severity.
	 *  - data?: (array) Data. Default is an empty array.
	 *  - isFixable?: (bool) Whether the message is fixable. Default true.
	 *  - isError?: (bool) Whether the message is an error rather than a warning. Default false.
	 */
	public const OP_MESSAGE = 'msg';

	/**
	 * Add an annotation.
	 *
	 * Ignored if no previous fixable OP_MESSAGE succeeded.
	 * Corresponding parameters:
	 *  - tag: (string) Annotation tag, including the `@`.
	 *  - content: (string) Annotation content, including any leading space.
	 */
	public const OP_ANN_ADD = 'ann-att';

	/**
	 * Replace an annotation.
	 *
	 * Ignored if no previous fixable OP_MESSAGE succeeded.
	 * Corresponding parameters:
	 *  - ann: (array) Annotation to replace.
	 *  - tag: (string) Annotation tag, including the `@`.
	 *  - content: (string) Annotation content, including any leading space.
	 */
	public const OP_ANN_REPLACE = 'ann-replace';

	/**
	 * Remove an annotation.
	 *
	 * Ignored if no previous fixable OP_MESSAGE succeeded.
	 * Corresponding parameters:
	 *  - ann: (array) Annotation to replace.
	 */
	public const OP_ANN_REMOVE = 'ann-remove';

	/**
	 * Add an attribute.
	 *
	 * Ignored if no previous fixable OP_MESSAGE succeeded.
	 * Corresponding parameters:
	 *  - class: (string) Attribute class. Fully qualified, no leading backslash.
	 *  - params: (string) Attribute parameters, if any. Include parentheses.
	 */
	public const OP_ATT_ADD = 'att-add';

	// Replacing attributes is not currently supported per YAGNI. If YNI, don't forget to test replacing multiple-attribute declarations.
	// Deleting attributes is not currently supported per YAGNI. If YNI, note you'll need a bunch of logic to properly handle multiple-attribute declarations.

	/**
	 * Where the attribute/annotation applies.
	 *
	 * @return int
	 */
	abstract public function applies();

	/**
	 * Attributes this data entry applies to.
	 *
	 * @return string[] Fully-qualified class names, without a leading backslash.
	 */
	abstract public function attributes();

	/**
	 * Annotations this data entry applies to.
	 *
	 * @return string[] Annotations, including the leading `@`.
	 */
	abstract public function annotations();

	/**
	 * Parse an attribute.
	 *
	 * @param File  $phpcsFile PHPCS File object.
	 * @param array $data Data for the attribute as returned by `\Automattic\Jetpack\Codesniffer\Utils\Attributes::getAttributesForDeclaration()`. The `name` field is normalized as a FQCN with no leading backslash.
	 * @param int   $applies Either `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @return string|int|null Data representing the attribute. For the default `process()` implementation, must be normalized such that parsing any equivalent attribute or annotation produces the same value.
	 *   Return null to ignore the attribute, likely after calling `$phpcsFile->addError()`.
	 */
	abstract public function parseAttribute( File $phpcsFile, array $data, $applies );

	/**
	 * Parse an annotation.
	 *
	 * @param File  $phpcsFile PHPCS File object.
	 * @param array $data Data for the annotation as returned by `\Automattic\Jetpack\Codesniffer\Utils\DocBlocks::getCommentTags()`.
	 * @param int   $applies Either `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @return string|int|null Data representing the annotation. For the default `process()` implementation, must be normalized such that parsing any equivalent attribute or annotation produces the same value.
	 *   Return null to ignore the attribute, likely after calling `$phpcsFile->addError()`.
	 */
	abstract public function parseAnnotation( File $phpcsFile, array $data, $applies );

	/**
	 * Determine how to process the attributes and annotations.
	 *
	 * This base class implementation matches up the keys in `$attributes` and `$annotations`: any missing attributes are added, while for annotations (depending on $keepAnnotations) either any missing ones are added or all are removed.
	 *
	 * In general, you'll return one of the following:
	 *  - An empty array, possibly after having called `$phpcsFile->addError()` or `$phpcsFile->addWarning()`.
	 *  - A non-fixable OP_MESSAGE.
	 *  - A fixable OP_MESSAGE, followed by one or more `OP_ATT_*` and `OP_ANN_*` operations..
	 *
	 * @param File  $phpcsFile PHPCS File object.
	 * @param int   $stackPtr Stack pointer for the class or method being processed.
	 * @param array $attributes Collected attribute data. Keys are the return values from `parseAttribute()`, values are the original `$data`.
	 * @param array $annotations Collected annotation data. Keys are the return values from `parseAnnotation()`, values are the original `$data`.
	 * @param int   $applies Either `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @param bool  $keepAnnotations Whether annotations are being kept. If false, you probably should return `OP_ANN_REMOVE` for all annotations and not return any `OP_ANN_ADD`.
	 * @return array[] Processing instructions. Each array should have an 'op' key with one of the `OP_*` constants. Other values in the array depend on the constant.
	 */
	public function process( File $phpcsFile, $stackPtr, array $attributes, array $annotations, $applies, $keepAnnotations ) {
		$ops = array();

		// Process annotations: Do we need to remove any or add corresponding attributes?
		foreach ( $annotations as $data => $ann ) {
			// If the corresponding attribute doesn't exist, add one. Then, if we're removing annotations, remove it.
			if ( ! isset( $attributes[ $data ] ) ) {
				list( $class, $params ) = $this->formatAttribute( $data, $applies );
				$ops[]                  = array(
					'op'   => self::OP_MESSAGE,
					'msg'  => $keepAnnotations
						? 'Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12. Add attribute `%s` for compatibility with those versions.'
						: 'Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12. Replace it with attribute `%s`.',
					'ptr'  => $ann['ptr'],
					'code' => 'AnnotationFoundMissingAttribute',
					'data' => array( $ann['name'], preg_replace( '!^.*\\\\!', '', $class ) ),
				);
				$ops[]                  = array(
					'op'     => self::OP_ATT_ADD,
					'class'  => $class,
					'params' => $params,
				);
				if ( ! $keepAnnotations ) {
					$ops[] = array(
						'op'  => self::OP_ANN_REMOVE,
						'ann' => $ann,
					);
				}
			} elseif ( ! $keepAnnotations ) {
				$ops[] = array(
					'op'   => self::OP_MESSAGE,
					'msg'  => 'Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12.',
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

		// Process attributes: Do we need to add corresponding annotations?
		if ( $keepAnnotations ) {
			foreach ( $attributes as $data => $att ) {
				// Corresponding annotation exists?
				if ( ! isset( $annotations[ $data ] ) ) {
					list( $tag, $content ) = $this->formatAnnotation( $data, $applies );
					$ops[]                 = array(
						'op'   => self::OP_MESSAGE,
						'msg'  => 'For compatibility with older PHPUnit versions, add annotation `%s` to match the `%s` attribute.',
						'ptr'  => $att['ptr'],
						'code' => 'AttributeFoundMissingAnnotation',
						'data' => array( $tag, preg_replace( '!^.*\\\\!', '', $att['name'] ) ),
					);
					$ops[]                 = array(
						'op'      => self::OP_ANN_ADD,
						'tag'     => $tag,
						'content' => $content,
					);
				}
			}
		}

		return $ops;
	}

	// phpcs:disable Squiz.Commenting.FunctionComment.InvalidNoReturn, Squiz.Commenting.FunctionCommentThrowTag.Missing -- Pointless for these two methods.
	// @codeCoverageIgnoreStart

	/**
	 * Format annotation/attribute data as an attribute.
	 *
	 * Implement this if you don't reimplement `process()`.
	 *
	 * @param string|int $data Data for the attribute as returned by `static::parseAttribute()` or `static::parseAnnotation()`.
	 * @param int        $applies Either `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @return array{string,string} Class and parameters as for `OP_ATT_ADD` or `OP_ATT_REPLACE`.
	 */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		throw new \BadMethodCallException( static::class . '::' . __FUNCTION__ . '() is not implemented.' );
	}

	/**
	 * Format annotation/attribute data as an annotation.
	 *
	 * Implement this if you don't reimplement `process()`.
	 *
	 * @param string|int $data Data for the annotation as returned by `static::parseAttribute()` or `static::parseAnnotation()`.
	 * @param int        $applies Either `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @return array{string,string} Tag and content as for `OP_ANN_ADD` or `OP_ANN_REPLACE`.
	 */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		throw new \BadMethodCallException( static::class . '::' . __FUNCTION__ . '() is not implemented.' );
	}

	// @codeCoverageIgnoreEnd
	// phpcs:enable Squiz.Commenting.FunctionComment.InvalidNoReturn, Squiz.Commenting.FunctionCommentThrowTag.Missing

	/**
	 * Utility function to unquote an attribute string parameter.
	 *
	 * If the parameter cannot be processed, an error will be added and null will be returned.
	 *
	 * @param File                                                              $phpcsFile PHPCS File object.
	 * @param array{name:string,ptr:int,params:array{start:int,clean:string}[]} $att Attribute data.
	 * @param int                                                               $idx Parameter number.
	 * @param string                                                            $name Parameter name.
	 * @param bool                                                              $noError Set true to suppress the AttributeInvalidStringParameter error.
	 * @return ?string String, or null.
	 */
	protected function parseAttributeStringParameter( File $phpcsFile, array $att, $idx, $name, $noError = false ) {
		if ( ! isset( $att['params'][ $idx ] ) ) {
			$this->addAttributeMissingParameterError( $phpcsFile, $att, $name );
			return null;
		}

		$value = $att['params'][ $idx ]['clean'];

		// Single-quoted string? Replace known escapes and return.
		if ( preg_match( '/^\x27(?:[^\x27\x5c]|\x5c.)*\x27$/', $value ) ) {
			return strtr(
				substr( $value, 1, -1 ),
				array(
					"\\'"  => "'",
					'\\\\' => '\\',
				)
			);
		}

		// Double-quoted string? Same, but more complex.
		if ( preg_match( '/^"(?:[^"\x5c$]|\x5c.)*"$/', $value ) ) {
			return preg_replace_callback(
				'/\x5c(?:([nrtvef\x5c$"])|([0-7]{1,3})|x([0-9a-fA-F]{1,2})|u{([0-9a-fA-F]+)})/',
				static function ( $m ) {
					static $map = array(
						'n' => "\n",
						'r' => "\r",
						't' => "\t",
						'v' => "\v",
						'e' => "\e",
						'f' => "\f",
					);
					if ( $m[1] !== '' ) {
						return $map[ $m[1] ] ?? $m[1];
					}
					if ( $m[2] !== '' ) {
						return chr( octdec( $m[2] ) & 0xff );
					}
					if ( $m[3] !== '' ) {
						return chr( hexdec( $m[3] ) );
					}
					return mb_chr( hexdec( $m[4] ), 'UTF-8' );
				},
				substr( $value, 1, -1 )
			);
		}

		// Anything else, abort.
		if ( ! $noError ) {
			$phpcsFile->addError(
				'Attribute `%s` parameter `%s` should be a constant single- or double-quoted string.',
				$att['params'][ $idx ]['start'],
				'AttributeInvalidStringParameter',
				array( preg_replace( '!.*\\\\!', '', $att['name'] ), "\$$name" )
			);
		}
		return null;
	}

	/**
	 * Utility function to handle an attribute class parameter.
	 *
	 * If the parameter cannot be processed, an error will be added and nulls will be returned.
	 *
	 * @param File                                                              $phpcsFile PHPCS File object.
	 * @param array{name:string,ptr:int,params:array{start:int,clean:string}[]} $att Attribute data.
	 * @param int                                                               $idx Parameter number.
	 * @param string                                                            $name Parameter name.
	 * @return ?array{string,string} FQCN (no leading backslash) and alias (may have a leading backslash).
	 */
	protected function parseAttributeClassParameter( File $phpcsFile, array $att, $idx, $name ) {
		if ( ! isset( $att['params'][ $idx ] ) ) {
			$this->addAttributeMissingParameterError( $phpcsFile, $att, $name );
			return null;
		}

		$nsinfo  = NamespaceInfo::getNamespaceInfo( $phpcsFile, $att['params'][ $idx ]['start'] );
		$aliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );

		$class = $att['params'][ $idx ]['clean'];
		if ( in_array( strtolower( $class ), array( 'static::class', 'self::class', 'parent::class' ), true ) ) {
			$phpcsFile->addWarning(
				'Attribute `%s` parameter `%s` uses `%s`, which this sniff cannot process.',
				$att['params'][ $idx ]['start'],
				'AttributeNonStaticClassParameter',
				array( preg_replace( '!.*\\\\!', '', $att['name'] ), "\$$name", $att['params'][ $idx ]['clean'] )
			);
			return null;
		} elseif ( str_ends_with( strtolower( $class ), '::class' ) ) {
			$class = ltrim( NamespaceInfo::qualifyClassName( substr( $class, 0, -7 ), $nsinfo['name'], $aliases ), '\\' );
		} else {
			$class = $this->parseAttributeStringParameter( $phpcsFile, $att, $idx, $name, true );
			if ( $class === null ) {
				$phpcsFile->addError(
					'Attribute `%s` parameter `%s` should be a class name, specified with `::class` or as a constant single- or double-quoted string.',
					$att['params'][ $idx ]['start'],
					'AttributeInvalidClassParameter',
					array( preg_replace( '!.*\\\\!', '', $att['name'] ), "\$$name" )
				);
				return null;
			}
			$class = ltrim( $class, '\\' );
		}
		return array(
			$class,
			NamespaceInfo::unqualifyClassName( $class, $nsinfo['name'], $aliases ),
		);
	}

	/**
	 * Utility function to add a 'AttributeMissingParameter' error.
	 *
	 * @param File                       $phpcsFile PHPCS File object.
	 * @param array{name:string,ptr:int} $att Attribute data.
	 * @param string                     $name Parameter name.
	 * @return boolean
	 */
	protected function addAttributeMissingParameterError( File $phpcsFile, array $att, $name ) {
		return $phpcsFile->addError(
			'Attribute `%s` is missing parameter `%s`.',
			$att['ptr'],
			'AttributeMissingParameter',
			array( preg_replace( '!.*\\\\!', '', $att['name'] ), "\$$name" )
		);
	}

	/**
	 * Utility function to handle a class name in an annotation.
	 *
	 * If the parameter cannot be processed, an error will be added and nulls will be returned.
	 *
	 * @param File           $phpcsFile PHPCS File object.
	 * @param array{ptr:int} $ann Annotation data.
	 * @param string         $class Class from the annotation.
	 * @return ?array{string,string} FQCN (no leading backslash) and alias (may have a leading backslash).
	 */
	protected function parseAnnotationClass( File $phpcsFile, array $ann, $class ) {
		$nsinfo  = NamespaceInfo::getNamespaceInfo( $phpcsFile, $ann['ptr'] );
		$aliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );

		$class = ltrim( $class, '\\' );
		return array(
			$class,
			NamespaceInfo::unqualifyClassName( $class, $nsinfo['name'], $aliases ),
		);
	}

	/**
	 * Utility function to encode an object for return from `parseAttribute()` or `parseAnnotation()`.
	 *
	 * Same as `json_encode()`, but returns null if any values are null.
	 *
	 * @param array|object $obj Object to encode.
	 * @return ?string Encoded string.
	 */
	protected static function json_encode_no_nulls( $obj ) {
		foreach ( $obj as $v ) {
			if ( $v === null ) {
				return null;
			}
		}
		return json_encode( $obj );
	}
}
