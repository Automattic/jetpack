<?php
/**
 * Function Moved Checker.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Function_Moved
 */
class Function_Moved extends PersistentListItem implements Invocation_Warner {
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
	 * Function_Moved constructor.
	 *
	 * @param object $old_declaration Old declaration.
	 * @param object $new_declaration New declaration.
	 */
	public function __construct( $old_declaration, $new_declaration ) {
		$this->old_declaration = $old_declaration;
		$this->new_declaration = $new_declaration;
	}

	/**
	 * Return array of declaration items.
	 *
	 * @return array
	 */
	public function to_csv_array() {
		return array(
			$this->type(),
			$this->old_declaration->path,
			$this->old_declaration->line,
			$this->old_declaration->display_name(),
		);
	}

	/**
	 * Returns type of issue discovered.
	 *
	 * @return string 'function_moved'
	 */
	public function type() {
		return 'function_moved';
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
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Function ' . $this->old_declaration->display_name() . ' was moved from ' . $this->old_declaration->path . ' to ' . $this->new_declaration->path, $this->old_declaration )
			);
		}
	}
}
