<?php
/**
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Every kind of site gets exactly one security entry in the Jetpack menu, and it is Protect.
 *
 * Each row runs in its own process: the module loader includes a module file once, and the
 * standalone Protect plugin is detected by a class that cannot be undefined afterwards.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Jetpack_Security_Menu_Matrix_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Mock a connection.
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );

		// The Protect page is being built behind this flag, which is removed when it ships.
		add_filter( 'jetpack_feature_flag_enabled_jetpack-protect-dashboard', '__return_true' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( array( 'master_user', 'id', 'blog_token', 'user_tokens' ) );
		parent::tear_down();
	}

	/**
	 * The site matrix.
	 *
	 * @return array[] Site name to whether it has Scan, the standalone Protect plugin, and is Atomic.
	 */
	public static function provide_sites() {
		return array(
			'self-hosted, no Scan'                 => array( false, false, false ),
			'self-hosted, with Scan'               => array( true, false, false ),
			'self-hosted, with the Protect plugin' => array( true, true, false ),
			'Atomic'                               => array( true, false, true ),
		);
	}

	/**
	 * The Jetpack menu has one security entry, Protect.
	 *
	 * @dataProvider provide_sites
	 *
	 * @param bool $has_scan           Whether the site has Scan.
	 * @param bool $has_protect_plugin Whether the standalone Protect plugin is active.
	 * @param bool $is_atomic          Whether the site is on WordPress.com Atomic.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_jetpack_menu_has_one_security_entry( $has_scan, $has_protect_plugin, $is_atomic ) {
		if ( $is_atomic ) {
			$this->markTestSkipped( 'Waiting on the WordPress.com answer for what Atomic shows.' );
		}

		$this->set_scan_entitlement( $has_scan );

		if ( $has_protect_plugin ) {
			$this->activate_standalone_protect_plugin();
		}

		$this->assertSame(
			array( array( 'Protect', 'jetpack-protect' ) ),
			$this->security_entries( $this->render_jetpack_menu() )
		);
	}

	/**
	 * Gives the site Scan, or takes it away, under each check the plugin uses for it.
	 *
	 * @param bool $has_scan Whether the site has Scan.
	 */
	private function set_scan_entitlement( $has_scan ) {
		$scan          = new stdClass();
		$scan->state   = $has_scan ? 'idle' : 'unavailable';
		$rewind        = new stdClass();
		$rewind->state = 'unavailable';
		set_transient( 'jetpack_scan_state', $scan, WEEK_IN_SECONDS );
		set_transient( 'jetpack_rewind_state', $rewind, WEEK_IN_SECONDS );

		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => $has_scan ? 'jetpack_scan' : 'jetpack_free',
				'class'        => $has_scan ? 'scan' : 'free',
				'features'     => array( 'active' => $has_scan ? array( 'scan' ) : array() ),
			)
		);
	}

	/**
	 * Stands in for the Jetpack Protect plugin, which this suite does not install.
	 *
	 * Mirrors what Jetpack_Protect::admin_page_init() registers, and the class Jetpack detects it by.
	 */
	private function activate_standalone_protect_plugin() {
		class_alias( stdClass::class, 'Jetpack_Protect' );

		add_action(
			'_admin_menu',
			static function () {
				Admin_Menu::add_menu(
					'Jetpack Protect',
					'Protect',
					'manage_options',
					'jetpack-protect',
					'__return_null',
					null,
					array(
						'product' => 'protect',
						'key'     => 'jetpack-protect',
					)
				);
			}
		);
	}

	/**
	 * Loads the modules a connected site has without its owner turning anything on, then builds the menu.
	 *
	 * @return array[] The Jetpack submenu items, in the order WordPress rendered them.
	 */
	private function render_jetpack_menu() {
		$default_modules = Jetpack::get_default_modules();
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) use ( $default_modules ) {
				return array_values( array_unique( array_merge( $modules, $default_modules ) ) );
			}
		);
		Jetpack::load_modules();
		// Jetpack loads its admin on admin requests only, which a PHPUnit run is not.
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';

		do_action( '_admin_menu' );
		do_action( 'admin_menu' );

		global $submenu;

		return empty( $submenu['jetpack'] ) ? array() : array_values( $submenu['jetpack'] );
	}

	/**
	 * Picks the visible security entries out of the Jetpack submenu.
	 *
	 * @param array[] $items Jetpack submenu items.
	 * @return array[] A title and slug pair for each entry named Scan or Protect, or pointing at either.
	 */
	private function security_entries( array $items ) {
		$entries = array();

		foreach ( $items as $item ) {
			$title = trim( wp_strip_all_tags( $item[0] ) );

			// jetpack-mu-wpcom hides an entry by class and leaves it registered.
			if ( isset( $item[4] ) && false !== strpos( $item[4], 'hide-if-js' ) ) {
				continue;
			}

			if ( preg_match( '/\b(Scan|Protect)\b/', $title ) || preg_match( '/scan|jetpack-protect/', $item[2] ) ) {
				$entries[] = array( $title, $item[2] );
			}
		}

		return $entries;
	}
}
