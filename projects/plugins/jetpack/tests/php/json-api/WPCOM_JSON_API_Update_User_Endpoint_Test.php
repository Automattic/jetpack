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
	 * Clean up after each test.
	 */
	public function tear_down() {
		WPCOM_JSON_API::init()->post_body    = null;
		WPCOM_JSON_API::init()->content_type = null;

		parent::tear_down();
	}

	/**
	 * Data provider for test_delete_user.
	 *
	 * @return array
	 */
	public static function provide_delete_requests() {
		return array(
			'no answer keeps a user who owns content'    => array( array(), true, false ),
			'delete_content deletes and trashes content' => array( array( 'delete_content' => true ), true, true ),
			// Replaced with the admin's ID in the test.
			'reassign deletes and keeps content'         => array( array( 'reassign' => true ), true, true ),
			'no answer deletes a user who owns nothing'  => array( array(), false, true ),
		);
	}

	/**
	 * Content is only deleted when the caller asks for it.
	 *
	 * @dataProvider provide_delete_requests
	 *
	 * @param array $input     Request body.
	 * @param bool  $owns_post Whether the user authors a post.
	 * @param bool  $deleted   Whether the user should be deleted.
	 */
	#[DataProvider( 'provide_delete_requests' )]
	public function test_delete_user( $input, $owns_post, $deleted ) {
		$user_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id = $owns_post ? self::factory()->post->create( array( 'post_author' => $user_id ) ) : 0;
		if ( isset( $input['reassign'] ) ) {
			$input['reassign'] = get_current_user_id();
		}

		WPCOM_JSON_API::init()->post_body    = wp_json_encode( $input, JSON_UNESCAPED_SLASHES );
		WPCOM_JSON_API::init()->content_type = 'application/json';

		$response = $this->get_endpoint()->delete_user( $user_id );

		if ( $deleted ) {
			$this->assertSame( array( 'success' => true ), $response );
		} else {
			$this->assertWPError( $response );
			$this->assertSame( 'reassign_required', $response->get_error_code() );
		}
		$this->assertSame( ! $deleted, (bool) get_userdata( $user_id ) );
		if ( $post_id ) {
			$this->assertSame( isset( $input['delete_content'] ) ? 'trash' : 'publish', get_post_status( $post_id ) );
		}
	}

	/**
	 * The endpoint the plugin registers, so the test sees its real request_format.
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
