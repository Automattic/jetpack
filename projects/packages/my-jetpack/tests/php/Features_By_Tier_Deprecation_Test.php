<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Backup;
use Automattic\Jetpack\My_Jetpack\Products\Boost;
use Automattic\Jetpack\My_Jetpack\Products\Creator;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the deprecation of get_features_by_tier().
 *
 * @package automattic/my-jetpack
 */
class Features_By_Tier_Deprecation_Test extends TestCase {

	/**
	 * Products and whether their get_features_by_tier() is deprecated.
	 *
	 * @return array[]
	 */
	public static function provide_products() {
		return array(
			'inherited from Product' => array( Backup::class, Product::class, true ),
			'Protect'                => array( Protect::class, Protect::class, true ),
			'Creator'                => array( Creator::class, Creator::class, true ),
			'Jetpack AI'             => array( Jetpack_Ai::class, Jetpack_Ai::class, true ),
			'Boost stays supported'  => array( Boost::class, Boost::class, false ),
		);
	}

	/**
	 * Only Boost keeps a supported get_features_by_tier(); the others still answer but flag the call.
	 *
	 * @dataProvider provide_products
	 *
	 * @param string $product_class   Product class to call the method on.
	 * @param string $declaring_class Class the method is declared in.
	 * @param bool   $is_deprecated   Whether the call must report a deprecation.
	 */
	#[DataProvider( 'provide_products' )]
	public function test_get_features_by_tier_deprecation( $product_class, $declaring_class, $is_deprecated ) {
		$deprecated = array();
		$capture    = function ( $function_name ) use ( &$deprecated ) {
			$deprecated[] = $function_name;
		};

		add_filter( 'deprecated_function_trigger_error', '__return_false' );
		add_action( 'deprecated_function_run', $capture );

		$features = $product_class::get_features_by_tier();

		remove_action( 'deprecated_function_run', $capture );
		remove_filter( 'deprecated_function_trigger_error', '__return_false' );

		$this->assertIsArray( $features );
		$this->assertSame(
			$is_deprecated ? array( $declaring_class . '::get_features_by_tier' ) : array(),
			$deprecated
		);
	}
}
