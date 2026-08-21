<?php
/**
 * The AI SEO Enhancer's availability gate. This package owns the
 * `ai_seo_enhancer_enabled` option, so the shared predicate lives here.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;

/**
 * Whether the AI SEO Enhancer is offered on this site.
 */
class AI_SEO_Enhancer {

	/**
	 * Whether the site can offer the enhancer, independent of the admin's
	 * toggle. Callers own the outer AI master and host gates. The AI sidebar's
	 * SEO suggestions intentionally use a different plan slug — do not unify.
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
			&& Current_Plan::supports( 'ai-seo-enhancer' );
	}
}
