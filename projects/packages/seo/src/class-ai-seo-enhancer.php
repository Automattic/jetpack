<?php
/**
 * The AI SEO Enhancer's availability gate — the editor feature that
 * auto-generates SEO titles, meta descriptions and image alt text.
 *
 * The AI feature settings endpoint and the SEO dashboard each carried their own
 * copy of this predicate and drifted apart. Both now delegate here. Other
 * surfaces still resolve the enhancer themselves: the AI Assistant block's
 * extension registration, the legacy settings endpoint, and the AI sidebar's
 * SEO suggestions, which asks a deliberately different question (see below).
 *
 * This package owns the `ai_seo_enhancer_enabled` option and already depends on
 * jetpack-plans and jetpack-status, so the predicate lives here and the plugin
 * calls in. The dependency runs one way: this class must never reference a
 * plugin class such as Jetpack_AI_Settings.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;

/**
 * Whether the AI SEO Enhancer is offered, and whether it is switched on.
 */
class AI_SEO_Enhancer {

	/**
	 * The user-facing toggle, round-tripped through `/jetpack/v4/settings`.
	 * Opt-in: absent means off.
	 *
	 * @var string
	 */
	const OPTION = 'ai_seo_enhancer_enabled';

	/**
	 * Whether the site can offer the enhancer at all, independent of the admin's
	 * toggle: the `ai_seo_enhancer_enabled` filter (a host's outright veto), the
	 * `seo-tools` module, `jetpack_disable_seo_tools`, and the plan.
	 *
	 * The module is required because the enhancer writes to the SEO title and
	 * meta description fields that module registers. `Modules::is_active()`
	 * returns true unconditionally under `IS_WPCOM`, so that term is inert on
	 * WordPress.com Simple.
	 *
	 * `jetpack_disable_seo_tools` is how the seo-tools module cedes a site's SEO
	 * to a conflicting plugin (Yoast, AIOSEO, Rank Math). Without it a settings
	 * screen would offer a toggle for suggestions the editor then refuses to
	 * make. The module registers that filter as it loads, so this only reads
	 * true once modules are loaded — fine for this class's callers, which run on
	 * `rest_api_init`.
	 *
	 * The plan slug is `ai-seo-enhancer` (Business and up). The AI sidebar's SEO
	 * suggestions deliberately use a different slug, `advanced-seo` (free tier
	 * off-WordPress.com), because those suggestions write into the plan-gated SEO
	 * meta fields and so follow those fields' entitlement rather than the
	 * enhancer's. The divergence is intentional — do not unify the two slugs.
	 *
	 * Deliberately excludes the AI master and host gates: callers own the outer
	 * gate, as `Jetpack_AI_Settings::is_feature_enabled()` does for its own
	 * features, and the package cannot reach that plugin class anyway.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function is_available() {
		/** This filter is documented in projects/plugins/jetpack/_inc/lib/class.core-rest-api-endpoints.php */
		if ( ! apply_filters( 'ai_seo_enhancer_enabled', true ) ) {
			return false;
		}

		/** This filter is documented in projects/plugins/jetpack/modules/seo-tools/class-jetpack-seo-utils.php */
		if ( apply_filters( 'jetpack_disable_seo_tools', false ) ) {
			return false;
		}

		return ( new Modules() )->is_active( 'seo-tools' )
			&& Current_Plan::supports( 'ai-seo-enhancer' );
	}

	/**
	 * Whether the admin has switched the enhancer on. The raw stored toggle, with
	 * no availability folded in, so a UI renders the switch where the admin left
	 * it even while the feature is unavailable.
	 *
	 * Reads exactly what `Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' )`
	 * reads: `seo_enhancer` is not among that class's owned features, so its
	 * WordPress.com Simple short-circuit does not apply and it falls through to
	 * this same option and default.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function is_toggled_on() {
		return (bool) get_option( self::OPTION, false );
	}
}
