<?php
/**
 * Tests for Blaze_Abilities — registration, the write-path wrapper,
 * inheritance behaviour, and the audit-log listener.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; tests gate with markTestSkipped() when the API isn't loaded in the test environment.

namespace Automattic\Jetpack\Blaze\Abilities;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Blaze\Abilities\Blaze_Abilities
 */
#[CoversClass( Blaze_Abilities::class )]
class Blaze_Abilities_Test extends BaseTestCase {

	/**
	 * Synthetic site ID used by Connection_Manager::get_site_id() and
	 * by the Blaze::site_supports_blaze() transient lookup.
	 *
	 * @var int
	 */
	private const TEST_SITE_ID = 12345;

	/**
	 * Original `wp_register_ability_args` filter callbacks, captured so
	 * we can restore them after each test.
	 *
	 * @var array|null
	 */
	private $original_args_filter;

	/**
	 * Set up: connect a synthetic site so Connection_Manager::get_site_id()
	 * resolves, and pre-populate the Blaze eligibility transient so the
	 * TOS check has a deterministic answer per test.
	 */
	public function set_up() {
		Jetpack_Options::update_option( 'id', self::TEST_SITE_ID );

		// Default: site is eligible. Individual tests can override.
		set_transient(
			'jetpack_blaze_site_supports_blaze_' . self::TEST_SITE_ID,
			array( 'approved' => true ),
			DAY_IN_SECONDS
		);
	}

	/**
	 * Tear down: clear the transient and any filter we may have added.
	 */
	public function tear_down() {
		delete_transient( 'jetpack_blaze_site_supports_blaze_' . self::TEST_SITE_ID );
		Jetpack_Options::delete_option( 'id' );
		remove_all_filters( 'wp_register_ability_args' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'blaze_abilities_create_campaign_enabled' );
		remove_all_actions( 'wp_after_execute_ability' );
	}

	// --- Wrapper: shape and identity behaviour ---

	/**
	 * Args for an ability we don't own should pass through unchanged.
	 */
	public function test_wrapper_passes_through_unowned_abilities() {
		$callback = static function () {
			return 'untouched';
		};
		$args     = array(
			'execute_callback' => $callback,
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, 'jetpack-forms/get-responses' );

		$this->assertSame( $callback, $result['execute_callback'], 'Unowned-ability callback must be left alone.' );
	}

	/**
	 * Args for an owned read-only ability should pass through unchanged.
	 */
	public function test_wrapper_passes_through_read_only_owned_abilities() {
		$callback = static function () {
			return 'list-result';
		};
		$args     = array(
			'execute_callback' => $callback,
			'meta'             => array( 'annotations' => array( 'readonly' => true ) ),
		);

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_LIST_CAMPAIGNS );

		$this->assertSame( $callback, $result['execute_callback'], 'Read-only owned-ability callback must be left alone.' );
	}

	/**
	 * Args missing an execute_callback are returned unchanged (defensive —
	 * no closure to wrap).
	 */
	public function test_wrapper_no_op_when_callback_missing() {
		$args = array(
			'meta' => array( 'annotations' => array( 'readonly' => false ) ),
		);

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );

		$this->assertSame( $args, $result, 'Missing callback should leave args untouched.' );
	}

	/**
	 * Args for an owned write ability must come back with a different
	 * execute_callback (i.e. the wrapper actually swapped it).
	 */
	public function test_wrapper_replaces_callback_for_write_abilities() {
		$callback = static function () {
			return 'original-result';
		};
		$args     = array(
			'execute_callback' => $callback,
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );

		$this->assertNotSame( $callback, $result['execute_callback'], 'Write-ability callback must be wrapped.' );
		$this->assertIsCallable( $result['execute_callback'] );
	}

	// --- Wrapped callback: TOS gate + delegation ---

	/**
	 * When the site is Blaze-eligible the wrapper delegates to the
	 * original callback and forwards its return value.
	 */
	public function test_wrapped_callback_delegates_when_tos_passes() {
		set_transient(
			'jetpack_blaze_site_supports_blaze_' . self::TEST_SITE_ID,
			array( 'approved' => true ),
			DAY_IN_SECONDS
		);

		$received_input = null;
		$callback       = static function ( $input ) use ( &$received_input ) {
			$received_input = $input;
			return array( 'campaign_id' => 'abc-123' );
		};
		$args           = array(
			'execute_callback' => $callback,
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);

		$wrapped = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );
		$result  = call_user_func( $wrapped['execute_callback'], array( 'budget_total' => 50 ) );

		$this->assertSame( array( 'campaign_id' => 'abc-123' ), $result, 'Original callback result should pass through unchanged.' );
		$this->assertSame( array( 'budget_total' => 50 ), $received_input, 'Original callback should receive the original input.' );
	}

	/**
	 * When the site is NOT Blaze-eligible the wrapper short-circuits with
	 * a WP_Error before invoking the original callback. The deep-link must
	 * appear in the message text (the Woo MCP adapter strips
	 * WP_Error::data, so message is the only field that reaches MCP
	 * clients).
	 */
	public function test_wrapped_callback_aborts_when_tos_fails() {
		set_transient(
			'jetpack_blaze_site_supports_blaze_' . self::TEST_SITE_ID,
			array( 'approved' => false ),
			HOUR_IN_SECONDS
		);

		$called   = false;
		$callback = static function () use ( &$called ) {
			$called = true;
			return array( 'campaign_id' => 'should-not-happen' );
		};
		$args     = array(
			'execute_callback' => $callback,
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);

		$wrapped = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );
		$result  = call_user_func( $wrapped['execute_callback'], array( 'budget_total' => 50 ) );

		$this->assertFalse( $called, 'Original callback must not run when TOS check fails.' );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_setup_required', $result->get_error_code() );

		$message = $result->get_error_message();
		$fix_url = admin_url( 'tools.php?page=advertising' );
		$this->assertStringContainsString( $fix_url, $message, 'Deep-link URL must be embedded in the error message text — the Woo MCP adapter strips WP_Error::data.' );

		$data = $result->get_error_data();
		$this->assertIsArray( $data );
		$this->assertSame( $fix_url, $data['fix_url'] ?? null, 'Belt-and-braces: data field still carries the fix_url for direct REST callers.' );
	}

	// --- Inheritance: synthetic write ability gets the same treatment ---

	/**
	 * The wrapper is keyed on `meta.annotations.readonly === false` and
	 * `OWNED_ABILITY_SLUGS`. To prove future Phase 3 abilities inherit it
	 * for free, this test uses a fictional slug as if it were owned and
	 * confirms the wrapper would apply.
	 *
	 * (We can't actually add a slug to the OWNED_ABILITY_SLUGS const at
	 * runtime — instead this test documents that *adding* a new write
	 * slug to that array is the only step a Phase 3 ability has to take
	 * to inherit the guardrails.)
	 */
	public function test_inheritance_documented_via_owned_slugs_constant() {
		$owned = Blaze_Abilities::OWNED_ABILITY_SLUGS;
		$this->assertContains( Blaze_Abilities::ABILITY_LIST_CAMPAIGNS, $owned );
		$this->assertContains( Blaze_Abilities::ABILITY_CREATE_CAMPAIGN, $owned );

		// Sanity: anything in OWNED_ABILITY_SLUGS that's a write ability gets
		// wrapped. We exercise create-campaign here as the canonical write slug.
		$args = array(
			'execute_callback' => static function () {
				return 'x';
			},
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);
		$out  = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );
		$this->assertNotSame( $args['execute_callback'], $out['execute_callback'] );
	}

	// --- Kill-switch ---

	/**
	 * Filter returning false on `blaze_abilities_create_campaign_enabled`
	 * makes the double-register guard refuse to register the slug —
	 * MCP clients won't see the tool, REST callers get 404.
	 */
	public function test_kill_switch_drops_create_campaign_registration() {
		add_filter( 'blaze_abilities_create_campaign_enabled', '__return_false' );

		$enabled = Blaze_Abilities::guard_against_double_register( true, 'ability', Blaze_Abilities::ABILITY_CREATE_CAMPAIGN );

		$this->assertFalse( $enabled, 'Kill-switch must drop create-campaign registration when set to false.' );
	}

	/**
	 * Kill-switch is scoped to create-campaign — the read-only
	 * list-campaigns ability is unaffected.
	 */
	public function test_kill_switch_does_not_affect_list_campaigns() {
		add_filter( 'blaze_abilities_create_campaign_enabled', '__return_false' );

		$enabled = Blaze_Abilities::guard_against_double_register( true, 'ability', Blaze_Abilities::ABILITY_LIST_CAMPAIGNS );

		$this->assertTrue( $enabled, 'Kill-switch must only affect create-campaign.' );
	}

	// --- Woo MCP opt-in ---

	/**
	 * Both owned slugs are opted into Woo's MCP whitelist; foreign slugs
	 * are passed through unchanged.
	 */
	public function test_opt_into_woo_mcp_for_owned_slugs() {
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( false, Blaze_Abilities::ABILITY_LIST_CAMPAIGNS ) );
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( false, Blaze_Abilities::ABILITY_CREATE_CAMPAIGN ) );

		// Foreign slug, default false — should remain false (we don't toggle other people's abilities on).
		$this->assertFalse( Blaze_Abilities::opt_into_woo_mcp( false, 'jetpack-forms/get-responses' ) );
		// Foreign slug, default true (Woo's own) — should remain true.
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( true, 'woocommerce/list-products' ) );
	}
}
