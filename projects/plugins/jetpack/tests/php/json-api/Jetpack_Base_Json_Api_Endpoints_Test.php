<?php
/**
 * Jetpack_JSON_API_Endpoint class unit tests.
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=Jetpack_Base_Json_Api_Endpoints_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Generic tests for Jetpack_JSON_API_Endpoint.
 *
 * @covers \Jetpack_JSON_API_Endpoint
 */
#[CoversClass( Jetpack_JSON_API_Endpoint::class )]
class Jetpack_Base_Json_Api_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A super admin user used for test.
	 *
	 * @var int
	 */
	private static $super_admin_user_id;

	/**
	 * Alternative super admin user used for test.
	 *
	 * @var int
	 */
	private static $super_admin_alt_user_id;

	/**
	 * A contributor user used for test.
	 *
	 * @var int
	 */
	private static $contributor_user_id;

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$super_admin_user_id     = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$super_admin_alt_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$contributor_user_id     = $factory->user->create(
			array(
				'user_login'    => 'john_doe',
				'user_pass'     => 'password123',
				'user_nicename' => 'John Doe',
				'user_email'    => 'john.doe@example.com',
				'user_url'      => 'https://example.com',
				'display_name'  => 'John Doe',
				'nickname'      => 'Johnny',
				'first_name'    => 'John',
				'last_name'     => 'Doe',
				'description'   => 'This is a dummy user for testing.',
				'role'          => 'contributor',
			)
		);
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		delete_user_meta( self::$super_admin_user_id, 'user_id' );

		parent::tear_down();
	}

	/**
	 * @author zaerl
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_should_trigger_error_if_a_user_not_exists() {
		// Force the error handler to return null.
		set_error_handler( '__return_null' );
		try {
			$endpoint = $this->get_dummy_endpoint();
			$author   = $endpoint->get_author( 0 );

			$this->assertNull( $author );
		} finally {
			restore_error_handler();
		}
	}

	/**
	 * @author zaerl
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_should_return_the_same_user() {
		$endpoint = $this->get_dummy_endpoint();
		$author   = $endpoint->get_author( self::$super_admin_user_id );

		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );
	}

	/**
	 * @author zaerl
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_should_return_the_same_user_if_user_meta_is_set() {
		$endpoint = $this->get_dummy_endpoint();

		// Force a 'user_id' pointing to another user in the user meta.
		add_user_meta( self::$super_admin_user_id, 'user_id', self::$super_admin_alt_user_id );

		$user   = get_user_by( 'id', self::$super_admin_user_id );
		$author = $endpoint->get_author( self::$super_admin_user_id );

		// Check that __get magic method is working.
		$this->assertSame( self::$super_admin_alt_user_id, (int) $user->user_id );

		// The user should be the same as the one passed to the method.
		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );

		$author = $endpoint->get_author( $user );

		// The user should be the same as the one passed as object to the method.
		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );
	}

	/**
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_should_provide_additional_data_when_user_id_is_specified() {
		$endpoint                            = $this->get_dummy_endpoint();
		$commment_data                       = new stdClass();
		$commment_data->comment_author_email = 'foo@bar.foo';
		$commment_data->comment_author       = 'John Doe';
		$commment_data->comment_author_url   = 'https://foo.bar.foo';
		$commment_data->user_id              = static::$contributor_user_id;
		$comment                             = new WP_Comment( $commment_data );

		$author = $endpoint->get_author( $comment, true );

		$this->assertIsObject( $author, 'The returned author should be an object.' );
		$this->assertNotNull( $author, 'The returned author should not be null.' );
		$this->assertSame(
			$commment_data->comment_author_email,
			$author->email,
			'The author email does not match the expected comment author email.'
		);
		$this->assertSame(
			$commment_data->comment_author,
			$author->name,
			'The author name does not match the expected comment author name.'
		);
		$this->assertSame(
			$commment_data->comment_author_url,
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'The author URL does not match the expected comment author URL.'
		);

		$user = get_user_by( 'id', static::$contributor_user_id );

		// The user should be the same as the one passed as object to the method.
		$this->assertSame(
			static::$contributor_user_id,
			$author->ID,
			'The author ID does not match the expected user ID.'
		);
		$this->assertSame(
			$user->user_login,
			$author->login,
			'The author login does not match the expected user login.'
		);
		$this->assertSame(
			$user->first_name,
			$author->first_name,
			'The author first name does not match the expected first name.'
		);
		$this->assertSame(
			$user->last_name,
			$author->last_name,
			'The author last name does not match the expected last name.'
		);
		$this->assertSame(
			$user->user_nicename,
			$author->nice_name,
			'The author nicename does not match the expected nicename.'
		);
	}

	/**
	 * Test get_author returns hashed email profile_URL for anonymous comment authors (user_id=0).
	 *
	 * This verifies the $id > 0 guard on the IS_WPCOM branch: anonymous comment authors
	 * should always get a hashed-email profile URL instead of an incomplete login-based one.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_anonymous_comment_author_gets_hashed_email_profile_url() {
		$endpoint = $this->get_dummy_endpoint();

		$comment_data                       = new stdClass();
		$comment_data->comment_author_email = 'anonymous@example.com';
		$comment_data->comment_author       = 'Anonymous Visitor';
		$comment_data->comment_author_url   = 'https://example.com';
		$comment_data->user_id              = 0;
		$comment_data->comment_author_IP    = '127.0.0.1';

		$comment = new WP_Comment( $comment_data );

		$author = $endpoint->get_author( $comment );

		$expected_profile_url = 'https://gravatar.com/' . md5( strtolower( trim( 'anonymous@example.com' ) ) );
		$this->assertSame(
			$expected_profile_url,
			$author->profile_URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'Anonymous comment author (user_id=0) should get a hashed-email profile URL.'
		);
	}

	/**
	 * Test get_author converts Gravatar URLs containing an email to the hashed version.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_converts_gravatar_email_url_to_hash() {
		$endpoint = $this->get_dummy_endpoint();

		$comment_data                       = new stdClass();
		$comment_data->comment_author_email = 'foo@bar.foo';
		$comment_data->comment_author       = 'Test Author';
		$comment_data->comment_author_url   = 'https://gravatar.com/foo@bar.foo';
		$comment_data->user_id              = 0;
		$comment_data->comment_author_IP    = '';

		$comment = new WP_Comment( $comment_data );

		$author = $endpoint->get_author( $comment );

		$expected_url = 'https://gravatar.com/' . md5( 'foo@bar.foo' );
		$this->assertSame(
			$expected_url,
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'Gravatar URL with email should be converted to hashed version.'
		);
	}

	/**
	 * Test get_author does not modify Gravatar URLs that already use a hash.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_preserves_gravatar_hash_url() {
		$hash     = md5( 'foo@bar.foo' );
		$endpoint = $this->get_dummy_endpoint();

		$comment_data                       = new stdClass();
		$comment_data->comment_author_email = 'foo@bar.foo';
		$comment_data->comment_author       = 'Test Author';
		$comment_data->comment_author_url   = 'https://gravatar.com/' . $hash;
		$comment_data->user_id              = 0;
		$comment_data->comment_author_IP    = '';

		$comment = new WP_Comment( $comment_data );

		$author = $endpoint->get_author( $comment );

		$this->assertSame(
			'https://gravatar.com/' . $hash,
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'Gravatar URL with hash should not be modified.'
		);
	}

	/**
	 * Test get_author does not modify non-Gravatar URLs.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_preserves_non_gravatar_url() {
		$endpoint = $this->get_dummy_endpoint();

		$comment_data                       = new stdClass();
		$comment_data->comment_author_email = 'foo@bar.foo';
		$comment_data->comment_author       = 'Test Author';
		$comment_data->comment_author_url   = 'https://example.com/profile';
		$comment_data->user_id              = 0;
		$comment_data->comment_author_IP    = '';

		$comment = new WP_Comment( $comment_data );

		$author = $endpoint->get_author( $comment );

		$this->assertSame(
			'https://example.com/profile',
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'Non-Gravatar URLs should not be modified.'
		);
	}

	/**
	 * Test get_author does not modify Gravatar URLs with a non-email username path.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_preserves_gravatar_username_url() {
		$endpoint = $this->get_dummy_endpoint();

		$comment_data                       = new stdClass();
		$comment_data->comment_author_email = 'foo@bar.foo';
		$comment_data->comment_author       = 'Test Author';
		$comment_data->comment_author_url   = 'https://gravatar.com/johndoe';
		$comment_data->user_id              = 0;
		$comment_data->comment_author_IP    = '';

		$comment = new WP_Comment( $comment_data );

		$author = $endpoint->get_author( $comment );

		$this->assertSame(
			'https://gravatar.com/johndoe',
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'Gravatar URL with username (not email) should not be modified.'
		);
	}

	/**
	 * Test get_author populates wpcom_id from Highlander WordPress.com-source comment meta on Jetpack sites.
	 *
	 * On a self-hosted Jetpack-connected site, commenters who authenticate via the WordPress.com
	 * tab in the Highlander comment form have their WordPress.com user ID stored as the
	 * `hc_foreign_user_id` comment meta. The Reader needs `wpcom_id` in the API response so it
	 * can build an in-Reader profile link via the existing user-profile lookup.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_populates_wpcom_id_from_highlander_wordpress_meta() {
		$endpoint = $this->get_dummy_endpoint_with_wpcom_data();

		$comment_id = self::factory()->comment->create(
			array(
				'comment_author'       => 'A WPCOM Commenter',
				'comment_author_email' => 'wpcom-commenter@example.com',
				'comment_author_url'   => 'https://commenter.example/',
				'user_id'              => 0,
			)
		);
		add_comment_meta( $comment_id, 'hc_post_as', 'wordpress' ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Highlander uses lowercase 'wordpress' as the identity-source key.
		add_comment_meta( $comment_id, 'hc_foreign_user_id', 123456 );

		$author = $endpoint->get_author( get_comment( $comment_id ) );

		$this->assertSame(
			123456,
			$author->wpcom_id,
			'wpcom_id should be populated from hc_foreign_user_id when hc_post_as is the WordPress.com source.'
		);
	}

	/**
	 * Test get_author does not surface a 'jetpack' Highlander foreign user ID as wpcom_id.
	 *
	 * `hc_post_as = 'jetpack'` indicates the commenter was logged in to the local Jetpack site
	 * (not authenticated against WordPress.com), so `hc_foreign_user_id` holds the local site
	 * user ID — not a WordPress.com one. It also has no signature stored alongside it. Surfacing
	 * it as wpcom_id would let the Reader link to an unrelated WordPress.com user account.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_does_not_populate_wpcom_id_for_jetpack_post_as() {
		$endpoint = $this->get_dummy_endpoint_with_wpcom_data();

		$comment_id = self::factory()->comment->create(
			array(
				'comment_author'       => 'A Jetpack Commenter',
				'comment_author_email' => 'jp-commenter@example.com',
				'user_id'              => 0,
			)
		);
		add_comment_meta( $comment_id, 'hc_post_as', 'jetpack' );
		add_comment_meta( $comment_id, 'hc_foreign_user_id', 7891011 );

		$author = $endpoint->get_author( get_comment( $comment_id ) );

		$this->assertObjectNotHasProperty(
			'wpcom_id',
			$author,
			'wpcom_id must not be set when hc_post_as is jetpack (the foreign ID is a local site user ID, not a WordPress.com ID).'
		);
	}

	/**
	 * Test get_author does not treat a Facebook foreign user ID as a wpcom_id.
	 *
	 * `hc_foreign_user_id` is reused across identity providers; for Facebook commenters it holds
	 * a Facebook user ID, not a WordPress.com one, and must not leak into wpcom_id.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_does_not_populate_wpcom_id_for_facebook_post_as() {
		$endpoint = $this->get_dummy_endpoint_with_wpcom_data();

		$comment_id = self::factory()->comment->create(
			array(
				'comment_author'       => 'A Facebook Commenter',
				'comment_author_email' => 'fb-commenter@example.com',
				'user_id'              => 0,
			)
		);
		add_comment_meta( $comment_id, 'hc_post_as', 'facebook' );
		add_comment_meta( $comment_id, 'hc_foreign_user_id', 999 );

		$author = $endpoint->get_author( get_comment( $comment_id ) );

		$this->assertObjectNotHasProperty(
			'wpcom_id',
			$author,
			'wpcom_id must not be set when hc_post_as is facebook (the foreign ID is not a WordPress.com ID).'
		);
	}

	/**
	 * Test get_author leaves wpcom_id absent for guest commenters without Highlander meta.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_leaves_wpcom_id_unset_without_highlander_meta() {
		$endpoint = $this->get_dummy_endpoint_with_wpcom_data();

		$comment_id = self::factory()->comment->create(
			array(
				'comment_author'       => 'A Guest',
				'comment_author_email' => 'guest@example.com',
				'user_id'              => 0,
			)
		);

		$author = $endpoint->get_author( get_comment( $comment_id ) );

		$this->assertObjectNotHasProperty(
			'wpcom_id',
			$author,
			'wpcom_id must not be set for a guest commenter with no Highlander meta.'
		);
	}

	/**
	 * Test get_author does not surface wpcom_id when author_wpcom_data is not requested.
	 *
	 * Regression check: the wpcom-data block must stay gated on the `author_wpcom_data`
	 * query argument, even when the comment has the Highlander meta available locally.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_get_author_skips_wpcom_id_when_author_wpcom_data_not_requested() {
		$endpoint = $this->get_dummy_endpoint();

		$comment_id = self::factory()->comment->create(
			array(
				'comment_author'       => 'A WPCOM Commenter',
				'comment_author_email' => 'wpcom-commenter@example.com',
				'user_id'              => 0,
			)
		);
		add_comment_meta( $comment_id, 'hc_post_as', 'wordpress' ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Highlander uses lowercase 'wordpress' as the identity-source key.
		add_comment_meta( $comment_id, 'hc_foreign_user_id', 5555 );

		$author = $endpoint->get_author( get_comment( $comment_id ) );

		$this->assertObjectNotHasProperty(
			'wpcom_id',
			$author,
			'wpcom_id must not appear when author_wpcom_data is not in the query args.'
		);
	}

	/**
	 * Generate a dummy endpoint.
	 */
	private function get_dummy_endpoint() {
		$endpoint = new Jetpack_JSON_API_Dummy_Base_Endpoint(
			array(
				'stat' => 'dummy',
			)
		);

		return $endpoint;
	}

	/**
	 * Generate a dummy endpoint that forces author_wpcom_data on for the wpcom-data branch.
	 */
	private function get_dummy_endpoint_with_wpcom_data() {
		return new Jetpack_JSON_API_Dummy_Endpoint_With_Wpcom_Data(
			array(
				'stat' => 'dummy',
			)
		);
	}
}

/**
 * Dummy endpoint for testing.
 */
class Jetpack_JSON_API_Dummy_Base_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * Dummy result.
	 */
	public function result() {
		return 'success';
	}
}

/**
 * Dummy endpoint that always reports author_wpcom_data=true in its query args, used to exercise
 * the wpcom-data branch of get_author without setting up the full request pipeline.
 */
class Jetpack_JSON_API_Dummy_Endpoint_With_Wpcom_Data extends Jetpack_JSON_API_Dummy_Base_Endpoint {
	/**
	 * Force author_wpcom_data on regardless of the actual incoming query.
	 *
	 * @param bool $return_default_values Unused.
	 * @param bool $cast_and_filter Unused.
	 * @return array
	 */
	public function query_args( $return_default_values = true, $cast_and_filter = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( 'author_wpcom_data' => true );
	}
}
