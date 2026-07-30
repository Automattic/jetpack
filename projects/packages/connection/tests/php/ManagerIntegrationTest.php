<?php
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\BeforeClass;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Connection Manager functionality testing.
 *
 * @covers \Automattic\Jetpack\Connection\Manager
 */
#[CoversClass( Manager::class )]
class ManagerIntegrationTest extends \WorDBless\BaseTestCase {

	/**
	 * The connection manager.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * The URL of the last HTTP request intercepted by the user-data endpoint filter.
	 *
	 * @var string|null
	 */
	private $intercepted_url = null;

	/**
	 * The arguments of the last HTTP request intercepted by the user-data endpoint filter.
	 *
	 * @var array|null
	 */
	private $intercepted_args = null;

	/**
	 * The canned response the user-data endpoint filter returns for a matching request.
	 *
	 * @var array|\WP_Error|null
	 */
	private $http_response = null;

	/**
	 * Initialize the hooks to reset memoized connection properties.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_before_class() {
		// Use reflection to call the private method that sets up cache invalidation hooks.
		$manager    = new Manager();
		$reflection = new \ReflectionClass( $manager );
		$method     = $reflection->getMethod( 'add_connection_status_invalidation_hooks' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( $manager );
	}

	/**
	 * Initialize the object before running the test method.
	 */
	public function set_up() {
		$this->manager = new Manager();
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tear_down() {
		Constants::clear_constants();
	}

	/**
	 * Reset the connection status.
	 * Needed because the connection status is memoized and not reset between tests.
	 * WorDBless does not fire the options update hooks that would reset the connection status.
	 */
	public function reset_connection_status() {
		static $manager = null;
		if ( ! $manager ) {
			$manager = new \Automattic\Jetpack\Connection\Manager();
		}
		$manager->reset_connection_status();
	}

	/**
	 * Test the `is_connected' method.
	 *
	 * @dataProvider is_connected_data_provider
	 *
	 * @param object|boolean $blog_token The blog token. False if the blog token does not exist.
	 * @param int|boolean    $blog_id The blog id. False if the blog id does not exist.
	 * @param boolean        $expected_output The expected output.
	 */
	#[DataProvider( 'is_connected_data_provider' )]
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
	public static function is_connected_data_provider() {

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
		$limited   = $this->manager->get_connected_users( 'any', 1 );

		$this->assertCount( 2, $all_users );
		$this->assertCount( 1, $admins );
		$this->assertCount( 1, $limited );
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
	#[DataProvider( 'get_access_token_data_provider' )]
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
			$user_id_query = true;
		}

		$token = ( new Tokens() )->get_access_token( $user_id_query, $token_key_query, false );

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
	public static function get_access_token_data_provider() {
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
			'no tokens, has user_id'           => array(
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
		$this->assertFalse( ( new Tokens() )->get_access_token( 123 ) );
		$this->assertInstanceOf( 'WP_Error', ( new Tokens() )->get_access_token( 123, '', false ) );
	}

	/**
	 * Test the `is_site_connection' method.
	 *
	 * @dataProvider data_provider_for_test_is_site_connection
	 *
	 * @param boolean $is_connected              If the blog is connected.
	 * @param boolean $has_connected_user        If the blog has a connected user.
	 * @param boolean $master_user_option_is_set If the master_user option is set.
	 * @param boolean $expected                  The expected output.
	 */
	#[DataProvider( 'data_provider_for_test_is_site_connection' )]
	public function test_is_site_connection( $is_connected, $has_connected_user, $master_user_option_is_set, $expected ) {
		$id_admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);

		if ( $is_connected ) {
			\Jetpack_Options::update_option( 'id', 1234 );
			\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		} else {
			\Jetpack_Options::delete_option( 'blog_token' );
			\Jetpack_Options::delete_option( 'id' );
		}

		if ( $has_connected_user ) {
			\Jetpack_Options::update_option(
				'user_tokens',
				array(
					$id_admin => 'asd123',
				)
			);
		} else {
			\Jetpack_Options::delete_option( 'user_tokens' );
		}

		if ( $master_user_option_is_set ) {
			\Jetpack_Options::update_option( 'master_user', $id_admin );
		} else {
			\Jetpack_Options::delete_option( 'master_user' );
		}

		$this->assertEquals( $expected, $this->manager->is_site_connection() );
	}

	/**
	 * Data provider for test_is_site_connection.
	 *
	 * Structure of the test data arrays:
	 *     [0] => 'is_connected'              boolean If the blog is connected.
	 *     [1] => 'has_connected_user'        boolean If the blog has a connected user.
	 *     [2] => 'master_user_option_is_set' boolean If the master_user option is set.
	 *     [3] => 'expected'                  boolean The expected output of the call to is_site_connection.
	 */
	public static function data_provider_for_test_is_site_connection() {

		return array(
			'connected, has connected_user, master_user option is set'         => array( true, true, true, false ),
			'not connected, has connected_user, master_user option is set'     => array( false, true, true, false ),
			'connected, no connected_user, master_user option is set'          => array( true, false, true, false ),
			'not connected, no connected_user, master_user option is set'      => array( false, false, true, false ),
			'not connected, has connected_user, master_user option is not set' => array( false, true, false, false ),
			'not connected, no connected_user, master_user option is not set'  => array( false, false, false, false ),
			'connected, has connected_user, master_user option is not set'     => array( true, true, false, false ),
			'connected, no connected_user, master_user option is not set'      => array( true, false, false, true ),
		);
	}

	/**
	 * Test the `try_registration()` method.
	 *
	 * @see Manager::try_registration()
	 */
	public function test_try_registration() {
		add_filter( 'pre_http_request', array( REST_Endpoints_Test::class, 'intercept_register_request' ), 10, 3 );
		set_transient( 'jetpack_assumed_site_creation_date', '2021-01-01 01:01:01' );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$result = $this->manager->try_registration();

		remove_filter( 'pre_http_request', array( REST_Endpoints_Test::class, 'intercept_register_request' ), 10 );
		delete_transient( 'jetpack_assumed_site_creation_date' );

		static::assertTrue( $result );
	}

	/**
	 * Test that User tokens behave according to expectations after attempting to disconnect a user.
	 *
	 * @dataProvider get_disconnect_user_outcomes
	 *
	 * @param bool $remote_response           Response from the unlink_user XML-RPC request.
	 * @param int  $expected_user_token_count Number of user tokens left on site after Manager::disconnect_user has completed.
	 */
	#[DataProvider( 'get_disconnect_user_outcomes' )]
	public function test_disconnect_user( $remote_response, $expected_user_token_count ) {
		$master_user_id = wp_insert_user(
			array(
				'user_login' => 'sample_user',
				'user_pass'  => 'asdqwe',
				'role'       => 'administrator',
			)
		);
		$editor_id      = wp_insert_user(
			array(
				'user_login' => 'editor',
				'user_pass'  => 'pass',
				'user_email' => 'editor@editor.com',
				'role'       => 'editor',
			)
		);

		if ( $remote_response ) {
			$callback = 'intercept_disconnect_success';
		} else {
			$callback = 'intercept_disconnect_failure';
		}

		add_filter(
			'pre_http_request',
			array(
				$this,
				$callback,
			),
			10,
			3
		);

		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$master_user_id => sprintf( '%s.%s.%d', 'masterkey', 'private', $master_user_id ),
				$editor_id      => sprintf( '%s.%s.%d', 'editorkey', 'private', $editor_id ),
			)
		);

		$this->manager->disconnect_user( $editor_id );

		remove_filter(
			'pre_http_request',
			array(
				$this,
				$callback,
			),
			10
		);

		$this->assertCount( $expected_user_token_count, $this->manager->get_connected_users() );
	}

	/**
	 * Intercept the disconnect user API request sent to WP.com, and mock success response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_disconnect_success( $response, $args, $url ) {
		if ( strpos( $url, 'https://jetpack.wordpress.com/xmlrpc.php' ) !== false ) {
			$response = array();

			$response['body'] = '
				<methodResponse>
					<params>
						<param>
							<value>1</value>
						</param>
					</params>
				</methodResponse>
			';

			$response['response']['code'] = 200;
			return $response;
		}

		return $response;
	}

	/**
	 * Intercept the disconnect user API request sent to WP.com, and mock failure response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_disconnect_failure( $response, $args, $url ) {
		if ( strpos( $url, 'https://jetpack.wordpress.com/xmlrpc.php' ) !== false ) {
			$response = array();

			$response['body'] = '
				<methodResponse>
					<params>
						<param>
							<value>1</value>
						</param>
					</params>
				</methodResponse>
			';

			$response['response']['code'] = 500;
			return $response;
		}

		return $response;
	}

	/**
	 * Data for test_disconnect_user
	 *
	 * @return array
	 */
	public static function get_disconnect_user_outcomes() {
		return array(
			'success' => array(
				true,
				1,
			),
			'failure' => array(
				false,
				2,
			),
		);
	}

	/**
	 * Test that registering an external storage provider after is_connected() resets the cached status.
	 */
	public function test_registering_provider_invalidates_stale_is_connected() {
		// Ensure clean state: no blog id, no token in DB.
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		$this->reset_connection_status();

		// First call: no provider, no DB data → false.
		$this->assertFalse( $this->manager->is_connected() );

		// Register a provider that supplies blog id and token.
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return in_array( $option_name, array( 'blog_token', 'id' ), true );
			}
			public function get( $option_name ) {
				if ( 'id' === $option_name ) {
					return 12345;
				}
				if ( 'blog_token' === $option_name ) {
					return 'test.token';
				}
				return null;
			}
			public function get_environment_id() {
				return 'test-invalidation';
			}
		};

		try {
			// This should fire jetpack_external_storage_provider_registered,
			// which resets the memoized is_connected value.
			External_Storage::register_provider( $provider );

			// Next call should re-evaluate with the provider and return true.
			$this->assertTrue( $this->manager->is_connected() );
		} finally {
			// Clean up: remove provider and reset init_fired.
			$reflection = new \ReflectionClass( External_Storage::class );

			$prop = $reflection->getProperty( 'provider' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$prop->setAccessible( true );
			}
			$prop->setValue( null, null );

			$init_fired = $reflection->getProperty( 'init_fired' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$init_fired->setAccessible( true );
			}
			$init_fired->setValue( null, false );

			$this->reset_connection_status();
		}
	}

	/**
	 * Set up a connected blog and user so a signed request can be built as $user_id.
	 *
	 * @param int $user_id The local user id to connect.
	 * @return int The connected user id.
	 */
	private function set_up_connected_user( $user_id = 2 ) {
		// A fully-qualified API base is required for the request URL to be signable.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blogkey.blogsecret' );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => "userkey.usersecret.$user_id" ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );

		return $user_id;
	}

	/**
	 * Intercept the outgoing request to the jetpack-wpcom-user-data endpoint and
	 * return the canned response, recording the request URL and args.
	 *
	 * @param false|array $response The preempted response.
	 * @param array       $args     The request arguments.
	 * @param string      $url      The request URL.
	 * @return false|array
	 */
	public function intercept_user_data_request( $response, $args, $url ) {
		if ( false !== strpos( $url, 'jetpack-wpcom-user-data' ) ) {
			$this->intercepted_url  = $url;
			$this->intercepted_args = $args;
			return $this->http_response;
		}

		return $response;
	}

	/**
	 * Test that `get_connected_user_data()` fetches the connected user data from the
	 * WordPress.com REST endpoint and caches the decoded payload.
	 */
	public function test_get_connected_user_data_fetches_from_rest_endpoint() {
		$user_id = $this->set_up_connected_user();

		$payload = array(
			'ID'                => 99,
			'login'             => 'wpcom_user',
			'email'             => 'wpcom@example.com',
			'display_name'      => 'WPCOM User',
			'text_direction'    => 'ltr',
			'site_count'        => 3,
			'jetpack_connect'   => '',
			'color_scheme'      => 'classic-dark',
			'sidebar_collapsed' => false,
			'user_locale'       => 'en_US',
			'user_currency'     => 'USD',
		);

		$this->http_response = array(
			'body'     => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'headers'  => array(),
		);

		add_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10, 3 );

		$result = $this->manager->get_connected_user_data( $user_id );

		$cached           = get_transient( "jetpack_connected_user_data_$user_id" );
		$requested_url    = $this->intercepted_url;
		$requested_method = $this->intercepted_args['method'] ?? null;

		remove_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10 );
		delete_transient( "jetpack_connected_user_data_$user_id" );

		$this->assertSame( $payload, $result );
		$this->assertSame( $payload, $cached );
		$this->assertStringContainsString( '/wpcom/v2/sites/1234/jetpack-wpcom-user-data', (string) $requested_url );
		$this->assertSame( 'GET', $requested_method );
	}

	/**
	 * Test that a cached transient is returned without making an HTTP request.
	 */
	public function test_get_connected_user_data_returns_cached_value() {
		$user_id = $this->set_up_connected_user();

		$cached = array(
			'ID'    => 5,
			'login' => 'cached_user',
		);
		set_transient( "jetpack_connected_user_data_$user_id", $cached, DAY_IN_SECONDS );

		add_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10, 3 );

		$result        = $this->manager->get_connected_user_data( $user_id );
		$requested_url = $this->intercepted_url;

		remove_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10 );
		delete_transient( "jetpack_connected_user_data_$user_id" );

		$this->assertSame( $cached, $result );
		// No HTTP request should have been attempted.
		$this->assertNull( $requested_url );
	}

	/**
	 * Test that a failed fetch returns false and caches an `error` sentinel, so
	 * the failing request is not repeated on every call.
	 *
	 * @dataProvider get_connected_user_data_error_responses
	 *
	 * @param array|\WP_Error $http_response The canned HTTP response for the request.
	 */
	#[DataProvider( 'get_connected_user_data_error_responses' )]
	public function test_get_connected_user_data_returns_false_on_error_response( $http_response ) {
		$user_id = $this->set_up_connected_user();

		$this->http_response = $http_response;

		add_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10, 3 );

		$result        = $this->manager->get_connected_user_data( $user_id );
		$cached        = get_transient( "jetpack_connected_user_data_$user_id" );
		$requested_url = $this->intercepted_url;

		// A repeated call must be served the cached failure without a new request.
		$this->intercepted_url = null;
		$repeat_result         = $this->manager->get_connected_user_data( $user_id );
		$repeat_requested_url  = $this->intercepted_url;

		remove_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10 );
		delete_transient( "jetpack_connected_user_data_$user_id" );

		$this->assertFalse( $result );
		$this->assertStringContainsString( 'jetpack-wpcom-user-data', (string) $requested_url );
		// Failures are cached briefly with an 'error' sentinel so a failing
		// request is not retried on every call.
		$this->assertSame( 'error', $cached );
		$this->assertFalse( $repeat_result );
		$this->assertNull( $repeat_requested_url );
	}

	/**
	 * Data provider for test_get_connected_user_data_returns_false_on_error_response.
	 *
	 * @return array
	 */
	public static function get_connected_user_data_error_responses() {
		return array(
			'transport error (WP_Error)' => array(
				new \WP_Error( 'http_request_failed', 'Request blocked.' ),
			),
			'non-200 response'           => array(
				array(
					'body'     => wp_json_encode(
						array(
							'error'   => 'unknown_token',
							'message' => 'Invalid token.',
						),
						JSON_UNESCAPED_SLASHES
					),
					'response' => array(
						'code'    => 403,
						'message' => 'Forbidden',
					),
					'headers'  => array(),
				),
			),
			'200 with malformed body'    => array(
				array(
					'body'     => 'not-json',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'headers'  => array(),
				),
			),
		);
	}

	/**
	 * Test that no request is made and false is returned when the user is not connected.
	 */
	public function test_get_connected_user_data_returns_false_when_user_not_connected() {
		add_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10, 3 );

		$result        = $this->manager->get_connected_user_data( 999 );
		$requested_url = $this->intercepted_url;

		remove_filter( 'pre_http_request', array( $this, 'intercept_user_data_request' ), 10 );

		$this->assertFalse( $result );
		// No HTTP request should have been attempted for an unconnected user.
		$this->assertNull( $requested_url );
	}
}
