<?php
/**
 * Tests for the dashboard boot preload.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the dashboard boot preload.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Boot_Preload
 */
#[CoversClass( Boot_Preload::class )]
class Boot_Preload_Test extends BaseTestCase {

	const ROUTES = 'jetpack-premium-analytics/routes/';

	/**
	 * Stage the route registry.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_routes_file( __DIR__ . '/fixtures/boot-preload/registry.php' );
	}

	/**
	 * Restore the request state.
	 */
	public function tear_down() {
		unset( $_GET['p'] );
		$this->set_routes_file( null );

		parent::tear_down();
	}

	/**
	 * The requested route's content module becomes static; everything else keeps its import type.
	 *
	 * @param string|null $location The `p` query arg, or null for none.
	 * @param string[]    $expected Content modules expected to turn static.
	 * @dataProvider provide_routes
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_preloads_requested_route_content( $location, $expected ) {
		if ( null !== $location ) {
			$_GET['p'] = $location;
		}

		$dependencies = array(
			array(
				'import' => 'static',
				'id'     => '@wordpress/boot',
			),
			array(
				'import' => 'dynamic',
				'id'     => 'jetpack-premium-analytics/widgets/traffic-chart/render',
			),
			array(
				'import' => 'static',
				'id'     => self::ROUTES . 'video-detail/route',
			),
		);
		foreach ( array( 'dashboard', 'post-detail' ) as $route ) {
			$dependencies[] = array(
				'import' => 'static',
				'id'     => self::ROUTES . $route . '/route',
			);
			$dependencies[] = array(
				'import' => 'dynamic',
				'id'     => self::ROUTES . $route . '/content',
			);
		}

		$filtered = Boot_Preload::filter_boot_dependencies( $dependencies );

		$changed = array();
		foreach ( $filtered as $index => $dependency ) {
			if ( $dependency !== $dependencies[ $index ] ) {
				$changed[] = $dependency['id'];
			}
		}
		$this->assertSame( $expected, $changed );
		$this->assertSame( array_column( $dependencies, 'id' ), array_column( $filtered, 'id' ) );
	}

	/**
	 * Requested locations and the content modules they preload.
	 *
	 * @return array
	 */
	public static function provide_routes() {
		return array(
			'no location is the dashboard'     => array( null, array( self::ROUTES . 'dashboard/content' ) ),
			'search params are ignored'        => array( '/?section=store', array( self::ROUTES . 'dashboard/content' ) ),
			'a param segment matches any id'   => array( '/post/12?from=x', array( self::ROUTES . 'post-detail/content' ) ),
			'a route without a content module' => array( '/video/3', array() ),
			'an unknown path'                  => array( '/nope', array() ),
		);
	}

	/**
	 * Point the preload at a route registry.
	 *
	 * @param string|null $path Registry path, or null for the build's.
	 */
	private function set_routes_file( $path ) {
		$property = new \ReflectionProperty( Boot_Preload::class, 'routes_file' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $path );
	}
}
