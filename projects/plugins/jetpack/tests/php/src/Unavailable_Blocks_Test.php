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

	public function test_module_details_name_the_module_and_whether_it_is_forced_off() {
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				return array_values( array_diff( $modules, array( 'subscriptions' ) ) );
			}
		);
		Jetpack_Modules_Overrides::instance()->clear_cache();

		$this->assertSame(
			array(
				'module'      => 'subscriptions',
				'module_name' => 'Newsletter',
				'forced'      => true,
			),
			Unavailable_Blocks::get_inactive_module_details( 'subscriptions' )
		);
	}

	public function test_editor_availability_names_the_module_a_block_reported() {
		$availability = Unavailable_Blocks::describe_inactive_modules(
			array(
				'subscriptions' => array(
					'available'          => false,
					'unavailable_reason' => 'missing_module',
					'details'            => array( 'module' => 'subscriptions' ),
				),
				'map'           => array( 'available' => true ),
			)
		);

		$this->assertSame( 'Newsletter', $availability['subscriptions']['details']['module_name'] );
		$this->assertSame( array( 'available' => true ), $availability['map'] );
	}

	public function test_offline_mode_only_withholds_modules_that_need_a_connection() {
		remove_all_filters( 'jetpack_offline_mode' );
		add_filter( 'jetpack_offline_mode', '__return_true', 1000 );
		\Automattic\Jetpack\Status\Cache::clear();

		$this->assertSame( array(), Unavailable_Blocks::get_inactive_module_details( 'subscriptions' ) );
		$this->assertSame( 'contact-form', Unavailable_Blocks::get_inactive_module_details( 'contact-form' )['module'] );
	}

	/**
	 * Blocks that bail out while their module is inactive, with the registration function that does it.
	 *
	 * @return array[]
	 */
	public static function provide_module_gated_blocks() {
		$ns = '\\Automattic\\Jetpack\\Extensions\\';
		return array(
			'subscriptions'    => array( 'subscriptions', $ns . 'Subscriptions\\register_block', 'subscriptions' ),
			'paywall'          => array( 'paywall', $ns . 'Paywall\\register_block', 'subscriptions' ),
			'subscriber-login' => array( 'subscriber-login', $ns . 'Subscriber_Login\\register_block', 'subscriptions' ),
			'blog-stats'       => array( 'blog-stats', $ns . 'Blog_Stats\\register_block', 'stats' ),
			'top-posts'        => array( 'top-posts', $ns . 'Top_Posts\\register_block', 'stats' ),
			'related-posts'    => array( 'related-posts', $ns . 'RelatedPosts\\register_block', 'related-posts' ),
		);
	}

	/**
	 * @param string $block    Block slug, which is also its directory under extensions/blocks.
	 * @param string $register The block's registration function.
	 * @param string $module   The module the block should report.
	 *
	 * @dataProvider provide_module_gated_blocks
	 */
	#[DataProvider( 'provide_module_gated_blocks' )]
	public function test_a_block_bailing_out_reports_its_inactive_module( $block, $register, $module ) {
		require_once JETPACK__PLUGIN_DIR . "extensions/blocks/{$block}/{$block}.php";
		Jetpack_Options::update_option( 'active_modules', array( 'blocks' ) );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		$extensions = static function () use ( $block ) {
			return array( $block );
		};
		add_filter( 'jetpack_set_available_extensions', $extensions );
		Jetpack_Gutenberg::reset();
		$availability = array();

		try {
			$register();
			$availability = (array) Jetpack_Gutenberg::get_availability();
		} finally {
			remove_filter( 'jetpack_set_available_extensions', $extensions );
			Jetpack_Gutenberg::reset();
		}

		$this->assertSame( 'missing_module', $availability[ $block ]['unavailable_reason'] );
		$this->assertSame( $module, $availability[ $block ]['details']['module'] );
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

		$data = (array) Unavailable_Blocks::get_editor_data();

		$this->assertSame( 'blocks_module', $data['reason'] );
		$this->assertSame( $can_fix, $data['canFix'] );
		$this->assertStringEndsWith( 'admin.php?page=jetpack#/writing', $data['fixUrl'] );
	}

	public function test_editor_data_is_null_without_a_site_wide_cause() {
		Jetpack_Options::update_option( 'active_modules', array( 'blocks' ) );

		$this->assertNull( Unavailable_Blocks::get_editor_data() );
	}

	public function test_editor_data_names_forms_when_blocks_and_forms_are_off() {
		Jetpack_Options::update_option( 'active_modules', array() );

		$data = (array) Unavailable_Blocks::get_editor_data();

		$this->assertSame( 'contact-form', $data['features']['jetpack/contact-form']['module'] );
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
