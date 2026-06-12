<?php
/**
 * Sidebar_Open_Preservation Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-sidebar-open-preservation.php';

/**
 * Class Sidebar_Open_Preservation_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\Sidebar_Open_Preservation
 */
#[CoversClass( Sidebar_Open_Preservation::class )]
class Sidebar_Open_Preservation_Test extends \WorDBless\BaseTestCase {

	const SIDEBAR_CONTAINER_CLASS = 'agents-manager-sidebar-container';
	const SIDEBAR_OPEN_CLASS      = 'agents-manager-sidebar-container--sidebar-open';

	/**
	 * The Sidebar_Open_Preservation instance.
	 *
	 * @var Sidebar_Open_Preservation
	 */
	private $preservation;

	/**
	 * The current test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->preservation = new Sidebar_Open_Preservation();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'preservation_tester',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		// Remove the hooks added by the constructor.
		remove_filter( 'admin_body_class', array( $this->preservation, 'add_preopen_body_classes' ), PHP_INT_MAX );
		remove_action( 'in_admin_header', array( $this->preservation, 'print_sidebar_open_sync_script' ) );

		// Clean up filters tests may add.
		remove_all_filters( 'agents_manager_use_unified_experience' );
		remove_all_filters( 'agents_manager_variant' );

		// Clear the cached open state.
		delete_transient( 'agents_manager_open_state_' . $this->user_id );

		// Restore admin/screen context.
		if ( function_exists( 'set_current_screen' ) ) {
			set_current_screen( 'front' );
		}
		unset( $GLOBALS['current_screen'], $GLOBALS['pagenow'] );

		parent::tear_down();
	}

	/**
	 * Put the request into the "should preserve" state: admin context with the app
	 * loading a connected (non-disconnected) variant.
	 */
	private function enable_preservation() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		add_filter( 'agents_manager_use_unified_experience', '__return_true' );
	}

	/**
	 * Cache a sidebar state for the current user.
	 *
	 * @param bool $open   Whether the sidebar is open.
	 * @param bool $docked Whether the sidebar is docked. Defaults to true.
	 */
	private function cache_open_state( bool $open, bool $docked = true ) {
		set_transient(
			'agents_manager_open_state_' . $this->user_id,
			array(
				'agents_manager_open'   => $open,
				'agents_manager_docked' => $docked,
			)
		);
	}

	/**
	 * Tests that init() creates a single shared instance.
	 */
	public function test_init_creates_singleton_instance() {
		$reflection = new \ReflectionClass( Sidebar_Open_Preservation::class );
		$property   = $reflection->getProperty( 'instance' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}

		// Reset any instance leaked from another test.
		$property->setValue( null, null );

		Sidebar_Open_Preservation::init();
		$first = $property->getValue();
		$this->assertInstanceOf( Sidebar_Open_Preservation::class, $first );

		Sidebar_Open_Preservation::init();
		$second = $property->getValue();

		$this->assertSame( $first, $second, 'init() should not replace an existing instance.' );

		// Clean up the hooks added by the instance created here.
		remove_filter( 'admin_body_class', array( $first, 'add_preopen_body_classes' ), PHP_INT_MAX );
		remove_action( 'in_admin_header', array( $first, 'print_sidebar_open_sync_script' ) );
		$property->setValue( null, null );
	}

	/**
	 * Tests that the constructor registers the body class filter last.
	 */
	public function test_constructor_registers_hook_last() {
		// Registered at `PHP_INT_MAX` so our class is always appended last and cannot be
		// glued onto a class added by a later `admin_body_class` filter.
		$this->assertSame(
			PHP_INT_MAX,
			has_filter( 'admin_body_class', array( $this->preservation, 'add_preopen_body_classes' ) ),
			'The pre-open body class filter must run last.'
		);
	}

	/**
	 * Tests that the constructor registers the early dock-sync script hook.
	 */
	public function test_constructor_registers_sync_script_hook() {
		$this->assertNotFalse(
			has_action( 'in_admin_header', array( $this->preservation, 'print_sidebar_open_sync_script' ) ),
			'The dock-sync script must be hooked into the admin body.'
		);
	}

	/**
	 * Tests that the dock-height sync script is printed when the
	 * docked-open shell is pre-rendered.
	 */
	public function test_print_sync_script_outputs_when_pre_rendering() {
		$this->enable_preservation();
		$this->cache_open_state( true );

		ob_start();
		$this->preservation->print_sidebar_open_sync_script();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<script', $output );
		// Height is the only gate measured here: it reads the admin menu and
		// publishes the verdict as the dock-too-short body class (mount only).
		$this->assertStringContainsString( 'adminmenu', $output );
		$this->assertStringContainsString( 'agents-manager--viewport-height-too-short-for-docking', $output );
	}

	/**
	 * Tests that the dock-sync script is not printed when nothing is pre-rendered.
	 */
	public function test_print_sync_script_noop_when_not_pre_rendering() {
		$this->enable_preservation();
		$this->cache_open_state( false );

		ob_start();
		$this->preservation->print_sidebar_open_sync_script();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	/**
	 * Tests that our pre-open class survives a misbehaving later filter that appends
	 * a class without a leading space. Because our filter runs last, our class lands
	 * at the very end of the list as a clean, standalone token.
	 *
	 * @see https://developer.wordpress.org/reference/hooks/admin_body_class/#comment-1012
	 */
	public function test_add_preopen_body_classes_runs_last_and_survives_concatenation() {
		$this->enable_preservation();
		$this->cache_open_state( true );

		// Mimic the real-world bug: a filter at the default priority that appends a
		// class without a leading space (e.g. `legacy-color-modern`).
		add_filter(
			'admin_body_class',
			static function ( $classes ) {
				return $classes . 'legacy-color-modern';
			}
		);

		$result = apply_filters( 'admin_body_class', 'foo' );
		$tokens = preg_split( '/\s+/', trim( $result ) );

		// Our open class is present as a clean, standalone token (not glued onto another).
		$this->assertContains( self::SIDEBAR_OPEN_CLASS, $tokens );
		// And it is the final token, confirming our filter ran last.
		$this->assertSame( self::SIDEBAR_OPEN_CLASS, end( $tokens ) );

		remove_all_filters( 'admin_body_class' );
	}

	/**
	 * Tests that body classes are unchanged on the site frontend.
	 */
	public function test_add_preopen_body_classes_unchanged_on_frontend() {
		// Not admin, even though the cached state says the sidebar is open.
		$this->cache_open_state( true );

		$this->assertFalse( is_admin() );
		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the app is not loading (no variant).
	 */
	public function test_add_preopen_body_classes_unchanged_when_app_inactive() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		$this->cache_open_state( true );

		// No unified experience filter added -> no active variant -> no app loaded.
		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that preservation runs for any active variant (the gate is purely
	 * "is the app loading on this request?").
	 */
	public function test_add_preopen_body_classes_runs_for_any_active_variant() {
		$this->enable_preservation();
		$this->cache_open_state( true );

		add_filter( 'agents_manager_variant', fn () => 'wp-admin-disconnected' );

		$result = $this->preservation->add_preopen_body_classes( 'foo bar' );

		$this->assertStringContainsString( self::SIDEBAR_OPEN_CLASS, $result );
	}

	/**
	 * Tests that body classes are unchanged when there is no cached state.
	 */
	public function test_add_preopen_body_classes_unchanged_when_state_uncached() {
		$this->enable_preservation();
		delete_transient( 'agents_manager_open_state_' . $this->user_id );

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the cached state is closed.
	 */
	public function test_add_preopen_body_classes_unchanged_when_closed() {
		$this->enable_preservation();
		$this->cache_open_state( false );

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the sidebar is open but undocked
	 * (floating). The docked-sidebar classes would wrongly reshape the layout.
	 */
	public function test_add_preopen_body_classes_unchanged_when_open_but_undocked() {
		$this->enable_preservation();
		$this->cache_open_state( true, false );

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that the sidebar-open classes are appended when the cached state is open.
	 */
	public function test_add_preopen_body_classes_appends_classes_when_open() {
		$this->enable_preservation();
		$this->cache_open_state( true );

		$result = $this->preservation->add_preopen_body_classes( 'foo bar' );

		$this->assertStringContainsString( 'foo bar', $result );
		$this->assertStringContainsString( self::SIDEBAR_CONTAINER_CLASS, $result );
		$this->assertStringContainsString( self::SIDEBAR_OPEN_CLASS, $result );
	}

	/**
	 * Persist a Gutenberg fullscreen-mode preference for the current user.
	 *
	 * @param string $scope      Preference scope (e.g. 'core/edit-post').
	 * @param bool   $fullscreen Whether fullscreen mode is on.
	 */
	private function set_fullscreen_preference( string $scope, bool $fullscreen ) {
		global $wpdb;
		update_user_meta(
			$this->user_id,
			$wpdb->get_blog_prefix() . 'persisted_preferences',
			array( $scope => array( 'fullscreenMode' => $fullscreen ) )
		);
	}

	/**
	 * Tests that nothing is pre-rendered on an editor screen when fullscreen mode
	 * is off — there the chat floats, so the docked classes would be a stale shell.
	 */
	public function test_no_pre_render_on_non_fullscreen_editor() {
		$this->enable_preservation();
		$this->cache_open_state( true );
		$GLOBALS['pagenow'] = 'post.php';
		$this->set_fullscreen_preference( 'core/edit-post', false );

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );

		ob_start();
		$this->preservation->print_sidebar_open_sync_script();
		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Tests that the shell is still pre-rendered on an editor screen when
	 * fullscreen mode is on (the default), where the chat docks.
	 */
	public function test_pre_renders_on_fullscreen_editor() {
		$this->enable_preservation();
		$this->cache_open_state( true );
		$GLOBALS['pagenow'] = 'site-editor.php';
		$this->set_fullscreen_preference( 'core/edit-site', true );

		$result = $this->preservation->add_preopen_body_classes( 'foo bar' );

		$this->assertStringContainsString( self::SIDEBAR_OPEN_CLASS, $result );
	}
}
