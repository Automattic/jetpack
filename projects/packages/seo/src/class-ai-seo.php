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
}
