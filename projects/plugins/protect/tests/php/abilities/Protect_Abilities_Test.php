<?php
/**
 * Tests for the Protect_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-protect-plugin
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Account_Protection\Account_Protection;
use Automattic\Jetpack\Protect\Abilities\Protect_Abilities;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/class-protect-abilities-test-stub.php';

/**
 * @covers \Automattic\Jetpack\Protect\Abilities\Protect_Abilities
 */
#[CoversClass( Protect_Abilities::class )]
class Protect_Abilities_Test extends BaseTestCase {

	/**
	 * Administrator user id, created once per test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id, created once per test.
	 *
	 * @var int
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'protect_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'protect_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		Protect_Abilities_Test_Stub::reset();
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Protect_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Protect_Abilities::class, 'register_abilities' ) );

		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Protect_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Protect_Abilities::get_category_slug() );
		}

		Protect_Abilities_Test_Stub::reset();

		parent::tear_down();
	}

	/**
	 * Build a Status_Model-like object out of a plain array, including
	 * Threat_Model children. We don't reuse the real Status_Model
	 * constructor because the tests want to drive the shape directly.
	 *
	 * @param array $overrides Status property overrides.
	 * @return Status_Model
	 */
	private function make_status( array $overrides = array() ): Status_Model {
		$defaults = array(
			'status'             => 'idle',
			'last_checked'       => '2024-01-15 12:34:56',
			'threats'            => array(),
			'fixable_threat_ids' => array(),
		);
		$merged   = array_merge( $defaults, $overrides );

		return new Status_Model( $merged );
	}

	/**
	 * Build a Threat_Model-like object.
	 *
	 * @param array $overrides Threat property overrides.
	 * @return Threat_Model
	 */
	private function make_threat( array $overrides = array() ): Threat_Model {
		$defaults = array(
			'id'             => 'threat-1',
			'signature'      => 'sig-1',
			'title'          => 'Vulnerable thing',
			'description'    => 'A thing that is bad.',
			'severity'       => 5,
			'first_detected' => '2024-01-10 00:00:00',
			'source'         => 'https://example.test/threat/1',
			'fixable'        => false,
			'status'         => 'current',
		);
		return new Threat_Model( array_merge( $defaults, $overrides ) );
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Protect_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Protect_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-protect', Protect_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Protect_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Protect_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-protect/', $slug );
		}
	}

	public function test_surface_exposes_documented_abilities() {
		$abilities = Protect_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-protect/get-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-protect/list-threats', $abilities );
		$this->assertArrayHasKey( 'jetpack-protect/get-threat', $abilities );
		$this->assertArrayHasKey( 'jetpack-protect/get-account-protection-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-protect/set-account-protection', $abilities );
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( Protect_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_read_abilities_are_annotated_readonly_idempotent() {
		$reads = array(
			'jetpack-protect/get-status',
			'jetpack-protect/list-threats',
			'jetpack-protect/get-threat',
			'jetpack-protect/get-account-protection-status',
		);
		foreach ( $reads as $slug ) {
			$spec = Protect_Abilities::get_abilities()[ $slug ];
			$this->assertTrue( $spec['meta']['annotations']['readonly'], "{$slug} must be readonly." );
			$this->assertFalse( $spec['meta']['annotations']['destructive'], "{$slug} must not be destructive." );
			$this->assertTrue( $spec['meta']['annotations']['idempotent'], "{$slug} must be idempotent." );
		}
	}

	public function test_set_account_protection_is_annotated_non_readonly_idempotent() {
		$spec = Protect_Abilities::get_abilities()['jetpack-protect/set-account-protection'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_list_threats_per_page_is_capped_at_100() {
		$spec = Protect_Abilities::get_abilities()['jetpack-protect/list-threats'];
		$this->assertSame( 100, $spec['input_schema']['properties']['per_page']['maximum'] );
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Protect_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Protect_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Protect_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Protect_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Protect_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Protect_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-protect/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Protect_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered_slugs, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires this parameter even when we don't branch on it.
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$registered_slugs = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( Protect_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Protect_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-protect',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_protect_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Protect_Abilities::can_view_protect() );
	}

	public function test_can_view_protect_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Protect_Abilities::can_view_protect() );
	}

	public function test_can_view_protect_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Protect_Abilities::can_view_protect() );
	}

	public function test_can_manage_protect_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Protect_Abilities::can_manage_protect() );
	}

	public function test_can_manage_protect_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Protect_Abilities::can_manage_protect() );
	}

	public function test_can_manage_protect_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Protect_Abilities::can_manage_protect() );
	}

	// -------------------- get-status execute --------------------

	public function test_get_status_errors_when_status_unavailable() {
		Protect_Abilities_Test_Stub::$status = null;

		$result = Protect_Abilities_Test_Stub::get_status();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_status_data_unavailable', $result->get_error_code() );
	}

	public function test_get_status_returns_full_shape_on_success() {
		Protect_Abilities_Test_Stub::$has_plan = true;
		Protect_Abilities_Test_Stub::$status   = $this->make_status(
			array(
				'status'             => 'idle',
				'last_checked'       => '2024-01-15 12:34:56',
				'threats'            => array(
					$this->make_threat( array( 'id' => 't1', 'severity' => 5 ) ),
					$this->make_threat( array( 'id' => 't2', 'severity' => 3 ) ),
					$this->make_threat( array( 'id' => 't3', 'severity' => 1 ) ),
				),
				'fixable_threat_ids' => array( 't1' ),
			)
		);

		$result = Protect_Abilities_Test_Stub::get_status();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['has_plan'] );
		$this->assertFalse( $result['scan_in_progress'] );
		$this->assertSame( '2024-01-15 12:34:56', $result['last_scan']['timestamp'] );
		$this->assertSame( 'idle', $result['last_scan']['status'] );
		$this->assertSame( 3, $result['last_scan']['threats_found'] );
		$this->assertSame( 3, $result['threat_counts']['total'] );
		$this->assertSame( 1, $result['threat_counts']['fixable'] );
		$this->assertSame( 1, $result['threat_counts']['critical'] );
	}

	public function test_get_status_marks_scan_in_progress_for_scanning_status() {
		Protect_Abilities_Test_Stub::$status = $this->make_status( array( 'status' => 'scanning' ) );
		$result                              = Protect_Abilities_Test_Stub::get_status();
		$this->assertTrue( $result['scan_in_progress'] );
	}

	// -------------------- list-threats execute --------------------

	public function test_list_threats_errors_when_status_unavailable() {
		Protect_Abilities_Test_Stub::$status = null;
		$result                              = Protect_Abilities_Test_Stub::list_threats( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_status_data_unavailable', $result->get_error_code() );
	}

	public function test_list_threats_returns_projected_entries() {
		Protect_Abilities_Test_Stub::$status = $this->make_status(
			array(
				'threats' => array(
					$this->make_threat(
						array(
							'id'        => 't1',
							'severity'  => 5,
							'extension' => (object) array( 'type' => 'plugin', 'name' => 'X', 'slug' => 'x', 'version' => '1.0' ),
						)
					),
				),
			)
		);

		$result = Protect_Abilities_Test_Stub::list_threats( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 't1', $result[0]['id'] );
		$this->assertSame( 'critical', $result[0]['severity'] );
		$this->assertSame( 'plugin', $result[0]['type'] );
		$this->assertFalse( $result[0]['fixable'] );
		$this->assertFalse( $result[0]['ignored'] );
	}

	public function test_list_threats_filters_by_severity() {
		Protect_Abilities_Test_Stub::$status = $this->make_status(
			array(
				'threats' => array(
					$this->make_threat( array( 'id' => 'crit',   'severity' => 5 ) ),
					$this->make_threat( array( 'id' => 'high',   'severity' => 3 ) ),
					$this->make_threat( array( 'id' => 'medium', 'severity' => 2 ) ),
					$this->make_threat( array( 'id' => 'low',    'severity' => 1 ) ),
				),
			)
		);

		$result = Protect_Abilities_Test_Stub::list_threats( array( 'severity' => 'high' ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'high', $result[0]['id'] );
	}

	public function test_list_threats_filters_by_type_file_when_filename_set() {
		Protect_Abilities_Test_Stub::$status = $this->make_status(
			array(
				'threats' => array(
					$this->make_threat( array( 'id' => 'core-1', 'extension' => (object) array( 'type' => 'core' ) ) ),
					$this->make_threat( array( 'id' => 'file-1', 'filename' => '/var/www/x.php' ) ),
				),
			)
		);

		$result = Protect_Abilities_Test_Stub::list_threats( array( 'type' => 'file' ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 'file-1', $result[0]['id'] );
	}

	public function test_list_threats_caps_per_page_at_100() {
		$threats = array();
		for ( $i = 0; $i < 250; $i++ ) {
			$threats[] = $this->make_threat( array( 'id' => 'threat-' . $i, 'severity' => 5 ) );
		}
		Protect_Abilities_Test_Stub::$status = $this->make_status( array( 'threats' => $threats ) );

		// Request 1000; should clamp to 100.
		$result = Protect_Abilities_Test_Stub::list_threats( array( 'per_page' => 1000 ) );
		$this->assertCount( 100, $result );
	}

	public function test_list_threats_paginates() {
		$threats = array();
		for ( $i = 0; $i < 30; $i++ ) {
			$threats[] = $this->make_threat( array( 'id' => 'threat-' . $i, 'severity' => 5 ) );
		}
		Protect_Abilities_Test_Stub::$status = $this->make_status( array( 'threats' => $threats ) );

		$page_1 = Protect_Abilities_Test_Stub::list_threats( array( 'page' => 1, 'per_page' => 10 ) );
		$page_2 = Protect_Abilities_Test_Stub::list_threats( array( 'page' => 2, 'per_page' => 10 ) );

		$this->assertCount( 10, $page_1 );
		$this->assertCount( 10, $page_2 );
		$this->assertNotSame( $page_1[0]['id'], $page_2[0]['id'] );
	}

	// -------------------- get-threat execute --------------------

	public function test_get_threat_rejects_missing_id() {
		$result = Protect_Abilities_Test_Stub::get_threat( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_missing_id', $result->get_error_code() );
	}

	public function test_get_threat_rejects_empty_string_id() {
		$result = Protect_Abilities_Test_Stub::get_threat( array( 'id' => '' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_missing_id', $result->get_error_code() );
	}

	public function test_get_threat_returns_empty_array_for_unknown_id() {
		Protect_Abilities_Test_Stub::$status = $this->make_status(
			array(
				'threats' => array( $this->make_threat( array( 'id' => 'known' ) ) ),
			)
		);

		$result = Protect_Abilities_Test_Stub::get_threat( array( 'id' => 'does-not-exist' ) );

		$this->assertSame( array(), $result, 'Consolidated-read pattern: unknown id returns []' );
	}

	public function test_get_threat_returns_one_element_array_for_known_id() {
		Protect_Abilities_Test_Stub::$status = $this->make_status(
			array(
				'threats' => array(
					$this->make_threat( array( 'id' => 'known', 'severity' => 5, 'fixable' => true ) ),
				),
			)
		);

		$result = Protect_Abilities_Test_Stub::get_threat( array( 'id' => 'known' ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 'known', $result[0]['id'] );
		$this->assertArrayHasKey( 'recommended_action', $result[0] );
		$this->assertSame( 'fix', $result[0]['recommended_action'] );
	}

	// -------------------- get-account-protection-status execute --------------------

	public function test_get_account_protection_status_returns_shape_from_settings() {
		Protect_Abilities_Test_Stub::$account_protection_settings = array(
			'isEnabled'   => true,
			'isSupported' => true,
		);

		$result = Protect_Abilities_Test_Stub::get_account_protection_status();

		$this->assertSame(
			array(
				'enabled'           => true,
				'supported'         => true,
				'last_event'        => null,
				'attempt_count_24h' => 0,
				'blocked_count_24h' => 0,
			),
			$result
		);
	}

	// -------------------- set-account-protection execute --------------------

	public function test_set_account_protection_rejects_missing_enabled() {
		$result = Protect_Abilities_Test_Stub::set_account_protection( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_missing_enabled', $result->get_error_code() );
	}

	public function test_set_account_protection_rejects_non_boolean_enabled_string() {
		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => 'true' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_invalid_enabled', $result->get_error_code() );
	}

	public function test_set_account_protection_rejects_non_boolean_enabled_integer() {
		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => 1 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_invalid_enabled', $result->get_error_code() );
	}

	public function test_set_account_protection_errors_when_environment_unsupported() {
		// Build an Account_Protection backed by a Modules mock whose
		// is_supported_environment() returns false. The real implementation
		// of is_supported_environment lives on Account_Protection itself and
		// inspects constants + Host, so we override via a subclass instead.
		Protect_Abilities_Test_Stub::$account_protection_fake = new class() extends Account_Protection {
			public function __construct() {} // skip parent constructor
			public function is_supported_environment(): bool {
				return false;
			}
			public function is_enabled(): bool {
				return false;
			}
		};

		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => true ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_account_protection_unsupported', $result->get_error_code() );
	}

	public function test_set_account_protection_returns_changed_false_when_already_matches() {
		Protect_Abilities_Test_Stub::$account_protection_fake = new class() extends Account_Protection {
			public bool $enable_called  = false;
			public bool $disable_called = false;
			public function __construct() {}
			public function is_supported_environment(): bool {
				return true;
			}
			public function is_enabled(): bool {
				return true;
			}
			public function enable(): bool {
				$this->enable_called = true;
				return true;
			}
			public function disable(): bool {
				$this->disable_called = true;
				return true;
			}
		};

		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => true ) );

		$this->assertSame(
			array(
				'enabled' => true,
				'changed' => false,
			),
			$result
		);
		$this->assertFalse( Protect_Abilities_Test_Stub::$account_protection_fake->enable_called, 'Idempotent no-op: enable() should not be called.' );
		$this->assertFalse( Protect_Abilities_Test_Stub::$account_protection_fake->disable_called, 'Idempotent no-op: disable() should not be called.' );
	}

	public function test_set_account_protection_returns_changed_true_when_enabling() {
		Protect_Abilities_Test_Stub::$account_protection_fake = new class() extends Account_Protection {
			public bool $enable_called  = false;
			public bool $disable_called = false;
			public function __construct() {}
			public function is_supported_environment(): bool {
				return true;
			}
			public function is_enabled(): bool {
				return false;
			}
			public function enable(): bool {
				$this->enable_called = true;
				return true;
			}
			public function disable(): bool {
				$this->disable_called = true;
				return true;
			}
		};

		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => true ) );

		$this->assertSame(
			array(
				'enabled' => true,
				'changed' => true,
			),
			$result
		);
		$this->assertTrue( Protect_Abilities_Test_Stub::$account_protection_fake->enable_called, 'enable() must be called when transitioning false -> true.' );
		$this->assertFalse( Protect_Abilities_Test_Stub::$account_protection_fake->disable_called );
	}

	public function test_set_account_protection_returns_changed_true_when_disabling() {
		Protect_Abilities_Test_Stub::$account_protection_fake = new class() extends Account_Protection {
			public bool $enable_called  = false;
			public bool $disable_called = false;
			public function __construct() {}
			public function is_supported_environment(): bool {
				return true;
			}
			public function is_enabled(): bool {
				return true;
			}
			public function enable(): bool {
				$this->enable_called = true;
				return true;
			}
			public function disable(): bool {
				$this->disable_called = true;
				return true;
			}
		};

		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => false ) );

		$this->assertSame(
			array(
				'enabled' => false,
				'changed' => true,
			),
			$result
		);
		$this->assertTrue( Protect_Abilities_Test_Stub::$account_protection_fake->disable_called );
	}

	public function test_set_account_protection_errors_when_toggle_fails() {
		Protect_Abilities_Test_Stub::$account_protection_fake = new class() extends Account_Protection {
			public function __construct() {}
			public function is_supported_environment(): bool {
				return true;
			}
			public function is_enabled(): bool {
				return false;
			}
			public function enable(): bool {
				return false; // Simulate underlying failure.
			}
			public function disable(): bool {
				return false;
			}
		};

		$result = Protect_Abilities_Test_Stub::set_account_protection( array( 'enabled' => true ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_protect_account_protection_toggle_failed', $result->get_error_code() );
	}
}
