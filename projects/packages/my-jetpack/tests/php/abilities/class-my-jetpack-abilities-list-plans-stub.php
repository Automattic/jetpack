<?php
/**
 * Test-only subclass of My_Jetpack_Abilities that overrides the pricing seam
 * so list-plans can be exercised without a remote WordPress.com pricing call.
 *
 * @package automattic/jetpack-my-jetpack
 */

use Automattic\Jetpack\My_Jetpack\Abilities\My_Jetpack_Abilities;

/**
 * Test-only subclass overriding My_Jetpack_Abilities's pricing seam.
 *
 * The seam reads from a static fixture so tests can drive list-plans
 * deterministically — including the "pricing unavailable" path.
 */
class My_Jetpack_Abilities_List_Plans_Stub extends My_Jetpack_Abilities {

	/**
	 * Pricing returned by get_plan_pricing(). Defaults to a deterministic
	 * fixture; set to array() to simulate a remote pricing failure.
	 *
	 * @var array<string, mixed>
	 */
	public static $pricing = array(
		'currency_code' => 'USD',
		'full_price'    => 49.0,
		'product_term'  => 'year',
	);

	/**
	 * Restore the default deterministic pricing fixture.
	 */
	public static function reset(): void {
		self::$pricing = array(
			'currency_code' => 'USD',
			'full_price'    => 49.0,
			'product_term'  => 'year',
		);
	}

	protected static function get_plan_pricing( string $class ): array {
		unset( $class );
		return self::$pricing;
	}
}
