<?php
/**
 * Shared test helper for priming Podcast_Gate's request-scoped purchases memo.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast_Gate;

/**
 * Sets the gate's private static purchases memo via reflection so tests can
 * grant or deny product access without a real `/upgrades` fetch.
 */
trait Purchases_Cache_Trait {

	/**
	 * Set the gate's private request memo (reflection; null clears it).
	 *
	 * @param array|null $purchases Purchases to memoize, or null to reset.
	 */
	protected static function set_purchases_cache( ?array $purchases ): void {
		$property = new \ReflectionProperty( Podcast_Gate::class, 'purchases_cache' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $purchases );
	}
}
