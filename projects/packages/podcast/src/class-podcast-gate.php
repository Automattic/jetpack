<?php
/**
 * Podcast product-access gate.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Current_Plan;

/**
 * Premium podcast feature gate.
 *
 * Operates on the current blog. `Current_Plan::supports` reads request-scoped
 * state, so callers that need to gate a different blog must `switch_to_blog`
 * first.
 */
class Podcast_Gate {

	const GRANDFATHER_STICKER = 'podcasting-grandfathered';

	const FEATURE_SLUG = 'podcasting';

	/**
	 * Whether the current blog can use Premium podcast features.
	 *
	 * @return bool
	 */
	public static function has_product_access(): bool {
		$blog_id = get_current_blog_id();
		if ( $blog_id <= 0 ) {
			return false;
		}

		if (
			function_exists( 'wpcom_has_blog_sticker' )
			&& wpcom_has_blog_sticker( self::GRANDFATHER_STICKER, $blog_id )
		) {
			return true;
		}

		return (bool) Current_Plan::supports( self::FEATURE_SLUG );
	}
}
