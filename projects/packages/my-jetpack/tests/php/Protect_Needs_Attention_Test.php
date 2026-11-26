<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use Automattic\Jetpack\Protect_Status\Status;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * The threats behind the `protect_has_threats` alert and the "Scan found threats" notice.
 *
 * @package automattic/my-jetpack
 * @covers \Automattic\Jetpack\My_Jetpack\Products\Protect::does_module_need_attention
 */
#[CoversMethod( Protect::class, 'does_module_need_attention' )]
class Protect_Needs_Attention_Test extends TestCase {

	/**
	 * Store a Scan status with a critical threat 1 and a non-critical threat 2, both fixable.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'pre_http_request', array( $this, 'block_http_request' ) );
		// Other test classes leave a memoized status behind.
		Status::$status = null;
		Current_Plan::update_from_site_record(
			array(
				'plan'     => array( 'product_slug' => 'jetpack_free' ),
				'products' => array( array( 'product_slug' => 'jetpack_scan' ) ),
			)
		);
		$threats = array();
		foreach ( array(
			1 => 5,
			2 => 3,
		) as $id => $severity ) {
			$threats[] = (object) array(
				'id'        => $id,
				'severity'  => $severity,
				'signature' => 'PHP.Generic',
				'filename'  => ABSPATH . "threat-$id.php",
				'fixable'   => (object) array( 'fixer' => 'delete' ),
			);
		}
		update_option(
			Scan_Status::OPTION_NAME,
			maybe_serialize(
				(object) array(
					'state'       => 'idle',
					'most_recent' => (object) array( 'timestamp' => gmdate( 'c', time() - HOUR_IN_SECONDS ) ),
					'threats'     => $threats,
				)
			)
		);
		update_option( Scan_Status::OPTION_TIMESTAMP_NAME, time() + HOUR_IN_SECONDS );
	}

	/**
	 * Leave no status, plan or option behind.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'block_http_request' ) );
		Status::$status = null;
		Current_Plan::update_from_site_record(
			array(
				'plan'     => array( 'product_slug' => 'jetpack_free' ),
				'products' => array(),
			)
		);
		WorDBless_Options::init()->clear_options();
		parent::tearDown();
	}

	/**
	 * Short-circuit every outbound HTTP request.
	 *
	 * @return \WP_Error
	 */
	public function block_http_request() {
		return new \WP_Error( 'blocked', 'Outbound HTTP requests are blocked in tests.' );
	}

	/**
	 * Record threats as fixed on the site after the last scan, as the Protect page does.
	 *
	 * @param int[] $ids Threat IDs.
	 */
	private function fix( array $ids ) {
		$fixed = array();
		foreach ( $ids as $id ) {
			$fixed[ (string) $id ] = array(
				'id'      => $id,
				'status'  => 'fixed',
				'fixedOn' => gmdate( 'Y-m-d\TH:i:s.000\Z' ),
			);
		}
		update_option( 'jetpack_protect_dashboard_resolved_threats', $fixed );
	}

	/**
	 * Fixed threats, what is stored, and what the alert says about the rest.
	 *
	 * @return array
	 */
	public static function provide_fixed_threats() {
		return array(
			'none fixed'                              => array(
				array(),
				array(
					'type' => 'error',
					'data' => array(
						'threat_count'          => 2,
						'critical_threat_count' => 1,
						'fixable_threat_ids'    => array( 1, 2 ),
					),
				),
			),
			'the critical one'                        => array(
				array( 1 ),
				array(
					'type' => 'warning',
					'data' => array(
						'threat_count'          => 1,
						'critical_threat_count' => 0,
						'fixable_threat_ids'    => array( 2 ),
					),
				),
			),
			'every one of them'                       => array( array( 1, 2 ), false ),
			'the critical one, then a failed refresh' => array(
				array( 1 ),
				array(
					'type' => 'warning',
					'data' => array(
						'threat_count'          => 1,
						'critical_threat_count' => 0,
						'fixable_threat_ids'    => array( 2 ),
					),
				),
				'expired',
			),
			'none stored, then a failed refresh'      => array( array(), false, 'none' ),
		);
	}

	/**
	 * @param int[]      $fixed    Threat IDs the site fixed.
	 * @param array|bool $expected The alert.
	 * @param string     $stored   The stored status: 'fresh', 'expired' (so refreshing it fails) or 'none'.
	 *
	 * @dataProvider provide_fixed_threats
	 */
	#[DataProvider( 'provide_fixed_threats' )]
	public function test_leaves_out_threats_the_site_fixed( $fixed, $expected, $stored = 'fresh' ) {
		if ( 'expired' === $stored ) {
			update_option( Scan_Status::OPTION_TIMESTAMP_NAME, time() - HOUR_IN_SECONDS );
		} elseif ( 'none' === $stored ) {
			delete_option( Scan_Status::OPTION_NAME );
			delete_option( Scan_Status::OPTION_TIMESTAMP_NAME );
		}
		$this->fix( $fixed );

		$this->assertSame( $expected, Protect::does_module_need_attention() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_counts_every_threat_with_a_protect_package_that_cannot_tell() {
		require_once __DIR__ . '/stubs/older-protect/class-dashboard-threats.php';
		$this->fix( array( 1, 2 ) );

		$this->assertSame( 2, Protect::does_module_need_attention()['data']['threat_count'] );
	}
}
