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
	 * Builds a capability-less dummy endpoint and installs a declaration on it.
	 *
	 * `$needed_capabilities` is protected, and these tests need to install shapes no production
	 * endpoint declares, so reflection is the only way in. Kept in one place so the
	 * `PHP_VERSION_ID` branch (setAccessible() became a no-op in 8.1) has a single call site.
	 *
	 * @param mixed $needed_capabilities The capability declaration to install.
	 *
	 * @return Jetpack_JSON_API_Empty_Capabilities_Dummy_Endpoint
	 */
	private function endpoint_declaring( $needed_capabilities ) {
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

		return $endpoint;
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
		$endpoint = $this->endpoint_declaring( $needed_capabilities );

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
			// Resolved-empty capability sets. The numeric forms were fail-open everywhere before this
			// fix; null and the empty string denied on single-site (which is what this suite runs) but
			// passed for a network super admin on multisite, because WP_User::has_cap() returns true for
			// a super admin whenever the mapped capabilities contain no 'do_not_allow'.
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
			// Whitespace-only names no capability, and core grants a network super admin anything it
			// cannot map to 'do_not_allow', so the guard rejects on the canonical value rather than on ''.
			'nested whitespace-only string'               => array( array( ' ' ), $declaration ),
			'scalar whitespace-only string'               => array( ' ', $declaration ),
			// PHP's byte-wise trim() strips neither the form feed nor any multibyte separator, so a
			// declaration made only of those would otherwise reach current_user_can() as an unmappable
			// name -- granted outright to a network super admin.
			'nested form feed only'                       => array( array( "\x0C" ), $declaration ),
			'nested no-break space only'                  => array( array( "\xC2\xA0" ), $declaration ),
			'nested ideographic space only'               => array( array( "\xE3\x80\x80" ), $declaration ),
			'nested byte order mark only'                 => array( array( "\xEF\xBB\xBF" ), $declaration ),
			'nested invalid UTF-8'                        => array( array( "\xC3\x28" ), $declaration ),
			// Padding around a real name is rejected rather than stripped: 'read ' is not the capability
			// 'read', and accepting it would make the declaration and the check disagree.
			'nested trailing whitespace'                  => array( array( 'read ' ), $declaration ),
			'nested leading whitespace'                   => array( array( ' read' ), $declaration ),
			// Also what keeps the numeric rejection matrix-stable: is_numeric( '0 ' ) is false before
			// PHP 8.0 and true from 8.0 on, so only the canonical comparison denies it on every version.
			'nested padded zero'                          => array( array( '0 ' ), $declaration ),
			// No 'capabilities' key, so the wrapper's own metadata is what gets capability-checked. That
			// only reaches this guard when the metadata is not capability-shaped; see the wrapper test
			// below for the string-valued case, which is indistinguishable from an ordinary list.
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
			// A scalar under the 'capabilities' key is the one shape this refactor makes less strict:
			// on trunk it never reached a capability check at all (count() on a string warned to 1 and
			// the foreach body never ran on PHP 7.x, and count() threw a TypeError on PHP 8+). It now
			// normalizes to a one-element list and runs the real check, so it can authorize a user who
			// holds the capability. No declaration in this repository uses the shape; this row pins it
			// to an ordinary capability check rather than to either fail-open or a fatal.
			'scalar under the capabilities key still denies a subscriber' => array(
				array( 'capabilities' => 'manage_options' ),
				new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 ),
			),
		);
	}

	/**
	 * The deny-side rows above cover the wrapper shapes that must be rejected. These are the wrapper
	 * shapes that instead reach a real capability check, pinned in both directions: authorized for a
	 * capability the subscriber fixture holds (`read`), denied for one it does not (`manage_options`).
	 * Without the authorized rows a regression that denied every wrapper declaration would leave the
	 * suite green; without the deny row, one that authorized every wrapper unconditionally would.
	 * Neither shape is used by any declaration in this repository; these rows fix the contract rather
	 * than endorse the shapes.
	 *
	 * @group json-api
	 * @dataProvider data_provider_test_wrapper_shapes_reach_an_ordinary_capability_check
	 *
	 * @param array           $needed_capabilities The capability declaration to install on the endpoint.
	 * @param WP_Error|string $result              The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_wrapper_shapes_reach_an_ordinary_capability_check' )]
	public function test_wrapper_shapes_reach_an_ordinary_capability_check( $needed_capabilities, $result ) {
		$endpoint = $this->endpoint_declaring( $needed_capabilities );

		wp_set_current_user( self::$subscriber_user_id );

		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Data provider for test_wrapper_shapes_reach_an_ordinary_capability_check.
	 */
	public static function data_provider_test_wrapper_shapes_reach_an_ordinary_capability_check() {
		return array(
			// The scalar-under-'capabilities' shape is the one this refactor makes less strict: on trunk
			// it never reached a capability check at all. It now normalizes to a one-element list, so it
			// must authorize a holder and deny a non-holder (the deny half is pinned in the provider
			// above).
			'scalar under the capabilities key authorizes a holder' => array(
				array( 'capabilities' => 'read' ),
				'success',
			),
			// A wrapper with no 'capabilities' key resolves to its own metadata. A string value there is
			// indistinguishable from the list array( 'read' ), so it gets an ordinary capability check
			// rather than the declaration deny. This predates the refactor; the rows state it plainly so
			// the guard's contract is not read as "every wrapper missing 'capabilities' fails closed".
			'string-valued wrapper metadata is capability-checked'  => array(
				array( 'must_pass' => 'read' ),
				'success',
			),
			'string-valued wrapper metadata still denies'           => array(
				array( 'must_pass' => 'manage_options' ),
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
		$endpoint = $this->endpoint_declaring(
			array(
				'capabilities' => array( 'manage_options' ),
				'must_pass'    => 0,
			)
		);

		// No current user, so is_jetpack_authorized_for_site() stands in for blog-token auth.
		$this->assertEquals( 'success', $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Sibling of test_zero_threshold_still_accepts_a_blog_token for the declaration guard, so all three
	 * guards are pinned below the accepts_site_based_authentication() short-circuit. A refactor that
	 * hoisted only this one above the short-circuit would 403 legitimate blog-token traffic to any
	 * endpoint whose declaration is a numeric or blank literal, and nothing else in the suite would fail.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_capability_declaration_still_accepts_a_blog_token() {
		// Non-empty, so it clears the emptiness guard and would be caught by the declaration guard if the
		// short-circuit above it did not fire first -- which is exactly what this test pins.
		$endpoint = $this->endpoint_declaring( array( 0 ) );

		// No current user, so is_jetpack_authorized_for_site() stands in for blog-token auth.
		$this->assertEquals( 'success', $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * The supported N-of-M wrapper must keep working. The threshold rows above only cover the invalid
	 * side (below 1), and this refactor rewrote the counting path that the valid side depends on, so
	 * assert both outcomes directly. The subscriber fixture holds `read` and not `manage_options`.
	 *
	 * @group json-api
	 * @dataProvider data_provider_test_positive_must_pass_thresholds
	 *
	 * @param array           $needed_capabilities The capability declaration to install on the endpoint.
	 * @param WP_Error|string $result              The expected result.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'data_provider_test_positive_must_pass_thresholds' )]
	public function test_positive_must_pass_thresholds( $needed_capabilities, $result ) {
		$endpoint = $this->endpoint_declaring( $needed_capabilities );

		wp_set_current_user( self::$subscriber_user_id );

		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Data provider for test_positive_must_pass_thresholds.
	 */
	public static function data_provider_test_positive_must_pass_thresholds() {
		$capabilities = array( 'read', 'manage_options' );

		return array(
			'1 of 2 passes on the capability the user holds' => array(
				array(
					'capabilities' => $capabilities,
					'must_pass'    => 1,
				),
				'success',
			),
			'2 of 2 denies and names only the failed capability' => array(
				array(
					'capabilities' => $capabilities,
					'must_pass'    => 2,
				),
				new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 ),
			),
		);
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

				// Exempt by name, not by structure. An earlier version of this test skipped every
				// endpoint whose callback() is declared outside the base class, on the theory that such
				// a class defines its own authorization path. That proxy is false: overriding callback()
				// does not mean bypassing check_capability(), and
				// Jetpack_JSON_API_Plugins_Modify_Endpoint overrides it, assigns a capability per action
				// and then delegates to parent::callback(). A future endpoint in that shape that also
				// declared no capabilities would have been skipped silently -- exactly the case this
				// invariant exists to catch.
				//
				// Only one registered class genuinely needs the exemption:
				// Jetpack_JSON_API_Check_Capabilities_Endpoint overrides callback() to hand-pass 'read'
				// to validate_call(), never consults $needed_capabilities, and is registered without the
				// site-auth flag, so its unset default is not a site-token declaration.
				// Jetpack_JSON_API_Themes_Active_Endpoint is in the same "passes a literal" shape but
				// does register the flag, so it is asserted rather than exempted: over-inclusion here
				// costs a false alarm, while the structural proxy cost a silent miss.
				if ( Jetpack_JSON_API_Check_Capabilities_Endpoint::class === $class->getName() ) {
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

		// Pin the population, not just "more than none": the per-endpoint assertion above only fires for
		// endpoints the loop actually reaches, so a directory-detection or autoload regression that
		// dropped most of them would otherwise stay green. Registering more of them only raises this
		// count, so the bound is the floor rather than the exact figure.
		$this->assertGreaterThanOrEqual( 10, $checked, 'Expected every capability-less endpoint registration to be reached; the assertion loop above ran on fewer than there are.' );
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
