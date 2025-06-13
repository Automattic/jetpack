<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;

/**
 * Attribute/annotation handler for attributes with an optional priority where the annotation has none.
 */
class PriorityHandler extends GenericHandler {

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// While we could parse the optional priority parameter here, YAGNI.
		return 0;
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return 0;
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->attributes[0], $data === 0 ? '' : "( $data )" );
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->annotations[0], '' );
	}
}
