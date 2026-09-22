<?php
/**
 * Tests for the Settings > Sharing section state resolver.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The resolver makes no WordPress calls, so these need no bootstrapped site.
 *
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Section_State
 */
#[CoversClass( Section_State::class )]
class Section_State_Test extends TestCase {

	/**
	 * Every state a section can be in.
	 *
	 * Both sections resolve identically, and only these three booleans reach the
	 * resolver: the platform, the theme and the module all collapse into them
	 * before they get here, which is why the CM-912 matrix has more cells than
	 * this has rows. Whether the right booleans arrive is `Environment_Test`
	 * and each section's own `can_offer_block()`.
	 *
	 * @return array<string, array{0: bool, 1: bool, 2: bool, 3: string}>
	 */
	public static function provide_sections(): array {
		return array(
			'live feature, no block route'           => array( false, true, false, Section_State::CONFIGURE ),
			'off feature, no block route'            => array( false, false, false, Section_State::OFF ),
			// Without a block to move to, the options are the only way back.
			'switched-off feature, no block route'   => array( false, true, true, Section_State::CONFIGURE ),
			// A live feature keeps its options on a block theme: the legacy output is
			// still on the site. The Atomic behaviour this reverses replaced them outright.
			'live feature, block route open'         => array( true, true, false, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
			'off feature, block route open'          => array( true, false, false, Section_State::BLOCK_CALL_TO_ACTION ),
			'switched-off feature, block route open' => array( true, true, true, Section_State::BLOCK_CALL_TO_ACTION ),
			'off and switched-off feature, block route open' => array( true, false, true, Section_State::BLOCK_CALL_TO_ACTION ),
		);
	}

	/**
	 * @param bool   $can_offer_block Whether the block is a route this site can be sent down.
	 * @param bool   $feature_enabled Whether the feature can still produce output.
	 * @param bool   $switched_off    Whether the feature's settings leave it nothing to show.
	 * @param string $expected        Expected variant.
	 * @dataProvider provide_sections
	 */
	#[DataProvider( 'provide_sections' )]
	public function test_section_variant( bool $can_offer_block, bool $feature_enabled, bool $switched_off, string $expected ): void {
		$this->assertSame( $expected, Section_State::for_section( $can_offer_block, $feature_enabled, $switched_off ) );
	}

	/**
	 * @return array<string, array{0: string, 1: string, 2: bool}>
	 */
	public static function provide_placement(): array {
		return array(
			'both configure'           => array( Section_State::CONFIGURE, Section_State::CONFIGURE, true ),
			'sharing only'             => array( Section_State::CONFIGURE_WITH_BLOCK_NUDGE, Section_State::OFF, true ),
			'likes only'               => array( Section_State::BLOCK_CALL_TO_ACTION, Section_State::CONFIGURE, true ),
			'both off'                 => array( Section_State::OFF, Section_State::OFF, false ),
			'both moved to the blocks' => array( Section_State::BLOCK_CALL_TO_ACTION, Section_State::BLOCK_CALL_TO_ACTION, false ),
		);
	}

	/**
	 * @param string $sharing_state Variant the Sharing buttons section renders.
	 * @param string $likes_state   Variant the Like buttons section renders.
	 * @param bool   $expected      Whether the placement section renders.
	 * @dataProvider provide_placement
	 */
	#[DataProvider( 'provide_placement' )]
	public function test_placement_section_visibility( string $sharing_state, string $likes_state, bool $expected ): void {
		$this->assertSame( $expected, Section_State::shows_placement( $sharing_state, $likes_state ) );
	}
}
