<?php
/**
 * Tests for the shared placement section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Placement_Section
 */
#[CoversClass( Placement_Section::class )]
class Placement_Section_Test extends BaseTestCase {

	/**
	 * Clear the option between cases; an unset option is the interesting state.
	 */
	public function tear_down() {
		delete_option( 'sharing-options' );

		parent::tear_down();
	}

	/**
	 * A site that has never saved this section still shows buttons somewhere,
	 * and the checkboxes have to say so: they are what the next save posts back,
	 * so reporting "nowhere" would turn the buttons off on a save the site owner
	 * believes changed nothing.
	 */
	public function test_unsaved_option_reports_the_defaults_the_features_apply(): void {
		$this->assertSame(
			array( 'post', 'page' ),
			Placement_Section::selected_post_types()
		);
	}

	/**
	 * An explicit empty list is a choice, not an absent value.
	 */
	public function test_explicitly_empty_placement_is_preserved(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array() ) ) );

		$this->assertSame( array(), Placement_Section::selected_post_types() );
	}

	/**
	 * A stored list is returned as-is.
	 */
	public function test_stored_placement_is_returned(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'index' ) ) ) );

		$this->assertSame( array( 'post', 'index' ), Placement_Section::selected_post_types() );
	}

	/**
	 * @return array<string, array{0: mixed, 1: string[]}>
	 */
	public static function provide_legacy_values(): array {
		return array(
			'posts'               => array( 'posts', array( 'post', 'page' ) ),
			'index'               => array( 'index', array( 'index' ) ),
			'posts-index'         => array( 'posts-index', array( 'post', 'page', 'index' ) ),
			'unrecognised'        => array( 'nonsense', array() ),
			'already a list'      => array( array( 'post' ), array( 'post' ) ),
			'non-strings dropped' => array( array( 'post', 42, array( 'nested' ) ), array( 'post' ) ),
		);
	}

	/**
	 * Pre-2.x sites stored a single keyword. Both `Sharing_Service` and
	 * `Jetpack_Likes_Settings` still map it, so the screen has to as well;
	 * treating it as absent would wipe placement on the next services save.
	 *
	 * @param mixed    $stored   Stored value.
	 * @param string[] $expected Normalised list.
	 * @dataProvider provide_legacy_values
	 */
	#[DataProvider( 'provide_legacy_values' )]
	public function test_normalizes_legacy_and_malformed_values( $stored, array $expected ): void {
		$this->assertSame( $expected, Placement_Section::normalize_show( $stored ) );
	}

	/**
	 * The legacy keyword has to survive a round trip through the option, which
	 * is the path a services save takes.
	 */
	public function test_legacy_scalar_in_the_option_is_normalised(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => 'posts-index' ) ) );

		$this->assertSame(
			array( 'post', 'page', 'index' ),
			Placement_Section::selected_post_types()
		);
	}
}
