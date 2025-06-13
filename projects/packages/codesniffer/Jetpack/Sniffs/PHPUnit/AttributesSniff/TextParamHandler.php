<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;

/**
 * Attribute/annotation handler for attributes that take a plain text parameter.
 */
class TextParamHandler extends GenericHandler {

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'text' );
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $data['content'];
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			$this->attributes[0],
			sprintf( '( %s )', var_export( $data, true ) ),
		);
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->annotations[0], " $data" );
	}
}
