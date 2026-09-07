<?php
/**
 * The AI SEO feature's availability gate. This package owns the SEO surfaces
 * the feature writes to, so the shared predicate lives here.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;

/**
 * Whether AI SEO is offered on this site.
 */
class Ai_Seo {

	/**
	 * Whether the site can offer AI SEO, independent of the admin's toggle.
	 * Callers own the outer AI master and host gates.
	 *
	 * The plan term is `advanced-seo`, the entitlement for the SEO title and
	 * meta description fields every AI SEO surface writes to. Automatic
	 * generation needs `ai-seo-enhancer` on top, checked where it runs.
	 *
	 * @since 0.8.2
	 *
	 * @return bool
	 */
	public static function is_available() {
		/** This filter is documented in projects/plugins/jetpack/_inc/lib/class.core-rest-api-endpoints.php */
		return (bool) apply_filters( 'ai_seo_enhancer_enabled', true )
			/** This filter is documented in projects/plugins/jetpack/modules/seo-tools/class-jetpack-seo-utils.php */
			&& ! apply_filters( 'jetpack_disable_seo_tools', false )
			&& ( new Modules() )->is_active( 'seo-tools' )
			&& Current_Plan::supports( 'advanced-seo' );
	}

	/**
	 * Whether an AI SEO surface can actually run here, so a control that governs
	 * nothing is never offered. The sidebar's suggestions need a host that loads
	 * the sidebar; the editor's generation needs `ai-seo-enhancer`.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function has_reachable_surface() {
		return self::is_available()
			&& ( self::is_sidebar_reachable() || Current_Plan::supports( 'ai-seo-enhancer' ) );
	}

	/**
	 * Whether this host loads the AI sidebar. Called as a string callable: the
	 * class lives in plugins/jetpack, which bundles this package, and asking it
	 * anything wider would route back through {@see self::is_available()}.
	 *
	 * @return bool
	 */
	private static function is_sidebar_reachable() {
		$callback = array( 'Automattic\\Jetpack\\Extensions\\AiAssistantPlugin\\Jetpack_AI_Sidebar', 'is_host_enabled' );

		// @phan-suppress-next-line PhanUndeclaredClassInCallable -- Jetpack_AI_Sidebar lives in plugins/jetpack and is guarded by is_callable.
		return is_callable( $callback ) && (bool) call_user_func( $callback );
	}
}
