<?php
/**
 * Survicate Tests File
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/survicate/class-survicate.php';

/**
 * Class Survicate_Test
 *
 * @covers \A8C\FSE\Survicate
 */
#[CoversClass( Survicate::class )]
class Survicate_Test extends \WorDBless\BaseTestCase {

	/**
	 * The Survicate instance.
	 *
	 * @var Survicate
	 */
	private $survicate;

	/**
	 * Original $pagenow global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_pagenow;

	/**
	 * Original current_screen global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_current_screen;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		$this->survicate = new Survicate();

		global $pagenow;
		$this->original_pagenow        = $pagenow;
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		remove_action( 'admin_enqueue_scripts', array( $this->survicate, 'enqueue_scripts' ), 100 );

		global $pagenow;
		$pagenow = $this->original_pagenow;

		if ( $this->original_current_screen === null ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		wp_set_current_user( 0 );

		global $wp_scripts;
		$wp_scripts = null;

		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Helper to call a private method on the Survicate instance via reflection.
	 *
	 * @param string $method_name The method name to call.
	 * @return mixed The method's return value.
	 */
	private function call_private_method( $method_name ) {
		$method = ( new \ReflectionClass( Survicate::class ) )->getMethod( $method_name );
		return $method->invoke( $this->survicate );
	}

	/**
	 * Helper to simulate admin context for tests.
	 */
	private function set_admin_context() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
	}

	/**
	 * Helper to create a logged-in user.
	 *
	 * @param string $locale The locale for the user.
	 * @return int The user ID.
	 */
	private function create_and_login_user( $locale = 'en_US' ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test@example.com',
				'locale'     => $locale,
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Helper to set up a block editor screen via reflection.
	 *
	 * @param string $screen_id The screen ID (e.g. 'post', 'widgets').
	 */
	private function set_block_editor_screen( $screen_id ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( $screen_id );
		$screen   = get_current_screen();
		$property = ( new \ReflectionClass( $screen ) )->getProperty( 'is_block_editor' );
		$property->setValue( $screen, true );
	}

	/**
	 * Helper to get the inline script output for the wpcom-survicate handle.
	 *
	 * @return string The concatenated inline script.
	 */
	private function get_inline_script() {
		global $wp_scripts;
		$inline_scripts = $wp_scripts->registered['wpcom-survicate']->extra['after'] ?? array();
		return implode( "\n", array_filter( $inline_scripts ) );
	}

	/**
	 * Helper to set up admin context with a logged-in English user and enqueue scripts.
	 */
	private function enqueue_survicate_scripts() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user( 'en_US' );
		$this->survicate->enqueue_scripts();
	}

	// ---- should_load() tests ----

	/**
	 * Tests that should_load returns false when user is not logged in.
	 */
	public function test_should_load_returns_false_when_not_logged_in() {
		$this->set_admin_context();
		wp_set_current_user( 0 );

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false when not in admin context.
	 */
	public function test_should_load_returns_false_when_not_admin() {
		$this->create_and_login_user();

		$this->assertFalse( is_admin() );
		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false for non-English locale users.
	 *
	 * @param string $locale The locale to test.
	 * @dataProvider provide_non_english_locales
	 */
	#[DataProvider( 'provide_non_english_locales' )]
	public function test_should_load_returns_false_for_non_english_locale( $locale ) {
		$this->set_admin_context();
		$this->create_and_login_user( $locale );

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Data provider for non-English locale tests.
	 *
	 * @return \Iterator
	 */
	public static function provide_non_english_locales(): \Iterator {
		yield 'French' => array( 'fr_FR' );
		yield 'Spanish' => array( 'es_ES' );
		yield 'Japanese' => array( 'ja' );
		yield 'Portuguese (Brazil)' => array( 'pt_BR' );
	}

	/**
	 * Tests that should_load returns true for English locale variants.
	 *
	 * @param string $locale The locale to test.
	 * @dataProvider provide_english_locales
	 */
	#[DataProvider( 'provide_english_locales' )]
	public function test_should_load_returns_true_for_english_locales( $locale ) {
		$this->set_admin_context();
		$this->create_and_login_user( $locale );

		$this->assertTrue( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Data provider for English locale variant tests.
	 *
	 * @return \Iterator
	 */
	public static function provide_english_locales(): \Iterator {
		yield 'en_US' => array( 'en_US' );
		yield 'en_GB' => array( 'en_GB' );
		yield 'en_AU' => array( 'en_AU' );
		yield 'en_CA' => array( 'en_CA' );
	}

	// ---- get_editor_context() tests ----

	/**
	 * Tests that get_editor_context returns 'site-editor' on site-editor.php.
	 */
	public function test_get_editor_context_returns_site_editor() {
		global $pagenow;
		$pagenow = 'site-editor.php';

		$this->assertSame( 'site-editor', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'block-editor' in block editor screen.
	 */
	public function test_get_editor_context_returns_block_editor() {
		global $pagenow;
		$pagenow = 'post.php';
		$this->set_block_editor_screen( 'post' );

		$this->assertSame( 'block-editor', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'wp-admin' for widgets screen even with block editor.
	 */
	public function test_get_editor_context_returns_wp_admin_for_widgets() {
		global $pagenow;
		$pagenow = 'widgets.php';
		$this->set_block_editor_screen( 'widgets' );

		$this->assertSame( 'wp-admin', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'wp-admin' on regular admin pages.
	 */
	public function test_get_editor_context_returns_wp_admin_by_default() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();

		$this->assertSame( 'wp-admin', $this->call_private_method( 'get_editor_context' ) );
	}

	// ---- get_visitor_traits() tests ----

	/**
	 * Tests that get_visitor_traits returns correct structure and values.
	 */
	public function test_get_visitor_traits_returns_correct_structure() {
		global $pagenow;
		$pagenow = 'site-editor.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'test@example.com', $traits['email'] );
		$this->assertArrayHasKey( 'site_id', $traits );
		$this->assertArrayHasKey( 'site_type', $traits );
		$this->assertSame( 'site-editor', $traits['editor_context'] );
	}

	/**
	 * Tests that get_visitor_traits returns 'atomic' site_type when IS_ATOMIC is set.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_atomic_site_type() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		if ( ! defined( 'IS_ATOMIC' ) ) {
			define( 'IS_ATOMIC', true );
		}

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'atomic', $traits['site_type'] );
	}

	// ---- enqueue_scripts() tests ----

	/**
	 * Tests that enqueue_scripts does not enqueue when should_load returns false.
	 */
	public function test_enqueue_scripts_does_not_enqueue_when_not_logged_in() {
		$this->set_admin_context();
		wp_set_current_user( 0 );

		$this->survicate->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue_scripts does not enqueue for non-English locale.
	 */
	public function test_enqueue_scripts_does_not_enqueue_for_non_english_locale() {
		$this->set_admin_context();
		$this->create_and_login_user( 'fr_FR' );

		$this->survicate->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue_scripts registers the script and includes expected inline JS.
	 */
	public function test_enqueue_scripts_registers_script_with_expected_inline_js() {
		$this->enqueue_survicate_scripts();

		$this->assertTrue( wp_script_is( 'wpcom-survicate', 'enqueued' ) );

		$inline_script = $this->get_inline_script();

		$this->assertStringContainsString( Survicate::WORKSPACE_KEY, $inline_script );
		$this->assertStringContainsString( 'window.innerWidth < 480', $inline_script );
		$this->assertStringContainsString( 'SurvicateReady', $inline_script );
		$this->assertStringContainsString( 'setVisitorTraits', $inline_script );
		$this->assertStringContainsString( 'test@example.com', $inline_script );
	}

	// ---- Singleton tests ----

	/**
	 * Tests that the init method creates a singleton instance.
	 */
	public function test_init_creates_singleton_instance() {
		$property = ( new \ReflectionClass( Survicate::class ) )->getProperty( 'instance' );

		$dummy = $this->survicate;
		$property->setValue( $dummy, null );

		Survicate::init();
		$instance1 = $property->getValue( $dummy );
		$this->assertInstanceOf( Survicate::class, $instance1 );

		Survicate::init();
		$instance2 = $property->getValue( $dummy );
		$this->assertSame( $instance1, $instance2 );

		$property->setValue( $dummy, null );
	}
}
