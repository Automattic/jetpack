<?php
/**
 * Tests for the stored layout move.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-layout.php';
require_once __DIR__ . '/../../src/dashboard-sections.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Stored_Layout_Move
 */
#[\PHPUnit\Framework\Attributes\CoversClass( Stored_Layout_Move::class )]
class Stored_Layout_Move_Test extends BaseTestCase {

	/**
	 * The reader whose preferences are read.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * The preferences meta key, blog-prefixed as core stores it.
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

		register_default_dashboard_sections();

		Stored_Layout_Move::register();
	}

	public function tear_down() {
		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		parent::tear_down();
	}

	/**
	 * Store the reader's section layouts, and whatever else rides in the same meta.
	 *
	 * @param array $layouts Section slug => widget instances.
	 * @param array $extra   Other preference keys in the dashboard scope.
	 * @return array The stored preferences.
	 */
	private function store_layouts( array $layouts, array $extra = array() ) {
		$preferences = array(
			Enablement_Setting::PREFERENCES_SCOPE => array_merge(
				$extra,
				array( Stored_Layout_Move::LAYOUTS_KEY => $layouts )
			),
			'_modified'                           => '2026-01-01T00:00:00Z',
		);
		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		update_user_meta( $this->user_id, $this->meta_key, $preferences );
		add_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99, 3 );

		return $preferences;
	}

	/**
	 * The layouts a read of the preferences hands back.
	 *
	 * @return array
	 */
	private function read_layouts() {
		$preferences = get_user_meta( $this->user_id, $this->meta_key, true );
		$layouts     = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ Stored_Layout_Move::LAYOUTS_KEY ] ?? null;
		$this->assertIsArray( $layouts );

		return $layouts;
	}

	/**
	 * A stored widget instance, positional like the layouts the client saves.
	 *
	 * @param string $type Widget type.
	 * @return array
	 */
	private static function stored( $type ) {
		return array(
			'uuid'      => 'stored-' . $type,
			'type'      => $type,
			'placement' => array(
				'width'  => 1,
				'height' => 2,
			),
		);
	}

	public function test_moves_tags_off_a_customized_insights_onto_a_customized_traffic_and_persists_it() {
		$this->store_layouts(
			array(
				'insights' => array( self::stored( 'jpa/all-time-stats' ), self::stored( 'jpa/tags' ) ),
				'traffic'  => array( self::stored( 'jpa/referrers' ) ),
			),
			array( 'onboardingCompletedAt' => '2026-01-01' )
		);

		$layouts = $this->read_layouts();

		$this->assertSame( array( 'jpa/all-time-stats' ), array_column( $layouts['insights'], 'type' ) );
		$this->assertSame( array( 'jpa/referrers', 'jpa/tags' ), array_column( $layouts['traffic'], 'type' ) );
		// The default's placement travels, bar its order: a stored layout is positional.
		$appended = end( $layouts['traffic'] );
		$this->assertSame( 'default-tags-widget-instance', $appended['uuid'] );
		$this->assertSame(
			array(
				'width'  => 2,
				'height' => 2,
			),
			$appended['placement']
		);

		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		$persisted = get_user_meta( $this->user_id, $this->meta_key, true );
		$this->assertSame( $layouts, $persisted[ Enablement_Setting::PREFERENCES_SCOPE ][ Stored_Layout_Move::LAYOUTS_KEY ] );
		$this->assertSame( '2026-01-01', $persisted[ Enablement_Setting::PREFERENCES_SCOPE ]['onboardingCompletedAt'] );
		$this->assertNotSame( '2026-01-01T00:00:00Z', $persisted['_modified'] );
	}

	public function test_leaves_an_uncustomized_traffic_to_the_default() {
		$this->store_layouts(
			array( 'insights' => array( self::stored( 'jpa/tags' ) ) )
		);

		$layouts = $this->read_layouts();

		$this->assertSame( array(), $layouts['insights'] );
		$this->assertArrayNotHasKey( 'traffic', $layouts );
	}

	/**
	 * The widget still on Insights is the only trigger, so a reader who removed it from Traffic
	 * after the move keeps it removed.
	 */
	public function test_leaves_layouts_without_the_widget_on_its_old_tab_alone() {
		$stored = $this->store_layouts(
			array(
				'insights' => array( self::stored( 'jpa/all-time-stats' ) ),
				'traffic'  => array( self::stored( 'jpa/referrers' ) ),
			)
		);

		$this->assertSame( $stored, get_user_meta( $this->user_id, $this->meta_key, true ) );
	}

	public function test_does_not_add_a_second_copy_to_a_traffic_that_already_has_it() {
		$this->store_layouts(
			array(
				'insights' => array( self::stored( 'jpa/tags' ) ),
				'traffic'  => array( self::stored( 'jpa/tags' ), self::stored( 'jpa/referrers' ) ),
			)
		);

		$layouts = $this->read_layouts();

		$this->assertSame( array(), $layouts['insights'] );
		$this->assertSame( array( 'jpa/tags', 'jpa/referrers' ), array_column( $layouts['traffic'], 'type' ) );
	}

	public function test_ignores_other_meta_and_a_reader_with_no_preferences() {
		update_user_meta( $this->user_id, 'unrelated', 'kept' );

		$this->assertSame( 'kept', get_user_meta( $this->user_id, 'unrelated', true ) );
		$this->assertSame( '', get_user_meta( $this->user_id, $this->meta_key, true ) );
	}
}
