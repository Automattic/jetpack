<?php
/**
 * Tests for the Protect dashboard's threat formatter.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/protect-dashboard/class-jetpack-protect-dashboard-threats.php';

/**
 * @covers \Jetpack_Protect_Dashboard_Threats
 */
#[CoversClass( Jetpack_Protect_Dashboard_Threats::class )]
class Jetpack_Protect_Dashboard_Threats_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Threats, and the part of the formatted threat each one decides.
	 *
	 * @return array[]
	 */
	public static function provider_format() {
		$fixable = (object) array( 'fixer' => 'update' );

		return array(
			'plugin type is pluralized'      => array(
				array( 'extension' => (object) array( 'type' => 'plugin' ) ),
				array( 'extension', 'type' ),
				'plugins',
			),
			'theme type is pluralized'       => array(
				array( 'extension' => (object) array( 'type' => 'theme' ) ),
				array( 'extension', 'type' ),
				'themes',
			),
			'core type is kept'              => array(
				array( 'extension' => (object) array( 'type' => 'core' ) ),
				array( 'extension', 'type' ),
				'core',
			),
			'no extension is null'           => array(
				array(),
				array( 'extension' ),
				null,
			),
			'empty fixable is false'         => array(
				array( 'fixable' => array() ),
				array( 'fixable' ),
				false,
			),
			'populated fixable is unchanged' => array(
				array( 'fixable' => $fixable ),
				array( 'fixable' ),
				$fixable,
			),
		);
	}

	/**
	 * Test format().
	 *
	 * @dataProvider provider_format
	 * @param array    $threat   The threat's properties.
	 * @param string[] $path     Keys leading to the value under test.
	 * @param mixed    $expected The expected value.
	 */
	#[DataProvider( 'provider_format' )]
	public function test_format( $threat, $path, $expected ) {
		$actual = Jetpack_Protect_Dashboard_Threats::format( (object) $threat );
		foreach ( $path as $key ) {
			$this->assertArrayHasKey( $key, $actual );
			$actual = $actual[ $key ];
		}

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Inputs for format_all(), and the ids of the threats it should return.
	 *
	 * @return array[]
	 */
	public static function provider_format_all() {
		return array(
			'a Traversable is walked'         => array(
				new ArrayIterator( array( (object) array( 'id' => 1 ), (object) array( 'id' => 2 ) ) ),
				array( 1, 2 ),
			),
			'a non-iterable gives no threats' => array( null, array() ),
		);
	}

	/**
	 * Test format_all().
	 *
	 * @dataProvider provider_format_all
	 * @param mixed $threats  The threats to format.
	 * @param int[] $expected The ids of the formatted threats.
	 */
	#[DataProvider( 'provider_format_all' )]
	public function test_format_all( $threats, $expected ) {
		$this->assertSame( $expected, array_column( Jetpack_Protect_Dashboard_Threats::format_all( $threats ), 'id' ) );
	}
}
