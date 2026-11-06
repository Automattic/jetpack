<?php
/**
 * Tests for Stored_Layout_Rescale.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * The rescale runs on the `persisted_preferences` read, once per reader, so these go through the
 * meta API like the dashboard's first read does.
 */
class Stored_Layout_Rescale_Test extends BaseTestCase {

	/**
	 * The reader.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * The blog-prefixed preferences meta key.
	 *
	 * @var string
	 */
	private $meta_key;

	public function set_up() {
		parent::set_up();

		global $wpdb;
		$this->meta_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
		$this->user_id  = wp_insert_user(
			array(
				'user_login' => 'reader',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);

		Stored_Layout_Rescale::register();
	}

	public function tear_down() {
		Stored_Layout_Rewrite::unregister();
		parent::tear_down();
	}

	/**
	 * Seed the reader's preferences, bypassing the rescale.
	 *
	 * @param array $scope The dashboard scope.
	 * @return array The stored preferences.
	 */
	private function store_scope( array $scope ) {
		$preferences = array(
			Enablement_Setting::PREFERENCES_SCOPE => $scope,
			'_modified'                           => '2026-01-01T00:00:00Z',
		);
		remove_filter( 'get_user_metadata', array( Stored_Layout_Rewrite::class, 'filter_user_meta' ), 99 );
		// WorDBless unslashes an inserted row a second time, so the row exists before the real
		// seed goes in as an update, slashed as the meta API expects.
		update_user_meta( $this->user_id, $this->meta_key, array() );
		update_user_meta( $this->user_id, $this->meta_key, wp_slash( $preferences ) );
		add_filter( 'get_user_metadata', array( Stored_Layout_Rewrite::class, 'filter_user_meta' ), 99, 3 );

		return $preferences;
	}

	/**
	 * The dashboard scope a read of the preferences hands back.
	 *
	 * @return array
	 */
	private function read_scope() {
		$preferences = get_user_meta( $this->user_id, $this->meta_key, true );
		$scope       = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ] ?? null;
		$this->assertIsArray( $scope );

		return $scope;
	}

	/**
	 * A stored widget instance of a height, positional like the layouts the client saves.
	 *
	 * @param string $uuid   Instance UUID.
	 * @param mixed  $height Stored height.
	 * @return array
	 */
	private static function stored( $uuid, $height ) {
		return array(
			'uuid'      => $uuid,
			'type'      => 'jpa/' . $uuid,
			'placement' => array(
				'width'  => 1,
				'height' => $height,
			),
		);
	}

	/**
	 * @param int|float $rows       Stored height.
	 * @param int|float $row_height Row the stored height counted.
	 * @param int       $expected   Height on 40px rows.
	 * @dataProvider provide_rescaled_heights
	 */
	#[DataProvider( 'provide_rescaled_heights' )]
	public function test_keeps_the_pixels_of_a_tile_rounding_up( $rows, $row_height, $expected ) {
		$this->assertSame( $expected, Stored_Layout_Rescale::rescale_height( $rows, $row_height ) );
	}

	public static function provide_rescaled_heights() {
		return array(
			'one row of 200px, 200px'          => array( 1, 200, 4 ),
			'two rows of 200px, 416px'         => array( 2, 200, 8 ),
			'three rows of 200px, 632px'       => array( 3, 200, 12 ),
			'two rows of 300px, 616px'         => array( 2, 300, 12 ),
			'two rows of 400px, 816px'         => array( 2, 400, 15 ),
			'a row that fits exactly, 40px'    => array( 1, 40, 1 ),
			'a height below one row stays one' => array( 0, 200, 1 ),
		);
	}

	public function test_rescales_every_stored_height_once_and_persists_it() {
		$this->store_scope(
			array(
				Stored_Layout_Rescale::LAYOUTS_KEY => array(
					'traffic'  => array( self::stored( 'chart', 2 ), self::stored( 'posts', 3 ) ),
					'insights' => array( self::stored( 'highlights', 1 ) ),
				),
			)
		);

		$scope = $this->read_scope();

		$this->assertSame( array( Stored_Layout_Rescale::MOVE_ID ), $scope[ Stored_Layout_Rescale::MOVES_KEY ] );
		$this->assertSame( 8, $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][0]['placement']['height'] );
		$this->assertSame( 12, $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][1]['placement']['height'] );
		$this->assertSame( 4, $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['insights'][0]['placement']['height'] );
		$this->assertSame( 1, $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][0]['placement']['width'] );

		// Persisted: a second read, without the filter, sees the same heights.
		remove_filter( 'get_user_metadata', array( Stored_Layout_Rewrite::class, 'filter_user_meta' ), 99 );
		$this->assertSame( $scope, $this->read_scope() );
	}

	public function test_counts_the_row_height_the_drawer_persisted_and_drops_it() {
		$this->store_scope(
			array(
				Stored_Layout_Rescale::LAYOUTS_KEY       => array( 'traffic' => array( self::stored( 'chart', 2 ) ) ),
				Stored_Layout_Rescale::GRID_SETTINGS_KEY => array(
					'model'     => 'grid',
					'columns'   => 3,
					'rowHeight' => 300,
				),
			)
		);

		$scope = $this->read_scope();

		$this->assertSame( 12, $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][0]['placement']['height'] );
		$this->assertArrayNotHasKey( Stored_Layout_Rescale::GRID_SETTINGS_KEY, $scope );
	}

	public function test_leaves_a_reader_who_already_had_the_rescale_alone() {
		$preferences = $this->store_scope(
			array(
				Stored_Layout_Rescale::LAYOUTS_KEY => array( 'traffic' => array( self::stored( 'chart', 2 ) ) ),
				Stored_Layout_Rescale::MOVES_KEY   => array( Stored_Layout_Rescale::MOVE_ID ),
			)
		);

		$this->assertSame( $preferences, get_user_meta( $this->user_id, $this->meta_key, true ) );
	}

	public function test_leaves_a_height_it_cannot_read_alone() {
		$this->store_scope(
			array(
				Stored_Layout_Rescale::LAYOUTS_KEY => array(
					'traffic' => array(
						self::stored( 'chart', 'tall' ),
						array(
							'uuid' => 'bare',
							'type' => 'jpa/bare',
						),
					),
				),
			)
		);

		$scope = $this->read_scope();

		$this->assertSame( 'tall', $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][0]['placement']['height'] );
		$this->assertArrayNotHasKey( 'placement', $scope[ Stored_Layout_Rescale::LAYOUTS_KEY ]['traffic'][1] );
		$this->assertSame( array( Stored_Layout_Rescale::MOVE_ID ), $scope[ Stored_Layout_Rescale::MOVES_KEY ] );
	}

	public function test_leaves_preferences_without_stored_layouts_alone() {
		$preferences = $this->store_scope( array( 'onboardingCompletedAt' => '2026-01-01T00:00:00Z' ) );

		$this->assertSame( $preferences, get_user_meta( $this->user_id, $this->meta_key, true ) );
	}

	public function test_ignores_other_meta_and_a_reader_with_no_preferences() {
		update_user_meta( $this->user_id, 'other', array( 'height' => 2 ) );

		$this->assertSame( array( 'height' => 2 ), get_user_meta( $this->user_id, 'other', true ) );
		$this->assertSame( '', get_user_meta( $this->user_id, $this->meta_key, true ) );
	}
}
