<?php
/**
 * Tests for the WordPress.com tab on the Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-themes/wpcom-themes-tab.php';

/**
 * Class Wpcom_Themes_Tab_Test
 */
class Wpcom_Themes_Tab_Test extends \WorDBless\BaseTestCase {

	/**
	 * Per-flag filter, so toggling ours leaves every other flag alone.
	 *
	 * @var string
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . WPCOM_THEMES_TAB_FLAG;

	/**
	 * Remove the flag override after each test.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_all_filters( self::FLAG_FILTER );
		wp_deregister_script( 'wpcom-themes-tab' );
		parent::tear_down();
	}

	/**
	 * Turn the tab on for the duration of a test.
	 *
	 * @return void
	 */
	private function enable_tab() {
		add_filter( self::FLAG_FILTER, '__return_true' );
	}

	/**
	 * Query the themes API as core's theme.js does for a tab.
	 *
	 * @param array $args Request arguments.
	 * @return false|object|array
	 */
	private function query( array $args ) {
		return wpcom_themes_tab_serve_themes_api( false, 'query_themes', (object) $args );
	}

	/**
	 * The tab's query is answered from the WordPress.com catalog.
	 */
	public function test_serves_catalog_for_the_tab() {
		$this->enable_tab();

		$result = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertIsObject( $result );
		$this->assertSameSize( wpcom_themes_tab_get_catalog(), $result->themes );
		$this->assertSame( count( $result->themes ), $result->info['results'] );
	}

	/**
	 * Core's wp_ajax_query_themes() reads these without isset() guards.
	 */
	public function test_themes_have_the_fields_core_reads() {
		$this->enable_tab();

		$theme = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) )->themes[0];

		foreach ( array( 'slug', 'name', 'version', 'description', 'screenshot_url', 'preview_url', 'rating', 'num_ratings', 'requires', 'requires_php' ) as $field ) {
			$this->assertObjectHasProperty( $field, $theme );
		}
		$this->assertArrayHasKey( 'display_name', $theme->author );
	}

	/**
	 * Scrolling the grid must not append the catalog a second time.
	 */
	public function test_later_pages_are_empty() {
		$this->enable_tab();

		$result = $this->query(
			array(
				'browse' => WPCOM_THEMES_TAB,
				'page'   => 2,
			)
		);

		$this->assertSame( array(), $result->themes );
	}

	/**
	 * Core's own tabs, search and theme details still go to WordPress.org.
	 */
	public function test_leaves_other_tabs_to_core() {
		$this->enable_tab();

		$this->assertFalse( $this->query( array( 'browse' => 'popular' ) ) );
		$this->assertFalse( $this->query( array( 'search' => 'blog' ) ) );
		$this->assertFalse( wpcom_themes_tab_serve_themes_api( false, 'theme_information', (object) array( 'slug' => 'assembler' ) ) );
	}

	/**
	 * With the flag off, neither the tab nor its results appear.
	 */
	public function test_does_nothing_when_flag_is_off() {
		$this->assertFalse( $this->query( array( 'browse' => WPCOM_THEMES_TAB ) ) );

		wpcom_themes_tab_enqueue_script();
		$this->assertFalse( wp_script_is( 'wpcom-themes-tab', 'enqueued' ) );
	}

	/**
	 * A result from an earlier filter is passed through untouched.
	 */
	public function test_respects_an_earlier_result() {
		$this->enable_tab();
		$earlier = (object) array( 'themes' => array() );

		$this->assertSame( $earlier, wpcom_themes_tab_serve_themes_api( $earlier, 'query_themes', (object) array( 'browse' => WPCOM_THEMES_TAB ) ) );
	}

	/**
	 * With the flag on, the Add Themes screen loads the tab script.
	 */
	public function test_enqueues_script_when_flag_is_on() {
		$this->enable_tab();

		wpcom_themes_tab_enqueue_script();

		$this->assertTrue( wp_script_is( 'wpcom-themes-tab', 'enqueued' ) );
	}
}
