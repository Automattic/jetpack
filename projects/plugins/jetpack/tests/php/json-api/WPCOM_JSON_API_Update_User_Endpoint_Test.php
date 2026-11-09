<?php
/**
 * Tests for the user removal endpoint.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/class.wpcom-json-api-update-user-endpoint.php';

/**
 * Tests Atomic self-service removal.
 *
 * @covers \WPCOM_JSON_API_Update_User_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Update_User_Endpoint::class )]
class WPCOM_JSON_API_Update_User_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * Atomic host constants.
	 */
	private const HOST_CONSTANTS = array( 'ATOMIC_SITE_ID', 'ATOMIC_CLIENT_ID', 'WPCOMSH__PLUGIN_FILE' );

	/** Enable the Atomic host fixture. */
	public function set_up() {
		parent::set_up();

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Atomic user deletion requires a single-site install.' );
		}

		foreach ( self::HOST_CONSTANTS as $name ) {
			Constants::set_constant( $name, true );
		}
		Cache::clear();
		( new Manager() )->reset_connection_status();
	}

	/** Reset the host and connection caches. */
	public function tear_down() {
		foreach ( self::HOST_CONSTANTS as $name ) {
			Constants::clear_single_constant( $name );
		}
		Cache::clear();
		( new Manager() )->reset_connection_status();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/** An editor can leave only if their content goes to the connected owner. */
	public function test_atomic_self_removal_requires_reassignment_to_the_owner() {
		$owner  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$admin  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor = self::factory()->user->create( array( 'role' => 'editor' ) );
		Jetpack_Options::update_option( 'master_user', $owner );
		Jetpack_Options::update_option( 'user_tokens', array( $owner => 'fixture.a.' . $owner ) );

		$post = self::factory()->post->create( array( 'post_author' => $editor ) );
		$page = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_author' => $editor,
			)
		);
		wp_set_current_user( $editor );

		$input    = array();
		$endpoint = $this->createPartialMock( WPCOM_JSON_API_Update_User_Endpoint::class, array( 'input' ) );
		$endpoint->method( 'input' )->willReturnCallback(
			static function () use ( &$input ) {
				return $input;
			}
		);

		foreach ( array( array(), array( 'reassign' => $admin ) ) as $input ) {
			$result = $endpoint->delete_user( $editor );
			$this->assertWPError( $result );
			$this->assertSame( 'site_owner_unavailable', $result->get_error_code() );
			$this->assertTrue( is_user_member_of_blog( $editor ) );
			$this->assertSame( $editor, (int) get_post( $post )->post_author );
			$this->assertSame( $editor, (int) get_post( $page )->post_author );
		}

		$input = array( 'reassign' => $owner );
		Jetpack_Options::delete_option( 'master_user' );
		( new Manager() )->reset_connection_status();
		$result = $endpoint->delete_user( $editor );
		$this->assertWPError( $result );
		$this->assertSame( 'site_owner_unavailable', $result->get_error_code() );
		Jetpack_Options::update_option( 'master_user', $owner );
		( new Manager() )->reset_connection_status();

		$owner_user = get_userdata( $owner );
		$owner_user->add_cap( 'manage_options', false );
		$result = $endpoint->delete_user( $editor );
		$this->assertWPError( $result );
		$this->assertSame( 'site_owner_unavailable', $result->get_error_code() );
		$owner_user->remove_cap( 'manage_options' );

		wp_set_current_user( $owner );
		$result = $endpoint->delete_user( $owner );
		$this->assertWPError( $result );
		$this->assertSame( 'forbidden', $result->get_error_code() );
		$this->assertTrue( is_user_member_of_blog( $owner ) );

		wp_set_current_user( $editor );
		$this->assertSame( array( 'success' => true ), $endpoint->delete_user( $editor ) );
		$this->assertFalse( get_userdata( $editor ) );
		$this->assertSame( $owner, (int) get_post( $post )->post_author );
		$this->assertSame( 'publish', get_post_status( $post ) );
		$this->assertSame( $owner, (int) get_post( $page )->post_author );
		$this->assertSame( 'draft', get_post_status( $page ) );
	}

	/** Administrators can still select a recipient when removing someone else. */
	public function test_atomic_admin_removal_preserves_explicit_reassignment() {
		$admin     = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor    = self::factory()->user->create( array( 'role' => 'editor' ) );
		$recipient = self::factory()->user->create( array( 'role' => 'editor' ) );
		$post      = self::factory()->post->create( array( 'post_author' => $editor ) );

		wp_set_current_user( $admin );
		$endpoint = $this->createPartialMock( WPCOM_JSON_API_Update_User_Endpoint::class, array( 'input' ) );
		$endpoint->method( 'input' )->willReturn( array( 'reassign' => $recipient ) );

		$this->assertSame( array( 'success' => true ), $endpoint->delete_user( $editor ) );
		$this->assertFalse( get_userdata( $editor ) );
		$this->assertSame( $recipient, (int) get_post( $post )->post_author );
	}
}
