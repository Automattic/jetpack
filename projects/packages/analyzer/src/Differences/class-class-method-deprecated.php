<?php
/**
 * Class Method Deprecated checker.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Method_Deprecated
 */
class Class_Method_Deprecated extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Old declaration.
	 *
	 * @var object
	 */
	public $old_declaration;
	/**
	 * New declaration.
	 *
	 * @var object
	 */
	public $new_declaration;

	/**
	 * Class_Method_Deprecated constructor.
	 *
	 * @param object $old_declaration Old declaration.
	 * @param object $new_declaration New declaration.
	 */
	public function __construct( $old_declaration, $new_declaration ) {
		$this->old_declaration = $old_declaration;
		$this->new_declaration = $new_declaration;
	}

	/**
	 * Returns serializable object.
	 *
	 * @return object
	 */
	protected function get_serializable() {
		return $this->old_declaration;
	}

	/**
	 * Returns type of issue.
	 *
	 * @return string 'method_deprecated'
	 */
	public function type() {
		return 'method_deprecated';
	}

	/**
	 * Display name of issue.
	 *
	 * @return string
	 */
	public function display_name() {
		return $this->old_declaration->display_name();
	}

	/**
	 * Find warnings.
	 *
	 * @param object $invocation Invocation.
	 * @param object $warnings Warnings.
	 */
	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation->depends_on( $this->old_declaration ) ) {
			$warnings->add(
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Class method ' . $this->old_declaration->display_name() . ' is deprecated ' . $this->old_declaration->path . ' line ' . $this->old_declaration->line, $this->old_declaration )
			);
		}
	}
}
