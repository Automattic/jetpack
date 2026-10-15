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
require_once __DIR__ . '/../../src/widget-modules.php';
require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Stored_Layout_Move
 */
#[\PHPUnit\Framework\Attributes\CoversClass( Stored_Layout_Move::class )]
class Stored_Layout_Move_Test extends BaseTestCase {
	use Widget_Manifest_Fixture_Trait;

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

		// No build manifest here: the widget registry holds only what a test registers.
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		$GLOBALS['jpa_test_widget_manifest'] = array();
		$this->reset_widget_registry();

		register_default_dashboard_sections();

		Stored_Layout_Move::register();
	}

	public function tear_down() {
		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		$this->reset_widget_registry();
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_absent_widget_manifest' ) );
		unset( $GLOBALS['jpa_test_widget_manifest'] );
		parent::tear_down();
	}

	private function reset_widget_registry() {
		$instance = new \ReflectionProperty( Widget_Type_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Store the reader's dashboard preferences, and whatever else rides in the same meta.
	 *
	 * @param array $scope The dashboard scope: section layouts, applied moves, and the rest.
	 * @return array The stored preferences.
	 */
	private function store_preferences( array $scope ) {
		$preferences = array(
			Enablement_Setting::PREFERENCES_SCOPE => $scope,
			'_modified'                           => '2026-01-01T00:00:00Z',
		);
		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		// WorDBless unslashes an inserted row a second time, so the row exists before the real
		// seed goes in as an update, slashed as the meta API expects.
		update_user_meta( $this->user_id, $this->meta_key, array() );
		update_user_meta( $this->user_id, $this->meta_key, wp_slash( $preferences ) );
		add_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99, 3 );

		return $preferences;
	}

	/**
	 * Store the reader's section layouts.
	 *
	 * @param array $layouts Section slug => widget instances.
	 * @param array $extra   Other preference keys in the dashboard scope.
	 * @return array The stored preferences.
	 */
	private function store_layouts( array $layouts, array $extra = array() ) {
		return $this->store_preferences(
			array_merge( $extra, array( Stored_Layout_Move::LAYOUTS_KEY => $layouts ) )
		);
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
	 * The layouts a read of the preferences hands back, the move asserted as recorded.
	 *
	 * @return array
	 */
	private function read_moved_layouts() {
		$scope = $this->read_scope();
		$this->assertSame( array( Stored_Layout_Move::MOVE_ID ), $scope[ Stored_Layout_Move::MOVES_KEY ] ?? null );
		$this->assertIsArray( $scope[ Stored_Layout_Move::LAYOUTS_KEY ] ?? null );

		return $scope[ Stored_Layout_Move::LAYOUTS_KEY ];
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
			array(
				'onboardingCompletedAt' => '2026-01-01',
				// The meta API unslashes on write, so a value with a backslash proves the write-back slashes.
				'rememberedPreset'      => 'ACME\\Blue',
			)
		);

		$layouts = $this->read_moved_layouts();

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
		$scope     = $persisted[ Enablement_Setting::PREFERENCES_SCOPE ];
		$this->assertSame( $layouts, $scope[ Stored_Layout_Move::LAYOUTS_KEY ] );
		$this->assertSame( array( Stored_Layout_Move::MOVE_ID ), $scope[ Stored_Layout_Move::MOVES_KEY ] );
		$this->assertSame( '2026-01-01', $scope['onboardingCompletedAt'] );
		$this->assertSame( 'ACME\\Blue', $scope['rememberedPreset'] );
		$this->assertNotSame( '2026-01-01T00:00:00Z', $persisted['_modified'] );
	}

	public function test_leaves_an_uncustomized_traffic_to_the_default() {
		$this->store_layouts(
			array( 'insights' => array( self::stored( 'jpa/tags' ) ) )
		);

		$layouts = $this->read_moved_layouts();

		$this->assertSame( array(), $layouts['insights'] );
		$this->assertArrayNotHasKey( 'traffic', $layouts );
	}

	/**
	 * A reader who customized only Traffic before the move had the widget on neither tab.
	 */
	public function test_adds_tags_to_a_customized_traffic_when_insights_is_the_default() {
		$this->store_layouts(
			array( 'traffic' => array( self::stored( 'jpa/referrers' ) ) )
		);

		$layouts = $this->read_moved_layouts();

		$this->assertArrayNotHasKey( 'insights', $layouts );
		$this->assertSame( array( 'jpa/referrers', 'jpa/tags' ), array_column( $layouts['traffic'], 'type' ) );
	}

	/**
	 * The record is what keeps a widget the reader removed from Traffic after the move removed.
	 */
	public function test_leaves_a_reader_who_already_had_the_move_alone() {
		$stored = $this->store_layouts(
			array(
				'insights' => array( self::stored( 'jpa/all-time-stats' ) ),
				'traffic'  => array( self::stored( 'jpa/referrers' ) ),
			),
			array( Stored_Layout_Move::MOVES_KEY => array( Stored_Layout_Move::MOVE_ID ) )
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

		$layouts = $this->read_moved_layouts();

		$this->assertSame( array(), $layouts['insights'] );
		$this->assertSame( array( 'jpa/tags', 'jpa/referrers' ), array_column( $layouts['traffic'], 'type' ) );
	}

	/**
	 * Without the destination's default there is nowhere to put the widget, so nothing is
	 * touched or recorded, and a later read tries again.
	 */
	public function test_keeps_the_widget_on_insights_while_the_traffic_default_lacks_it() {
		$without_tags = function ( $layout ) {
			return array_values(
				array_filter(
					$layout,
					function ( $widget ) {
						return 'jpa/tags' !== $widget['type'];
					}
				)
			);
		};
		add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, $without_tags );
		$stored = $this->store_layouts(
			array(
				'insights' => array( self::stored( 'jpa/tags' ) ),
				'traffic'  => array( self::stored( 'jpa/referrers' ) ),
			)
		);

		$read = get_user_meta( $this->user_id, $this->meta_key, true );
		remove_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, $without_tags );

		$this->assertSame( $stored, $read );
	}

	/**
	 * The client keeps whichever of its localStorage copy and the server's is newer, so a
	 * browser clock ahead of the server must not outrank the move.
	 */
	public function test_stamps_the_move_after_a_modified_from_the_future() {
		$future = gmdate( 'Y-m-d\TH:i:s\Z', time() + 600 );
		$this->store_layouts( array( 'insights' => array( self::stored( 'jpa/tags' ) ) ) );
		remove_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99 );
		$preferences              = get_user_meta( $this->user_id, $this->meta_key, true );
		$preferences['_modified'] = $future;
		update_user_meta( $this->user_id, $this->meta_key, wp_slash( $preferences ) );
		add_filter( 'get_user_metadata', array( Stored_Layout_Move::class, 'filter_user_meta' ), 99, 3 );

		$moved = get_user_meta( $this->user_id, $this->meta_key, true );

		$this->assertSame( array(), $moved[ Enablement_Setting::PREFERENCES_SCOPE ][ Stored_Layout_Move::LAYOUTS_KEY ]['insights'] );
		$this->assertGreaterThan( strtotime( $future ), strtotime( $moved['_modified'] ) );
	}

	/**
	 * A reader on the default layouts has nothing to move, and gets no record written either.
	 */
	public function test_leaves_preferences_without_stored_layouts_alone() {
		$stored = $this->store_preferences( array( 'onboardingCompletedAt' => '2026-01-01' ) );

		$this->assertSame( $stored, get_user_meta( $this->user_id, $this->meta_key, true ) );
	}

	public function test_ignores_other_meta_and_a_reader_with_no_preferences() {
		update_user_meta( $this->user_id, 'unrelated', 'kept' );

		$this->assertSame( 'kept', get_user_meta( $this->user_id, 'unrelated', true ) );
		$this->assertSame( '', get_user_meta( $this->user_id, $this->meta_key, true ) );
	}
}
