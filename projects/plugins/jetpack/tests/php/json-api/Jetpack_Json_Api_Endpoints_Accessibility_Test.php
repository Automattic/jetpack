<?php
/**
 * Generic tests for Jetpack_JSON_API_Endpoint accessibility.
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

if ( defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/module-extras.php';
}

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Generic tests for Jetpack_JSON_API_Endpoint accessibility.
 *
 * @covers \Jetpack_JSON_API_Endpoint
 * @covers \WPCOM_JSON_API
 * @covers \WPCOM_JSON_API_Endpoint
 */
#[CoversClass( Jetpack_JSON_API_Endpoint::class )]
#[CoversClass( WPCOM_JSON_API::class )]
#[CoversClass( WPCOM_JSON_API_Endpoint::class )]
class Jetpack_Json_Api_Endpoints_Accessibility_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * An admin user_id.
	 *
	 * @var int $admin_user_id.
	 */
	private static $admin_user_id;
	/**
	 * The user_id of a user without read capabilities.
	 *
	 * @var int $no_read_user_id.
	 */
	private static $no_read_user_id;
	/**
	 * A low-privileged (subscriber) user_id.
	 *
	 * @var int $subscriber_user_id.
	 */
	private static $subscriber_user_id;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$no_read_user_id    = $factory->user->create();
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		$no_read_user = get_user_by( 'id', self::$no_read_user_id );
		$no_read_user->add_cap( 'read', false );
	}

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 *  Called before every test.
	 */
	public function set_up() {
		parent::set_up();

		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		$this->set_globals();

		// Initialize some missing stuff for the API.
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Tests accepts_site_based_authentication method.
	 *
	 * @author fgiannar
	 * @group json-api
	 * @dataProvider data_provider_test_accepts_site_based_authentication
	 *
	 * @param bool $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool $is_user_logged_in If a user is logged in.
	 * @param bool $result The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_accepts_site_based_authentication' )]
	public function test_accepts_site_based_authentication( $allow_jetpack_site_auth, $is_user_logged_in, $result ) {

		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( $is_user_logged_in ) {
			wp_set_current_user( self::$admin_user_id );
		}

		$this->assertEquals( $result, $endpoint->accepts_site_based_authentication() );
	}

	/**
	 * Tests api accessibility on a private site.
	 *
	 * @author fgiannar
	 * @group json-api
	 * @dataProvider data_provider_test_private_site_accessibility
	 *
	 * @param bool            $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool            $use_blog_token If we should simulate a blog token for this test.
	 * @param bool            $user_can_read If the current user has read capability. When a blog token is used this has no effect.
	 * @param WP_Error|string $result The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_private_site_accessibility' )]
	public function test_private_site_accessibility( $allow_jetpack_site_auth, $use_blog_token, $user_can_read, $result ) {
		StatusCache::clear();
		// Private site.
		add_filter( 'jetpack_is_private_site', '__return_true' );
		update_option( 'blog_public', '-1' );

		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( ! $use_blog_token ) {
			$user_id = $user_can_read ? self::$admin_user_id : self::$no_read_user_id;
			wp_set_current_user( $user_id );
		}
		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );

		remove_filter( 'jetpack_is_private_site', '__return_true' );
		StatusCache::clear();
	}

	/**
	 * Tests endpoint capabilities.
	 *
	 * @author fgiannar
	 * @group json-api
	 * @dataProvider data_provider_test_endpoint_capabilities
	 *
	 * @param bool            $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool            $use_blog_token If we should simulate a blog token for this test.
	 * @param bool            $user_with_permissions If the current user has the needed capabilities to access the endpoint. When a blog token is used this has no effect.
	 * @param WP_Error|string $result The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_endpoint_capabilities' )]
	public function test_endpoint_capabilities( $allow_jetpack_site_auth, $use_blog_token, $user_with_permissions, $result ) {
		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( ! $use_blog_token ) {
			$user_id = $user_with_permissions ? self::$admin_user_id : self::$no_read_user_id;
			wp_set_current_user( $user_id );
		}
		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * An endpoint that declares no required capabilities (like the Backup helper-script
	 * endpoints) must only be reachable with a Jetpack blog token (site-based auth). A
	 * low-privileged connected user token must be rejected with a 403.
	 *
	 * Regression test for the empty-capabilities authorization bypass: an empty
	 * `$needed_capabilities` array previously made `check_capability()` pass for any
	 * connected user token, letting a low-privileged user reach site-token-only endpoints.
	 *
	 * @group json-api
	 * @dataProvider data_provider_test_empty_capabilities_requires_site_auth
	 *
	 * @param bool            $use_blog_token If we should simulate a blog token for this test.
	 * @param WP_Error|string $result         The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_empty_capabilities_requires_site_auth' )]
	public function test_empty_capabilities_requires_site_auth( $use_blog_token, $result ) {
		$endpoint = new Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => true,
			)
		);

		if ( ! $use_blog_token ) {
			wp_set_current_user( self::$subscriber_user_id );
		}

		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Data provider for test_empty_capabilities_requires_site_auth.
	 *
	 * Note the 'blog token is accepted' row short-circuits at accepts_site_based_authentication()
	 * before reaching the guard, so it passes with or without the guard. It is here to prove
	 * legitimate access still works, not as evidence that the guard denies anything.
	 */
	public static function data_provider_test_empty_capabilities_requires_site_auth() {
		return array(
			'blog token is accepted'          => array( true, 'success' ),
			'low-priv user token is rejected' => array( false, new WP_Error( 'unauthorized_site_token_required', 'This endpoint is only accessible using a Jetpack site token.', 403 ) ),
		);
	}

	/**
	 * The deny is privilege-independent by design: a capability-less endpoint is a site-token
	 * endpoint, so an administrator's user token is rejected exactly like a subscriber's.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_empty_capabilities_rejects_administrator_token() {
		$endpoint = new Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => true,
			)
		);

		wp_set_current_user( self::$admin_user_id );

		$this->assertEquals(
			new WP_Error( 'unauthorized_site_token_required', 'This endpoint is only accessible using a Jetpack site token.', 403 ),
			$endpoint->api->process_request( $endpoint, array() )
		);
	}

	/**
	 * Capability declarations that resolve to "authorize unconditionally" must be denied, not just
	 * the literal empty array. Three shapes reach the same fail-open as the original bug: a resolved
	 * capability set that is empty (including scalar forms that skip the is_array() branch), an entry
	 * that is not a capability name and so resolves to a legacy user level every role holds, and a
	 * `must_pass` threshold below 1, which makes `$passed < $must_pass` false for every user.
	 *
	 * @group json-api
	 * @dataProvider data_provider_test_zero_threshold_declarations_are_denied
	 *
	 * @param mixed    $needed_capabilities The capability declaration to install on the endpoint.
	 * @param WP_Error $result              The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_zero_threshold_declarations_are_denied' )]
	public function test_zero_threshold_declarations_are_denied( $needed_capabilities, $result ) {
		$endpoint = new Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => true,
			)
		);

		$property = ( new ReflectionClass( $endpoint ) )->getProperty( 'needed_capabilities' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $endpoint, $needed_capabilities );

		wp_set_current_user( self::$subscriber_user_id );

		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Data provider for test_zero_threshold_declarations_are_denied.
	 */
	public static function data_provider_test_zero_threshold_declarations_are_denied() {
		$site_token_required = new WP_Error( 'unauthorized_site_token_required', 'This endpoint is only accessible using a Jetpack site token.', 403 );
		$threshold           = new WP_Error( 'unauthorized_capability_threshold', 'This endpoint requires at least one capability check to pass.', 403 );
		$declaration         = new WP_Error( 'unauthorized_capability_declaration', 'This endpoint does not declare a valid capability requirement.', 403 );

		return array(
			// Resolved-empty capability sets. Only the numeric forms were fail-open before this fix;
			// null and the empty string already denied, but with the generic 'unauthorized' code.
			'structured wrapper with an empty list'       => array( array( 'capabilities' => array() ), $site_token_required ),
			'null (the base class default)'               => array( null, $site_token_required ),
			'empty string'                                => array( '', $site_token_required ),
			'integer zero'                                => array( 0, $site_token_required ),
			'string zero'                                 => array( '0', $site_token_required ),
			// Non-string entries survive the emptiness check but resolve to legacy user levels:
			// current_user_can( 0 ) checks level_0, which every default role holds.
			'nested integer zero'                         => array( array( 0 ), $declaration ),
			'nested string zero'                          => array( array( '0' ), $declaration ),
			'nested empty string'                         => array( array( '' ), $declaration ),
			// No 'capabilities' key, so the wrapper's own metadata is what gets capability-checked.
			'wrapper with no capabilities key'            => array( array( 'must_pass' => 0 ), $declaration ),
			// Zero thresholds over a non-empty list.
			'must_pass of 0 over a real list'             => array(
				array(
					'capabilities' => array( 'manage_options' ),
					'must_pass'    => 0,
				),
				$threshold,
			),
			'negative must_pass over a real list'         => array(
				array(
					'capabilities' => array( 'manage_options' ),
					'must_pass'    => -1,
				),
				$threshold,
			),
			// Sanity rows: these are GREEN on trunk too. They prove the new guards did not swallow the
			// ordinary capability path, not that anything is newly denied.
			'real capability still denies a subscriber'   => array(
				array( 'manage_options' ),
				new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 ),
			),
			'scalar capability still denies a subscriber' => array(
				'manage_options',
				new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 ),
			),
		);
	}

	/**
	 * The threshold guard must sit below the accepts_site_based_authentication() short-circuit, exactly
	 * like the emptiness guard. Without this row a refactor that hoisted both guards above the
	 * short-circuit would 403 legitimate blog-token traffic with the rest of the suite still green.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_zero_threshold_still_accepts_a_blog_token() {
		$endpoint = new Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => true,
			)
		);

		$property = ( new ReflectionClass( $endpoint ) )->getProperty( 'needed_capabilities' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue(
			$endpoint,
			array(
				'capabilities' => array( 'manage_options' ),
				'must_pass'    => 0,
			)
		);

		// No current user, so is_jetpack_authorized_for_site() stands in for blog-token auth.
		$this->assertEquals( 'success', $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Every production endpoint that declares no capabilities is now unreachable without site-based
	 * authentication, so each one must be registered with `allow_jetpack_site_auth => true` or it is
	 * permanently 403. Nothing links the declaration to the registration, so assert the pairing.
	 *
	 * This test is GREEN on trunk as well -- all eight endpoints already carried the flag. It is a
	 * forward-looking invariant for the newly mandatory pairing, not evidence of a fixed regression.
	 * It only covers endpoints registered from this repository: under `IS_WPCOM` the endpoint
	 * directory is loaded from the WordPress.com tree and neither those registrations nor that copy
	 * of the guard are visible here.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_capability_less_endpoints_register_site_auth() {
		$json_endpoints_dir = JETPACK__PLUGIN_DIR . 'json-endpoints/';
		$checked            = 0;

		foreach ( WPCOM_JSON_API::init()->endpoints as $endpoints_by_method ) {
			if ( ! is_array( $endpoints_by_method ) ) {
				continue;
			}
			foreach ( $endpoints_by_method as $endpoint ) {
				if ( ! $endpoint instanceof Jetpack_JSON_API_Endpoint ) {
					continue;
				}

				$class = new ReflectionClass( $endpoint );

				// Skip the dummy endpoints defined in this test file; the endpoint constructor
				// registers every instance, so they would otherwise leak in by test order.
				if ( strpos( (string) $class->getFileName(), $json_endpoints_dir ) !== 0 ) {
					continue;
				}

				// The pairing only binds for endpoints that reach check_capability() with the property
				// as declared. This carve-out is load-bearing for exactly one class:
				// Jetpack_JSON_API_Check_Capabilities_Endpoint, which overrides callback() to hand-pass
				// 'read', never consults $needed_capabilities, and is registered without the site-auth
				// flag -- so its unset default is not a site-token declaration. It is expressed as a
				// mechanism rather than a name so a future endpoint in the same shape is covered too;
				// note that overriding callback() does not by itself mean bypassing this path, as
				// Jetpack_JSON_API_Plugins_Modify_Endpoint assigns a real capability and then delegates
				// to parent::callback().
				if ( $class->getMethod( 'callback' )->getDeclaringClass()->getName() !== Jetpack_JSON_API_Endpoint::class ) {
					continue;
				}

				$property = $class->getProperty( 'needed_capabilities' );
				if ( PHP_VERSION_ID < 80100 ) {
					$property->setAccessible( true );
				}
				$capabilities = $property->getValue( $endpoint );
				if ( is_array( $capabilities ) ) {
					$capabilities = $capabilities['capabilities'] ?? $capabilities;
				}
				if ( ! empty( $capabilities ) ) {
					continue;
				}

				++$checked;
				$this->assertTrue(
					$endpoint->allow_jetpack_site_auth,
					$class->getName() . ' declares no capabilities, so it is only reachable with a site token and must be registered with allow_jetpack_site_auth => true.'
				);
			}
		}

		$this->assertGreaterThan( 0, $checked, 'Expected at least one capability-less endpoint in the registry; the assertion loop above ran on nothing.' );
	}

	/**
	 * Data provider for test_accepts_site_based_authentication.
	 */
	public static function data_provider_test_accepts_site_based_authentication() {
		return array(
			'allow_jetpack_site_auth: true; logged_in_user: false;'  => array( true, false, true ),
			'allow_jetpack_site_auth: false; logged_in_user: false;' => array( false, false, false ),
			'allow_jetpack_site_auth: true; logged_in_user: true;'   => array( true, true, false ),
		);
	}

	/**
	 * Data provider for test_private_site_accessibility.
	 */
	public static function data_provider_test_private_site_accessibility() {
		$success = 'success';
		$error   = new WP_Error( 'unauthorized', 'User cannot access this private blog.', 403 );

		return array(
			'allow_jetpack_site_auth: true; blog_token: true; can_read: null'   => array( true, true, null, $success ),
			'allow_jetpack_site_auth: false; blog_token: true; can_read: null'   => array( false, true, null, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; can_read: false'   => array( false, false, false, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; can_read: true'   => array( false, false, true, $success ),
		);
	}

	/**
	 * Data provider for test_endpoint_capabilities.
	 */
	public static function data_provider_test_endpoint_capabilities() {
		$success = 'success';
		$error   = new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 );

		return array(
			'allow_jetpack_site_auth: true; blog_token: true; user_with_permissions: null'   => array( true, true, null, $success ),
			'allow_jetpack_site_auth: false; blog_token: true; user_with_permissions: null'   => array( false, true, null, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; user_with_permissions: false'   => array( false, false, false, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; user_with_permissions: true'   => array( false, false, true, $success ),
		);
	}
}

/**
 * Dummy endpoint for testing.
 */
class Jetpack_JSON_API_Dummy_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * Only accessible to admins.
	 *
	 * @var array|string
	 */
	protected $needed_capabilities = 'manage_options';

	/**
	 * Dummy result.
	 */
	public function result() {

		return 'success';
	}
}

/**
 * Dummy endpoint that declares no required capabilities, mirroring the Backup
 * helper-script endpoints. Intended to be reachable only with a blog token.
 */
class Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * No capabilities required; site-token-only endpoint.
	 *
	 * @var array
	 */
	protected $needed_capabilities = array();

	/**
	 * Dummy result.
	 */
	public function result() {

		return 'success';
	}
}
