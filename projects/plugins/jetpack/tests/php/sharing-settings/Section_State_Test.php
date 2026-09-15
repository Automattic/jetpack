<?php
/**
 * Tests for the Settings > Sharing section state resolver.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The resolver makes no WordPress calls, so these need no bootstrapped site.
 *
 * @covers \Automattic\Jetpack\Plugin\Sharing_Settings\Section_State
 */
#[CoversClass( Section_State::class )]
class Section_State_Test extends TestCase {

	/**
	 * Every state the Sharing and Likes sections can be in.
	 *
	 * Both sections resolve identically; only their contents differ. The cell
	 * labels match the design matrix on CM-912.
	 *
	 * @return array<string, array{0: bool, 1: bool, 2: string}>
	 */
	public static function provide_sections(): array {
		return array(
			'S1 Jetpack, classic theme, sharing active'   => array( false, true, Section_State::CONFIGURE ),
			'S2 Jetpack, classic theme, sharing inactive' => array( false, false, Section_State::OFF ),
			'S3 Jetpack, block theme, sharing active'     => array( true, true, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
			'S4 Jetpack, block theme, sharing inactive'   => array( true, false, Section_State::BLOCK_CALL_TO_ACTION ),
			'S5 Simple, classic theme'                    => array( false, true, Section_State::CONFIGURE ),
			'S6 Simple, block theme'                      => array( true, true, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
			'L1 Jetpack, classic theme, likes active'     => array( false, true, Section_State::CONFIGURE ),
			'L2 Jetpack, classic theme, likes inactive'   => array( false, false, Section_State::OFF ),
			'L3 Jetpack, block theme, likes active'       => array( true, true, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
			'L4 Jetpack, block theme, likes inactive'     => array( true, false, Section_State::BLOCK_CALL_TO_ACTION ),
			'L5 Simple, classic theme'                    => array( false, true, Section_State::CONFIGURE ),
			'L6 Simple, block theme'                      => array( true, true, Section_State::CONFIGURE_WITH_BLOCK_NUDGE ),
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
	 * A live feature on a block theme keeps its options, because its legacy
	 * output is still on the site. Regression guard for the Atomic behaviour
	 * this reverses, where the options were replaced outright.
	 */
	public function test_block_theme_keeps_options_while_feature_is_live(): void {
		$this->assertSame(
			Section_State::CONFIGURE_WITH_BLOCK_NUDGE,
			Section_State::for_section( true, true )
		);
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
