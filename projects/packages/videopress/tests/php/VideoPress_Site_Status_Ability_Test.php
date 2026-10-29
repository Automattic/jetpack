<?php
/**
 * Tests for VideoPress site status diagnostics.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\VideoPress\Abilities\VideoPress_Abilities;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests connected and disconnected diagnostic states.
 */
class VideoPress_Site_Status_Ability_Test extends BaseTestCase {
	/**
	 * Clear connection caches and acting user.
	 */
	public function tear_down() {
		foreach ( array( 'id', 'blog_token', 'master_user' ) as $key ) {
			\Jetpack_Options::delete_option( $key );
		}
		( new Manager() )->reset_connection_status();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * A disconnected site must remain diagnosable without inventing entitlement.
	 *
	 * @dataProvider connection_states
	 * @param bool $connected Whether to seed a connected site and owner.
	 * @param bool $user_connected Whether the acting user is the connected owner.
	 */
	#[DataProvider( 'connection_states' )]
	public function test_diagnostics_report_connection_prerequisites( $connected, $user_connected ) {
		$id = wp_insert_user(
			array(
				'user_login' => 'status_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $id );
		foreach ( array( 'id', 'blog_token', 'master_user' ) as $key ) {
			\Jetpack_Options::delete_option( $key );
		}
		if ( $connected ) {
			\Jetpack_Options::update_option( 'id', 1234 );
			\Jetpack_Options::update_option( 'blog_token', 'key.1234' );
			\Jetpack_Options::update_option( 'master_user', $id );
			( new Tokens() )->update_user_token( $id, sprintf( 'key.private.%d', $id ), false );
		}
		if ( $connected && ! $user_connected ) {
			$other_id = wp_insert_user(
				array(
					'user_login' => 'unconnected_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			);
			wp_set_current_user( $other_id );
		}
		( new Manager() )->reset_connection_status();

		$requests = 0;
		$block    = static function () use ( &$requests ) {
			++$requests;
			return new \WP_Error( 'unexpected_http', 'Diagnostics should not make remote requests.' );
		};
		$result   = null;
		add_filter( 'pre_http_request', $block );
		try {
			$result = VideoPress_Abilities::get_site_status();
		} finally {
			remove_filter( 'pre_http_request', $block );
		}
		$this->assertIsArray( $result );
		$this->assertSame( 0, $requests );
		$this->assertSame( $connected, $result['has_connected_owner'] );
		$this->assertSame( $connected && $user_connected, $result['connection_allows_actions'] );
		$this->assertSame( $connected ? 1234 : null, $result['videopress_site_id'] );
		$this->assertSame( Status::is_active(), $result['active'] );
		$this->assertSame( 'jetpack', $result['site_type'] );
		$spec = VideoPress_Abilities::get_abilities()['videopress/get-site-status'];
		$this->assertTrue( rest_validate_value_from_schema( $result, $spec['output_schema'] ) );
	}

	/**
	 * Connection states that must remain distinct.
	 *
	 * @return array
	 */
	public static function connection_states() {
		return array(
			'disconnected'            => array( false, false ),
			'connected-owner'         => array( true, true ),
			'unconnected-acting-user' => array( true, false ),
		);
	}
}
