<?php
/**
 * The flag that opens the Upgrade to Parsely prompts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Owns the prompts' flag. A class rather than part of `parsely-prompts.php`, because the flag
 * registers on every request and that file's own dependencies must not load on a front-end one.
 *
 * @since $$next-version$$
 */
final class Parsely_Prompts {

	const FLAG = 'jetpack-stats-parsely-prompts';

	/**
	 * Register the flag, so feature-flag tooling lists it.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => 'Show the Upgrade to Parsely prompts to sites that qualify: a paid Stats plan, 100,000 monthly views, and no Parsely of their own.',
				'owner'       => 'jetpack-stats',
			)
		);
	}

	/**
	 * Whether the prompts are open at all. Every other condition sits behind this.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FLAG );
	}
}
