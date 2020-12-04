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
	 *
	 * @before
	 */
	public function set_up() {
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
	 * Test get_connection_owner and is_owner
	 */
	public function test_get_connection_owner_and_has_connected_owner() {
		$this->assertFalse( $this->manager->get_connection_owner() );
		$this->assertFalse( $this->manager->has_connected_owner() );

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
		$this->assertFalse( $this->manager->has_connected_owner() );

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
		$this->assertTrue( $this->manager->has_connected_owner() );
	}

	/**
	 * Test has_connected_user and has_connected_admin
	 */
	public function test_has_connected_user_and_has_connected_admin() {
		$this->assertFalse( $this->manager->has_connected_user() );
		$this->assertFalse( $this->manager->has_connected_admin() );

		// Create the user.
		$id_author = wp_insert_user(
			array(
				'user_login' => 'author',
				'user_pass'  => 'pass',
				'role'       => 'author',
			)
		);

		$this->assertFalse( $this->manager->has_connected_user() );
		$this->assertFalse( $this->manager->has_connected_admin() );

		// Connect the user.
		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$id_author => 'asd.123.' . $id_author,
			)
		);

		$this->assertTrue( $this->manager->has_connected_user() );
		$this->assertFalse( $this->manager->has_connected_admin() );

		$id_admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);

		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$id_admin  => 'asd.123.' . $id_admin,
				$id_author => 'asd.123.' . $id_author,
			)
		);

		$this->assertTrue( $this->manager->has_connected_user() );
		$this->assertTrue( $this->manager->has_connected_admin() );

	}

	/**
	 * Test is_connection_owner
	 */
	public function test_is_connection_owner() {
		$master_user_id = wp_insert_user(
			array(
				'user_login' => 'sample_user',
				'user_pass'  => 'asdqwe',
				'role'       => 'administrator',
			)
		);
		$other_user_id  = wp_insert_user(
			array(
				'user_login' => 'other_user',
				'user_pass'  => 'asdqwe',
				'role'       => 'administrator',
			)
		);
		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$master_user_id => 'asd.qwe.' . $master_user_id,
			)
		);
		// No owner and non-logged in user context.
		$this->assertFalse( $this->manager->is_connection_owner() );
		\Jetpack_Options::update_option( 'master_user', $master_user_id );

		$this->assertFalse( $this->manager->is_connection_owner() );

		wp_set_current_user( $master_user_id );
		$this->assertTrue( $this->manager->is_connection_owner() );

		wp_set_current_user( $other_user_id );
		$this->assertFalse( $this->manager->is_connection_owner() );

	}

	/**
	 * Test get_access_token method
	 *
	 * @dataProvider get_access_token_data_provider
	 *
	 * @param bool|string $create_blog_token The blog token to be created.
	 * @param bool|array  $create_user_tokens The user tokens to be created.
	 * @param bool|int    $master_user The ID of the master user to be defined.
	 * @param bool|int    $user_id_query The user ID that will be used to fetch the token.
	 * @param bool|string $token_key_query The token_key that will be used to fetch the token.
	 * @param bool|string $expected_error_code If an error is expected, the error code.
	 * @param bool|object $expected_token If success is expected, the expected token object.
	 * @return void
	 */
	public function test_get_access_token( $create_blog_token, $create_user_tokens, $master_user, $user_id_query, $token_key_query, $expected_error_code, $expected_token ) {

		// Set up.
		if ( $create_blog_token ) {
			\Jetpack_Options::update_option( 'blog_token', $create_blog_token );
			\Jetpack_Options::update_option( 'id', 1234 );
		}
		if ( $create_user_tokens ) {
			\Jetpack_Options::update_option( 'user_tokens', $create_user_tokens );
			foreach ( array_keys( $create_user_tokens ) as $uid ) {
				wp_insert_user(
					array(
						'user_login' => 'sample_user' . $uid,
						'user_pass'  => 'asdqwe',
					)
				);
			}
			if ( $master_user ) {
				\Jetpack_Options::update_option( 'master_user', $master_user );
			}
		}

		if ( 'CONNECTION_OWNER' === $user_id_query ) {
			$manager       = $this->manager; // php 5.6 safe.
			$user_id_query = $manager::CONNECTION_OWNER;
		}

		$token = $this->manager->get_access_token( $user_id_query, $token_key_query, false );

		if ( $expected_error_code ) {
			$this->assertInstanceOf( 'WP_Error', $token );
			$this->assertSame( $expected_error_code, $token->get_error_code() );
		} else {
			$this->assertEquals( $expected_token, $token );
		}
	}

	/**
	 * Data provider for test_get_access_token
	 *
	 * @return array
	 */
	public function get_access_token_data_provider() {
		return array(
			'no tokens'                        => array(
				false, // blog token.
				false, // user tokens.
				false, // master_user.
				false, // user_id_query.
				false, // token_key_query.
				'no_possible_tokens', // expected error code.
				false, // expected token.
			),
			'no tokens'                        => array(
				false, // blog token.
				false, // user tokens.
				false, // master_user.
				22, // user_id_query.
				false, // token_key_query.
				'no_user_tokens', // expected error code.
				false, // expected token.
			),
			'no tokens for the user'           => array(
				false, // blog token.
				array(
					11 => 'asd.zxc.11',
				), // user tokens.
				false, // master_user.
				22, // user_id_query.
				false, // token_key_query.
				'no_token_for_user', // expected error code.
				false, // expected token.
			),
			'malformed user token'             => array(
				false, // blog token.
				array(
					11 => 'asdzxc.11',
				), // user tokens.
				false, // master_user.
				11, // user_id_query.
				false, // token_key_query.
				'token_malformed', // expected error code.
				false, // expected token.
			),
			'user mismatch'                    => array(
				false, // blog token.
				array(
					11 => 'asd.zxc.22',
				), // user tokens.
				false, // master_user.
				11, // user_id_query.
				false, // token_key_query.
				'user_id_mismatch', // expected error code.
				false, // expected token.
			),
			'Connection owner not defined'     => array(
				false, // blog token.
				array(
					11 => 'asd.zxc.11',
				), // user tokens.
				false, // master_user.
				'CONNECTION_OWNER', // user_id_query.
				false, // token_key_query.
				'empty_master_user_option', // expected error code.
				false, // expected token.
			),
			'Connection owner'                 => array(
				false, // blog token.
				array(
					11 => 'asd.zxc.11',
				), // user tokens.
				11, // master_user.
				'CONNECTION_OWNER', // user_id_query.
				false, // token_key_query.
				false, // expected error code.
				(object) array(
					'secret'           => 'asd.zxc',
					'external_user_id' => 11,
				), // expected token.
			),
			'Find blog token'                  => array(
				'asdasd.qweqwe', // blog token.
				false, // user tokens.
				false, // master_user.
				false, // user_id_query.
				false, // token_key_query.
				false, // expected error code.
				(object) array(
					'secret'           => 'asdasd.qweqwe',
					'external_user_id' => 0,
				), // expected token.
			),
			'Find user token'                  => array(
				false, // blog token.
				array(
					11 => 'qwe.asd.11',
					12 => 'asd.zxc.12',
				), // user tokens.
				false, // master_user.
				11, // user_id_query.
				false, // token_key_query.
				false, // expected error code.
				(object) array(
					'secret'           => 'qwe.asd',
					'external_user_id' => 11,
				), // expected token.
			),
			'Find user token with secret'      => array(
				false, // blog token.
				array(
					11 => 'qwe.asd.11',
					12 => 'asd.zxc.12',
				), // user tokens.
				false, // master_user.
				12, // user_id_query.
				'asd', // token_key_query.
				false, // expected error code.
				(object) array(
					'secret'           => 'asd.zxc',
					'external_user_id' => 12,
				), // expected token.
			),
			'Find blog token with secret'      => array(
				'asdasd.qweqwe', // blog token.
				false, // user tokens.
				false, // master_user.
				false, // user_id_query.
				'asdasd', // token_key_query.
				false, // expected error code.
				(object) array(
					'secret'           => 'asdasd.qweqwe',
					'external_user_id' => 0,
				), // expected token.
			),
			'Dont find user token with secret' => array(
				false, // blog token.
				array(
					11 => 'qwe.asd.11',
					12 => 'asd.zxc.12',
				), // user tokens.
				false, // master_user.
				12, // user_id_query.
				'qqq', // token_key_query.
				'no_valid_user_token', // expected error code.
				false, // expected token.
			),
			'Dont find blog token with secret' => array(
				'asdasd.qweqwe', // blog token.
				false, // user tokens.
				false, // master_user.
				false, // user_id_query.
				'kaasdas', // token_key_query.
				'no_valid_blog_token', // expected error code.
				false, // expected token.
			),
		);
	}

	/**
	 * Make sure we don´t change how we return errors
	 */
	public function test_get_access_token_suppress_errors() {
		$this->assertFalse( $this->manager->get_access_token( 123 ) );
		$this->assertInstanceOf( 'WP_Error', $this->manager->get_access_token( 123, '', false ) );
	}

}
