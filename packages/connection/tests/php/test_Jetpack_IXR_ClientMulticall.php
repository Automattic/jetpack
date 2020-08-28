<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_IXR_ClientMulticall;
use WorDBless\BaseTestCase;

require_once ABSPATH . WPINC . '/IXR/class-IXR-client.php';
require_once ABSPATH . WPINC . '/IXR/class-IXR-clientmulticall.php';

/**
 * Class Jetpack_IXR_ClientMulticall_Test.
 *
 * @package Automattic\Jetpack\Connection
 */
class Jetpack_IXR_ClientMulticall_Test extends BaseTestCase {
	/**
	 * Test ::sort_calls() preserves the relative order of equal items.
	 */
	public function test_sort_calls_preserves_relative_order_on_equal_items() {
		$original = array(
			array(
				'methodName' => 'foo',
				'params'     => array( 1 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 2 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 3 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 4 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 5 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 6 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 7 ),
			),
			array(
				'methodName' => 'jetpack.syncContent',
				'params'     => array( 8 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 9 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 10 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 11 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 12 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 13 ),
			),
			array(
				'methodName' => 'jetpack.syncContent',
				'params'     => array( 14 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 15 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 16 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 17 ),
			),
			// Intentional duplicate.
			array(
				'methodName' => 'foo',
				'params'     => array( 12 ),
			),
		);

		$expected = array(
			array(
				'methodName' => 'jetpack.syncContent',
				'params'     => array( 8 ),
			),
			array(
				'methodName' => 'jetpack.syncContent',
				'params'     => array( 14 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 1 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 2 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 3 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 4 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 5 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 6 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 7 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 9 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 10 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 11 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 12 ),
			),
			// Intentional duplicate gets moved up next to the other one.
			array(
				'methodName' => 'foo',
				'params'     => array( 12 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 13 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 15 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 16 ),
			),
			array(
				'methodName' => 'foo',
				'params'     => array( 17 ),
			),
		);

		$ixr = new Jetpack_IXR_ClientMulticall();

		$this->assertSame( $expected, $ixr->sort_calls( $original ) );
	}
}
