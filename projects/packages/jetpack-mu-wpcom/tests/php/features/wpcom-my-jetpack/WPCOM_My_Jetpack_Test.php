<?php
/**
 * Test class for the Simple My Jetpack page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_My_Jetpack;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-my-jetpack/wpcom-my-jetpack.php';

/**
 * Class WPCOM_My_Jetpack_Test
 */
class WPCOM_My_Jetpack_Test extends \WorDBless\BaseTestCase {

	/**
	 * The test site's domain.
	 *
	 * @var string
	 */
	private $domain;

	/**
	 * Sets up the Jetpack menu the page reads, as an admin.
	 */
	public function set_up() {
		parent::set_up();

		global $submenu;
		$this->domain = wp_parse_url( home_url(), PHP_URL_HOST );
		wp_set_current_user( $this->insert_user( 'administrator' ) );
		WPCOM_My_Jetpack::reset();
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(
			'jetpack' => array(
				array( 'My Jetpack', 'edit_posts', 'my-jetpack' ),
				array( 'Akismet Anti-spam <span class="awaiting-mod"><span class="count">2</span></span>', 'manage_options', 'akismet-key-config' ),
				array( 'Activity Log', 'manage_options', 'jetpack-activity-log', '', 'hide-if-js' ),
				array( 'Scan', 'manage_options', 'https://wordpress.com/scan/' . $this->domain ),
				array( 'New Tool', 'manage_options', 'jetpack-new-tool' ),
			),
		);
	}

	/**
	 * Inserts a user.
	 *
	 * @param string $role The user's role.
	 * @return int The user's ID.
	 */
	private function insert_user( $role ) {
		return wp_insert_user(
			array(
				'user_login' => "my_jetpack_$role",
				'user_pass'  => 'pass',
				'user_email' => "my_jetpack_$role@example.com",
				'role'       => $role,
			)
		);
	}

	/**
	 * The page steps aside when the real My Jetpack claimed the slug, as on a site with the sticker.
	 */
	public function test_page_leaves_a_claimed_slug_alone() {
		global $submenu;

		WPCOM_My_Jetpack::register_page();

		$this->assertFalse( WPCOM_My_Jetpack::owns_page() );
		$this->assertCount( 1, array_keys( array_column( $submenu['jetpack'], 2 ), 'my-jetpack', true ) );
	}

	/**
	 * The page registers on a site without My Jetpack, for anyone who can edit posts.
	 */
	public function test_page_registers_when_the_slug_is_free() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array();

		WPCOM_My_Jetpack::register_page();

		$this->assertTrue( WPCOM_My_Jetpack::owns_page() );
		$this->assertSame( array( 'my-jetpack' ), array_column( $submenu['jetpack'], 2 ) );
		$this->assertSame( 'edit_posts', $submenu['jetpack'][0][1] );
	}

	/**
	 * The list holds visible items only, with clean titles and the right destinations.
	 */
	public function test_tools_list_the_visible_menu() {
		$this->assertSame(
			array(
				array(
					'title'       => 'Akismet Anti-spam',
					'description' => 'Filter spam from comments and forms',
					'icon'        => 'akismet-key-config',
					'url'         => admin_url( 'admin.php?page=akismet-key-config' ),
					'external'    => false,
				),
				array(
					'title'       => 'Scan',
					'description' => 'Check your site for malware and threats',
					'icon'        => 'scan',
					'url'         => 'https://wordpress.com/scan/' . $this->domain,
					'external'    => true,
				),
				array(
					'title'       => 'New Tool',
					'description' => '',
					'icon'        => '',
					'url'         => admin_url( 'admin.php?page=jetpack-new-tool' ),
					'external'    => false,
				),
			),
			WPCOM_My_Jetpack::get_tools()
		);
	}

	/**
	 * Values escaped for wp-admin's menu HTML reach React decoded, and badges stay out of titles.
	 */
	public function test_tools_decode_escaped_slugs_and_titles() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'Journal d&#039;activit&eacute; <span class="count">3</span>', 'manage_options', 'https://jetpack.com/redirect/?source=x&#038;site=y' ),
			array( '<span class="name">Wrapped</span>', 'manage_options', 'jetpack-wrapped' ),
		);

		$tools = WPCOM_My_Jetpack::get_tools();

		$this->assertSame( "Journal d'activité", $tools[0]['title'] );
		$this->assertSame( 'https://jetpack.com/redirect/?source=x&site=y', $tools[0]['url'] );
		$this->assertSame( 'Wrapped', $tools[1]['title'] );
	}

	/**
	 * Only Jetpack's own slugs pick up a description and icon, and each address form of a tool does.
	 */
	public function test_tools_match_known_slugs_exactly() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'WPForms', 'manage_options', 'wpforms-admin' ),
			array( 'Museo', 'manage_options', 'museo-settings' ),
			array( 'Forms', 'manage_options', 'jetpack-forms-responses-wp-admin' ),
			array( 'Traffic', 'manage_options', 'https://wordpress.com/marketing/traffic/' . $this->domain ),
		);

		$this->assertSame( array( '', '', 'forms-responses-wp-admin', 'marketing/traffic' ), array_column( WPCOM_My_Jetpack::get_tools(), 'icon' ) );
	}

	/**
	 * Code linking to My Jetpack's Features screen stands down once this page holds the slug.
	 */
	public function test_page_reports_no_modules_management() {
		global $submenu;

		$this->assertTrue( apply_filters( 'jetpack_my_jetpack_modules_management_available', true ) );

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array();
		WPCOM_My_Jetpack::register_page();

		$this->assertFalse( apply_filters( 'jetpack_my_jetpack_modules_management_available', true ) );
	}

	/**
	 * Admins get the plan link and Editors don't, though both get the tools.
	 */
	public function test_state_gives_the_plan_link_to_admins_only() {
		$state = WPCOM_My_Jetpack::get_initial_state();
		$this->assertSame( 'https://wordpress.com/plans/' . $this->domain, $state['plan']['url'] );

		wp_set_current_user( $this->insert_user( 'editor' ) );

		$state = WPCOM_My_Jetpack::get_initial_state();
		$this->assertNull( $state['plan'] );
		$this->assertCount( 3, $state['tools'] );
	}

	/**
	 * Staging sites don't get the plan link, as they don't get the Upgrades menu.
	 */
	public function test_state_leaves_the_plan_link_off_staging_sites() {
		update_option( 'wpcom_is_staging_site', true );

		$this->assertNull( WPCOM_My_Jetpack::get_initial_state()['plan'] );
	}
}
