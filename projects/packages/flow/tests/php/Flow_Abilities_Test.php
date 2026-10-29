<?php
/**
 * Tests for the Flow abilities.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow\Abilities;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Flow abilities.
 *
 * @covers \Automattic\Jetpack\Flow\Abilities\Flow_Abilities
 */
#[CoversClass( Flow_Abilities::class )]
class Flow_Abilities_Test extends TestCase {

	/**
	 * Only the delete ability may be destructive, and only the getters read-only.
	 */
	public function test_annotations_match_what_each_ability_does() {
		$abilities = Flow_Abilities::get_abilities();

		$this->assertSame(
			array( 'jetpack-flow/get-flow-catalog', 'jetpack-flow/get-flows', 'jetpack-flow/save-flow', 'jetpack-flow/delete-flow' ),
			array_keys( $abilities )
		);
		foreach ( $abilities as $slug => $ability ) {
			$annotations = $ability['meta']['annotations'];
			$this->assertSame( 0 === strpos( $slug, 'jetpack-flow/get-' ), $annotations['readonly'], $slug );
			$this->assertSame( 'jetpack-flow/delete-flow' === $slug, $annotations['destructive'], $slug );
			$this->assertTrue( $ability['meta']['mcp']['public'], $slug );
		}
	}

	/**
	 * Agent mistakes must come back as errors that name the fix, not be dropped silently.
	 *
	 * @param array  $input Ability input.
	 * @param string $code  Expected error code.
	 * @dataProvider provide_invalid_flows
	 */
	#[DataProvider( 'provide_invalid_flows' )]
	public function test_save_flow_rejects_unknown_ids_and_fields( $input, $code ) {
		$result = Flow_Abilities::save_flow( $input );

		$this->assertWPError( $result );
		$this->assertSame( $code, $result->get_error_code() );
	}

	/**
	 * Invalid flows.
	 *
	 * @return array
	 */
	public static function provide_invalid_flows() {
		return array(
			'no trigger'      => array( array( 'name' => 'Empty' ), 'jetpack_flow_missing_triggers' ),
			'unknown trigger' => array( array( 'triggers' => array( 'nope' ) ), 'jetpack_flow_invalid_trigger' ),
			'unknown action'  => array(
				array(
					'triggers' => array( 'post_published' ),
					'steps'    => array( array( 'type' => 'rm_rf' ) ),
				),
				'jetpack_flow_invalid_action',
			),
			'unknown field'   => array(
				array(
					'triggers' => array( 'post_published' ),
					'steps'    => array(
						array(
							'type'   => 'webhook',
							'config' => array( 'bogus' => 'x' ),
						),
					),
				),
				'jetpack_flow_invalid_config',
			),
		);
	}

	/**
	 * The catalog filters must narrow each list independently.
	 */
	public function test_catalog_filters_by_kind_and_search() {
		$triggers = Flow_Abilities::get_flow_catalog( array( 'kind' => 'triggers' ) );
		$this->assertNotEmpty( $triggers['triggers'] );
		$this->assertSame( array(), $triggers['actions'] );

		$found = Flow_Abilities::get_flow_catalog( array( 'search' => 'webhook' ) );
		$this->assertContains( 'webhook', array_column( $found['actions'], 'id' ) );
		$this->assertNotContains( 'post_published', array_column( $found['triggers'], 'id' ) );
	}

	/**
	 * Without the opt-in filter, nothing may hook into the Abilities API.
	 */
	public function test_init_registers_nothing_until_enabled() {
		Flow_Abilities::init();

		$this->assertFalse( has_action( 'wp_abilities_api_init', array( Flow_Abilities::class, 'register_abilities' ) ) );
	}

	/**
	 * PHPUnit's WP_Error assertion, since the base TestCase has none.
	 *
	 * @param mixed $actual Value to check.
	 */
	private function assertWPError( $actual ) {
		$this->assertInstanceOf( \WP_Error::class, $actual );
	}
}
