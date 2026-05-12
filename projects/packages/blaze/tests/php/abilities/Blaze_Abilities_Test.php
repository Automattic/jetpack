<?php
/**
 * Tests for Blaze Abilities registration.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; tests exercise guarded integration points directly.

namespace Automattic\Jetpack\Blaze\Abilities;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Blaze\Abilities\Blaze_Abilities
 */
#[CoversClass( Blaze_Abilities::class )]
class Blaze_Abilities_Test extends BaseTestCase {

	/**
	 * Synthetic site ID used by the Blaze list-campaigns REST delegation.
	 *
	 * @var int
	 */
	private const TEST_SITE_ID = 12345;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		Jetpack_Options::update_option( 'id', self::TEST_SITE_ID );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'id' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
	}

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
	 * Woo MCP should include the Blaze ability without altering other abilities.
	 */
	public function test_opt_into_woo_mcp_for_list_campaigns() {
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( false, Blaze_Abilities::ABILITY_LIST_CAMPAIGNS ) );
		$this->assertFalse( Blaze_Abilities::opt_into_woo_mcp( false, 'woocommerce/list-products' ) );
		$this->assertTrue( Blaze_Abilities::opt_into_woo_mcp( true, 'woocommerce/list-products' ) );
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
}
