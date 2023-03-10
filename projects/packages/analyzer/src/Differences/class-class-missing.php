<?php
/**
 * Class missing checker.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Invocations\New_;
use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Missing
 */
class Class_Missing extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Declaration.
	 *
	 * @var object
	 */
	public $declaration;

	/**
	 * Class_Missing constructor.
	 *
	 * @param object $declaration Declaration.
	 */
	public function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	/**
	 * Returns serializable object.
	 *
	 * @return object
	 */
	protected function get_serializable() {
		return array( 'old_declaration' => $this->declaration );
	}

	/**
	 * Returns type of issue.
	 *
	 * @return string 'class_missing'
	 */
	public function type() {
		return 'class_missing';
	}

	/**
	 * Find warnings.
	 *
	 * @param object $invocation Invocation.
	 * @param object $warnings Warnings.
	 */
	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof New_ ) {
			// check if it's instantiating this missing class.
			if ( $invocation->class_name === $this->declaration->class_name ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class ' . $this->declaration->display_name() . ' is missing', $this->declaration ) );
			}
		}
	}
}
