<?php
/**
 * Tests for the guard that keeps a WordPress.com site's private or coming-soon
 * state out of reach of the SEO dashboard's indexing toggle.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 */
#[CoversClass( Dashboard_Data::class )]
class DashboardPrivateSiteTest extends SeoTestCase {

	/**
	 * `blog_public` as the bootstrap left it, restored rather than deleted — it's a
	 * core option other suites read, so clobbering it leaks state. Null when absent.
	 *
	 * @var mixed
	 */
	private $original_blog_public;

	/**
	 * Capture `blog_public` before a test moves it.
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->original_blog_public = get_option( 'blog_public', null );
	}

	/**
	 * Put `blog_public` back and unhook the guard, so no other suite inherits either.
	 */
	protected function tearDown(): void {
		remove_filter( 'rest_pre_update_setting', array( Dashboard_Data::class, 'block_publishing_a_private_site' ), 10 );

		delete_option( 'wpcom_public_coming_soon' );
		Constants::clear_single_constant( 'IS_WPCOM' );
		Status_Cache::clear();

		if ( null === $this->original_blog_public ) {
			delete_option( 'blog_public' );
		} else {
			update_option( 'blog_public', $this->original_blog_public );
		}

		parent::tearDown();
	}

	/**
	 * Registering the settings also hooks the guard. Without this the callback below
	 * could be correct and never consulted.
	 */
	public function test_registering_settings_hooks_the_guard() {
		$this->assertFalse(
			has_filter( 'rest_pre_update_setting', array( Dashboard_Data::class, 'block_publishing_a_private_site' ) ),
			'Precondition: not hooked before registration.'
		);

		Dashboard_Data::register_rest_settings();

		$this->assertNotFalse(
			has_filter( 'rest_pre_update_setting', array( Dashboard_Data::class, 'block_publishing_a_private_site' ) )
		);
	}

	/**
	 * WordPress.com stores `-1` for a private site and `-2` for coming-soon. The
	 * dashboard's only control writes 1 or 0, so before this guard an owner who
	 * flipped "allow search engines to index this site" on an unfinished site
	 * published it.
	 *
	 * Reporting the write as handled is what makes core's settings controller skip it.
	 */
	public function test_publishing_a_private_site_is_refused() {
		foreach ( array( -1, -2 ) as $private ) {
			update_option( 'blog_public', $private );

			$this->assertTrue(
				Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', 1 ),
				"A site stored as $private should refuse a write to 1."
			);
		}
	}

	/**
	 * A write that keeps the site unpublished still goes through, so the guard can't
	 * strand a site between its own visibility states.
	 */
	public function test_a_private_site_can_still_move_between_unpublished_states() {
		update_option( 'blog_public', -1 );

		$this->assertFalse( Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', -2 ) );
	}

	/**
	 * A public site's toggle is untouched in both directions.
	 */
	public function test_a_public_site_is_unaffected() {
		update_option( 'blog_public', 1 );
		$this->assertFalse( Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', 0 ) );

		update_option( 'blog_public', 0 );
		$this->assertFalse( Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', 1 ) );
	}

	/**
	 * The guard owns one option and defers on everything else, including a write
	 * another handler has already claimed.
	 */
	public function test_the_guard_defers_outside_its_own_option() {
		update_option( 'blog_public', -1 );

		$this->assertFalse( Dashboard_Data::block_publishing_a_private_site( false, 'blogname', 1 ) );
		$this->assertTrue( Dashboard_Data::block_publishing_a_private_site( true, 'blogname', 1 ) );
	}

	/**
	 * The dashboard reports the state, so the toggle can say why it's disabled rather
	 * than appearing to work and silently doing nothing.
	 */
	public function test_the_dashboard_reports_a_private_site() {
		update_option( 'blog_public', -1 );
		$this->assertTrue( Dashboard_Data::get_settings_data()['site_is_private'] );
		$this->assertFalse( Dashboard_Data::get_settings_data()['site_is_coming_soon'] );
		$this->assertTrue( Dashboard_Data::get_overview_data()['site_visibility']['site_is_private'] );

		// Discouraging search engines is not the same as being unpublished.
		update_option( 'blog_public', 0 );
		$this->assertFalse( Dashboard_Data::get_settings_data()['site_is_private'] );
		$this->assertFalse( Dashboard_Data::get_settings_data()['search_engines_visible'] );
	}

	/**
	 * @dataProvider provide_coming_soon_writes
	 * @param int|null $value   Submitted `blog_public`.
	 * @param bool     $refused Whether the guard skips the write.
	 */
	#[DataProvider( 'provide_coming_soon_writes' )]
	public function test_only_a_write_that_launches_a_coming_soon_site_is_refused( $value, $refused ) {
		$this->make_coming_soon();

		$this->assertSame( $refused, Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', $value ) );
	}

	/**
	 * Writes to a Coming Soon site, and whether each is refused.
	 *
	 * @return array
	 */
	public static function provide_coming_soon_writes() {
		return array(
			'allow indexing'   => array( 1, true ),
			'delete (null)'    => array( null, true ),
			'stay discouraged' => array( 0, false ),
			'go private'       => array( -1, false ),
		);
	}

	/**
	 * The toggle is disabled and says why, rather than reading as a discouraged site.
	 */
	public function test_the_dashboard_reports_a_coming_soon_site() {
		$this->make_coming_soon();

		$settings = Dashboard_Data::get_settings_data();
		$this->assertTrue( $settings['site_is_private'] );
		$this->assertTrue( $settings['site_is_coming_soon'] );
		$this->assertFalse( $settings['search_engines_visible'] );
		$this->assertSame( admin_url( 'options-reading.php' ), $settings['site_visibility_url'] );
		$this->assertTrue( Dashboard_Data::get_overview_data()['site_visibility']['site_is_private'] );
	}

	/**
	 * A site that left WordPress.com can keep the flag, but nothing serves Coming Soon there.
	 */
	public function test_the_coming_soon_flag_is_ignored_off_wordpress_com() {
		$this->make_coming_soon();
		Constants::clear_single_constant( 'IS_WPCOM' );
		Status_Cache::clear();

		$this->assertFalse( Dashboard_Data::block_publishing_a_private_site( false, 'blog_public', 1 ) );
		$this->assertFalse( Dashboard_Data::get_settings_data()['site_is_private'] );
	}

	/**
	 * Put the site in WordPress.com's Coming Soon mode, as a new site starts.
	 */
	private function make_coming_soon() {
		Constants::set_constant( 'IS_WPCOM', true );
		Status_Cache::clear();
		update_option( 'blog_public', 0 );
		update_option( 'wpcom_public_coming_soon', 1 );
	}
}
