<?php
/**
 * Tests for flow storage and the token renderer.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Flow storage and token rendering.
 *
 * @covers \Automattic\Jetpack\Flow\Flow_Store
 * @covers \Automattic\Jetpack\Flow\Engine
 */
#[CoversClass( Engine::class )]
#[CoversClass( Flow_Store::class )]
class Flow_Test extends TestCase {

	/**
	 * AI output is untrusted, so unknown triggers and actions must never be stored.
	 */
	public function test_sanitize_drops_unknown_triggers_and_actions() {
		$flows = Flow_Store::sanitize(
			array(
				array(
					'trigger' => array( 'type' => 'does_not_exist' ),
					'steps'   => array(),
				),
				array(
					'name'    => 'Valid',
					'trigger' => array( 'type' => 'form_submitted' ),
					'steps'   => array(
						array( 'type' => 'rm_rf' ),
						array(
							'type'   => 'webhook',
							'config' => array(
								'url'   => 'https://example.com/hook',
								'extra' => 'dropped',
							),
						),
					),
				),
			)
		);

		$this->assertCount( 1, $flows );
		$this->assertCount( 1, $flows[0]['steps'] );
		$this->assertSame( 'webhook', $flows[0]['steps'][0]['type'] );
		$this->assertArrayNotHasKey( 'extra', $flows[0]['steps'][0]['config'] );
	}

	/**
	 * Unknown tokens must render empty rather than leaking the placeholder.
	 */
	public function test_render_replaces_known_tokens_and_blanks_unknown() {
		$this->assertSame(
			'Hi Ann, ',
			Engine::render( 'Hi {{ name }}, {{missing}}', array( 'name' => 'Ann' ) )
		);
	}
}
