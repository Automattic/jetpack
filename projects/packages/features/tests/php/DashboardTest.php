<?php

use Automattic\Jetpack\Features\Dashboard;
use Automattic\Jetpack\Features\Status_Resolver;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Features\Dashboard
 */
#[CoversClass( Dashboard::class )]
final class DashboardTest extends PHPUnit\Framework\TestCase {

	/**
	 * Each resolved status maps to its badge CSS class; unknown falls back to unsupported.
	 *
	 * @dataProvider status_class_provider
	 *
	 * @param string $status   Resolved status.
	 * @param string $expected Expected CSS class.
	 */
	#[DataProvider( 'status_class_provider' )]
	public function test_status_class( $status, $expected ) {
		$this->assertSame( $expected, Dashboard::status_class( $status ) );
	}

	/**
	 * Data provider for status_class.
	 *
	 * @return array<string, array{0:string,1:string}>
	 */
	public static function status_class_provider() {
		return array(
			'active'           => array( Status_Resolver::STATUS_ACTIVE, 'is-active' ),
			'available_off'    => array( Status_Resolver::STATUS_AVAILABLE_OFF, 'is-available' ),
			'needs_connection' => array( Status_Resolver::STATUS_NEEDS_CONNECTION, 'is-connection' ),
			'needs_upgrade'    => array( Status_Resolver::STATUS_NEEDS_UPGRADE, 'is-upgrade' ),
			'unsupported'      => array( Status_Resolver::STATUS_UNSUPPORTED, 'is-unsupported' ),
			'unknown'          => array( 'something-else', 'is-unsupported' ),
		);
	}
}
