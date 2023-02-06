<?php
/**
 * Class Constant Missing
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Invocations\Static_Const;
use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Const_Missing
 */
class Class_Const_Missing extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Declaration.
	 *
	 * @var object
	 */
	public $declaration;

	/**
	 * Class_Const_Missing constructor.
	 *
	 * @param object $declaration The declaration.
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
	 * @return string 'class_cont_missing'
	 */
	public function type() {
		return 'class_const_missing';
	}

	/**
	 * Find warnings.
	 *
	 * @param object $invocation Invocation.
	 * @param object $warnings Warnings.
	 */
	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Static_Const ) {
			if ( $invocation->class_name === $this->declaration->class_name
				&& $invocation->const_name === $this->declaration->const_name ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class constant ' . $this->declaration->display_name() . ' is missing', $this->declaration ) );
			}
		}
	}
}
