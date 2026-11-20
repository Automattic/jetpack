<?php
/**
 * Tests for where the usage tracking setting lives.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\My_Jetpack\Initializer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack_Privacy_Settings_Home
 */
#[CoversClass( Jetpack_Privacy_Settings_Home::class )]
class Jetpack_Privacy_Settings_Home_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Registered admin pages before the test.
	 *
	 * @var array
	 */
	private $registered_pages;

	/**
	 * Fired actions before the test.
	 *
	 * @var array
	 */
	private $actions;

	/**
	 * Save the globals arrange() changes.
	 */
	public function set_up() {
		global $_registered_pages, $wp_actions;

		parent::set_up();
		$this->registered_pages = $_registered_pages;
		$this->actions          = $wp_actions;
	}

	/**
	 * Undo arrange().
	 */
	public function tear_down() {
		global $_registered_pages, $wp_actions;

		$_registered_pages = $this->registered_pages;
		$wp_actions        = $this->actions; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Restores what set_up() saved.
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		parent::tear_down();
	}

	/**
	 * The Profile page shows the section.
	 */
	public function test_hooks_the_profile_page() {
		$this->assertSame( 10, has_action( 'profile_personal_options', array( Jetpack_Privacy_Settings_Home::class, 'render_profile_section' ) ) );
	}

	/**
	 * Sites and users, and whether the Profile page should show the section.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		return array(
			'flag on, editor'          => array( true, true, 'editor', true ),
			'flag off'                 => array( false, true, 'administrator', false ),
			'no My Jetpack page'       => array( true, false, 'administrator', false ),
			'flag on, cannot edit any' => array( true, true, 'subscriber', false ),
		);
	}

	/**
	 * The section shows exactly where the Settings app drops its Privacy card.
	 *
	 * @dataProvider provide_sites
	 *
	 * @param bool   $flag     Settings consolidation flag.
	 * @param bool   $has_page Whether My Jetpack registered its page.
	 * @param string $role     Current user's role.
	 * @param bool   $is_shown Whether the section prints.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_section_follows_the_settings_card( $flag, $has_page, $role, $is_shown ) {
		$this->arrange( $flag, $has_page, $role );

		$this->assertSame( $is_shown, Jetpack_Privacy_Settings_Home::is_moved_off_settings() );
		$this->assertSame( $is_shown, str_contains( $this->render(), 'id="jetpack-privacy"' ) );
	}

	/**
	 * The section links to the WordPress.com page that holds the setting.
	 */
	public function test_section_links_to_wordpress_com() {
		$this->arrange( true, true, 'editor' );

		$this->assertStringContainsString( 'href="https://wordpress.com/me/privacy"', $this->render() );
	}

	/**
	 * Set up the site and user a provide_sites() row names.
	 *
	 * @param bool   $flag     Settings consolidation flag.
	 * @param bool   $has_page Whether My Jetpack registered its page.
	 * @param string $role     Current user's role.
	 */
	private function arrange( $flag, $has_page, $role ) {
		global $_registered_pages, $wp_actions;

		// Pin it: an earlier test can leave a local site URL, which Status reads as offline.
		add_filter( 'jetpack_offline_mode', '__return_false' );
		if ( $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG, '__return_true' );
		}
		// An earlier test can leave My Jetpack's page registered.
		unset( $_registered_pages[ get_plugin_page_hookname( 'my-jetpack', 'jetpack' ) ] );
		if ( $has_page ) {
			unset( $wp_actions['my_jetpack_init'] );
			do_action( 'my_jetpack_init' );
			$_registered_pages[ get_plugin_page_hookname( 'my-jetpack', 'jetpack' ) ] = true;
		}
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );
	}

	/**
	 * The section's markup.
	 *
	 * @return string
	 */
	private function render() {
		ob_start();
		Jetpack_Privacy_Settings_Home::render_profile_section();
		return ob_get_clean();
	}
}
