<?php
/**
 * Tests for A4A_Client_Abilities.
 *
 * @package automattic/automattic-for-agencies-client
 */

use Automattic\Jetpack\A4A_Client\Abilities\A4A_Client_Abilities;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\A4A_Client\Abilities\A4A_Client_Abilities
 */
#[CoversClass( A4A_Client_Abilities::class )]
class A4A_Client_Abilities_Test extends BaseTestCase {

	/**
	 * Admin user id used to satisfy the manage_options permission check.
	 *
	 * @var int|null
	 */
	private $admin_id = null;

	/**
	 * Editor user id used for the negative permission check.
	 *
	 * @var int|null
	 */
	private $editor_id = null;

	/**
	 * Filter callback that injects a stub Connection_Manager; held so we can detach in tearDown.
	 *
	 * @var callable|null
	 */
	private $manager_filter = null;

	/**
	 * Create one administrator and one editor for permission-gate coverage.
	 */
	protected function set_up() {
		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'a4a-admin-' . wp_generate_password( 6, false ),
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'a4a-editor-' . wp_generate_password( 6, false ),
				'user_pass'  => 'pass',
				'role'       => 'editor',
			)
		);
	}

	/**
	 * Reset user, detach injected filter, and clear gating filters between tests.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );

		if ( $this->manager_filter ) {
			remove_filter( 'jetpack_a4a_client_abilities_manager', $this->manager_filter );
			$this->manager_filter = null;
		}

		remove_all_filters( 'jetpack_wp_abilities_enabled' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
	}

	/**
	 * Replace the Connection_Manager used by A4A_Client_Abilities with a stub
	 * whose `is_connected()` / `has_connected_user()` return the supplied
	 * booleans. Returning a stub from the documented filter is the seam used
	 * by the production class to make the manager injectable for tests.
	 *
	 * @param bool $is_connected      Stub return for is_connected().
	 * @param bool $has_connected_user Stub return for has_connected_user().
	 */
	private function stub_manager( bool $is_connected, bool $has_connected_user ): void {
		// Use createStub() so PHPUnit treats this as a test stub (no expectations
		// recorded) rather than a mock that triggers the "no expectations
		// configured" risky-test notice. The two method stubs override return
		// values without arming verification.
		$stub = $this->createStub( Connection_Manager::class );
		$stub->method( 'is_connected' )->willReturn( $is_connected );
		$stub->method( 'has_connected_user' )->willReturn( $has_connected_user );

		$this->manager_filter = static function () use ( $stub ) {
			return $stub;
		};
		add_filter( 'jetpack_a4a_client_abilities_manager', $this->manager_filter );
	}

	/* ---------------- Static contract ---------------- */

	/**
	 * The class must extend the shared Registrar base so it inherits the gated
	 * init() lifecycle and the auto-injected category behavior.
	 */
	public function test_extends_registrar() {
		$this->assertTrue( is_subclass_of( A4A_Client_Abilities::class, Registrar::class ) );
	}

	/**
	 * Category slug must be the documented kebab-case, plugin-scoped value.
	 */
	public function test_category_slug_is_kebab_and_plugin_scoped() {
		$slug = A4A_Client_Abilities::get_category_slug();
		$this->assertSame( 'jetpack-a4a-client', $slug );
		// kebab-case, all lower, no underscores.
		$this->assertMatchesRegularExpression( '/^[a-z][a-z0-9-]*$/', $slug );
	}

	/**
	 * Category definition must carry both label and description, both non-empty.
	 */
	public function test_category_definition_has_label_and_description() {
		$def = A4A_Client_Abilities::get_category_definition();
		$this->assertIsArray( $def );
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', trim( (string) $def['label'] ) );
		$this->assertNotSame( '', trim( (string) $def['description'] ) );
	}

	/**
	 * Only the one read currently backed by local data is registered.
	 */
	public function test_get_abilities_returns_expected_set() {
		$abilities = A4A_Client_Abilities::get_abilities();
		$this->assertIsArray( $abilities );
		$this->assertSame( array( 'jetpack-a4a-client/get-status' ), array_keys( $abilities ) );
	}

	/**
	 * The get-status spec must declare a zero-argument input, read-only
	 * annotations, and must not preset its category (Registrar injects it).
	 */
	public function test_get_status_spec_shape_is_correct() {
		$abilities = A4A_Client_Abilities::get_abilities();
		$spec      = $abilities['jetpack-a4a-client/get-status'];

		$this->assertArrayHasKey( 'label', $spec );
		$this->assertArrayHasKey( 'description', $spec );
		$this->assertArrayHasKey( 'input_schema', $spec );
		$this->assertArrayHasKey( 'output_schema', $spec );
		$this->assertArrayHasKey( 'execute_callback', $spec );
		$this->assertArrayHasKey( 'permission_callback', $spec );
		$this->assertArrayHasKey( 'meta', $spec );

		// Zero-argument: empty object property bag, additionalProperties false.
		$this->assertSame( 'object', $spec['input_schema']['type'] );
		$this->assertFalse( $spec['input_schema']['additionalProperties'] );
		$this->assertInstanceOf( \stdClass::class, $spec['input_schema']['properties'] );

		// Read-only, idempotent, non-destructive.
		$annotations = $spec['meta']['annotations'];
		$this->assertTrue( $annotations['readonly'] );
		$this->assertFalse( $annotations['destructive'] );
		$this->assertTrue( $annotations['idempotent'] );
		$this->assertTrue( $spec['meta']['show_in_rest'] );

		// Registrar should auto-inject the category — spec must not preset it.
		$this->assertArrayNotHasKey( 'category', $spec );
	}

	/**
	 * Output schema must advertise every key the production execute callback returns.
	 */
	public function test_output_schema_advertises_documented_keys() {
		$spec       = A4A_Client_Abilities::get_abilities()['jetpack-a4a-client/get-status'];
		$properties = $spec['output_schema']['properties'];

		$expected = array(
			'plugin_slug',
			'plugin_name',
			'plugin_version',
			'plugin_registered_with_connection',
			'site_connected',
			'user_connected',
			'blog_id',
			'master_user_id',
			'settings_url',
		);
		foreach ( $expected as $key ) {
			$this->assertArrayHasKey( $key, $properties, "Output schema is missing key: $key" );
		}
	}

	/* ---------------- Permission gate ---------------- */

	/**
	 * Administrators have manage_options and should pass the permission gate.
	 */
	public function test_can_view_status_allows_administrator() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( A4A_Client_Abilities::can_view_status() );
	}

	/**
	 * Editors lack manage_options and must be denied.
	 */
	public function test_can_view_status_denies_editor() {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( A4A_Client_Abilities::can_view_status() );
	}

	/**
	 * Anonymous callers must be denied — no public read of connection state.
	 */
	public function test_can_view_status_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( A4A_Client_Abilities::can_view_status() );
	}

	/* ---------------- Execute callback ---------------- */

	/**
	 * Disconnected state returns the documented keys with null/false values
	 * for connection-derived fields and the plugin's settings URL.
	 */
	public function test_get_status_returns_documented_shape_for_disconnected_site() {
		$this->stub_manager( false, false );

		$result = A4A_Client_Abilities::get_status();

		$this->assertIsArray( $result );
		$this->assertSame( 'automattic-for-agencies-client', $result['plugin_slug'] );
		$this->assertNotSame( '', $result['plugin_name'] );
		$this->assertFalse( $result['site_connected'] );
		$this->assertFalse( $result['user_connected'] );
		$this->assertNull( $result['blog_id'] );
		$this->assertNull( $result['master_user_id'] );
		$this->assertStringContainsString( 'page=automattic-for-agencies-client', $result['settings_url'] );
		// plugin_registered_with_connection is a bool — value depends on whether
		// Plugin_Storage::configure has run, which is environment-dependent in
		// dbless tests; only assert it's the right type.
		$this->assertIsBool( $result['plugin_registered_with_connection'] );
	}

	/**
	 * Connection booleans must come from the injected Connection_Manager.
	 */
	public function test_get_status_reflects_connected_state_from_manager() {
		$this->stub_manager( true, true );

		$result = A4A_Client_Abilities::get_status();

		$this->assertTrue( $result['site_connected'] );
		$this->assertTrue( $result['user_connected'] );
	}

	/**
	 * When jetpack_options carries `id` and `master_user`, the payload
	 * surfaces them as integers.
	 */
	public function test_get_status_reads_blog_id_and_master_user_when_options_present() {
		$this->stub_manager( true, true );

		update_option(
			'jetpack_options',
			array(
				'id'          => 12345,
				'master_user' => (int) $this->admin_id,
			)
		);

		try {
			$result = A4A_Client_Abilities::get_status();
			$this->assertSame( 12345, $result['blog_id'] );
			$this->assertSame( (int) $this->admin_id, $result['master_user_id'] );
		} finally {
			delete_option( 'jetpack_options' );
		}
	}

	/**
	 * The ability is declared zero-arg; the callback must still succeed if a
	 * client sends extra input by mistake.
	 */
	public function test_get_status_ignores_extraneous_input() {
		$this->stub_manager( false, false );
		// Ability is zero-arg; passing junk must not break the callback.
		$result = A4A_Client_Abilities::get_status( array( 'unexpected' => 'value' ) );
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'plugin_slug', $result );
	}

	/* ---------------- Registrar wiring ---------------- */

	/**
	 * With the gate filter defaulting to false, init() must not hook either
	 * lifecycle action.
	 */
	public function test_init_is_disabled_by_default() {
		// Default: jetpack_wp_abilities_enabled is false → init() registers nothing.
		// We can't assert "nothing registered" reliably without the Abilities API
		// runtime, but we can assert init() short-circuits cleanly (no exception)
		// and that no lifecycle action hooks were added.
		remove_all_actions( Registrar::CATEGORIES_INIT_ACTION );
		remove_all_actions( Registrar::ABILITIES_INIT_ACTION );

		A4A_Client_Abilities::init();

		$this->assertFalse( has_action( Registrar::CATEGORIES_INIT_ACTION ) );
		$this->assertFalse( has_action( Registrar::ABILITIES_INIT_ACTION ) );
	}

	/**
	 * With the gate filter enabled and neither lifecycle action fired yet,
	 * init() must hook both registration callbacks.
	 */
	public function test_init_hooks_lifecycle_actions_when_filter_enabled() {
		remove_all_actions( Registrar::CATEGORIES_INIT_ACTION );
		remove_all_actions( Registrar::ABILITIES_INIT_ACTION );

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		A4A_Client_Abilities::init();

		$this->assertNotFalse( has_action( Registrar::CATEGORIES_INIT_ACTION, array( A4A_Client_Abilities::class, 'register_category' ) ) );
		$this->assertNotFalse( has_action( Registrar::ABILITIES_INIT_ACTION, array( A4A_Client_Abilities::class, 'register_abilities' ) ) );
	}
}
