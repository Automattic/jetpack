<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

/**
 * Attribute/annotation handler base class that takes the list of annotations and attributes as a constructor parameter.
 */
abstract class GenericHandler extends Handler {

	/**
	 * Where the attribute/annotation applies.
	 *
	 * @var int
	 */
	protected $applies;

	/**
	 * Attribute classes. First is the primary.
	 *
	 * @var string[]
	 */
	protected $attributes;

	/**
	 * Annotation tags. First is the primary.
	 *
	 * @var string[]
	 */
	protected $annotations;

	/**
	 * Constructor.
	 *
	 * @param int      $applies Where the attribute/annotation applies.
	 * @param string[] $annotations Annotation tags.
	 * @param string[] $attributes Attribute classes.
	 */
	public function __construct( $applies, array $annotations, array $attributes ) {
		$this->applies     = $applies;
		$this->annotations = $annotations;
		$this->attributes  = $attributes;
	}

	/** {@inheritdoc} */
	public function applies() {
		return $this->applies;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return $this->attributes;
	}

	/** {@inheritdoc} */
	public function annotations() {
		return $this->annotations;
	}
}
