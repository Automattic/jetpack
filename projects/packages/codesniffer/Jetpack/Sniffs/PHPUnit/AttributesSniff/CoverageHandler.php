<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use InvalidArgumentException;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\CoversTrait;
use PHPUnit\Framework\Attributes\UsesClass;
use PHPUnit\Framework\Attributes\UsesFunction;
use PHPUnit\Framework\Attributes\UsesMethod;
use PHPUnit\Framework\Attributes\UsesTrait;

/**
 * Attribute/annotation handler for '@covers', `@coversDefaultClass`, `@uses`, and `@usesDefaultClass`.
 *
 * Note this ignores the annotations on methods; we assume `Jetpack.PHPUnit.TestMethodCovers` will migrate them.
 */
class CoverageHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_CLASS;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array( CoversClass::class, CoversFunction::class, CoversMethod::class, CoversTrait::class, UsesClass::class, UsesFunction::class, UsesMethod::class, UsesTrait::class );
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@covers', '@coversDefaultClass', '@uses', '@usesDefaultClass' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled attribute class is somehow passed.
	 */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case CoversClass::class:
			case CoversFunction::class:
			case CoversMethod::class:
			case CoversTrait::class:
				$ret->which = 'covers';
				break;

			case UsesClass::class:
			case UsesFunction::class:
			case UsesMethod::class:
			case UsesTrait::class:
				$ret->which = 'uses';
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		switch ( $data['name'] ) {
			case CoversClass::class:
			case UsesClass::class:
			case CoversTrait::class:
			case UsesTrait::class:
				$ret->type                       = str_ends_with( $data['name'], 'Trait' ) ? 'trait' : 'class';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, "{$ret->type}Name" );
				break;

			case CoversFunction::class:
			case UsesFunction::class:
				$ret->type     = 'function';
				$ret->function = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'functionName' );
				break;

			case CoversMethod::class:
			case UsesMethod::class:
				$ret->type                       = 'method';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				$ret->method                     = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'methodName' );
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return static::json_encode_no_nulls( $ret );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled annotation tag is somehow passed.
	 */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case '@covers':
			case '@coversDefaultClass':
				$ret->which = 'covers';
				break;

			case '@uses':
			case '@usesDefaultClass':
				$ret->which = 'uses';
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		switch ( $data['name'] ) {
			case '@coversDefaultClass':
			case '@usesDefaultClass':
				$ret->type                       = 'defaultClass';
				list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $data['content'] );
				break;

			case '@covers':
			case '@uses':
				// Yes, PHPUnit just ignores everything after the first space. 🤷
				$value = preg_replace( '/ .*|[\s()]+$/', '', $data['content'] );

				// Just a class or trait?
				if ( ! str_contains( $value, '::' ) ) {
					$ret->type                       = 'class/trait';
					list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $data['content'] );
					break;
				}

				// Nope, function or method.
				list( $class, $method ) = explode( '::', $value ); // It also ignores multiple `::`s. 🤷
				if ( $class === '' ) {
					// Might be defaultClassed, but we'll munge that later.
					$ret->type     = 'function';
					$ret->function = $method;
				} else {
					$ret->type                       = 'method';
					list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $class );
					$ret->method                     = $method;
				}
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return static::json_encode_no_nulls( $ret );
	}

	/** {@inheritdoc} */
	public function process( File $phpcsFile, $stackPtr, array $attributes, array $annotations, $applies, $keepAnnotations ) {
		$ops  = array();
		$skip = array();

		$annotationsByType = array();
		foreach ( $annotations as $k => $ann ) {
			$d = json_decode( $k );
			$annotationsByType[ $d->which ][ $d->type ][ $k ] = $d;
		}

		// Syntactically there's no difference for annotations covering a class versus a trait.
		// Do what we can to match them up with attributes.
		foreach ( array( 'covers', 'uses' ) as $which ) {
			if ( isset( $annotationsByType[ $which ]['class/trait'] ) ) {
				foreach ( $annotationsByType[ $which ]['class/trait'] as $k => $d ) {
					$kclass = json_encode(
						array(
							'which' => $d->which,
							'type'  => 'class',
							'class' => $d->class,
							'alias' => $d->alias,
						)
					);
					$ktrait = json_encode(
						array(
							'which' => $d->which,
							'type'  => 'trait',
							'class' => $d->class,
							'alias' => $d->alias,
						)
					);
					if ( isset( $attributes[ $kclass ] ) ) {
						$annotations[ $kclass ] = $annotations[ $k ];
					} elseif ( isset( $attributes[ $ktrait ] ) ) {
						$annotations[ $ktrait ] = $annotations[ $k ];
					} elseif ( str_ends_with( $d->class, 'Trait' ) ) { // Guess.
						$annotations[ $ktrait ] = $annotations[ $k ];
					} else {
						$annotations[ $kclass ] = $annotations[ $k ];
					}
					unset( $annotations[ $k ] );
				}
			}
		}

		// Also, if we have both CoversClass and CoversTrait for the same class name, ignore one of them. Having both confuses the annotation check.
		// PHPUnit will probably choke on it later, but it'll give a better message about which is wrong than we could.
		foreach ( $attributes as $k => $att ) {
			$d = json_decode( $k );
			if ( $d->type === 'trait' ) {
				$kclass = json_encode(
					array(
						'which' => $d->which,
						'type'  => 'class',
						'class' => $d->class,
						'alias' => $d->alias,
					)
				);
				if ( isset( $attributes[ $kclass ] ) ) {
					unset( $attributes[ $k ] );
				}
			}
		}

		// We need to find and specially handle any `@coversDefaultClass`/`@usesDefaultClass`, and munge any `@covers`/`@uses` affected by them too.
		foreach ( array( 'covers', 'uses' ) as $which ) {
			// No defaultClass annotation? Nothing to munge then.
			if ( ! isset( $annotationsByType[ $which ]['defaultClass'] ) ) {
				continue;
			}

			// Multiple defaultClass annotations is an error. But we don't need to care if there are no function `@covers`/`@uses` to munge and we're deleting annotations anyway.
			if ( count( $annotationsByType[ $which ]['defaultClass'] ) > 1 && ( $keepAnnotations || isset( $annotationsByType[ $which ]['function'] ) ) ) {
				$skip[] = $which;
				foreach ( $annotationsByType[ $which ]['defaultClass'] as $k => $dummy ) {
					$ann = $annotations[ $k ];
					$phpcsFile->addError(
						"This class has multiple `@{$which}DefaultClass` annotations. PHPUnit will throw an error about this.",
						$ann['ptr'],
						'Multiple' . ucfirst( $which ) . 'DefaultClassAnnotationsFound'
					);
				}
				continue;
			}

			// Otherwise, we have one annotation (or we can ignore the duplicates). Convert any function coverage to method coverage.
			$dc = reset( $annotationsByType[ $which ]['defaultClass'] );
			if ( isset( $annotationsByType[ $which ]['function'] ) ) {
				foreach ( $annotationsByType[ $which ]['function'] as $k => $d ) {
					$k2                 = json_encode(
						(object) array(
							'which'  => $d->which,
							'type'   => 'method',
							'class'  => $dc->class,
							'alias'  => $dc->alias,
							'method' => $d->function,
						)
					);
					$annotations[ $k2 ] = $annotations[ $k ];
					unset( $annotations[ $k ] );
				}
			}

			// Now delete the defaultClass annotations if necessary, and ignore them from further processing.
			foreach ( $annotationsByType[ $which ]['defaultClass'] as $k => $d ) {
				$ann = $annotations[ $k ];
				unset( $annotations[ $k ] );
				if ( ! $keepAnnotations ) {
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
		}

		// If we're skipping something, ignore all the relevant attributes and annotations.
		foreach ( $skip as $which ) {
			$attributes  = array_filter(
				$attributes,
				fn ( $k ) => json_decode( $k )->which !== $which,
				ARRAY_FILTER_USE_KEY
			);
			$annotations = array_filter(
				$annotations,
				fn ( $k ) => json_decode( $k )->which !== $which,
				ARRAY_FILTER_USE_KEY
			);
		}

		// Consistent ordering after all the above.
		ksort( $attributes );
		ksort( $annotations );

		// Use the default processing for what remains.
		return array_merge( $ops, parent::process( $phpcsFile, $stackPtr, $attributes, $annotations, $applies, $keepAnnotations ) );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->which` or `$data->type` is somehow passed.
	 */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		static $classes = array(
			'covers' => array(
				'class'    => CoversClass::class,
				'function' => CoversFunction::class,
				'method'   => CoversMethod::class,
				'trait'    => CoversTrait::class,
			),
			'uses'   => array(
				'class'    => UsesClass::class,
				'function' => UsesFunction::class,
				'method'   => UsesMethod::class,
				'trait'    => UsesTrait::class,
			),
		);

		$d     = json_decode( $data );
		$class = $classes[ $d->which ][ $d->type ] ?? null;
		if ( $class === null ) {
			// Should never happen.
			throw new InvalidArgumentException( "Unrecognized data $d->which $d->type" ); // @codeCoverageIgnore
		}

		$params = array();
		switch ( $d->type ) {
			case 'class':
			case 'trait':
				$params[] = $d->alias . '::class';
				break;
			case 'function':
				$params[] = var_export( $d->function, true );
				break;
			case 'method':
				$params[] = $d->alias . '::class';
				$params[] = var_export( $d->method, true );
				break;
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}

		return array( $class, '( ' . implode( ', ', $params ) . ' )' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->type` is somehow passed.
	 */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		switch ( $d->type ) {
			case 'class':
			case 'trait':
				return array( "@$d->which", " \\$d->class" );
			case 'function':
				return array( "@$d->which", " ::$d->function" );
			case 'method':
				return array( "@$d->which", " \\$d->class::$d->method" );
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}
	}
}
