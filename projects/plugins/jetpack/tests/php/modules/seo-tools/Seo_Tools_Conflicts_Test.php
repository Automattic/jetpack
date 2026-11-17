<?php
/**
 * Tests for the conflicting SEO plugin detection.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/seo-tools-conflicts.php';

/**
 * Tests that one plugin list names the SEO plugin Jetpack steps aside for.
 */
class Seo_Tools_Conflicts_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @dataProvider provide_active_plugins
	 *
	 * @param string[]    $active_plugins Active plugin paths.
	 * @param string|null $expected       The name the filter should report.
	 */
	#[DataProvider( 'provide_active_plugins' )]
	public function test_filter_names_the_active_seo_plugin( $active_plugins, $expected ) {
		update_option( 'active_plugins', $active_plugins );

		$this->assertSame( $expected, apply_filters( 'jetpack_seo_conflicting_plugin', null ) );
	}

	/**
	 * @return array Active plugins and the expected name.
	 */
	public static function provide_active_plugins() {
		return array(
			'no SEO plugin'                  => array( array( 'akismet/akismet.php' ), null ),
			'Yoast SEO'                      => array( array( 'wordpress-seo/wp-seo.php' ), 'Yoast SEO' ),
			'paid edition beside free one'   => array( array( 'wordpress-seo/wp-seo.php', 'wordpress-seo-premium/wp-seo-premium.php' ), 'Yoast SEO Premium' ),
			'Rank Math SEO'                  => array( array( 'seo-by-rank-math/rank-math.php' ), 'Rank Math SEO' ),
			'SEOKEY Pro beside free edition' => array( array( 'seo-key/seo-key.php', 'seo-key-pro/seo-key.php' ), 'SEOKEY Pro' ),
		);
	}

	/**
	 * A name another callback already reported wins over the built-in list.
	 */
	public function test_keeps_a_name_reported_earlier() {
		update_option( 'active_plugins', array( 'wordpress-seo/wp-seo.php' ) );

		$this->assertSame( 'Custom SEO', jetpack_seo_detect_conflicting_plugin( 'Custom SEO' ) );
	}
}
