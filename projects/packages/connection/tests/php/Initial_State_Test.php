<?php

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Initial_State class.
 *
 * @package automattic/jetpack-connection
 */
class Initial_State_Test extends TestCase {

	/**
	 * Cleans up the test environment after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		\Jetpack_Options::delete_option( 'master_user' );
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
			'apiRoot'                 => esc_url_raw( rest_url() ),
			'apiNonce'                => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'       => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connectionStatus'        => REST_Connector::connection_status( false ),
			'userConnectionData'      => REST_Connector::get_user_connection_data( false ),
			'connectedPlugins'        => REST_Connector::get_connection_plugins( false ),
			'wpVersion'               => $wp_version,
			'siteSuffix'              => ( new Status() )->get_site_suffix(),
			'connectionErrors'        => Error_Handler::get_instance()->get_displayable_errors(),
			'isOfflineMode'           => ( new Status() )->is_offline_mode(),
			'calypsoEnv'              => 'wpcalypso',
			'isOwnershipTransferable' => ( new Manager() )->is_ownership_transferable(),
			'connectionOwner'         => null,
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
}
