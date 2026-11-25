<?php
/**
 * Tests for when Jetpack turns on its Open Graph tags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for Jetpack::check_open_graph().
 *
 * @covers Jetpack::check_open_graph
 */
#[CoversMethod( Jetpack::class, 'check_open_graph' )]
class Jetpack_Open_Graph_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clear constants set by a test.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Jetpack SEO turns on Open Graph tags without Social or Sharing, except on VIP or when another SEO plugin takes over.
	 *
	 * @dataProvider provide_seo_states
	 *
	 * @param string[] $modules           Active modules.
	 * @param bool     $vip               Whether the site is on VIP.
	 * @param bool     $conflicting_seo   Whether another SEO plugin manages SEO output.
	 * @param bool     $expected          Whether Open Graph tags are enabled.
	 */
	#[DataProvider( 'provide_seo_states' )]
	public function test_seo_turns_on_open_graph( $modules, $vip, $conflicting_seo, $expected ) {
		add_filter(
			'jetpack_active_modules',
			static function () use ( $modules ) {
				return $modules;
			}
		);
		if ( $vip ) {
			Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		}
		if ( $conflicting_seo ) {
			add_filter(
				'jetpack_seo_conflicting_plugin',
				static function () {
					return 'Another SEO Plugin';
				}
			);
		}

		Jetpack::init()->check_open_graph();

		$this->assertSame( $expected, apply_filters( 'jetpack_enable_open_graph', false ) );
	}

	/**
	 * Active modules, VIP, another SEO plugin, and whether Open Graph tags are expected.
	 *
	 * @return array<string, array{string[], bool, bool, bool}>
	 */
	public static function provide_seo_states() {
		$seo = array( 'seo-tools', 'seo-dashboard' );

		return array(
			'no SEO, Social or Sharing' => array( array(), false, false, false ),
			'SEO on'                    => array( $seo, false, false, true ),
			'SEO on, VIP'               => array( $seo, true, false, false ),
			'SEO on, other SEO plugin'  => array( $seo, false, true, false ),
		);
	}
}
