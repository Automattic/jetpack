<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use InvalidArgumentException;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\ExcludeGlobalVariableFromBackup;
use PHPUnit\Framework\Attributes\ExcludeStaticPropertyFromBackup;

/**
 * Attribute/annotation handler for `@excludeGlobalVariableFromBackup` and `@excludeStaticPropertyFromBackup`.
 *
 * The annotations are actually pointless. They were added in PHPUnit 10, which already has the corresponding attributes, and aren't even recognized everywhere the annotations are.
 */
class ExcludeThingFromBackupHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_BOTH;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array(
			ExcludeGlobalVariableFromBackup::class,
			ExcludeStaticPropertyFromBackup::class,
		);
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@excludeGlobalVariableFromBackup', '@excludeStaticPropertyFromBackup' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled attribute class is somehow passed.
	 */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case ExcludeStaticPropertyFromBackup::class:
				$ret->type                       = 'property';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				$ret->property                   = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'propertyName' );
				if ( $ret->class === null || $ret->property === null ) {
					return null;
				}
				break;

			case ExcludeGlobalVariableFromBackup::class:
				$ret->type     = 'variable';
				$ret->variable = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'extension' );
				if ( $ret->variable === null ) {
					return null;
				}
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return json_encode( $ret );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled annotation tag is somehow passed.
	 */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case '@excludeStaticPropertyFromBackup':
				$ret->type = 'property';

				$tmp = explode( ' ', $data['content'], 3 );
				if ( count( $tmp ) !== 2 ) {
					$phpcsFile->addError(
						'Annotation takes two parameters, like `@excludeStaticPropertyFromBackup class name`.',
						$data['ptr'],
						'InvalidAnnotation'
					);
					return null;
				}

				list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $tmp[0] );
				if ( $ret->class === null ) {
					// Should never happen.
					return null; // @codeCoverageIgnore
				}
				$ret->property = $tmp[1];
				break;

			case '@excludeGlobalVariableFromBackup':
				$ret->type     = 'variable';
				$ret->variable = $data['content'];
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return json_encode( $ret );
	}

	/** {@inheritdoc} */
	public function process( File $phpcsFile, $stackPtr, array $attributes, array $annotations, $applies, $keepAnnotations ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Since the annotation is pointless, always remove it regardless of $keepAnnotations.
		$ops = parent::process( $phpcsFile, $stackPtr, $attributes, $annotations, $applies, false );

		// Adjust some of the annotation removal messages to better explain the situation.
		foreach ( $ops as &$op ) {
			if ( $op['op'] === self::OP_MESSAGE && $op['code'] === 'AnnotationFoundMissingAttribute' ) {
				$op['msg'] = ( $applies & self::APPLIES_CLASS )
					? 'Annotation `%s` only exists in PHPUnit 10+ and isn\'t even supported at the class level. Just use attribute `%s` instead.'
					: 'Annotation `%s` only exists in PHPUnit 10+. Just use attribute `%s` instead.';
			} elseif ( $op['op'] === self::OP_MESSAGE && $op['code'] === 'RedundantAnnotationFound' ) {
				$op['msg'] = ( $applies & self::APPLIES_CLASS )
					? 'Annotation `%s` only exists in PHPUnit 10+ and isn\'t even supported at the class level. There\'s no point in using it when you already have the corresponding attribute.'
					: 'Annotation `%s` only exists in PHPUnit 10+. There\'s no point in using it when you already have the corresponding attribute.';
			}
		}
		unset( $op );

		return $ops;
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->type` is somehow passed.
	 */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		$class  = null;
		$params = array();
		switch ( $d->type ) {
			case 'property':
				$class    = ExcludeStaticPropertyFromBackup::class;
				$params[] = $d->alias . '::class';
				$params[] = var_export( $d->property, true );
				break;
			case 'variable':
				$class    = ExcludeGlobalVariableFromBackup::class;
				$params[] = var_export( $d->variable, true );
				break;
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}

		return array( $class, '( ' . implode( ', ', $params ) . ' )' );
	}
}
