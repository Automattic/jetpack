<?php
/**
 * Tests for dashboard visibility on supported and excluded hosts.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Surface_Visibility
 */
#[CoversClass( Surface_Visibility::class )]
class SurfaceVisibilityTest extends TestCase {

	/**
	 * @dataProvider hosts
	 * @param bool $vip Whether the host is VIP.
	 * @param bool $simple Whether the host is WordPress.com Simple.
	 */
	#[DataProvider( 'hosts' )]
	public function test_script_data_preserves_host_visibility_and_other_values( $vip, $simple ) {
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', $vip );
		Constants::set_constant( 'IS_WPCOM', $simple );
		try {
			$data = Surface_Visibility::inject_surface_visibility(
				array(
					'keep'                       => 1,
					Initializer::SCRIPT_DATA_KEY => array( 'existing' => true ),
				)
			);
			$this->assertSame( ! $vip, $data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['existing'] );
			$this->assertSame( 1, $data['keep'] );
			$this->assertSame( ! $vip, Surface_Visibility::is_visible() );
		} finally {
			Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
			Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	public static function hosts() {
		return array(
			'self-hosted' => array( false, false ),
			'Simple'      => array( false, true ),
			'VIP'         => array( true, false ),
		);
	}

	public function test_missing_script_data_is_initialized() {
		$this->assertSame( array( Initializer::SCRIPT_DATA_KEY => array( 'surface_visible' => true ) ), Surface_Visibility::inject_surface_visibility( null ) );
	}
}
