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
	}

	/**
	 * Clear synthetic connection state.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'id' );
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
}
