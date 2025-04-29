<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use InvalidArgumentException;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\Depends;
use PHPUnit\Framework\Attributes\DependsExternal;
use PHPUnit\Framework\Attributes\DependsExternalUsingDeepClone;
use PHPUnit\Framework\Attributes\DependsExternalUsingShallowClone;
use PHPUnit\Framework\Attributes\DependsOnClass;
use PHPUnit\Framework\Attributes\DependsOnClassUsingDeepClone;
use PHPUnit\Framework\Attributes\DependsOnClassUsingShallowClone;
use PHPUnit\Framework\Attributes\DependsUsingDeepClone;
use PHPUnit\Framework\Attributes\DependsUsingShallowClone;

/**
 * Attribute/annotation handler for '@depends'.
 */
class DependsHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_METHOD;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array(
			Depends::class,
			DependsUsingDeepClone::class,
			DependsUsingShallowClone::class,
			DependsExternal::class,
			DependsExternalUsingDeepClone::class,
			DependsExternalUsingShallowClone::class,
			DependsOnClass::class,
			DependsOnClassUsingDeepClone::class,
			DependsOnClassUsingShallowClone::class,
		);
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@depends' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled attribute class is somehow passed.
	 */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case Depends::class:
			case DependsExternal::class:
			case DependsOnClass::class:
				$ret->clone = 'no';
				break;
			case DependsUsingDeepClone::class:
			case DependsExternalUsingDeepClone::class:
			case DependsOnClassUsingDeepClone::class:
				$ret->clone = 'deep';
				break;
			case DependsUsingShallowClone::class:
			case DependsExternalUsingShallowClone::class:
			case DependsOnClassUsingShallowClone::class:
				$ret->clone = 'shallow';
				break;
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		switch ( $data['name'] ) {
			case Depends::class:
			case DependsUsingDeepClone::class:
			case DependsUsingShallowClone::class:
				$ret->type   = 'method';
				$ret->method = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'methodName' );
				break;

			case DependsExternal::class:
			case DependsExternalUsingDeepClone::class:
			case DependsExternalUsingShallowClone::class:
				$ret->type                       = 'external';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				$ret->method                     = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'methodName' );
				break;

			case DependsOnClass::class:
			case DependsOnClassUsingDeepClone::class:
			case DependsOnClassUsingShallowClone::class:
				$ret->type                       = 'class';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return static::json_encode_no_nulls( $ret );
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		$ret->clone = 'no';

		$value = $data['content'];
		if ( str_starts_with( $value, 'clone ' ) ) {
			$ret->clone = 'deep';
			$value      = substr( $value, 6 );
		} elseif ( str_starts_with( $value, '!clone ' ) ) {
			$value = substr( $value, 7 );
		} elseif ( str_starts_with( $value, 'shallowClone ' ) ) {
			$ret->clone = 'shallow';
			$value      = substr( $value, 13 );
		} elseif ( str_starts_with( $value, '!shallowClone ' ) ) {
			$value = substr( $value, 14 );
		}

		if ( ! str_contains( $value, '::' ) ) {
			$ret->type   = 'method';
			$ret->method = $value;
		} else {
			list( $class, $method )          = explode( '::', $value ); // PHPUnit ignores multiple `::`s. 🤷
			$ret->type                       = $method === 'class' ? 'class' : 'external';
			list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $class );
			if ( $method !== 'class' ) {
				$ret->method = $method;
			}
		}

		return json_encode( $ret );
	}

	/** {@inheritdoc} */
	public function process( File $phpcsFile, $stackPtr, array $attributes, array $annotations, $applies, $keepAnnotations ) {
		$ops = array();

		// Check for use of `!clone` and `!shallowClone` if we're keeping annotations.
		if ( $keepAnnotations ) {
			foreach ( $annotations as $ann ) {
				if ( str_starts_with( $ann['content'], '!clone ' ) ) {
					$notclone = '!clone';
				} elseif ( str_starts_with( $ann['content'], '!shallowClone ' ) ) {
					$notclone = '!shallowClone';
				} else {
					continue;
				}

				$ops[] = array(
					'op'   => self::OP_MESSAGE,
					'msg'  => 'Annotation `@depends %1$s` only works with PHPUnit 10+, and does nothing beyond explicitly indicating lack of cloning. Remove the `%1$s` for compatibility with PHPUnit 9 and earlier.',
					'ptr'  => $ann['ptr'],
					'code' => 'DependsNotCloneFound',
					'data' => array( $notclone ),
				);
				$ops[] = array(
					'op'      => self::OP_ANN_REPLACE,
					'ann'     => $ann,
					'tag'     => '@depends',
					'content' => ' ' . substr( $ann['content'], strlen( $notclone ) + 1 ),
				);
			}
		}

		// Other than that, the default processing works fine.
		return array_merge( $ops, parent::process( $phpcsFile, $stackPtr, $attributes, $annotations, $applies, $keepAnnotations ) );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->clone` or `$data->type` is somehow passed.
	 */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		static $classes = array(
			'no'      => array(
				'method'   => Depends::class,
				'external' => DependsExternal::class,
				'class'    => DependsOnClass::class,
			),
			'deep'    => array(
				'method'   => DependsUsingDeepClone::class,
				'external' => DependsExternalUsingDeepClone::class,
				'class'    => DependsOnClassUsingDeepClone::class,
			),
			'shallow' => array(
				'method'   => DependsUsingShallowClone::class,
				'external' => DependsExternalUsingShallowClone::class,
				'class'    => DependsOnClassUsingShallowClone::class,
			),
		);

		$d     = json_decode( $data );
		$class = $classes[ $d->clone ][ $d->type ] ?? null;
		if ( $class === null ) {
			// Should never happen.
			throw new InvalidArgumentException( "Unrecognized data clone=$d->clone type=$d->type" ); // @codeCoverageIgnore
		}

		$params = array();
		switch ( $d->type ) {
			case 'method':
				$params[] = var_export( $d->method, true );
				break;
			case 'external':
				$params[] = $d->alias . '::class';
				$params[] = var_export( $d->method, true );
				break;
			case 'class':
				$params[] = $d->alias . '::class';
				break;
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type=$d->type" ); // @codeCoverageIgnore
		}

		return array( $class, '( ' . implode( ', ', $params ) . ' )' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->clone` or `$data->type` is somehow passed.
	 */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		static $clonePrefixes = array(
			'no'      => '',
			'deep'    => 'clone ',
			'shallow' => 'shallowClone ',
		);

		$d = json_decode( $data );

		$clone = $clonePrefixes[ $d->clone ] ?? null;
		if ( $clone === null ) {
			// Should never happen.
			throw new InvalidArgumentException( "Unrecognized data clone=$d->clone" ); // @codeCoverageIgnore
		}

		switch ( $d->type ) {
			case 'method':
				return array( '@depends', " $clone$d->method" );
			case 'external':
				return array( '@depends', " $clone\\$d->class::$d->method" );
			case 'class':
				return array( '@depends', " $clone\\$d->class::class" );
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}
	}
}
