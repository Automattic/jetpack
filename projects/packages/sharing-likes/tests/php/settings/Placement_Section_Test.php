<?php
/**
 * Tests for the shared placement section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';

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

		unset( $GLOBALS['sharing_likes_test_likes_show'] );
		Jetpack_Options::delete_option( 'active_modules' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );

		parent::tear_down();
	}

	/**
	 * Report the module slugs as available, so `Modules` does not filter them
	 * out of the active list for want of a plugin to read module headers from.
	 *
	 * @return string[]
	 */
	public function offer_modules(): array {
		return array( 'likes' );
	}

	/**
	 * Put the site in the state where the Likes settings are the ones in use.
	 *
	 * @param mixed $show What `Jetpack_Likes_Settings` reports as the placement.
	 */
	private function given_likes_running( $show ): void {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
		Jetpack_Options::update_option( 'active_modules', array( 'likes' ) );

		$GLOBALS['sharing_likes_test_likes_show'] = $show;
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

	/**
	 * The two features disagree about the default: sharing uses posts and pages,
	 * Likes adds public commentable custom post types. On a site running Likes
	 * the narrower answer understates where the buttons are — and because these
	 * checkboxes are what the next save posts back, saving the screen unchanged
	 * would then stop Like buttons rendering on those custom post types.
	 */
	public function test_unsaved_option_defers_to_the_likes_defaults_when_likes_are_running(): void {
		$this->given_likes_running( array( 'post', 'page', 'book' ) );

		$this->assertSame(
			array( 'post', 'page', 'book' ),
			Placement_Section::selected_post_types()
		);
	}

	/**
	 * The deferral goes through the same normalisation as a stored value, since
	 * `Jetpack_Likes_Settings::get_options()` maps the pre-2.x scalar too.
	 */
	public function test_likes_defaults_are_normalised_like_a_stored_value(): void {
		$this->given_likes_running( 'posts-index' );

		$this->assertSame(
			array( 'post', 'page', 'index' ),
			Placement_Section::selected_post_types()
		);
	}

	/**
	 * A saved value is the site owner's choice and outranks either default.
	 */
	public function test_a_saved_placement_outranks_the_likes_defaults(): void {
		$this->given_likes_running( array( 'post', 'page', 'book' ) );
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'index' ) ) ) );

		$this->assertSame( array( 'index' ), Placement_Section::selected_post_types() );
	}
}
