<?php
/**
 * Tests for the editor's explanation of unavailable Jetpack blocks.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Plugin\Unavailable_Blocks;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Plugin\Unavailable_Blocks
 */
#[CoversClass( Unavailable_Blocks::class )]
class Unavailable_Blocks_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		\Automattic\Jetpack\Status\Cache::clear();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( 'jetpack_gutenberg' );
		remove_all_filters( 'jetpack_active_modules' );
		Jetpack_Options::delete_option( 'active_modules' );
		Jetpack_Modules_Overrides::instance()->clear_cache();
		\Automattic\Jetpack\Status\Cache::clear();
		Constants::clear_single_constant( 'REST_REQUEST' );
		parent::tear_down();
	}

	/**
	 * States of the Blocks module, the `jetpack_gutenberg` filter, and the connection.
	 *
	 * @return array[]
	 */
	public static function provide_site_wide_states() {
		return array(
			'blocks active'                            => array( true, null, true, null ),
			'blocks inactive'                          => array( false, null, true, 'blocks_module' ),
			'filter cannot load an inactive module'    => array( false, '__return_true', true, 'blocks_module' ),
			'filter turns blocks off'                  => array( true, '__return_false', true, 'disabled' ),
			'not connected outranks the blocks module' => array( false, null, false, 'not_connected' ),
		);
	}

	/**
	 * @param bool        $blocks_active Whether the Blocks module is active.
	 * @param string|null $filter        Callback for `jetpack_gutenberg`, if any.
	 * @param bool        $connected     Whether the site is connected.
	 * @param string|null $expected      Expected reason.
	 *
	 * @dataProvider provide_site_wide_states
	 */
	#[DataProvider( 'provide_site_wide_states' )]
	public function test_site_wide_reason( $blocks_active, $filter, $connected, $expected ) {
		Jetpack_Options::update_option( 'active_modules', $blocks_active ? array( 'blocks' ) : array() );
		if ( $filter ) {
			add_filter( 'jetpack_gutenberg', $filter );
		}
		if ( ! $connected ) {
			remove_all_filters( 'jetpack_is_connection_ready' );
			add_filter( 'jetpack_is_connection_ready', '__return_false', 1000 );
		}

		$this->assertSame( $expected, Unavailable_Blocks::get_site_wide_reason() );
	}

	public function test_blocks_module_forced_off_is_reported_as_disabled() {
		Jetpack_Options::update_option( 'active_modules', array( 'blocks' ) );
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				return array_values( array_diff( $modules, array( 'blocks' ) ) );
			}
		);
		Jetpack_Modules_Overrides::instance()->clear_cache();

		$this->assertSame( 'disabled', Unavailable_Blocks::get_site_wide_reason() );
	}

	public function test_feature_blocks_follow_their_module() {
		Jetpack_Options::update_option( 'active_modules', array( 'blocks', 'contact-form' ) );

		$blocks = Unavailable_Blocks::get_inactive_feature_blocks();

		$this->assertArrayHasKey( 'jetpack/subscriptions', $blocks );
		$this->assertArrayHasKey( 'jetpack/paywall', $blocks );
		$this->assertFalse( $blocks['jetpack/subscriptions']['forced'] );
		$this->assertArrayNotHasKey( 'jetpack/contact-form', $blocks );
	}

	public function test_stats_blocks_need_a_connected_owner_before_blaming_the_module() {
		Jetpack_Options::update_option( 'active_modules', array( 'blocks' ) );

		$this->assertArrayNotHasKey( 'jetpack/blog-stats', Unavailable_Blocks::get_inactive_feature_blocks() );
	}

	public function test_offline_mode_does_not_blame_feature_modules() {
		remove_all_filters( 'jetpack_offline_mode' );
		add_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		\Automattic\Jetpack\Status\Cache::clear();

		$this->assertSame( array(), Unavailable_Blocks::get_inactive_feature_blocks() );
	}

	public function test_forced_off_feature_is_flagged() {
		Jetpack_Options::update_option( 'active_modules', array( 'blocks', 'subscriptions' ) );
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				return array_values( array_diff( $modules, array( 'subscriptions' ) ) );
			}
		);
		Jetpack_Modules_Overrides::instance()->clear_cache();

		$this->assertTrue( Unavailable_Blocks::get_inactive_feature_blocks()['jetpack/subscriptions']['forced'] );
	}

	/**
	 * Roles and whether each may turn the Blocks module back on.
	 *
	 * @return array[]
	 */
	public static function provide_roles() {
		return array(
			'administrator' => array( 'administrator', true ),
			'editor'        => array( 'editor', false ),
		);
	}

	/**
	 * @param string $role    User role.
	 * @param bool   $can_fix Whether the user should be offered the fix.
	 *
	 * @dataProvider provide_roles
	 */
	#[DataProvider( 'provide_roles' )]
	public function test_editor_data_offers_the_fix_only_to_users_who_can_apply_it( $role, $can_fix ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );
		Jetpack_Options::update_option( 'active_modules', array() );

		$data = Unavailable_Blocks::get_editor_data();

		$this->assertSame( 'blocks_module', $data['reason'] );
		$this->assertSame( $can_fix, $data['canFix'] );
		$this->assertStringEndsWith( 'admin.php?page=jetpack#/writing', $data['fixUrl'] );
	}

	public function test_editor_data_is_null_when_nothing_is_unavailable() {
		Jetpack_Options::update_option( 'active_modules', array_merge( array( 'blocks' ), array_keys( Unavailable_Blocks::FEATURE_BLOCKS ) ) );

		$this->assertNull( Unavailable_Blocks::get_editor_data() );
	}

	public function test_editor_data_is_withheld_from_rest_requests() {
		Jetpack_Options::update_option( 'active_modules', array() );
		Constants::set_constant( 'REST_REQUEST', true );

		$this->assertNull( Unavailable_Blocks::get_editor_data() );
	}

	public function test_shipped_blocks_leave_out_blocks_gated_by_more_than_the_module() {
		$blocks = Unavailable_Blocks::get_shipped_blocks();

		$this->assertContains( 'videopress/video', $blocks );
		$this->assertNotContains( 'jetpack/wordads', $blocks );
		$this->assertNotContains( 'jetpack/revue', $blocks );
	}
}
