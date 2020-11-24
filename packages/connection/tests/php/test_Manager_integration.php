<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Connection Manager functionality testing.
 */
class ManagerIntegrationTest extends \WorDBless\BaseTestCase {

	/**
	 * Initialize the object before running the test method.
	 */
	public function setUp() {
		parent::setUp();
		$this->manager = new Manager();
	}

	/**
	 * Test the `is_connected' method.
	 *
	 * @covers Automattic\Jetpack\Connection\Manager::is_connected
	 * @dataProvider is_connected_data_provider
	 *
	 * @param object|boolean $blog_token The blog token. False if the blog token does not exist.
	 * @param int|boolean    $blog_id The blog id. False if the blog id does not exist.
	 * @param boolean        $expected_output The expected output.
	 */
	public function test_is_connected( $blog_token, $blog_id, $expected_output ) {
		if ( $blog_token ) {
			\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		} else {
			\Jetpack_Options::delete_option( 'blog_token' );
		}

		if ( $blog_id ) {
			\Jetpack_Options::update_option( 'id', $blog_id );
		} else {
			\Jetpack_Options::delete_option( 'id' );
		}

		$this->assertEquals( $expected_output, $this->manager->is_connected() );
	}

	/**
	 * Data provider for test_is_connected.
	 *
	 * Structure of the test data arrays:
	 *     [0] => 'blog_token'      object|boolean The blog token or false if the blog token does not exist.
	 *     [1] => 'blog_id'         int|boolean The blog id or false if the blog id does not exist.
	 *     [2] => 'expected_output' boolean The expected output of the call to is_connected.
	 */
	public function is_connected_data_provider() {

		return array(
			'blog token, blog id'       => array( true, 1234, true ),
			'blog token, no blog id'    => array( true, false, false ),
			'no blog token, blog id'    => array( false, 1234, false ),
			'no blog token, no blog id' => array( false, false, false ),
		);
	}

	/**
	 * Test get_connected_users
	 */
	public function test_get_connected_users() {
		$id_admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);

		$id_author = wp_insert_user(
			array(
				'user_login' => 'author',
				'user_pass'  => 'pass',
				'role'       => 'author',
			)
		);

		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$id_admin  => 'asd123',
				$id_author => 'asd123',
			)
		);

		$all_users = $this->manager->get_connected_users();
		$admins    = $this->manager->get_connected_users( 'manage_options' );

		$this->assertCount( 2, $all_users );
		$this->assertCount( 1, $admins );
		$this->assertSame( $id_admin, $admins[0]->ID );
	}

	/**
	 * Test get_connection_owner
	 */
	public function test_get_connection_owner() {
		$this->assertFalse( $this->manager->get_connection_owner() );

		$id_admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);

		$id_author = wp_insert_user(
			array(
				'user_login' => 'author',
				'user_pass'  => 'pass',
				'role'       => 'author',
			)
		);

		\Jetpack_Options::update_option( 'master_user', $id_admin );

		// Before tokens are created, no owner is found.
		$this->assertFalse( $this->manager->get_connection_owner() );

		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$id_admin  => 'asd.123.' . $id_admin,
				$id_author => 'asd.123.' . $id_author,
			)
		);

		$owner = $this->manager->get_connection_owner();

		$this->assertInstanceOf( 'WP_User', $owner );
		$this->assertSame( $id_admin, $owner->ID );
	}

}
