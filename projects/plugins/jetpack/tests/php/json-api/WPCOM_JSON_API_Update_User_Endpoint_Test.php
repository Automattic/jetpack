<?php
/**
 * WPCOM_JSON_API_Update_User_Endpoint unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Update_User_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once ABSPATH . 'wp-admin/includes/user.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/class.wpcom-json-api-update-user-endpoint.php';

/**
 * Tests for the /sites/%s/users/%d/delete endpoint.
 *
 * @covers \WPCOM_JSON_API_Update_User_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Update_User_Endpoint::class )]
class WPCOM_JSON_API_Update_User_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Multisite removes the user from the site instead of deleting them.' );
		}

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Data provider for test_remove_user_with_content.
	 *
	 * @return array
	 */
	public static function provide_remover() {
		return array(
			'leaving keeps the account and content'  => array( true ),
			'an admin removing someone deletes both' => array( false ),
		);
	}

	/**
	 * Leaving a single site only drops the role, as on multisite; admin removals still delete.
	 *
	 * @dataProvider provide_remover
	 *
	 * @param bool $self Whether the user removes themselves.
	 */
	#[DataProvider( 'provide_remover' )]
	public function test_remove_user_with_content( $self ) {
		$user_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
		if ( $self ) {
			wp_set_current_user( $user_id );
		}

		$this->assertSame( array( 'success' => true ), $this->get_endpoint()->delete_or_remove_user( $user_id ) );

		$user = get_userdata( $user_id );
		if ( $self ) {
			$this->assertSame( array(), $user->roles );
			$this->assertSame( 'publish', get_post_status( $post_id ) );
		} else {
			$this->assertFalse( $user );
			$this->assertSame( 'trash', get_post_status( $post_id ) );
		}
	}

	/**
	 * The endpoint the plugin registers.
	 *
	 * @return WPCOM_JSON_API_Update_User_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint() {
		foreach ( WPCOM_JSON_API::init()->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['POST'] ?? null;
			if ( $endpoint instanceof WPCOM_JSON_API_Update_User_Endpoint ) {
				return $endpoint;
			}
		}
		$this->fail( 'The user delete endpoint is not registered.' );
	}
}
