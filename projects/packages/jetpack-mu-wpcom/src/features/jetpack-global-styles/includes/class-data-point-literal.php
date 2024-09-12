<?php
/**
 * Class Data Point Literal.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Global_Styles;

require_once __DIR__ . '/interface-data-point.php';

/**
 * Literal Data Point.
 */
class Data_Point_Literal implements Data_Point {

	/**
	 * Holds the literal value.
	 *
	 * @var mixed
	 */
	private $value;

	/**
	 * Constructor.
	 *
	 * @param array $meta Data point description.
	 */
	public function __construct( $meta ) {
		if ( array_key_exists( 'default', $meta ) ) {
			$this->value = $meta['default'];
		}
	}

	/**
	 * Implements \Automattic\Jetpack\Jetpack_Mu_Wpcom\Global_Styles\Data_Point interface.
	 *
	 * @return mixed The literal value.
	 */
	public function get_value() {
		return $this->value;
	}
}
