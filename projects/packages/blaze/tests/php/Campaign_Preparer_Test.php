<?php
/**
 * Tests for the reusable Blaze campaign preparer.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Blaze\Campaign_Preparer
 */
#[CoversClass( Campaign_Preparer::class )]
class Campaign_Preparer_Test extends BaseTestCase {

	/**
	 * Synthetic site ID used in target URNs.
	 *
	 * @var int
	 */
	private const TEST_SITE_ID = 12345;

	/**
	 * Set up a synthetic connected site ID.
	 */
	public function set_up() {
		Jetpack_Options::update_option( 'id', self::TEST_SITE_ID );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
	}

	/**
	 * Clear synthetic connection state.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'id' );
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_blaze_prepare_campaign_has_saved_payment_method' );
	}

	/**
	 * Helper: insert a test post and return its ID and target URN.
	 *
	 * @param array $overrides Post field overrides.
	 * @return array
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
	 * Register a test forecast route that captures the preparer's proxied DSP request.
	 *
	 * @param callable $callback Route callback.
	 */
	private function register_forecast_route( callable $callback ) {
		register_rest_route(
			'jetpack/v4/blaze-app',
			sprintf( '/sites/%d/wordads/dsp/api/v1.1/forecast', self::TEST_SITE_ID ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => $callback,
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Mock the public WordPress.com site lookup used by portable target inputs.
	 *
	 * @param string $expected_site_url Expected site URL.
	 * @param array  $response          Mock HTTP response.
	 */
	private function mock_site_lookup( string $expected_site_url, array $response ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $expected_site_url, $response ) {
				$expected_path = '/rest/v1.1/sites/' . rawurlencode( $expected_site_url );

				if ( false !== strpos( $url, $expected_path ) ) {
					return $response;
				}

				return $preempt;
			},
			10,
			3
		);
	}

	/**
	 * The preparer returns reusable structured data and leaves MCP-specific
	 * human-readable messaging to the ability adapter.
	 */
	public function test_prepare_returns_structured_proposal_without_mcp_message() {
		$ctx = $this->make_test_post();

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn'    => $ctx['target_urn'],
				'budget_total'  => 75,
				'duration_days' => 10,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'pending_merchant_review', $result['status'] );
		$this->assertArrayHasKey( 'prefill_url', $result );
		$this->assertArrayHasKey( 'prefill', $result );
		$this->assertArrayNotHasKey( 'message', $result );
		$this->assertStringContainsString( 'blaze_prefill=', $result['prefill_url'] );

		$prefill = $result['prefill'];
		$this->assertSame( $ctx['target_urn'], $prefill['target_urn'] );
		$this->assertSame( 'Test product page', $prefill['site_name'] );
		$this->assertSame( 'A short summary about the product.', $prefill['text_snippet'] );
		$this->assertSame( 75.0, $prefill['budget']['amount'] );
		$this->assertSame( 10, $prefill['duration_days'] );
		$this->assertSame( 'content', $result['intent'] );
		$this->assertArrayHasKey( 'assumptions', $result );
		$this->assertArrayHasKey( 'recommendations', $result );
		$this->assertArrayNotHasKey( 'budget_options', $result );
	}

	/**
	 * Chat clients get a complete Blaze-owned package without composing ad HTML
	 * or campaign defaults themselves.
	 */
	public function test_prepare_returns_chat_ready_prepared_campaign_package() {
		add_filter( 'jetpack_blaze_prepare_campaign_has_saved_payment_method', '__return_true' );

		$ctx = $this->make_test_post();

		$args = array(
			'target_urn'    => $ctx['target_urn'],
			'budget_total'  => 75,
			'duration_days' => 10,
			'languages'     => array( 'en', 'es' ),
			'countries'     => array( 'US' ),
			'devices'       => array( 'mobile' ),
			'interests'     => array( 'IAB8_IAB18' ),
		);

		$result = Campaign_Preparer::prepare( $args );
		$again  = Campaign_Preparer::prepare( $args );

		$this->assertIsArray( $result );
		$this->assertIsArray( $again );

		$this->assertArrayHasKey( 'prepared_campaign', $result );
		$this->assertSame( $result['prepared_campaign'], $again['prepared_campaign'] );
		$this->assertSame( 1, preg_match( '/^[a-f0-9]{64}$/', $result['prepared_campaign']['hash'] ) );
		$this->assertSame( $result['prepared_campaign']['hash'], $result['prepared_campaign']['id'] );
		$this->assertSame( 'v1', $result['prepared_campaign']['version'] );

		$this->assertArrayHasKey( 'rendered_preview', $result );
		$this->assertSame( 'html', $result['rendered_preview']['type'] );
		$this->assertStringContainsString( 'data-blaze-prepared-campaign-id="' . $result['prepared_campaign']['id'] . '"', $result['rendered_preview']['html'] );
		$this->assertStringContainsString( 'Test product page', $result['rendered_preview']['html'] );
		$this->assertStringContainsString( 'A short summary about the product.', $result['rendered_preview']['html'] );

		$this->assertSame( $result['prefill_url'], $result['fallback_url'] );

		$summary = $result['campaign_summary'];
		foreach ( array( 'destination', 'creative', 'budget', 'cadence', 'schedule', 'targeting_summary', 'source_context' ) as $section ) {
			$this->assertArrayHasKey( $section, $summary );
		}
		$this->assertSame( get_permalink( $ctx['post_id'] ), $summary['destination']['url'] );
		$this->assertSame( 'Test product page', $summary['creative']['heading'] );
		$this->assertSame( 'A short summary about the product.', $summary['creative']['copy'] );
		$this->assertSame( 75.0, $summary['budget']['total']['amount'] );
		$this->assertSame( 10, $summary['cadence']['duration_days'] );
		$this->assertSame( array( 'US' ), $summary['targeting_summary']['countries'] );
		$this->assertSame( array( 'en', 'es' ), $summary['targeting_summary']['languages'] );
		$this->assertSame( array( 'mobile' ), $summary['targeting_summary']['devices'] );
		$this->assertSame( $ctx['target_urn'], $summary['source_context']['target_urn'] );
		$this->assertSame( 'post', $summary['source_context']['post_type'] );

		$this->assertTrue( $result['submit_eligibility']['chat_native_submit'] );
		$this->assertSame( 'saved_payment_method', $result['submit_eligibility']['payment_method'] );
		$this->assertArrayHasKey( 'approval_block', $result );
		$this->assertSame( $result['prepared_campaign']['id'], $result['approval_block']['prepared_campaign_id'] );
		$this->assertSame( 'blaze.approval.confirm_prepared_campaign', $result['approval_block']['confirmation_label_key'] );

		$this->assertTrue( $result['material_edit_policy']['requires_reprepare'] );
		$this->assertContains( 'creative', $result['material_edit_policy']['material_fields'] );
		$this->assertContains( 'budget', $result['material_edit_policy']['material_fields'] );
		$this->assertContains( 'targeting', $result['material_edit_policy']['material_fields'] );
	}

	/**
	 * Product targets get ecommerce-oriented defaults and conservative budget
	 * options when budget or duration is omitted.
	 */
	public function test_prepare_infers_ecommerce_intent_and_budget_options_for_products() {
		$ctx = $this->make_test_post(
			array(
				'post_type' => 'product',
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $ctx['target_urn'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'ecommerce', $result['intent'] );
		$this->assertSame( 'CLICKS', $result['prefill']['objective'] );
		$this->assertSame( 50.0, $result['prefill']['budget']['amount'] );
		$this->assertSame( 7, $result['prefill']['duration_days'] );
		$this->assertArrayHasKey( 'budget_options', $result );
		$this->assertCount( 3, $result['budget_options'] );
		$this->assertSame( array( 'lower', 'recommended', 'higher' ), wp_list_pluck( $result['budget_options'], 'key' ) );

		$recommended = $result['budget_options'][1];
		$this->assertSame( 'recommended', $recommended['key'] );
		$this->assertSame( 50.0, $recommended['budget']['amount'] );
		$this->assertSame( 7.14, $recommended['daily_budget']['amount'] );
		$this->assertSame( 7, $recommended['duration_days'] );
		$this->assertStringContainsString( 'conservative', strtolower( $recommended['rationale'] ) );

		$higher = $result['budget_options'][2];
		$this->assertSame( 150.0, $higher['budget']['amount'] );
		$this->assertStringContainsString( 'more reach', strtolower( $higher['rationale'] ) );
		$this->assertStringContainsString( 'product', implode( ' ', $result['assumptions'] ) );
	}

	/**
	 * Forecast requests use the DSP v1.1 forecast body shape and ecommerce
	 * responses emphasize clicks before visibility.
	 */
	public function test_prepare_adds_click_first_forecast_for_ecommerce_intent() {
		$ctx           = $this->make_test_post( array( 'post_type' => 'product' ) );
		$captured_body = null;
		$this->register_forecast_route(
			static function ( WP_REST_Request $request ) use ( &$captured_body ) {
				$captured_body = json_decode( $request->get_body(), true );
				return array(
					'total_impressions_min'     => 1200,
					'total_impressions_max'     => 2400,
					'total_clicks_min'          => 30,
					'total_clicks_max'          => 60,
					'total_tsp_impressions_min' => 100,
					'total_tsp_impressions_max' => 200,
				);
			}
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn'    => $ctx['target_urn'],
				'budget_total'  => 80,
				'duration_days' => 8,
				'languages'     => array( 'en' ),
				'devices'       => array( 'mobile' ),
				'interests'     => array( 'IAB8_IAB18' ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertIsArray( $captured_body );
		$captured_body = is_array( $captured_body ) ? $captured_body : array();
		$this->assertSame(
			array(
				'time_zone',
				'start_date',
				'end_date',
				'total_budget',
				'is_evergreen',
				'is_tsp_eligible',
				'targeting',
			),
			array_keys( $captured_body )
		);
		$this->assertSame( 80, $captured_body['total_budget'] );
		$this->assertSame( gmdate( 'Y-m-d' ), $captured_body['start_date'] );
		$this->assertSame( gmdate( 'Y-m-d', strtotime( '+7 days' ) ), $captured_body['end_date'] );
		$this->assertSame(
			array(
				'locations'   => array(),
				'languages'   => array( 'en' ),
				'devices'     => array( 'mobile' ),
				'page_topics' => array( 'IAB8_IAB18' ),
			),
			$captured_body['targeting']
		);

		$this->assertSame( 'available', $result['forecast']['status'] );
		$this->assertSame( 'clicks', $result['forecast']['primary_metric'] );
		$this->assertSame( 'views', $result['forecast']['secondary_metric'] );
		$this->assertSame(
			array(
				'min' => 30,
				'max' => 60,
			),
			$result['forecast']['clicks']
		);
		$this->assertSame(
			array(
				'min' => 1200,
				'max' => 2400,
			),
			$result['forecast']['views']
		);
		$this->assertSame(
			array(
				'min' => 1200,
				'max' => 2400,
			),
			$result['forecast']['impressions']
		);
	}

	/**
	 * Content forecasts put visibility first and clicks second.
	 */
	public function test_prepare_adds_view_first_forecast_for_content_intent() {
		$ctx = $this->make_test_post( array( 'post_type' => 'post' ) );
		$this->register_forecast_route(
			static function () {
				return array(
					'total_impressions_min'     => 5000,
					'total_impressions_max'     => 8000,
					'total_clicks_min'          => 20,
					'total_clicks_max'          => 35,
					'total_tsp_impressions_min' => 0,
					'total_tsp_impressions_max' => 0,
				);
			}
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $ctx['target_urn'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'content', $result['intent'] );
		$this->assertSame( 'available', $result['forecast']['status'] );
		$this->assertSame( 'views', $result['forecast']['primary_metric'] );
		$this->assertSame( 'clicks', $result['forecast']['secondary_metric'] );
	}

	/**
	 * Forecast failure does not block the proposal or review URL.
	 */
	public function test_prepare_degrades_gracefully_when_forecast_fails() {
		$ctx = $this->make_test_post();
		$this->register_forecast_route(
			static function () {
				return new WP_Error( 'forecast_unavailable', 'Forecast failed.', array( 'status' => 500 ) );
			}
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $ctx['target_urn'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'pending_merchant_review', $result['status'] );
		$this->assertStringContainsString( 'blaze_prefill=', $result['prefill_url'] );
		$this->assertSame( 'unavailable', $result['forecast']['status'] );
		$this->assertSame( 'forecast_unavailable', $result['forecast']['reason'] );
	}

	/**
	 * Content targets retain visibility-oriented defaults.
	 */
	public function test_prepare_infers_content_intent_for_posts_and_pages() {
		$post = $this->make_test_post(
			array(
				'post_type' => 'post',
			)
		);
		$page = $this->make_test_post(
			array(
				'post_type' => 'page',
			)
		);

		$post_result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $post['target_urn'],
			)
		);
		$page_result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $page['target_urn'],
			)
		);

		$this->assertSame( 'content', $post_result['intent'] );
		$this->assertSame( 'content', $page_result['intent'] );
		$this->assertSame( 'VIEWS', $post_result['prefill']['objective'] );
		$this->assertSame( 'VIEWS', $page_result['prefill']['objective'] );
	}

	/**
	 * Unknown target types stay explicit so future intelligence can handle them
	 * without pretending the preparer knows more than it does.
	 */
	public function test_prepare_infers_unknown_intent_for_custom_post_types() {
		$ctx = $this->make_test_post(
			array(
				'post_type' => 'portfolio_item',
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $ctx['target_urn'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'unknown', $result['intent'] );
		$this->assertSame( 'VIEWS', $result['prefill']['objective'] );
		$this->assertStringContainsString( 'portfolio_item', implode( ' ', $result['assumptions'] ) );
	}

	/**
	 * Natural-language goals can steer the inferred intent, and revision notes
	 * remain visible as preparation assumptions.
	 */
	public function test_prepare_uses_goal_and_revision_instruction_in_assumptions() {
		$ctx = $this->make_test_post(
			array(
				'post_type' => 'post',
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn'           => $ctx['target_urn'],
				'goal'                 => 'Drive sales for a weekend offer.',
				'revision_instruction' => 'Make the copy less salesy.',
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 'ecommerce', $result['intent'] );
		$this->assertSame( 'CLICKS', $result['prefill']['objective'] );
		$this->assertStringContainsString( 'goal', strtolower( implode( ' ', $result['assumptions'] ) ) );
		$this->assertStringContainsString( 'Drive sales for a weekend offer.', implode( ' ', $result['assumptions'] ) );
		$this->assertStringContainsString( 'Make the copy less salesy.', implode( ' ', $result['assumptions'] ) );
	}

	/**
	 * Caller overrides and targeting hints are normalized by the preparer.
	 */
	public function test_prepare_applies_overrides_and_targeting_hints() {
		$ctx = $this->make_test_post(
			array(
				'post_type' => 'product',
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn'           => $ctx['target_urn'],
				'budget_total'         => 150,
				'duration_days'        => 7,
				'site_name'            => 'Custom heading',
				'text_snippet'         => 'Custom ad copy.',
				'goal'                 => 'Drive sales in the UK.',
				'revision_instruction' => 'Make it more direct.',
				'main_image_url'       => 'https://example.com/custom.jpg',
				'main_image_mime_type' => 'image/jpeg',
				'languages'            => array( 'EN', '', 'es', 'xx' ),
				'countries'            => array( 'gb', 'usa', 'FR' ),
				'devices'              => array( 'mobile', 'tablet', 'spaceship' ),
				'interests'            => array( 'IAB18', 'fashion', 'IAB1_IAB2', '0', 'IAB24', 'IAB9_IAB22' ),
				'is_evergreen'         => false,
			)
		);

		$this->assertIsArray( $result );
		$prefill = $result['prefill'];
		$this->assertSame( 'Custom heading', $prefill['site_name'] );
		$this->assertSame( 'Custom ad copy.', $prefill['text_snippet'] );
		$this->assertSame( 'Shop Now', $prefill['cta_text'] );
		$this->assertSame( 'Drive sales in the UK.', $prefill['goal'] );
		$this->assertSame( 'Make it more direct.', $prefill['revision_instruction'] );
		$this->assertSame( 'https://example.com/custom.jpg', $prefill['main_image']['url'] );
		$this->assertSame( array( 'en', 'es' ), $prefill['languages'] );
		$this->assertSame( array( 'GB', 'FR' ), $prefill['countries'] );
		$this->assertSame( array( 'mobile' ), $prefill['devices'] );
		$this->assertSame( array( 'IAB8_IAB18', 'IAB9_IAB22' ), $prefill['page_topics'] );
		$this->assertArrayNotHasKey( 'interests', $prefill );
		$this->assertFalse( $prefill['is_evergreen'] );
		$this->assertSame( 'CLICKS', $prefill['objective'] );
	}

	/**
	 * Asking for both supported narrowed device targets is equivalent to
	 * targeting all devices, so the prefill payload omits the field.
	 */
	public function test_prepare_omits_device_prefill_when_all_supported_devices_are_requested() {
		$ctx = $this->make_test_post();

		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => $ctx['target_urn'],
				'devices'    => array( 'mobile', 'desktop' ),
			)
		);

		$this->assertIsArray( $result );
		$this->assertArrayNotHasKey( 'devices', $result['prefill'] );
	}

	/**
	 * Invalid targets remain hard stops owned by the preparation layer.
	 */
	public function test_prepare_returns_error_for_invalid_target_urn() {
		$result = Campaign_Preparer::prepare(
			array(
				'target_urn' => 'not-a-urn',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_invalid_target_urn', $result->get_error_code() );
	}

	/**
	 * Friendly site URL + post ID inputs are normalized into the canonical
	 * target URN before the existing proposal path runs.
	 */
	public function test_prepare_accepts_site_url_and_post_id() {
		$ctx = $this->make_test_post();
		$this->mock_site_lookup(
			'https://example.com',
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'ID' => self::TEST_SITE_ID ), JSON_UNESCAPED_SLASHES ),
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'site_url'      => 'https://example.com',
				'post_id'       => $ctx['post_id'],
				'budget_total'  => 25,
				'duration_days' => 5,
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( $ctx['target_urn'], $result['prefill']['target_urn'] );
		$this->assertStringContainsString( 'blaze_prefill=', $result['prefill_url'] );
	}

	/**
	 * Product_id is a Woo-friendly alias for the promoted post ID in the
	 * canonical Blaze target URN.
	 */
	public function test_prepare_accepts_site_url_and_product_id() {
		$ctx = $this->make_test_post( array( 'post_type' => 'product' ) );
		$this->mock_site_lookup(
			'https://shop.example.com',
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'ID' => self::TEST_SITE_ID ), JSON_UNESCAPED_SLASHES ),
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'site_url'   => 'https://shop.example.com',
				'product_id' => $ctx['post_id'],
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( $ctx['target_urn'], $result['prefill']['target_urn'] );
		$this->assertSame( 'product', $result['prefill']['type'] );
	}

	/**
	 * A failed public site lookup is a clear hard stop, not a malformed URN.
	 */
	public function test_prepare_returns_error_when_site_lookup_fails() {
		$ctx = $this->make_test_post();
		$this->mock_site_lookup(
			'https://missing.example.com',
			array(
				'response' => array( 'code' => 404 ),
				'body'     => wp_json_encode( array( 'error' => 'unknown_blog' ), JSON_UNESCAPED_SLASHES ),
			)
		);

		$result = Campaign_Preparer::prepare(
			array(
				'site_url' => 'https://missing.example.com',
				'post_id'  => $ctx['post_id'],
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_site_lookup_failed', $result->get_error_code() );
	}

	/**
	 * Callers must choose either post_id or product_id for friendly inputs.
	 */
	public function test_prepare_returns_error_for_ambiguous_friendly_target() {
		$ctx = $this->make_test_post();

		$result = Campaign_Preparer::prepare(
			array(
				'site_url'   => 'https://example.com',
				'post_id'    => $ctx['post_id'],
				'product_id' => $ctx['post_id'],
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_ambiguous_target', $result->get_error_code() );
	}

	/**
	 * Missing target inputs get a specific error that can guide MCP clients.
	 */
	public function test_prepare_returns_error_for_missing_target_input() {
		$result = Campaign_Preparer::prepare( array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'blaze_missing_target', $result->get_error_code() );
	}
}
