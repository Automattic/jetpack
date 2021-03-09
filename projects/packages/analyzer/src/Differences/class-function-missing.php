<?php
/**
 * Function Missing checker
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Function_Missing
 */
class Function_Missing extends PersistentListItem implements Invocation_Warner {
	/**
	 * Declaration.
	 *
	 * @var object
	 */
	public $declaration;

	/**
	 * Function_Missing constructor.
	 *
	 * @param object $declaration Declaration.
	 */
	public function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	/**
	 * Return array of declaration items.
	 *
	 * @return array
	 */
	public function to_csv_array() {
		return array(
			$this->type(),
			$this->declaration->path,
			$this->declaration->line,
			$this->declaration->display_name(),
		);
	}

	/**
	 * Returns type of issue.
	 *
	 * @return string 'function_missing'
	 */
	public function type() {
		return 'function_missing';
	}

	/**
	 * Returns the display name for the issue.
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
		if ( $invocation->depends_on( $this->declaration ) ) {
			$warnings->add(
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Function ' . $this->declaration->display_name() . ' is missing', $this->declaration )
			);
		}
	}
}
