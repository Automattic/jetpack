<?php
/**
 * Tests for when Jetpack turns on its Open Graph tags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Tests for Jetpack::check_open_graph().
 *
 * @covers Jetpack::check_open_graph
 */
#[CoversMethod( Jetpack::class, 'check_open_graph' )]
class Jetpack_Open_Graph_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Jetpack SEO turns on Open Graph tags without Social or Sharing, except where SEO output is held off.
	 *
	 * Separate processes, since the Open Graph files register their hooks only on first load.
	 *
	 * @dataProvider provide_seo_states
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param string[]             $modules  Active modules.
	 * @param bool                 $vip      Whether the site is on VIP.
	 * @param array<string, mixed> $filters  Filter name => value it returns.
	 * @param bool                 $expected Whether Open Graph tags are enabled.
	 */
	#[DataProvider( 'provide_seo_states' )]
	#[PreserveGlobalState( false )]
	#[RunInSeparateProcess]
	public function test_seo_turns_on_open_graph( $modules, $vip, $filters, $expected ) {
		add_filter(
			'jetpack_active_modules',
			static function () use ( $modules ) {
				return $modules;
			}
		);
		if ( $vip ) {
			Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		}
		foreach ( $filters as $name => $value ) {
			add_filter(
				$name,
				static function () use ( $value ) {
					return $value;
				}
			);
		}

		Jetpack::init()->check_open_graph();

		$this->assertSame( $expected, apply_filters( 'jetpack_enable_open_graph', false ) );
	}

	/**
	 * Active modules, VIP, filters, and whether Open Graph tags are expected.
	 *
	 * @return array<string, array{string[], bool, array<string, mixed>, bool}>
	 */
	public static function provide_seo_states() {
		$seo = array( 'seo-tools', 'seo-dashboard' );

		return array(
			'no SEO, Social or Sharing' => array( array(), false, array(), false ),
			'SEO on'                    => array( $seo, false, array(), true ),
			'SEO switched off'          => array( array( 'seo-tools' ), false, array(), false ),
			'SEO on, VIP'               => array( $seo, true, array(), false ),
			'SEO on, other SEO plugin'  => array( $seo, false, array( 'jetpack_seo_conflicting_plugin' => 'Another SEO Plugin' ), false ),
			'SEO on, SEO meta tags off' => array( $seo, false, array( 'jetpack_seo_meta_tags_enabled' => false ), false ),
		);
	}
}
