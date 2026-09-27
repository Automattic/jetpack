<?php
/**
 * Test what the onboarding wizard's panel is willing to say about this site.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the site portrait's data and its guard.
 */
class Onboarding_Site_Portrait_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		StatusCache::clear();
		update_option( 'blog_public', '1' );
		add_filter( 'jetpack_offline_mode', '__return_false' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		remove_all_filters( 'jetpack_my_jetpack_can_photograph_site' );
		remove_all_filters( 'wp_count_attachments' );
		remove_all_filters( 'wp_count_posts' );
		remove_all_filters( 'home_url' );
		unset( $_GET['page'], $_GET['step'] );
		StatusCache::clear();
	}

	/**
	 * Reach the private guard through the data it decides.
	 *
	 * @return bool
	 */
	private function can_photograph() {
		$portrait = Initializer::get_onboarding_site_portrait();

		return $portrait['canPhotograph'];
	}

	/**
	 * Every value of `blog_public` that is not 1 is a reason not to photograph.
	 *
	 * The option is not a boolean. `0` asks search engines to stay away, and `-1`
	 * and below, which "More Privacy Options" adds on multisite, mean private —
	 * and every one of them casts to true.
	 *
	 * @return array<string, array{mixed, bool}>
	 */
	public static function provide_blog_public() {
		return array(
			'public'                   => array( '1', true ),
			'public as an integer'     => array( 1, true ),
			'discouraging search'      => array( '0', false ),
			'unset'                    => array( '', false ),
			'private'                  => array( '-1', false ),
			'more privacy options'     => array( '-2', false ),
			'more privacy options too' => array( '-3', false ),
		);
	}

	/**
	 * @param mixed $blog_public What the option holds.
	 * @param bool  $expected    Whether the site may be photographed.
	 * @dataProvider provide_blog_public
	 */
	#[DataProvider( 'provide_blog_public' )]
	public function test_only_a_public_site_is_photographed( $blog_public, $expected ) {
		update_option( 'blog_public', $blog_public );

		$this->assertSame( $expected, $this->can_photograph() );
	}

	public function test_offline_mode_is_never_photographed() {
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$this->assertFalse( $this->can_photograph() );

		remove_filter( 'jetpack_offline_mode', '__return_true' );
	}

	/**
	 * A coming-soon site answers with its splash rather than its homepage, however
	 * public the option says it is.
	 */
	public function test_a_coming_soon_site_is_not_photographed() {
		add_filter( 'jetpack_is_coming_soon', '__return_true' );
		StatusCache::clear();

		$this->assertFalse( $this->can_photograph() );

		remove_filter( 'jetpack_is_coming_soon', '__return_true' );
	}

	/**
	 * For hosts serving sites that are public but unreachable from outside.
	 */
	public function test_a_host_can_turn_it_off() {
		add_filter( 'jetpack_my_jetpack_can_photograph_site', '__return_false' );

		$this->assertFalse( $this->can_photograph() );
	}

	public function test_the_filter_cannot_photograph_a_private_site() {
		update_option( 'blog_public', '-1' );
		add_filter( 'jetpack_my_jetpack_can_photograph_site', '__return_true' );

		$this->assertTrue( $this->can_photograph(), 'the filter has the last word, both ways' );
	}

	/**
	 * `wp_count_attachments()` returns per-mime-type counts plus a `trash` total
	 * that is not in the library. Left in, it reports the emptied uploads back to
	 * the person who emptied them.
	 */
	/**
	 * `wp_count_attachments()` returns per-mime-type counts plus a `trash` total
	 * that is not in the library. Left in, it reports the emptied uploads back to
	 * the person who emptied them.
	 *
	 * Driven through the filter because WorDBless has no queryable posts table:
	 * an insert here returns an id and `wp_count_posts()` still answers zero.
	 */
	public function test_the_media_count_leaves_out_the_trash() {
		add_filter(
			'wp_count_attachments',
			function () {
				return (object) array(
					'image/png'       => 3,
					'application/pdf' => 2,
					'trash'           => 40,
				);
			}
		);

		$portrait = Initializer::get_onboarding_site_portrait();

		$this->assertSame( 5, $portrait['counts']['media'] );
	}

	public function test_the_media_count_survives_a_library_with_no_trash_key() {
		add_filter(
			'wp_count_attachments',
			function () {
				return (object) array( 'image/png' => 4 );
			}
		);

		$portrait = Initializer::get_onboarding_site_portrait();

		$this->assertSame( 4, $portrait['counts']['media'] );
	}

	public function test_it_counts_published_posts_and_pages_only() {
		add_filter(
			'wp_count_posts',
			function ( $counts, $type ) {
				return (object) array(
					'publish' => 'post' === $type ? 12 : 3,
					'draft'   => 99,
					'trash'   => 7,
				);
			},
			10,
			2
		);

		$portrait = Initializer::get_onboarding_site_portrait();

		$this->assertSame( 12, $portrait['counts']['posts'] );
		$this->assertSame( 3, $portrait['counts']['pages'] );
	}

	/**
	 * The head link exists to start the render before the wizard's own JavaScript
	 * can, so it has to ask for the same picture. Asserted as a whole string, and
	 * again in `use-site-shot.test.ts`, because a drift on either side warms a
	 * render nothing then reads and nothing else would notice.
	 */
	public function test_the_preload_asks_for_exactly_what_the_wizard_asks_for() {
		$_GET['page'] = 'my-jetpack';
		$_GET['step'] = 'onboarding';
		add_filter( 'home_url', array( $this, 'return_example_url' ) );

		ob_start();
		Initializer::preload_onboarding_site_shot();
		$printed = ob_get_clean();

		$this->assertStringContainsString(
			'https://s0.wp.com/mshots/v1/https%3A%2F%2Fexample.com?vpw=1600&#038;vph=1600&#038;w=880&#038;h=550&#038;scale=2',
			$printed
		);
		$this->assertStringContainsString( 'rel="preload"', $printed );
		$this->assertStringContainsString( 'as="image"', $printed );
	}

	public function test_nothing_is_preloaded_for_a_site_that_cannot_be_photographed() {
		$_GET['page'] = 'my-jetpack';
		$_GET['step'] = 'onboarding';
		update_option( 'blog_public', '0' );

		ob_start();
		Initializer::preload_onboarding_site_shot();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Every other admin page would be warming a render nothing is going to read.
	 */
	public function test_nothing_is_preloaded_outside_the_wizard() {
		$_GET['page'] = 'my-jetpack';
		unset( $_GET['step'] );

		ob_start();
		Initializer::preload_onboarding_site_shot();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * @return string
	 */
	public function return_example_url() {
		return 'https://example.com';
	}

	public function test_the_domain_is_a_string_even_for_a_broken_home_url() {
		add_filter( 'home_url', '__return_empty_string' );

		$portrait = Initializer::get_onboarding_site_portrait();

		$this->assertIsString( $portrait['domain'] );

		remove_filter( 'home_url', '__return_empty_string' );
	}
}
