<?php
/**
 * Function Deprecated Checker.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Function_Deprecated
 */
class Function_Deprecated extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Old declaration.
	 *
	 * @var object
	 */
	public $old_declaration;

	/**
	 * Function_Moved constructor.
	 *
	 * @param object $old_declaration Old declaration.
	 */
	public function __construct( $old_declaration ) {
		$this->old_declaration = $old_declaration;
	}

	/**
	 * Returns serializable object.
	 *
	 * @return object
	 */
	protected function get_serializable() {
		return array( 'old_declaration' => $this->old_declaration );
	}

	/**
	 * Returns type of issue discovered.
	 *
	 * @return string 'function_deprecated'
	 */
	public function type() {
		return 'function_deprecated';
	}

	/**
	 * Returns the display name of the issue.
	 *
	 * @return mixed
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
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Function ' . $this->old_declaration->display_name() . ' is deprecated ' . $this->old_declaration->path . ' line ' . $this->old_declaration->line, $this->old_declaration )
			);
		}
	}
}
