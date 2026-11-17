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
	 * Requires the metadata abilities' `ai-seo-enhancer` entitlement.
	 *
	 * @since 0.8.2
	 *
	 * @return bool
	 */
	public static function is_available() {
		/** This filter is documented in projects/plugins/jetpack/_inc/lib/class.core-rest-api-endpoints.php */
		return (bool) apply_filters( 'ai_seo_enhancer_enabled', true )
			&& ! Seo_Tools::is_disabled()
			&& ( new Modules() )->is_active( 'seo-tools' )
			&& Current_Plan::supports( 'ai-seo-enhancer' );
	}

	/**
	 * Whether an entitled AI SEO surface is available to the settings control.
	 *
	 * @since 0.9.1
	 *
	 * @return bool
	 */
	public static function has_reachable_surface() {
		return self::is_available();
	}
}
