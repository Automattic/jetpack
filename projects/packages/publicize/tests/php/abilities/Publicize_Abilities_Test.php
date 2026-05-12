<?php
/**
 * Unit tests for the Publicize_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-publicize
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that.
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Publicize\Abilities;

use Automattic\Jetpack\Publicize\Share_Status;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Abilities\Publicize_Abilities
 */
#[CoversClass( Publicize_Abilities::class )]
class Publicize_Abilities_Test extends BaseTestCase {

	/** @var int */
	private $admin_id;

	/** @var int */
	private $author_id;

	/** @var int */
	private $subscriber_id;

	/**
	 * Set up users + open the rollout gate by default.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'publicize_ability_admin_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->author_id     = wp_insert_user(
			array(
				'user_login' => 'publicize_ability_author_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'author',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'publicize_ability_sub_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open. Specific tests opt out by removing this filter.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	/**
	 * Tear down: drop hooks and abilities so they don't leak across tests.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );

		$this->deregister_publicize_abilities();
		parent::tearDown();
	}

	/**
	 * Remove ability + category registrations so the next test starts clean.
	 */
	private function deregister_publicize_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Publicize_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			$slug = Publicize_Abilities::get_category_slug();
			if ( wp_has_ability_category( $slug ) ) {
				wp_unregister_ability_category( $slug );
			}
		}
	}

	/**
	 * Simulate the `wp_abilities_api_categories_init` action being mid-flight.
	 */
	private function simulate_doing_categories_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulate the `wp_abilities_api_init` action being mid-flight.
	 */
	private function simulate_doing_abilities_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Category slug must be the kebab-case plugin-scoped slug.
	 */
	public function test_category_slug_is_jetpack_publicize(): void {
		$this->assertSame( 'jetpack-publicize', Publicize_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Publicize_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Publicize_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-publicize/', $slug );
		}
	}

	public function test_expected_ability_slugs_are_present(): void {
		$slugs = array_keys( Publicize_Abilities::get_abilities() );
		foreach (
			array(
				'jetpack-publicize/list-connections',
				'jetpack-publicize/get-share-status',
				'jetpack-publicize/delete-connection',
			) as $expected
		) {
			$this->assertContains( $expected, $slugs );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Publicize_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_ability_has_strict_input_schema(): void {
		foreach ( Publicize_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} missing input_schema." );
			$this->assertSame( 'object', $spec['input_schema']['type'] ?? null );
			$this->assertSame( false, $spec['input_schema']['additionalProperties'] ?? null, "Ability {$slug} must set additionalProperties=false." );
		}
	}

	public function test_annotations_match_read_vs_destructive_write(): void {
		$abilities = Publicize_Abilities::get_abilities();

		foreach ( array( 'jetpack-publicize/list-connections', 'jetpack-publicize/get-share-status' ) as $read_slug ) {
			$annotations = $abilities[ $read_slug ]['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "{$read_slug} must be readonly." );
			$this->assertFalse( $annotations['destructive'] );
			$this->assertTrue( $annotations['idempotent'] );
		}

		$delete_annotations = $abilities['jetpack-publicize/delete-connection']['meta']['annotations'];
		$this->assertFalse( $delete_annotations['readonly'] );
		$this->assertTrue( $delete_annotations['destructive'], 'delete-connection must be marked destructive.' );
		$this->assertTrue( $delete_annotations['idempotent'], 'Re-deleting an already-gone connection returns changed=false — idempotent.' );
	}

	public function test_every_spec_declares_callbacks_and_show_in_rest(): void {
		foreach ( Publicize_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertTrue( $spec['meta']['show_in_rest'] ?? false, "Ability {$slug} must opt into REST." );
		}
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * Default rollout gate is off, so init() must not hook anything.
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Publicize_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Publicize_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Publicize_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Publicize_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Publicize_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Publicize_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->simulate_doing_categories_init();
		Publicize_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Publicize_Abilities::register_abilities();

		$registered = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			array_filter(
				wp_get_abilities(),
				static function ( $a ) {
					return 0 === strpos( $a->get_name(), 'jetpack-publicize/' );
				}
			)
		);

		foreach ( array_keys( Publicize_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				unset( $slug );
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_doing_categories_init();
		Publicize_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Publicize_Abilities::register_abilities();

		foreach ( array_keys( Publicize_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse( wp_has_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	// -------------------- Permission callbacks --------------------

	/**
	 * Authors can view connections — same threshold as publish_posts in the REST surface.
	 */
	public function test_can_view_connections_allows_author(): void {
		wp_set_current_user( $this->author_id );
		$this->assertTrue( Publicize_Abilities::can_view_connections() );
	}

	public function test_can_view_connections_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Publicize_Abilities::can_view_connections() );
	}

	public function test_can_view_connections_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Publicize_Abilities::can_view_connections() );
	}

	public function test_can_view_share_status_allows_author(): void {
		wp_set_current_user( $this->author_id );
		$this->assertTrue( Publicize_Abilities::can_view_share_status() );
	}

	public function test_can_view_share_status_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Publicize_Abilities::can_view_share_status() );
	}

	public function test_can_manage_connections_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Publicize_Abilities::can_manage_connections() );
	}

	public function test_can_manage_connections_denies_author(): void {
		// Authors lack edit_others_posts; connection deletion requires editor+.
		wp_set_current_user( $this->author_id );
		$this->assertFalse( Publicize_Abilities::can_manage_connections() );
	}

	public function test_can_manage_connections_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Publicize_Abilities::can_manage_connections() );
	}

	// -------------------- Execute: list-connections --------------------

	/**
	 * Connection rows are projected to the documented agent-facing shape.
	 */
	public function test_execute_list_connections_returns_summarised_shape(): void {
		wp_set_current_user( $this->admin_id );

		$stub = new class() extends Publicize_Abilities {
			protected static function fetch_connections(): array {
				return array(
					array(
						'connection_id'        => '11',
						'service_name'         => 'twitter',
						'external_id'          => '42',
						'display_name'         => 'A. Person',
						'profile_display_name' => 'A. Person Display',
						'external_handle'      => '@aperson',
						'profile_link'         => 'https://twitter.com/aperson',
						'profile_picture'      => 'https://pbs.twimg.com/profile_images/42.jpg',
						'status'               => 'ok',
						'shared'               => true,
						'noise_field'          => 'should be dropped',
					),
					array(
						'connection_id' => '12',
						'service_name'  => 'facebook',
						'display_name'  => 'Page Name',
						'shared'        => false,
					),
				);
			}
		};

		$result = $stub::execute_list_connections( null );

		$this->assertCount( 2, $result );
		$this->assertSame( '11', $result[0]['id'] );
		$this->assertSame( 'twitter', $result[0]['service'] );
		$this->assertSame( '@aperson', $result[0]['external_handle'] );
		$this->assertSame( 'A. Person', $result[0]['external_name'] );
		$this->assertSame( 'A. Person Display', $result[0]['external_display_name'] );
		$this->assertSame( 'ok', $result[0]['status'] );
		$this->assertTrue( $result[0]['shared'] );
		$this->assertArrayNotHasKey( 'noise_field', $result[0] );

		$this->assertSame( '12', $result[1]['id'] );
		$this->assertSame( 'facebook', $result[1]['service'] );
		$this->assertSame( 'Page Name', $result[1]['external_name'] );
		// When profile_display_name is absent, fall back to display_name.
		$this->assertSame( 'Page Name', $result[1]['external_display_name'] );
		$this->assertFalse( $result[1]['shared'] );
		$this->assertNull( $result[1]['status'] );
	}

	public function test_execute_list_connections_returns_empty_array_when_upstream_unavailable(): void {
		wp_set_current_user( $this->admin_id );

		// Default fetch path (no connection) — Connections::get_all() returns [].
		$result = Publicize_Abilities::execute_list_connections( null );
		$this->assertSame( array(), $result );
	}

	// -------------------- Execute: get-share-status --------------------

	/**
	 * Missing post_id is rejected with the documented error code.
	 */
	public function test_execute_get_share_status_missing_post_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_get_share_status( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_missing_post_id', $result->get_error_code() );
	}

	public function test_execute_get_share_status_rejects_zero_string_post_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => '0' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_invalid_post_id', $result->get_error_code() );
	}

	public function test_execute_get_share_status_rejects_non_numeric_post_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => 'banana' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_invalid_post_id', $result->get_error_code() );
	}

	public function test_execute_get_share_status_unknown_post(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => 999999 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_post_not_found', $result->get_error_code() );
	}

	public function test_execute_get_share_status_rejects_unpublished_post(): void {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Draft',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => $post_id ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_post_not_published', $result->get_error_code() );
	}

	public function test_execute_get_share_status_happy_path(): void {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Published',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		// Seed the share-status meta so we don't have to mock the WPCOM call.
		update_post_meta(
			$post_id,
			Share_Status::SHARES_META_KEY,
			array(
				array(
					'connection_id' => 11,
					'service'       => 'twitter',
					'status'        => 'success',
					'external_id'   => 'tw-100',
					'timestamp'     => 1700000000,
					'message'       => 'https://twitter.com/aperson/status/100',
				),
			)
		);

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => $post_id ) );

		$this->assertIsArray( $result );
		$this->assertSame( $post_id, $result['post_id'] );
		$this->assertArrayHasKey( 'can_be_shared', $result );
		$this->assertIsBool( $result['can_be_shared'] );
		$this->assertArrayHasKey( 'shares', $result );
		$this->assertArrayHasKey( 'scheduled_shares', $result );
		$this->assertSame( array(), $result['scheduled_shares'] );

		// `Share_Status::get_post_share_status` filters by user-owned/shared connections;
		// without a Jetpack-connected user, the user-access filter strips the entry —
		// but the documented shape (top-level keys) must be stable regardless.
		$this->assertIsArray( $result['shares'] );
	}

	public function test_execute_get_share_status_accepts_numeric_string_post_id(): void {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Pub',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		$result = Publicize_Abilities::execute_get_share_status( array( 'post_id' => (string) $post_id ) );

		$this->assertIsArray( $result );
		$this->assertSame( $post_id, $result['post_id'] );
	}

	// -------------------- Execute: delete-connection --------------------

	/**
	 * Missing connection_id is rejected with the documented error code.
	 */
	public function test_execute_delete_connection_missing_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_delete_connection( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_missing_connection_id', $result->get_error_code() );
	}

	public function test_execute_delete_connection_rejects_empty_string_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_delete_connection( array( 'connection_id' => '' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_invalid_connection_id', $result->get_error_code() );
	}

	public function test_execute_delete_connection_rejects_non_scalar_id(): void {
		wp_set_current_user( $this->admin_id );

		$result = Publicize_Abilities::execute_delete_connection( array( 'connection_id' => array() ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_invalid_connection_id', $result->get_error_code() );
	}

	public function test_execute_delete_connection_idempotent_when_already_gone(): void {
		wp_set_current_user( $this->admin_id );

		$stub = new class() extends Publicize_Abilities {
			protected static function fetch_connections(): array {
				return array();
			}
			protected static function dispatch_delete( string $connection_id ) {
				unset( $connection_id );
				// Should never be called when the connection doesn't exist.
				throw new \LogicException( 'dispatch_delete should not be reached for absent connection' );
			}
		};

		$result = $stub::execute_delete_connection( array( 'connection_id' => 'gone-123' ) );
		$this->assertIsArray( $result );
		$this->assertSame( 'gone-123', $result['connection_id'] );
		$this->assertTrue( $result['deleted'] );
		$this->assertFalse( $result['changed'], 'Re-deleting an already-gone connection must return changed=false.' );
	}

	public function test_execute_delete_connection_changed_true_when_existed(): void {
		wp_set_current_user( $this->admin_id );

		$stub = new class() extends Publicize_Abilities {
			protected static function fetch_connections(): array {
				return array(
					array(
						'connection_id' => '99',
						'service_name'  => 'twitter',
					),
				);
			}
			protected static function dispatch_delete( string $connection_id ) {
				unset( $connection_id );
				return true;
			}
		};

		$result = $stub::execute_delete_connection( array( 'connection_id' => '99' ) );
		$this->assertIsArray( $result );
		$this->assertSame( '99', $result['connection_id'] );
		$this->assertTrue( $result['deleted'] );
		$this->assertTrue( $result['changed'] );
	}

	public function test_execute_delete_connection_wraps_upstream_failure(): void {
		wp_set_current_user( $this->admin_id );

		$stub = new class() extends Publicize_Abilities {
			protected static function fetch_connections(): array {
				return array(
					array(
						'connection_id' => '7',
						'service_name'  => 'facebook',
					),
				);
			}
			protected static function dispatch_delete( string $connection_id ) {
				unset( $connection_id );
				return new \WP_Error( 'http_request_failed', 'Boom.' );
			}
		};

		$result = $stub::execute_delete_connection( array( 'connection_id' => '7' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_publicize_connection_delete_failed', $result->get_error_code() );
		$this->assertSame( '7', $result->get_error_data()['connection_id'] ?? null );
	}

	public function test_execute_delete_connection_accepts_integer_id(): void {
		wp_set_current_user( $this->admin_id );

		$stub = new class() extends Publicize_Abilities {
			protected static function fetch_connections(): array {
				return array(
					array(
						'connection_id' => '42',
						'service_name'  => 'twitter',
					),
				);
			}
			protected static function dispatch_delete( string $connection_id ) {
				unset( $connection_id );
				return true;
			}
		};

		$result = $stub::execute_delete_connection( array( 'connection_id' => 42 ) );
		$this->assertIsArray( $result );
		$this->assertSame( '42', $result['connection_id'] );
		$this->assertTrue( $result['changed'] );
	}
}
