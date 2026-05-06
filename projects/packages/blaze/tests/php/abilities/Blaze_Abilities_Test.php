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
		remove_all_filters( 'blaze_abilities_prepare_campaign_enabled' );
		remove_all_actions( 'wp_after_execute_ability' );
	}

	// --- list-campaigns read ability ---

	/**
	 * Category metadata is stable for clients that group MCP tools.
	 */
	public function test_category_definition() {
		$this->assertSame( 'blaze-ads', Blaze_Abilities::get_category_slug() );
		$this->assertSame(
			array(
				'label'       => 'Blaze',
				'description' => 'Abilities for managing Blaze ad campaigns.',
			),
			Blaze_Abilities::get_category_definition()
		);
	}

	/**
	 * The list-campaigns ability is read-only and has the expected public contract.
	 */
	public function test_list_campaigns_ability_definition() {
		$abilities = Blaze_Abilities::get_abilities();

		$this->assertArrayHasKey( Blaze_Abilities::ABILITY_LIST_CAMPAIGNS, $abilities );

		$ability = $abilities[ Blaze_Abilities::ABILITY_LIST_CAMPAIGNS ];
		$this->assertSame( array( Blaze_Abilities::class, 'list_campaigns' ), $ability['execute_callback'] );
		$this->assertSame( array( Blaze_Abilities::class, 'permission_callback' ), $ability['permission_callback'] );
		$this->assertTrue( $ability['meta']['show_in_rest'] );
		$this->assertTrue( $ability['meta']['annotations']['readonly'] );
		$this->assertFalse( $ability['meta']['annotations']['destructive'] );
		$this->assertTrue( $ability['meta']['annotations']['idempotent'] );
		$this->assertFalse( $ability['input_schema']['additionalProperties'] );
	}

	/**
	 * The double-register guard preserves an existing disabled decision.
	 */
	public function test_guard_against_double_register_preserves_disabled_decision() {
		$this->assertFalse(
			Blaze_Abilities::guard_against_double_register( false, 'ability', Blaze_Abilities::ABILITY_LIST_CAMPAIGNS )
		);
		$this->assertTrue(
			Blaze_Abilities::guard_against_double_register( true, 'category', Blaze_Abilities::ABILITY_LIST_CAMPAIGNS )
		);
	}

	/**
	 * List_campaigns delegates to the existing Blaze REST route and returns its data.
	 */
	public function test_list_campaigns_delegates_to_blaze_rest_route() {
		register_rest_route(
			'jetpack/v4',
			'/blaze-app/sites/' . self::TEST_SITE_ID . '/wordads/dsp/api/v1.1/campaigns',
			array(
				'methods'             => 'GET',
				'callback'            => static function ( $request ) {
					return array(
						'api_version' => $request->get_param( 'api_version' ),
						'campaigns'   => array(
							array(
								'id'     => 'campaign-1',
								'status' => 'active',
							),
						),
					);
				},
				'permission_callback' => '__return_true',
			)
		);

		$this->assertSame(
			array(
				'api_version' => 'v1.1',
				'campaigns'   => array(
					array(
						'id'     => 'campaign-1',
						'status' => 'active',
					),
				),
			),
			Blaze_Abilities::list_campaigns()
		);
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

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );

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

		$result = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );

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

		$wrapped = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );
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

		$wrapped = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );
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
		$this->assertContains( Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN, $owned );

		// Sanity: anything in OWNED_ABILITY_SLUGS that's a write ability gets
		// wrapped. We exercise prepare-campaign here as the canonical write slug.
		$args = array(
			'execute_callback' => static function () {
				return 'x';
			},
			'meta'             => array( 'annotations' => array( 'readonly' => false ) ),
		);
		$out  = Blaze_Abilities::wrap_write_path_execute_callback( $args, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );
		$this->assertNotSame( $args['execute_callback'], $out['execute_callback'] );
	}

	// --- Kill-switch ---

	/**
	 * Filter returning false on `blaze_abilities_prepare_campaign_enabled`
	 * makes the double-register guard refuse to register the slug —
	 * MCP clients won't see the tool, REST callers get 404.
	 */
	public function test_kill_switch_drops_prepare_campaign_registration() {
		add_filter( 'blaze_abilities_prepare_campaign_enabled', '__return_false' );

		$enabled = Blaze_Abilities::guard_against_double_register( true, 'ability', Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN );

		$this->assertFalse( $enabled, 'Kill-switch must drop prepare-campaign registration when set to false.' );
	}

	/**
	 * Kill-switch is scoped to prepare-campaign — the read-only
	 * list-campaigns ability is unaffected.
	 */
	public function test_kill_switch_does_not_affect_list_campaigns() {
		add_filter( 'blaze_abilities_prepare_campaign_enabled', '__return_false' );

		$enabled = Blaze_Abilities::guard_against_double_register( true, 'ability', Blaze_Abilities::ABILITY_LIST_CAMPAIGNS );

		$this->assertTrue( $enabled, 'Kill-switch must only affect prepare-campaign.' );
	}

	// --- Woo MCP opt-in ---

	/**
	 * Both owned slugs are opted into Woo's MCP whitelist; foreign slugs
	 * are passed through unchanged.
	 */
	public function test_opt_into_woo_mcp_for_owned_slugs() {
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( false, Blaze_Abilities::ABILITY_LIST_CAMPAIGNS ) );
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( false, Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN ) );

		// Foreign slug, default false — should remain false (we don't toggle other people's abilities on).
		$this->assertFalse( Blaze_Abilities::opt_into_woo_mcp( false, 'jetpack-forms/get-responses' ) );
		// Foreign slug, default true (Woo's own) — should remain true.
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( true, 'woocommerce/list-products' ) );
	}

	// --- prepare-campaign public schema ---

	/**
	 * The public write ability is prepare-campaign and its MCP-facing
	 * input contract requires only the target. Budget/duration are
	 * optional hints, and the raw DSP objective stays server-owned.
	 */
	public function test_prepare_campaign_schema_is_minimal_and_renamed() {
		$abilities = Blaze_Abilities::get_abilities();

		$this->assertArrayHasKey( 'blaze-ads/prepare-campaign', $abilities );
		$this->assertStringContainsString( 'Audience overrides must use stable codes or closed enums', $abilities[ Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN ]['description'] );

		$schema     = $abilities[ Blaze_Abilities::ABILITY_PREPARE_CAMPAIGN ]['input_schema'];
		$properties = $schema['properties'];

		$this->assertSame( array( 'target_urn' ), $schema['required'] );
		$this->assertFalse( $schema['additionalProperties'] );
		$this->assertArrayHasKey( 'goal', $properties );
		$this->assertArrayHasKey( 'budget_total', $properties );
		$this->assertArrayHasKey( 'duration_days', $properties );
		$this->assertArrayHasKey( 'revision_instruction', $properties );
		$this->assertArrayHasKey( 'site_name', $properties );
		$this->assertArrayHasKey( 'text_snippet', $properties );
		$this->assertArrayHasKey( 'cta_text', $properties );
		$this->assertArrayHasKey( 'main_image_url', $properties );
		$this->assertArrayHasKey( 'languages', $properties );
		$this->assertArrayHasKey( 'countries', $properties );
		$this->assertArrayHasKey( 'devices', $properties );
		$this->assertArrayHasKey( 'interests', $properties );
		$this->assertArrayNotHasKey( 'objective', $properties );
		$this->assertArrayNotHasKey( 'page_topics', $properties );
		$this->assertStringContainsString( 'ISO 639-1', $properties['languages']['description'] );
		$this->assertStringContainsString( 'ISO 3166-1 alpha-2', $properties['countries']['description'] );
		$this->assertSame( array( 'zh', 'nl', 'en', 'fr', 'de', 'hi', 'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'es', 'tr' ), $properties['languages']['items']['enum'] );
		$this->assertSame( 1, $properties['devices']['maxItems'] );
		$this->assertSame( array( 'mobile', 'desktop' ), $properties['devices']['items']['enum'] );
		$this->assertStringContainsString( 'Tablet is not exposed', $properties['devices']['description'] );
		$this->assertStringContainsString( 'IAB category IDs', $properties['interests']['description'] );
	}

	// --- prepare_campaign: prefill payload + URL ---

	/**
	 * Helper: insert a test post and return its ID. Returns the
	 * synthetic URN that callers should pass to prepare_campaign.
	 */
	private function make_test_post( array $overrides = array() ): array {
		$post_id = wp_insert_post(
			array_merge(
				array(
					'post_title'   => 'Test product page',
					'post_excerpt' => 'A short summary about the product.',
					'post_content' => 'Long-form content that would otherwise be the fallback snippet source.',
					'post_status'  => 'publish',
					'post_type'    => 'post',
				),
				$overrides
			)
		);
		return array(
			'post_id'    => (int) $post_id,
			'target_urn' => sprintf( 'urn:wpcom:post:%d:%d', self::TEST_SITE_ID, (int) $post_id ),
		);
	}

	/**
	 * Invalid target_urn returns a WP_Error with status 400, not a partial proposal.
	 */
	public function test_prepare_campaign_returns_error_for_invalid_target_urn() {
		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn' => 'not-a-urn',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_invalid_target_urn', $result->get_error_code() );
		$data = $result->get_error_data();
		$this->assertSame( 400, $data['status'] ?? null );
	}

	/**
	 * URN that parses but references a missing post returns a 404 WP_Error.
	 */
	public function test_prepare_campaign_returns_error_for_missing_post() {
		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn' => sprintf( 'urn:wpcom:post:%d:9999999', self::TEST_SITE_ID ),
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_post_not_found', $result->get_error_code() );
		$data = $result->get_error_data();
		$this->assertSame( 404, $data['status'] ?? null );
	}

	/**
	 * Happy path: returns the canonical pending-review shape with
	 * prefill_url + prefill payload, and the defaults are pulled from
	 * the target post.
	 */
	public function test_prepare_campaign_returns_prefill_payload_and_url() {
		$ctx = $this->make_test_post();

		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn'    => $ctx['target_urn'],
				'budget_total'  => 50,
				'duration_days' => 14,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'pending_merchant_review', $result['status'] );
		$this->assertNotEmpty( $result['prefill_url'] );
		$this->assertStringContainsString( 'blaze_prefill=', $result['prefill_url'] );
		$this->assertStringContainsString( $result['prefill_url'], $result['message'] );

		$prefill = $result['prefill'];
		$this->assertSame( $ctx['target_urn'], $prefill['target_urn'] );
		$this->assertSame( 'post', $prefill['type'] );
		$this->assertSame( 'Test product page', $prefill['site_name'] );
		$this->assertSame( 'A short summary about the product.', $prefill['text_snippet'] );
		$this->assertSame( 50.0, $prefill['budget']['amount'] );
		$this->assertSame( 'total', $prefill['budget']['mode'] );
		$this->assertSame( 14, $prefill['duration_days'] );
		$this->assertTrue( $prefill['is_evergreen'] );
		$this->assertSame( 'VIEWS', $prefill['objective'] );
	}

	/**
	 * Minimal input is enough to prepare a proposal. Budget/duration
	 * defaults stay server-owned for this slice.
	 */
	public function test_prepare_campaign_accepts_minimal_input() {
		$ctx = $this->make_test_post();

		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn' => $ctx['target_urn'],
			)
		);

		$this->assertIsArray( $result );
		$prefill = $result['prefill'];
		$this->assertSame( 50.0, $prefill['budget']['amount'] );
		$this->assertSame( 7, $prefill['duration_days'] );
		$this->assertSame( 'VIEWS', $prefill['objective'] );
	}

	/**
	 * Caller overrides take precedence over post-derived defaults.
	 */
	public function test_prepare_campaign_caller_overrides_win() {
		$ctx = $this->make_test_post();

		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn'           => $ctx['target_urn'],
				'budget_total'         => 100,
				'duration_days'        => 30,
				'site_name'            => 'Custom heading',
				'text_snippet'         => 'Custom ad copy.',
				'cta_text'             => 'Buy now',
				'goal'                 => 'Drive sales for a spring promotion.',
				'revision_instruction' => 'Make it less salesy.',
				'main_image_url'       => 'https://example.com/custom.jpg',
				'main_image_mime_type' => 'image/jpeg',
				'is_evergreen'         => false,
			)
		);

		$this->assertIsArray( $result );
		$prefill = $result['prefill'];
		$this->assertSame( 'Custom heading', $prefill['site_name'] );
		$this->assertSame( 'Custom ad copy.', $prefill['text_snippet'] );
		$this->assertSame( 'Buy now', $prefill['cta_text'] );
		$this->assertSame( 'Drive sales for a spring promotion.', $prefill['goal'] );
		$this->assertSame( 'Make it less salesy.', $prefill['revision_instruction'] );
		$this->assertSame( 'https://example.com/custom.jpg', $prefill['main_image']['url'] );
		$this->assertSame( 'VIEWS', $prefill['objective'], 'DSP objective is server-owned and not overridden by public input.' );
		$this->assertFalse( $prefill['is_evergreen'] );
	}

	/**
	 * When the post has no excerpt, the text_snippet falls back to the
	 * stripped + truncated post content. This proves we don't return an
	 * empty snippet (which the widget would surface as an empty heading).
	 */
	public function test_prepare_campaign_falls_back_to_stripped_content_when_no_excerpt() {
		$ctx = $this->make_test_post(
			array(
				'post_excerpt' => '',
				'post_content' => '<p><strong>Hello world.</strong></p> Long-form HTML body that should be stripped.',
			)
		);

		$result = Blaze_Abilities::prepare_campaign(
			array(
				'target_urn'    => $ctx['target_urn'],
				'budget_total'  => 50,
				'duration_days' => 7,
			)
		);

		$this->assertIsArray( $result );
		$snippet = $result['prefill']['text_snippet'];
		$this->assertNotEmpty( $snippet );
		$this->assertStringContainsString( 'Hello world.', $snippet );
		$this->assertStringNotContainsString( '<strong>', $snippet );
	}
}
