<?php
/**
 * Class_Moved.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Moved.
 */
class Class_Moved extends Differences_List_Item implements Invocation_Warner {
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
	 * Class_Moved constructor.
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
	 * @return array
	 */
	protected function get_serializable() {
		return array(
			'old_declaration' => $this->old_declaration,
			'new_declaration' => $this->new_declaration,
		);  }

	/**
	 * Returns type of issue.
	 *
	 * @return string 'class_moved'
	 */
	public function type() {
		return 'class_moved';
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
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Class ' . $this->old_declaration->display_name() . ' was moved from ' . $this->old_declaration->path . ' to ' . $this->new_declaration->path, $this->old_declaration )
			);
		}
	}
}
