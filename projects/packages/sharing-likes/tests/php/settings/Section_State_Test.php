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
	 * Both sections resolve identically, and only these two booleans reach the
	 * resolver: the platform, the theme and the module all collapse into them
	 * before they get here, which is why the CM-912 matrix has more cells than
	 * this has rows. Whether the right booleans arrive is `Environment_Test`
	 * and each section's own `can_offer_block()`.
	 *
	 * @return array<string, array{0: bool, 1: bool, 2: string}>
	 */
	public static function provide_sections(): array {
		return array(
			'live feature, no block route'   => array( false, true, Section_State::CONFIGURE ),
			'off feature, no block route'    => array( false, false, Section_State::OFF ),
			// A live feature keeps its options on a block theme: the legacy output is
			// still on the site. The Atomic behaviour this reverses replaced them outright.
			'live feature, block route open' => array( true, true, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
			'off feature, block route open'  => array( true, false, Section_State::BLOCK_CALL_TO_ACTION ),
		);
	}

	/**
	 * @param bool   $can_offer_block Whether the block is a route this site can be sent down.
	 * @param bool   $feature_enabled Whether the feature can still produce output.
	 * @param string $expected        Expected variant.
	 * @dataProvider provide_sections
	 */
	#[DataProvider( 'provide_sections' )]
	public function test_section_variant( bool $can_offer_block, bool $feature_enabled, string $expected ): void {
		$this->assertSame( $expected, Section_State::for_section( $can_offer_block, $feature_enabled ) );
	}

	/**
	 * @return array<string, array{0: bool, 1: bool, 2: bool}>
	 */
	public static function provide_placement(): array {
		return array(
			'both features on' => array( true, true, true ),
			'sharing only'     => array( true, false, true ),
			'likes only'       => array( false, true, true ),
			'both off'         => array( false, false, false ),
		);
	}

	/**
	 * @param bool $sharing_enabled Whether sharing buttons can produce output.
	 * @param bool $likes_enabled   Whether anything still reads the Likes settings.
	 * @param bool $expected        Whether the placement section renders.
	 * @dataProvider provide_placement
	 */
	#[DataProvider( 'provide_placement' )]
	public function test_placement_section_visibility( bool $sharing_enabled, bool $likes_enabled, bool $expected ): void {
		$this->assertSame( $expected, Section_State::shows_placement( $sharing_enabled, $likes_enabled ) );
	}
}
