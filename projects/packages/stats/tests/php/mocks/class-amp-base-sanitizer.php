<?php
/**
 * Stands in for the AMP plugin's sanitizer base class.
 *
 * @package jetpack-stats
 */

/**
 * The AMP plugin's sanitizer base class.
 */
abstract class AMP_Base_Sanitizer {
	/**
	 * Document being sanitized.
	 *
	 * @var DOMDocument
	 */
	protected $dom;

	/**
	 * Constructor.
	 *
	 * @param DOMDocument $dom  Document being sanitized.
	 * @param array       $args Args.
	 */
	public function __construct( $dom, $args = array() ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->dom = $dom;
	}

	/**
	 * Sanitize the document.
	 */
	abstract public function sanitize();
}
