<?php
/**
 * Podcast product-access gate.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Current_Plan;

/**
 * Single source of truth for "is this blog allowed to use Premium podcast
 * features?". Downstream gates (dashboard tab, stats endpoint, episode block,
 * AI shownotes) call {@see self::has_product_access()} so the rule lives in
 * one place.
 *
 * Two ways to pass:
 *   1. The blog carries the `podcasting-grandfathered` sticker (backfill for
 *      sites that uploaded audio before the paid gate).
 *   2. `Current_Plan::supports( 'podcasting' )` returns true. On Simple/Atomic
 *      this falls through to `wpcom_site_has_feature`; on self-hosted Jetpack
 *      it consults the cached plan data. Either way the answer is correct for
 *      the current host.
 *
 * Operates on the current blog. `Current_Plan::supports` reads request-scoped
 * state, so callers that need to gate a different blog must `switch_to_blog`
 * first.
 */
class Podcast_Gate {

	/**
	 * Blog sticker that grants access independent of the current plan.
	 */
	const GRANDFATHER_STICKER = 'podcasting-grandfathered';

	/**
	 * Feature slug shared with `WPCOM_Features::PODCASTING` on Simple/Atomic
	 * and with the Jetpack Plans API on self-hosted.
	 */
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
