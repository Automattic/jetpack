<?php
/**
 * Tests for the Licensing_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-licensing
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Licensing\Abilities;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

require_once __DIR__ . '/class-licensing-abilities-test-stub.php';

/**
 * Unit tests for Licensing_Abilities registration and execution.
 *
 * Run from projects/packages/licensing:
 *
 *   composer phpunit -- --filter Licensing_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Licensing\Abilities\Licensing_Abilities
 */
#[CoversClass( Licensing_Abilities::class )]
class Licensing_Abilities_Test extends BaseTestCase {

	/**
	 * The admin user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * The subscriber user id.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Stubbed `get_user_licenses` response items used by the
	 * Licensing_Abilities_Test_Stub class. Reset per-test.
	 *
	 * @var array
	 */
	public static $stub_license_items = array();

	/**
	 * Stubbed `attach_licenses` return value used by the
	 * Licensing_Abilities_Test_Stub class. Reset per-test.
	 *
	 * @var mixed
	 */
	public static $stub_attach_return = array();

	/**
	 * Stubbed `last_error` return value used by the
	 * Licensing_Abilities_Test_Stub class. Reset per-test.
	 *
	 * @var string
	 */
	public static $stub_last_error = '';

	/**
	 * Standard set-up.
	 */
	protected function set_up() {
		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'licensing_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'licensing_abilities_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Most tests open the rollout gate; the specific "disabled by default" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any hooks a prior test may have added for the Registrar lifecycle actions.
		remove_action( 'wp_abilities_api_categories_init', array( Licensing_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Licensing_Abilities::class, 'register_abilities' ) );

		self::$stub_license_items = array();
		self::$stub_attach_return = array();
		self::$stub_last_error    = '';
	}

	/**
	 * Standard tear-down.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_action( 'wp_abilities_api_categories_init', array( Licensing_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Licensing_Abilities::class, 'register_abilities' ) );
		wp_set_current_user( 0 );

		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't bleed.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Licensing_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Licensing_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Licensing_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Run a callable while the given Abilities API lifecycle action appears to be firing.
	 *
	 * @param string   $action Action name to simulate.
	 * @param callable $fn     Callable to run while the action is "firing".
	 */
	private function with_simulated_action( string $action, callable $fn ): void {
		global $wp_current_filter;
		$wp_current_filter[] = $action;
		try {
			$fn();
		} finally {
			for ( $i = count( $wp_current_filter ) - 1; $i >= 0; $i-- ) {
				if ( $wp_current_filter[ $i ] === $action ) {
					array_splice( $wp_current_filter, $i, 1 );
					break;
				}
			}
		}
	}

	public function test_category_slug_is_jetpack_licensing(): void {
		$this->assertSame( 'jetpack-licensing', Licensing_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Licensing_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Licensing_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-licensing/', $slug );
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Licensing_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertArrayHasKey( 'meta', $spec, "Ability {$slug} missing meta" );
			$this->assertArrayHasKey( 'annotations', $spec['meta'], "Ability {$slug} missing meta.annotations" );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $flag ) {
				$this->assertArrayHasKey( $flag, $spec['meta']['annotations'], "Ability {$slug} missing annotation {$flag}" );
				$this->assertIsBool( $spec['meta']['annotations'][ $flag ], "Ability {$slug} annotation {$flag} must be bool" );
			}
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects the category; setting it on each spec is
		// redundant and drifts. This guard mirrors the Stats and Forms tests.
		foreach ( Licensing_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_read_abilities_declared_readonly(): void {
		$read_slugs = array(
			'jetpack-licensing/list-licenses',
			'jetpack-licensing/get-error-info',
		);
		$abilities  = Licensing_Abilities::get_abilities();
		foreach ( $read_slugs as $slug ) {
			$this->assertArrayHasKey( $slug, $abilities );
			$ann = $abilities[ $slug ]['meta']['annotations'];
			$this->assertTrue( $ann['readonly'], "{$slug} should be readonly" );
			$this->assertFalse( $ann['destructive'], "{$slug} should not be destructive" );
			$this->assertTrue( $ann['idempotent'], "{$slug} should be idempotent" );
		}
	}

	public function test_attach_license_is_writable_idempotent_and_non_destructive(): void {
		$abilities = Licensing_Abilities::get_abilities();
		$ann       = $abilities['jetpack-licensing/attach-license']['meta']['annotations'];
		$this->assertFalse( $ann['readonly'] );
		$this->assertFalse( $ann['destructive'] );
		$this->assertTrue( $ann['idempotent'] );
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Licensing_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertSame( true, $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}

	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Licensing_Abilities::init();

		$this->assertFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Licensing_Abilities::class, 'register_category' )
			)
		);
		$this->assertFalse(
			has_action(
				'wp_abilities_api_init',
				array( Licensing_Abilities::class, 'register_abilities' )
			)
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		if ( did_action( 'wp_abilities_api_init' ) || did_action( 'wp_abilities_api_categories_init' ) ) {
			$this->markTestSkipped( 'Abilities API lifecycle already fired in this test run; late-load path covered elsewhere.' );
		}

		Licensing_Abilities::init();

		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Licensing_Abilities::class, 'register_category' )
			)
		);
		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_init',
				array( Licensing_Abilities::class, 'register_abilities' )
			)
		);
	}

	public function test_register_abilities_registers_every_slug_with_auto_injected_category(): void {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Licensing_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Licensing_Abilities::register_abilities();
			}
		);

		foreach ( array_keys( Licensing_Abilities::get_abilities() ) as $slug ) {
			$this->assertTrue( wp_has_ability( $slug ), "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type ) {
					return 'jetpack-licensing/get-error-info' === $slug;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Licensing_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Licensing_Abilities::register_abilities();
			}
		);

		$this->assertTrue( wp_has_ability( 'jetpack-licensing/get-error-info' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-licensing/list-licenses' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-licensing/attach-license' ) );
	}

	public function test_can_manage_licensing_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Licensing_Abilities::can_manage_licensing() );
	}

	public function test_can_manage_licensing_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Licensing_Abilities::can_manage_licensing() );
	}

	public function test_can_manage_licensing_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Licensing_Abilities::can_manage_licensing() );
	}

	public function test_get_error_info_when_no_error_returns_clean_shape(): void {
		self::$stub_last_error = '';

		$result = Licensing_Abilities_Test_Stub::get_error_info();

		$this->assertSame(
			array(
				'has_error'       => false,
				'message'         => '',
				'code'            => null,
				'last_attempt_at' => null,
			),
			$result
		);
	}

	public function test_get_error_info_when_error_present_returns_message_and_has_error(): void {
		self::$stub_last_error = 'License foo is revoked.';

		$result = Licensing_Abilities_Test_Stub::get_error_info();

		$this->assertTrue( $result['has_error'] );
		$this->assertSame( 'License foo is revoked.', $result['message'] );
		$this->assertNull( $result['code'] );
		$this->assertNull( $result['last_attempt_at'] );
	}

	public function test_list_licenses_returns_normalized_shape(): void {
		self::$stub_license_items = array(
			(object) array(
				'id'           => 7,
				'product_slug' => 'jetpack_scan',
				'product_name' => 'Jetpack Scan',
				'attached_at'  => '2026-04-01 12:00:00',
				'revoked_at'   => null,
				'expires_at'   => null,
			),
		);

		$result = Licensing_Abilities_Test_Stub::list_licenses( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame(
			array(
				'id'           => 7,
				'slug'         => 'jetpack_scan',
				'product_name' => 'Jetpack Scan',
				'attached_at'  => '2026-04-01 12:00:00',
				'status'       => 'active',
				'expires_at'   => null,
			),
			$result[0]
		);
	}

	public function test_list_licenses_status_filter_keeps_only_matching_entries(): void {
		self::$stub_license_items = array(
			// attached and active
			(object) array(
				'id'           => 1,
				'product_slug' => 'a',
				'product_name' => 'A',
				'attached_at'  => '2026-04-01 12:00:00',
				'revoked_at'   => null,
				'expires_at'   => null,
			),
			// detached (unattached)
			(object) array(
				'id'           => 2,
				'product_slug' => 'b',
				'product_name' => 'B',
				'attached_at'  => null,
				'revoked_at'   => null,
				'expires_at'   => null,
			),
			// revoked => expired
			(object) array(
				'id'           => 3,
				'product_slug' => 'c',
				'product_name' => 'C',
				'attached_at'  => '2025-01-01 12:00:00',
				'revoked_at'   => '2025-06-01 12:00:00',
				'expires_at'   => null,
			),
			// past expiry => expired
			(object) array(
				'id'           => 4,
				'product_slug' => 'd',
				'product_name' => 'D',
				'attached_at'  => '2024-01-01 12:00:00',
				'revoked_at'   => null,
				'expires_at'   => '2024-06-01 12:00:00',
			),
		);

		$expired = Licensing_Abilities_Test_Stub::list_licenses( array( 'status' => 'expired' ) );
		$this->assertCount( 2, $expired );
		$ids = array_column( $expired, 'id' );
		$this->assertContains( 3, $ids );
		$this->assertContains( 4, $ids );

		$detached = Licensing_Abilities_Test_Stub::list_licenses( array( 'status' => 'detached' ) );
		$this->assertCount( 1, $detached );
		$this->assertSame( 2, $detached[0]['id'] );

		$active = Licensing_Abilities_Test_Stub::list_licenses( array( 'status' => 'active' ) );
		$this->assertCount( 1, $active );
		$this->assertSame( 1, $active[0]['id'] );
	}

	public function test_list_licenses_attached_filter_includes_all_attached_regardless_of_expiry(): void {
		self::$stub_license_items = array(
			// Attached + active.
			(object) array(
				'id'           => 1,
				'product_slug' => 'a',
				'product_name' => 'A',
				'attached_at'  => '2026-04-01 12:00:00',
				'revoked_at'   => null,
				'expires_at'   => null,
			),
			// Attached but expired (past expiry).
			(object) array(
				'id'           => 2,
				'product_slug' => 'b',
				'product_name' => 'B',
				'attached_at'  => '2024-01-01 12:00:00',
				'revoked_at'   => null,
				'expires_at'   => '2024-06-01 12:00:00',
			),
			// Never attached — should NOT match `attached` filter.
			(object) array(
				'id'           => 3,
				'product_slug' => 'c',
				'product_name' => 'C',
				'attached_at'  => null,
				'revoked_at'   => null,
				'expires_at'   => null,
			),
		);

		// `attached` is broader than `active` — it includes attached-but-expired
		// licenses so agents can answer "what has this site ever had attached?"
		// without re-issuing per-status calls.
		$result = Licensing_Abilities_Test_Stub::list_licenses( array( 'status' => 'attached' ) );
		$this->assertCount( 2, $result );
		$ids = array_column( $result, 'id' );
		$this->assertContains( 1, $ids );
		$this->assertContains( 2, $ids );
		$this->assertNotContains( 3, $ids );
	}

	public function test_list_licenses_license_id_filter_returns_single_or_empty_array(): void {
		self::$stub_license_items = array(
			(object) array(
				'id'           => 1,
				'product_slug' => 'a',
				'product_name' => 'A',
				'attached_at'  => null,
				'revoked_at'   => null,
				'expires_at'   => null,
			),
			(object) array(
				'id'           => 2,
				'product_slug' => 'b',
				'product_name' => 'B',
				'attached_at'  => null,
				'revoked_at'   => null,
				'expires_at'   => null,
			),
		);

		$found = Licensing_Abilities_Test_Stub::list_licenses( array( 'license_id' => 2 ) );
		$this->assertCount( 1, $found );
		$this->assertSame( 2, $found[0]['id'] );

		$missing = Licensing_Abilities_Test_Stub::list_licenses( array( 'license_id' => 99 ) );
		$this->assertSame( array(), $missing );
	}

	public function test_list_licenses_pagination_caps_per_page_at_100(): void {
		$items = array();
		for ( $i = 1; $i <= 5; $i++ ) {
			$items[] = (object) array(
				'id'           => $i,
				'product_slug' => "p{$i}",
				'product_name' => "P{$i}",
				'attached_at'  => null,
				'revoked_at'   => null,
				'expires_at'   => null,
			);
		}
		self::$stub_license_items = $items;

		$page1 = Licensing_Abilities_Test_Stub::list_licenses(
			array(
				'page'     => 1,
				'per_page' => 2,
			)
		);
		$this->assertCount( 2, $page1 );
		$this->assertSame( 1, $page1[0]['id'] );

		$page2 = Licensing_Abilities_Test_Stub::list_licenses(
			array(
				'page'     => 2,
				'per_page' => 2,
			)
		);
		$this->assertCount( 2, $page2 );
		$this->assertSame( 3, $page2[0]['id'] );

		// Out-of-range per_page is clamped, not rejected.
		$capped = Licensing_Abilities_Test_Stub::list_licenses( array( 'per_page' => 9999 ) );
		$this->assertCount( 5, $capped );
	}

	public function test_list_licenses_returns_wp_error_when_fetch_fails(): void {
		Licensing_Abilities_Test_Stub::$stub_fetch_error = new WP_Error(
			'jetpack_licensing_data_unavailable',
			'boom'
		);

		$result = Licensing_Abilities_Test_Stub::list_licenses( array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_licensing_data_unavailable', $result->get_error_code() );

		Licensing_Abilities_Test_Stub::$stub_fetch_error = null;
	}

	public function test_attach_license_rejects_missing_key(): void {
		$result = Licensing_Abilities_Test_Stub::attach_license( array() );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_licensing_missing_license_key', $result->get_error_code() );
	}

	public function test_attach_license_rejects_empty_string(): void {
		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => '   ' ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_licensing_missing_license_key', $result->get_error_code() );
	}

	public function test_attach_license_happy_path_returns_attached_true_with_products(): void {
		self::$stub_attach_return = array(
			array(
				'license_id'         => 42,
				'activatedProductId' => 'jetpack_scan',
			),
		);

		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => 'abcdef' ) );

		$this->assertSame(
			array(
				'attached'           => true,
				'license_id'         => 42,
				'products_activated' => array( 'jetpack_scan' ),
				'error'              => null,
			),
			$result
		);
	}

	public function test_attach_license_already_attached_idempotent_returns_attached_true(): void {
		// `true` is the legacy multicall ack the server returns when the key
		// is already attached and there's nothing new to activate. The agent
		// MUST see attached=true here, not an error, so the same call is safe
		// to retry.
		self::$stub_attach_return = array( true );

		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => 'already-attached-key' ) );

		$this->assertTrue( $result['attached'] );
		$this->assertNull( $result['license_id'] );
		$this->assertSame( array(), $result['products_activated'] );
		$this->assertNull( $result['error'] );
	}

	public function test_attach_license_per_key_error_returns_structured_failure(): void {
		self::$stub_attach_return = array(
			new WP_Error( 'invalid_license_key', 'License key is invalid.' ),
		);

		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => 'bad-key' ) );

		$this->assertFalse( $result['attached'] );
		$this->assertNull( $result['license_id'] );
		$this->assertSame( array(), $result['products_activated'] );
		$this->assertIsArray( $result['error'] );
		$this->assertSame( 'jetpack_licensing_invalid_key', $result['error']['code'] );
		$this->assertSame( 'License key is invalid.', $result['error']['message'] );
	}

	public function test_attach_license_top_level_wp_error_returns_mapped_failure_code(): void {
		self::$stub_attach_return = new WP_Error( 'not_connected', 'Not connected.' );

		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => 'abc' ) );

		$this->assertFalse( $result['attached'] );
		$this->assertSame( 'jetpack_licensing_not_connected', $result['error']['code'] );
		$this->assertSame( 'Not connected.', $result['error']['message'] );
	}

	public function test_attach_license_request_failed_maps_to_namespaced_code(): void {
		self::$stub_attach_return = new WP_Error( 'request_failed', 'XMLRPC blew up.' );

		$result = Licensing_Abilities_Test_Stub::attach_license( array( 'license_key' => 'abc' ) );

		$this->assertFalse( $result['attached'] );
		$this->assertSame( 'jetpack_licensing_request_failed', $result['error']['code'] );
	}
}
