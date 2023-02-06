<?php
/**
 * Class Method Missing Warner.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Invocations\Static_Call;
use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Method_Missing
 */
class Class_Method_Missing extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Declaration.
	 *
	 * @var object
	 */
	public $declaration;

	/**
	 * Class_Method_Missing constructor.
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
	 * @return string 'method_missing'
	 */
	public function type() {
		return 'method_missing';
	}

	/**
	 * Returns display name.
	 *
	 * @return mixed
	 */
	public function display_name() {
		return $this->declaration->display_name();
	}

	/**
	 * Find warnings.
	 *
	 * @param object $invocation Invocation.
	 * @param object $warnings Warnings.
	 */
	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Static_Call ) {
			// check if it's instantiating this missing class.
			if ( $invocation->class_name === $this->declaration->class_name
				&& $invocation->method_name === $this->declaration->method_name
				&& $this->declaration->static ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class static method ' . $this->declaration->display_name() . ' is missing', $this->declaration ) );
			}
		}
	}
}
