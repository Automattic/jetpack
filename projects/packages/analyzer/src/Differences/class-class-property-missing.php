<?php
/**
 * Class Property Missing check.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\Warnings\Warning;
// TODO - subclasses?

/**
 * Class Class_Property_Missing
 */
class Class_Property_Missing extends Differences_List_Item implements Invocation_Warner {
	/**
	 * Declaration.
	 *
	 * @var object
	 */
	public $declaration;

	/**
	 * Class_Property_Missing constructor.
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
	 * @return string 'property_missing'
	 */
	public function type() {
		return 'property_missing';
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
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Class static property ' . $this->declaration->display_name() . ' is missing', $this->declaration )
			);
		}
	}
}
