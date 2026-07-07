<?php
/**
 * Tests for the Playlist_Block registration guards and order-resolution helper.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Registration-guard tests for Playlist_Block::register() plus pure-function
 * table tests for Playlist_Block::resolve_ordered_ids().
 *
 * Registration tests use a fixture block.json (tests/php/fixtures) because the
 * real metadata ships with the webpack build, which does not exist in the test
 * environment. The render pipeline itself needs real taxonomy tables and is
 * covered by the sqlite suite (tests/php-sqlite/Playlist_Block_Render_Test.php).
 *
 * The resolve_ordered_ids() cases mirror the jest suite for the JS twin in
 * src/client/lib/playlist-order/test — the two implementations must stay in
 * lockstep or the editor preview and the frontend render will disagree.
 *
 * @covers \Automattic\Jetpack\VideoPress\Playlist_Block::register
 * @covers \Automattic\Jetpack\VideoPress\Playlist_Block::resolve_ordered_ids
 */
#[CoversMethod( Playlist_Block::class, 'register' )]
#[CoversMethod( Playlist_Block::class, 'resolve_ordered_ids' )]
class Playlist_Block_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		remove_all_filters( Admin_UI::STUDIO_FILTER );

		if ( \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Block::BLOCK_NAME ) ) {
			unregister_block_type( Playlist_Block::BLOCK_NAME );
		}
	}

	/**
	 * Path of the fixture block metadata used to exercise register().
	 *
	 * @return string
	 */
	private static function fixture_metadata_file() {
		return __DIR__ . '/fixtures/playlist-block.json';
	}

	/**
	 * Tests that the block does not register while the Studio flag is off,
	 * even when valid block metadata is available.
	 */
	public function test_register_bails_when_studio_flag_off() {
		Playlist_Block::register( self::fixture_metadata_file() );

		$this->assertFalse( \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Block::BLOCK_NAME ) );
	}

	/**
	 * Tests that a missing build file is tolerated gracefully: no registration,
	 * no error. This is the state of a package checkout without a webpack build.
	 */
	public function test_register_bails_when_metadata_file_missing() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		Playlist_Block::register( __DIR__ . '/fixtures/no-such-block.json' );

		$this->assertFalse( \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Block::BLOCK_NAME ) );
	}

	/**
	 * Tests that the block registers with the render callback when the flag is on.
	 */
	public function test_register_registers_block_with_render_callback_when_flag_on() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		Playlist_Block::register( self::fixture_metadata_file() );

		$registry = \WP_Block_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( Playlist_Block::BLOCK_NAME ) );

		$block_type = $registry->get_registered( Playlist_Block::BLOCK_NAME );
		$this->assertSame( array( Playlist_Block::class, 'render' ), $block_type->render_callback );
	}

	/**
	 * Tests that a second registration attempt is a silent no-op — the Jetpack
	 * and standalone VideoPress plugins can both load this package, and
	 * register_block_type() raises a doing-it-wrong on duplicates.
	 */
	public function test_register_tolerates_double_registration() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );

		Playlist_Block::register( self::fixture_metadata_file() );
		Playlist_Block::register( self::fixture_metadata_file() );

		$this->assertTrue( \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Block::BLOCK_NAME ) );
	}

	/**
	 * Data provider of ( stored order, actual members, expected result ) cases.
	 *
	 * @return array[]
	 */
	public static function ordered_ids_provider() {
		return array(
			'keeps the stored order for ids that are still members' => array(
				array( 3, 1, 2 ),
				array( 1, 2, 3 ),
				array( 3, 1, 2 ),
			),
			'drops order entries that are no longer members' => array(
				array( 9, 3, 8, 1 ),
				array( 1, 3 ),
				array( 3, 1 ),
			),
			'appends members missing from the order, in member (date) sequence' => array(
				array( 2 ),
				array( 5, 4, 2, 6 ),
				array( 2, 5, 4, 6 ),
			),
			'drops stale entries and appends missing members in one pass' => array(
				array( 9, 2, 7 ),
				array( 5, 2, 6 ),
				array( 2, 5, 6 ),
			),
			'dedupes repeated order entries keeping the first position' => array(
				array( 2, 1, 2, 1 ),
				array( 1, 2 ),
				array( 2, 1 ),
			),
			'returns members as-is when there is no stored order' => array(
				array(),
				array( 4, 2, 3 ),
				array( 4, 2, 3 ),
			),
			'returns empty when there are no members' => array(
				array( 1, 2, 3 ),
				array(),
				array(),
			),
			'casts numeric-string meta entries so they match int members' => array(
				array( '3', '1' ),
				array( 1, 2, 3 ),
				array( 3, 1, 2 ),
			),
		);
	}

	/**
	 * Tests resolve_ordered_ids() against the shared semantics table.
	 *
	 * @dataProvider ordered_ids_provider
	 * @param array $order      Stored `vps_playlist_order` entries.
	 * @param array $member_ids IDs of the attachments actually carrying the term.
	 * @param int[] $expected   Expected reconciled order.
	 */
	#[DataProvider( 'ordered_ids_provider' )]
	public function test_resolve_ordered_ids( array $order, array $member_ids, array $expected ) {
		$this->assertSame( $expected, Playlist_Block::resolve_ordered_ids( $order, $member_ids ) );
	}

	/**
	 * Tests that the result is a reindexed list even after stale entries are
	 * dropped mid-array, so it JSON-encodes as an array rather than an object.
	 */
	public function test_result_is_a_reindexed_list() {
		$result = Playlist_Block::resolve_ordered_ids( array( 9, 3, 8, 1 ), array( 1, 3 ) );

		$this->assertSame( array( 0, 1 ), array_keys( $result ) );
		$this->assertSame( '[3,1]', wp_json_encode( $result, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) );
	}
}
