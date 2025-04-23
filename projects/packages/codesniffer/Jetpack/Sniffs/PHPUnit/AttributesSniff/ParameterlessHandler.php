<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;

/**
 * Attribute/annotation handler for attributes/annotations with no parameters.
 */
class ParameterlessHandler extends GenericHandler {

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return '';
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return '';
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->attributes[0], '' );
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->annotations[0], '' );
	}
}
