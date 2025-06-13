<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\DataProviderExternal;

/**
 * Attribute/annotation handler for '@dataProvider'.
 */
class DataProviderHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_METHOD;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array( DataProvider::class, DataProviderExternal::class );
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@dataProvider' );
	}

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();
		switch ( $data['name'] ) {
			case DataProvider::class:
				$ret->method = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'methodName' );
				break;

			case DataProviderExternal::class:
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				$ret->method                     = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'methodName' );
				break;
		}

		return static::json_encode_no_nulls( $ret );
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$value = rtrim( $data['content'], " ()\n\r\t\v\x00" );

		$ret = (object) array();
		if ( str_contains( $value, '::' ) ) {
			list( $class, $method )          = explode( '::', $value ); // PHPUnit ignores multiple `::`s. 🤷
			list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $class );
			$ret->method                     = $method;
		} else {
			$ret->method = $value;
		}

		return static::json_encode_no_nulls( $ret );
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		if ( isset( $d->alias ) ) {
			return array(
				DataProviderExternal::class,
				sprintf( '( %s::class, %s )', $d->alias, var_export( $d->method, true ) ),
			);
		}

		return array(
			DataProvider::class,
			sprintf( '( %s )', var_export( $d->method, true ) ),
		);
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		return array(
			'@dataProvider',
			isset( $d->class ) ? " $d->class::$d->method" : " $d->method",
		);
	}
}
