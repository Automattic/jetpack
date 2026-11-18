<?php

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Initial_State class.
 *
 * @package automattic/jetpack-connection
 */
class Initial_State_Test extends TestCase {

	/**
	 * Manager whose capability mapping a test hooked.
	 *
	 * @var Manager|null
	 */
	private $caps_manager;

	/**
	 * Whether a test attached the URL reversal filter that Identity_Crisis::init() adds.
	 *
	 * @var bool
	 */
	private $added_reversal_filter = false;

	/**
	 * Cleans up the test environment after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		\Jetpack_Options::delete_option( array( 'master_user', 'user_tokens', 'safe_mode_confirmed', 'blog_token', 'id', 'sync_error_idc', Protected_Owner::OPTION ) );
		Identity_Crisis::$is_safe_mode_confirmed = false;
		remove_all_filters( 'jetpack_connection_requires_protected_owner' );
		remove_all_filters( 'jetpack_is_in_safe_mode' );
		if ( $this->added_reversal_filter ) {
			remove_filter( 'jetpack_options', array( Identity_Crisis::class, 'reverse_wpcom_urls_for_idc' ) );
			$this->added_reversal_filter = false;
		}
		delete_transient( 'jetpack_idc_local' );
		delete_transient( 'jetpack_idc_possible_dynamic_site_url_detected' );
		remove_all_filters( 'jetpack_sync_home_url' );
		remove_all_filters( 'jetpack_sync_site_url' );
		remove_all_filters( 'home_url' );
		if ( $this->caps_manager ) {
			remove_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1 );
			$this->caps_manager = null;
		}
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Identity_Crisis::NEW_SCREEN_FLAG );
		Cache::clear();
		remove_all_filters( 'jetpack_connection_protected_owner_default_ui' );
		( new Manager() )->reset_connection_status();
		wp_set_current_user( 0 );
		Error_Handler::get_instance()->delete_all_errors();
	}

	/**
	 * Extracts the initial state data from the public render() output.
	 *
	 * @return array The initial state data.
	 */
	private static function get_data() {
		$rendered = Initial_State::render();

		self::assertSame( 1, preg_match( '/JP_CONNECTION_INITIAL_STATE = (\{.*\})\);window\.jpTracksContext/', $rendered, $matches ), 'The initial state JSON must be extractable from the render() output.' );

		return json_decode( $matches[1], true );
	}

	/**
	 * Creates a user with the jetpack_connect capability and sets it as current.
	 *
	 * The mapped capability assignment is not set up in tests, so the capability
	 * is granted directly.
	 *
	 * @param string $login The user login.
	 * @return int The user ID.
	 */
	private static function act_as_connection_manager( $login ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		get_user_by( 'id', $user_id )->add_cap( 'jetpack_connect' );
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Ensures that all of the expected fields and no other fields are returned by get_data().
	 */
	public function test_render() {
		global $wp_version;

		// Ensure that the nonces match up despite slight time differences.
		add_filter(
			'nonce_life',
			function () {
				return PHP_INT_MAX;
			}
		);

		// Ensure a consistent gravatar URL (by default, it has a random subdomain of 0, 1, or 2.
		add_filter(
			'get_avatar_url',
			function () {
				return 'https://gravatar.com/';
			}
		);

		$_GET['calypso_env'] = 'wpcalypso';

		// Known state: no connection owner is set.
		\Jetpack_Options::delete_option( 'master_user' );

		$expected_state = array(
			'apiRoot'                    => esc_url_raw( rest_url() ),
			'apiNonce'                   => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'          => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connectionStatus'           => REST_Connector::connection_status( false ),
			'userConnectionData'         => REST_Connector::get_user_connection_data( false ),
			'connectedPlugins'           => REST_Connector::get_connection_plugins( false ),
			'wpVersion'                  => $wp_version,
			'siteSuffix'                 => ( new Status() )->get_site_suffix(),
			'connectionErrors'           => Error_Handler::get_instance()->get_displayable_errors(),
			'isOfflineMode'              => ( new Status() )->is_offline_mode(),
			'calypsoEnv'                 => 'wpcalypso',
			'isOwnershipTransferable'    => ( new Manager() )->is_ownership_transferable(),
			'canTakeOwnerSlot'           => ( new Manager() )->can_take_owner_slot(),
			'connectionOwner'            => null,
			'hasProtectedOwner'          => null,
			'requiresProtectedOwner'     => null,
			'useDefaultProtectedOwnerUi' => null,
			'identityCrisis'             => null,
		);
		$expected_value = 'var JP_CONNECTION_INITIAL_STATE; typeof JP_CONNECTION_INITIAL_STATE === "object" || (JP_CONNECTION_INITIAL_STATE = ' . wp_json_encode( $expected_state, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ');'
			. sprintf( 'window.jpTracksContext = window.jpTracksContext || {}; window.jpTracksContext.blog_id = %s;', absint( \Jetpack_Options::get_option( 'id', 0 ) ) );

		$actual_value = Initial_State::render();

		unset( $_GET['calypso_env'] );

		$this->assertEquals( $expected_value, $actual_value );
	}

	/**
	 * The owner fields must be derived from the master_user option and local user data,
	 * not from the token-dependent Manager::get_connection_owner(). That method returns
	 * false exactly when the owner's token is broken, which is the scenario the
	 * connection-error UIs need this data for.
	 */
	public function test_get_data_derives_owner_from_master_user_without_token() {
		$owner_id = wp_insert_user(
			array(
				'user_login'   => 'initial_state_owner',
				'user_pass'    => 'password',
				'display_name' => 'Connection Owner',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		// No user token exists for the owner, so the token-dependent derivation
		// (Manager::get_connection_owner()) would yield no owner here.
		$this->assertFalse( ( new Manager() )->get_connection_owner() );

		self::act_as_connection_manager( 'initial_state_admin' );

		$data = self::get_data();

		$this->assertSame(
			array(
				'id'          => $owner_id,
				'displayName' => 'Connection Owner',
				'avatar'      => get_avatar_url(
					$owner_id,
					array(
						'size'    => 48,
						'default' => 'mysteryman',
					)
				),
			),
			$data['connectionOwner']
		);
	}

	/**
	 * The owner's identity must not be exposed to viewers without the jetpack_connect
	 * capability: the initial state is printed for any logged-in user loading
	 * connection scripts (e.g. contributors in the editor).
	 */
	public function test_get_data_hides_owner_from_low_capability_viewers() {
		$owner_id = wp_insert_user(
			array(
				'user_login'   => 'initial_state_owner_2',
				'user_pass'    => 'password',
				'display_name' => 'Connection Owner',
			)
		);
		\Jetpack_Options::update_option( 'master_user', $owner_id );

		$contributor_id = wp_insert_user(
			array(
				'user_login' => 'initial_state_contributor',
				'user_pass'  => 'password',
				'role'       => 'contributor',
			)
		);
		wp_set_current_user( $contributor_id );

		$data = self::get_data();

		$this->assertNull( $data['connectionOwner'] );
	}

	/**
	 * With no master_user option, or with a dangling one pointing at a deleted
	 * WP user, connectionOwner must be null even for capable viewers.
	 */
	public function test_get_data_owner_is_null_when_unresolvable() {
		self::act_as_connection_manager( 'initial_state_admin_2' );

		\Jetpack_Options::delete_option( 'master_user' );

		$data = self::get_data();

		$this->assertNull( $data['connectionOwner'] );

		// A dangling master_user option pointing at a user that no longer exists.
		\Jetpack_Options::update_option( 'master_user', 987654 );

		$data = self::get_data();

		$this->assertNull( $data['connectionOwner'] );
	}
	/**
	 * A viewer who can manage the connection gets the protected owner fields at their defaults.
	 */
	public function test_get_data_exposes_protected_owner_defaults_to_capable_viewers() {
		self::act_as_connection_manager( 'initial_state_po_admin' );

		$data = self::get_data();

		$this->assertFalse( $data['hasProtectedOwner'] );
		$this->assertFalse( $data['requiresProtectedOwner'] );
		$this->assertTrue( $data['useDefaultProtectedOwnerUi'] );
	}

	/**
	 * Withheld rather than false, so a low-capability viewer is not told the site has no protected owner.
	 */
	public function test_get_data_withholds_protected_owner_fields_from_low_capability_viewers() {
		$contributor_id = wp_insert_user(
			array(
				'user_login' => 'initial_state_po_contributor',
				'user_pass'  => 'password',
				'role'       => 'contributor',
			)
		);
		$this->assertIsInt( $contributor_id, 'Test setup failed: contributor not created.' );
		wp_set_current_user( $contributor_id );

		$data = self::get_data();

		$this->assertNull( $data['hasProtectedOwner'] );
		$this->assertNull( $data['requiresProtectedOwner'] );
		$this->assertNull( $data['useDefaultProtectedOwnerUi'] );
	}

	/**
	 * The binding is set up front, so resolving the owner makes no WordPress.com lookup.
	 */
	public function test_get_data_reports_an_owner_matching_the_locked_anchor() {
		$owner_id = self::act_as_connection_manager( 'initial_state_po_owner' );
		\Jetpack_Options::update_option( 'master_user', $owner_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $owner_id => 'token.secret.' . $owner_id ) );
		Utils::set_wpcom_user_id( $owner_id, 4242 );
		Protected_Owner::set( 4242, $owner_id );
		( new Manager() )->reset_connection_status();

		$this->assertTrue( self::get_data()['hasProtectedOwner'] );
	}

	/**
	 * Both flags are consumer-controlled.
	 */
	public function test_get_data_protected_owner_flags_follow_their_filters() {
		self::act_as_connection_manager( 'initial_state_po_admin_2' );
		add_filter( 'jetpack_connection_requires_protected_owner', '__return_true' );
		add_filter( 'jetpack_connection_protected_owner_default_ui', '__return_false' );

		$data = self::get_data();

		$this->assertTrue( $data['requiresProtectedOwner'] );
		$this->assertFalse( $data['useDefaultProtectedOwnerUi'] );
	}

	/**
	 * The Safe Mode surfaces pick the old or the shared screen from this value alone.
	 *
	 * @dataProvider provide_new_screen_flag_states
	 *
	 * @param bool $enabled Whether the flag is forced on.
	 */
	#[DataProvider( 'provide_new_screen_flag_states' )]
	public function test_get_data_identity_crisis_follows_the_new_screen_flag( $enabled ) {
		self::enter_safe_mode();
		if ( $enabled ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Identity_Crisis::NEW_SCREEN_FLAG, '__return_true' );
		}

		$this->assertSame( $enabled, self::get_data()['identityCrisis']['useNewScreen'] );
	}

	/**
	 * Data provider for test_get_data_identity_crisis_follows_the_new_screen_flag.
	 *
	 * @return array
	 */
	public static function provide_new_screen_flag_states() {
		return array(
			'off by default' => array( false ),
			'forced on'      => array( true ),
		);
	}

	/**
	 * Only a viewer who can resolve Safe Mode gets its details.
	 *
	 * @dataProvider provide_identity_crisis_viewers
	 *
	 * @param string $role          Role of the viewer.
	 * @param bool   $confirmed     Whether an admin confirmed Safe Mode.
	 * @param array  $expected_keys Keys the viewer receives.
	 */
	#[DataProvider( 'provide_identity_crisis_viewers' )]
	public function test_get_data_identity_crisis_details_follow_the_viewer( $role, $confirmed, $expected_keys ) {
		self::enter_safe_mode();
		\Jetpack_Options::update_option( 'safe_mode_confirmed', $confirmed );
		$this->act_as( $role );

		$identity_crisis = self::get_data()['identityCrisis'];

		$this->assertEqualsCanonicalizing( $expected_keys, array_keys( $identity_crisis ) );
		$this->assertSame( 'administrator' === $role, $identity_crisis['canResolve'] );
		$this->assertSame( $confirmed, $identity_crisis['isSafeModeConfirmed'] );
	}

	/**
	 * Data provider for test_get_data_identity_crisis_details_follow_the_viewer.
	 *
	 * @return array
	 */
	public static function provide_identity_crisis_viewers() {
		$shared   = array( 'useNewScreen', 'canResolve', 'isSafeModeConfirmed' );
		$resolver = array_merge( $shared, array( 'wpcomHomeUrl', 'currentUrl', 'isDevelopmentSite', 'possibleDynamicSiteUrlDetected', 'isCurrentUrlHttps', 'logoUrl' ) );

		return array(
			'admin, confirmed'       => array( 'administrator', true, $resolver ),
			'admin, not confirmed'   => array( 'administrator', false, $resolver ),
			'contributor, confirmed' => array( 'contributor', true, $shared ),
		);
	}

	/**
	 * @dataProvider provide_home_url_schemes
	 *
	 * @param string $home     The home URL.
	 * @param bool   $expected The expected isCurrentUrlHttps.
	 */
	#[DataProvider( 'provide_home_url_schemes' )]
	public function test_get_data_identity_crisis_says_whether_the_site_loads_over_https( $home, $expected ) {
		add_filter( 'home_url', fn () => $home );
		self::enter_safe_mode();
		$this->act_as( 'administrator' );

		$this->assertSame( $expected, self::get_data()['identityCrisis']['isCurrentUrlHttps'] );
	}

	/**
	 * Data provider for test_get_data_identity_crisis_says_whether_the_site_loads_over_https.
	 *
	 * @return array
	 */
	public static function provide_home_url_schemes() {
		return array(
			'https' => array( 'https://example.com', true ),
			'http'  => array( 'http://example.com', false ),
		);
	}

	/**
	 * @dataProvider provide_identity_crisis_errors
	 *
	 * @param array|null $response        The WordPress.com response the error is stored from, null for none.
	 * @param bool       $reversal_filter Whether Identity_Crisis::init() attached the URL reversal filter.
	 * @param string     $expected_wpcom  The expected wpcomHomeUrl.
	 * @param string     $expected_local  The expected currentUrl.
	 */
	#[DataProvider( 'provide_identity_crisis_errors' )]
	public function test_get_data_identity_crisis_urls_once_confirmed( $response, $reversal_filter, $expected_wpcom, $expected_local ) {
		\Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		\Jetpack_Options::update_option( 'id', 12345 );
		// WorDBless can't serve the raw URLs Urls reads.
		add_filter( 'jetpack_sync_home_url', fn () => 'https://www.Local.example' );
		add_filter( 'jetpack_sync_site_url', fn () => 'https://www.Local.example/wp' );
		if ( $response ) {
			\Jetpack_Options::update_option( 'sync_error_idc', Identity_Crisis::get_sync_error_idc_option( $response ) );
		}
		if ( $reversal_filter && false === has_filter( 'jetpack_options', array( Identity_Crisis::class, 'reverse_wpcom_urls_for_idc' ) ) ) {
			add_filter( 'jetpack_options', array( Identity_Crisis::class, 'reverse_wpcom_urls_for_idc' ) );
			$this->added_reversal_filter = true;
		}
		Identity_Crisis::$is_safe_mode_confirmed = true;
		self::enter_safe_mode();
		$this->act_as( 'administrator' );

		$identity_crisis = self::get_data()['identityCrisis'];

		$this->assertSame( $expected_wpcom, $identity_crisis['wpcomHomeUrl'] );
		$this->assertSame( $expected_local, $identity_crisis['currentUrl'] );
	}

	/**
	 * Data provider for test_get_data_identity_crisis_urls_once_confirmed.
	 *
	 * @return array
	 */
	public static function provide_identity_crisis_errors() {
		$response = array(
			'wpcom_home'    => 'https://www.WPCOM.example',
			'wpcom_siteurl' => 'https://wpcom.example/wp',
		);

		return array(
			'site URL mismatch, without init()' => array( array( 'error_code' => 'jetpack_site_url_mismatch' ) + $response, false, 'wpcom.example/wp/', 'local.example/wp/' ),
			'home URL mismatch, after init()'   => array( array( 'error_code' => 'jetpack_home_url_mismatch' ) + $response, true, 'wpcom.example/', 'local.example/' ),
			'no stored error'                   => array( null, false, '', 'local.example/' ),
		);
	}

	/**
	 * Create a user with the role, map the connection capabilities as configure() does, and act as that user.
	 *
	 * @param string $role The role.
	 */
	private function act_as( $role ) {
		$this->caps_manager = new Manager();
		add_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1, 4 );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'initial_state_idc_' . wp_generate_password( 8, false ),
					'user_pass'  => 'password',
					'role'       => $role,
				)
			)
		);
	}

	/**
	 * Put the site in Safe Mode for the rest of the test.
	 */
	private static function enter_safe_mode() {
		add_filter( 'jetpack_is_in_safe_mode', '__return_true' );
		Cache::clear();
	}
}
