<?php
/**
 * Sidebar_Open_Preservation Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-sidebar-open-preservation.php';

/**
 * Class Sidebar_Open_Preservation_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\Sidebar_Open_Preservation
 */
#[CoversClass( Sidebar_Open_Preservation::class )]
class Sidebar_Open_Preservation_Test extends \WorDBless\BaseTestCase {

	const COOKIE_KEY         = 'agents_manager_chat_sidebar_open';
	const SIDEBAR_OPEN_CLASS = 'agents-manager-sidebar-container--sidebar-open';

	/**
	 * The Sidebar_Open_Preservation instance.
	 *
	 * @var Sidebar_Open_Preservation
	 */
	private $preservation;

	/**
	 * Original $_COOKIE value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_cookie;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->preservation = new Sidebar_Open_Preservation();

		// Save original cookie value so tests can mutate it freely.
		$this->original_cookie = $_COOKIE[ self::COOKIE_KEY ] ?? null;
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		// Remove hooks added by the constructor.
		remove_filter( 'admin_body_class', array( $this->preservation, 'add_preopen_body_classes' ) );
		remove_action( 'admin_enqueue_scripts', array( $this->preservation, 'enqueue_sidebar_open_watcher_script' ), 1 );

		// Clean up the unified experience filter that tests may add.
		remove_all_filters( 'agents_manager_use_unified_experience' );

		// Restore the cookie superglobal.
		if ( $this->original_cookie === null ) {
			unset( $_COOKIE[ self::COOKIE_KEY ] );
		} else {
			$_COOKIE[ self::COOKIE_KEY ] = $this->original_cookie;
		}

		// Restore admin/screen context.
		if ( function_exists( 'set_current_screen' ) ) {
			set_current_screen( 'front' );
		}
		unset( $GLOBALS['current_screen'] );

		// Reset the script registry.
		global $wp_scripts;
		$wp_scripts = null;

		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Put the request into the "should preserve" state: admin context with the
	 * unified experience enabled.
	 */
	private function enable_preservation() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		add_filter( 'agents_manager_use_unified_experience', '__return_true' );
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

		// Clean up hooks added by the instance created here.
		remove_filter( 'admin_body_class', array( $first, 'add_preopen_body_classes' ) );
		remove_action( 'admin_enqueue_scripts', array( $first, 'enqueue_sidebar_open_watcher_script' ), 1 );
		$property->setValue( null, null );
	}

	/**
	 * Tests that the constructor registers the expected hooks.
	 */
	public function test_constructor_registers_hooks() {
		$this->assertNotFalse(
			has_filter( 'admin_body_class', array( $this->preservation, 'add_preopen_body_classes' ) )
		);
		$this->assertSame(
			1,
			has_action( 'admin_enqueue_scripts', array( $this->preservation, 'enqueue_sidebar_open_watcher_script' ) )
		);
	}

	/**
	 * Tests that body classes are unchanged on the site frontend.
	 */
	public function test_add_preopen_body_classes_unchanged_on_frontend() {
		// Not admin, even though the cookie says the sidebar is open.
		$_COOKIE[ self::COOKIE_KEY ] = '1';

		$this->assertFalse( is_admin() );
		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the unified experience is disabled.
	 */
	public function test_add_preopen_body_classes_unchanged_when_unified_experience_disabled() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
		$_COOKIE[ self::COOKIE_KEY ] = '1';

		// No unified experience filter added -> defaults to false.
		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the cookie is absent.
	 */
	public function test_add_preopen_body_classes_unchanged_when_cookie_missing() {
		$this->enable_preservation();
		unset( $_COOKIE[ self::COOKIE_KEY ] );

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that body classes are unchanged when the cookie is not "1".
	 */
	public function test_add_preopen_body_classes_unchanged_when_cookie_not_open() {
		$this->enable_preservation();
		$_COOKIE[ self::COOKIE_KEY ] = '0';

		$this->assertSame( 'foo bar', $this->preservation->add_preopen_body_classes( 'foo bar' ) );
	}

	/**
	 * Tests that the sidebar-open classes are appended when the cookie is "1".
	 */
	public function test_add_preopen_body_classes_appends_classes_when_open() {
		$this->enable_preservation();
		$_COOKIE[ self::COOKIE_KEY ] = '1';

		$result = $this->preservation->add_preopen_body_classes( 'foo bar' );

		$this->assertStringContainsString( 'foo bar', $result );
		$this->assertStringContainsString( 'agents-manager-sidebar-container', $result );
		$this->assertStringContainsString( self::SIDEBAR_OPEN_CLASS, $result );
	}

	/**
	 * Tests that no leading whitespace is produced when the incoming class string is empty.
	 */
	public function test_add_preopen_body_classes_trims_when_input_empty() {
		$this->enable_preservation();
		$_COOKIE[ self::COOKIE_KEY ] = '1';

		$result = $this->preservation->add_preopen_body_classes( '' );

		$this->assertSame(
			'agents-manager-sidebar-container ' . self::SIDEBAR_OPEN_CLASS,
			$result
		);
	}

	/**
	 * Tests that the open cookie value is sanitized before being compared.
	 */
	public function test_add_preopen_body_classes_handles_slashed_cookie_value() {
		$this->enable_preservation();
		// A slashed/padded value that is not exactly "1" should not open the sidebar.
		$_COOKIE[ self::COOKIE_KEY ] = '1; rm -rf';

		$result = $this->preservation->add_preopen_body_classes( 'foo' );

		$this->assertSame( 'foo', $result );
	}

	/**
	 * Tests that the watcher script is not enqueued when preservation is disabled.
	 */
	public function test_enqueue_does_nothing_when_disabled() {
		// Frontend context: should_preserve_sidebar_open_state() returns false.
		$this->preservation->enqueue_sidebar_open_watcher_script();

		$this->assertFalse( wp_script_is( 'jetpack-agents-manager-sidebar-open-watcher', 'registered' ) );
		$this->assertFalse( wp_script_is( 'jetpack-agents-manager-sidebar-open-watcher', 'enqueued' ) );
	}

	/**
	 * Tests that the watcher script is registered, enqueued, and carries inline data when enabled.
	 */
	public function test_enqueue_registers_and_enqueues_script_when_enabled() {
		$this->enable_preservation();
		Constants::set_constant( 'ADMIN_COOKIE_PATH', '/wp-admin' );

		$this->preservation->enqueue_sidebar_open_watcher_script();

		$handle = 'jetpack-agents-manager-sidebar-open-watcher';
		$this->assertTrue( wp_script_is( $handle, 'registered' ) );
		$this->assertTrue( wp_script_is( $handle, 'enqueued' ) );

		global $wp_scripts;
		$inline_scripts = $wp_scripts->registered[ $handle ]->extra['before'] ?? array();
		$inline_script  = implode( "\n", array_filter( (array) $inline_scripts ) );

		$this->assertStringContainsString( 'window.AgentsManagerSidebarOpenWatcherData =', $inline_script );
		$this->assertStringContainsString( '"cookieKey":"' . self::COOKIE_KEY . '"', $inline_script );
		$this->assertStringContainsString( '"sidebarOpenClass":"' . self::SIDEBAR_OPEN_CLASS . '"', $inline_script );
		$this->assertStringContainsString( '"cookiePath":"/wp-admin"', $inline_script );
	}
}
