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
				'languages'            => array( 'EN', '', 'es' ),
				'countries'            => array( 'gb', 'usa', 'FR' ),
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
		$this->assertFalse( $prefill['is_evergreen'] );
		$this->assertSame( 'VIEWS', $prefill['objective'] );
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
