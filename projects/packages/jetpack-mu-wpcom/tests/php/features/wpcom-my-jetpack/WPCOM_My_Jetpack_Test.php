<?php
/**
 * Test class for the Simple My Jetpack page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
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
				array( 'Feedback', 'manage_options', 'edit.php?post_type=feedback' ),
			),
		);
		$this->add_page_callback( 'akismet-key-config' );
		$this->add_page_callback( 'jetpack-new-tool' );
	}

	/**
	 * Clears the feature flag and host overrides.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . WPCOM_My_Jetpack::FEATURE_FLAG );
		remove_all_filters( 'stylesheet' );
		Constants::clear_single_constant( 'IS_WPCOM' );
		parent::tear_down();
	}

	/**
	 * Gives a menu slug a page callback, as add_submenu_page() does.
	 *
	 * @param string $slug The menu slug.
	 */
	private function add_page_callback( $slug ) {
		add_action( get_plugin_page_hookname( $slug, 'jetpack' ), '__return_null' );
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

		$items = $this->get_jetpack_submenu();
		$this->assertTrue( WPCOM_My_Jetpack::owns_page() );
		$this->assertSame( array( 'my-jetpack' ), array_column( $items, 2 ) );
		$this->assertSame( 'edit_posts', $items[0][1] ?? null );
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
					'key'         => 'akismet-key-config',
					'section'     => 'security',
					'url'         => admin_url( 'admin.php?page=akismet-key-config' ),
				),
				array(
					'title'       => 'Scan',
					'description' => 'Check your site for malware and threats',
					'key'         => 'scan',
					'section'     => 'security',
					'url'         => 'https://wordpress.com/scan/' . $this->domain,
				),
				array(
					'title'       => 'New Tool',
					'description' => '',
					'key'         => '',
					'section'     => 'more',
					'url'         => admin_url( 'admin.php?page=jetpack-new-tool' ),
				),
				array(
					'title'       => 'Feedback',
					'description' => '',
					'key'         => '',
					'section'     => 'more',
					'url'         => admin_url( 'edit.php?post_type=feedback' ),
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
	 * Only Jetpack's own slugs and this site's WordPress.com links pick up a description and icon.
	 */
	public function test_tools_match_known_slugs_exactly() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'WPForms', 'manage_options', 'wpforms-admin' ),
			array( 'Museo', 'manage_options', 'museo-settings' ),
			array( 'Forms', 'manage_options', 'jetpack-forms-responses-wp-admin' ),
			array( 'Traffic', 'manage_options', 'https://wordpress.com/marketing/traffic/' . $this->domain ),
			array( 'Protect', 'manage_options', 'jetpack-protect' ),
			array( 'Other site', 'manage_options', 'https://wordpress.com/scan/other.example' ),
		);

		$this->assertSame( array( '', '', 'forms', 'marketing/traffic', 'protect', '' ), array_column( WPCOM_My_Jetpack::get_tools(), 'key' ) );
	}

	/**
	 * Two menu entries with the same destination make one card.
	 */
	public function test_tools_skip_repeated_destinations() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'Akismet Anti-spam', 'manage_options', 'akismet-key-config' ),
			array( 'Akismet Anti-spam <span class="count">2</span>', 'manage_options', 'akismet-key-config' ),
		);

		$this->assertCount( 1, WPCOM_My_Jetpack::get_tools() );
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
	 * The page stays off until its feature flag is on.
	 */
	public function test_page_registers_only_with_its_feature_flag() {
		$this->assertFalse( WPCOM_My_Jetpack::should_register() );

		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_My_Jetpack::FEATURE_FLAG, '__return_true' );

		$this->assertTrue( WPCOM_My_Jetpack::should_register() );
	}

	/**
	 * P2s drop the Jetpack menu, so the page stays off there with its flag on.
	 */
	public function test_page_skips_p2_sites() {
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_My_Jetpack::FEATURE_FLAG, '__return_true' );
		Constants::set_constant( 'IS_WPCOM', true );
		add_filter(
			'stylesheet',
			function () {
				return 'pub/p2';
			}
		);

		$this->assertFalse( WPCOM_My_Jetpack::should_register() );
	}

	/**
	 * A menu slug in a protocol WordPress doesn't allow never becomes a link.
	 */
	public function test_tools_drop_disallowed_protocols() {
		global $submenu;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['jetpack'] = array(
			array( 'Bad', 'manage_options', 'javascript://example.com/%0Aalert(1)' ),
			array( 'Good', 'manage_options', 'jetpack-good' ),
		);

		$this->assertSame( array( 'Good' ), array_column( WPCOM_My_Jetpack::get_tools(), 'title' ) );
	}

	/**
	 * The Jetpack submenu as it stands, read in its own scope so Phan doesn't
	 * narrow it to the empty menu a test started from.
	 *
	 * @return array<int,array<int,string>>
	 */
	private function get_jetpack_submenu() {
		global $submenu;
		return $submenu['jetpack'] ?? array();
	}
}
