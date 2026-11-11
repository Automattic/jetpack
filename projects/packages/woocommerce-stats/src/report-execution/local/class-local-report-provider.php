<?php
/**
 * Reports from this site's own WooCommerce data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\WooCommerce\Utilities\FeaturesUtil;
use WP_Error;

/**
 * The `local` provider: WooCommerce with its Analytics, whose `wc-analytics` routes the handlers call.
 *
 * @internal
 *
 * @since $$next-version$$
 */
class Local_Report_Provider implements Report_Provider {

	/**
	 * {@inheritDoc}
	 */
	public function check_ready() {
		if ( ! class_exists( FeaturesUtil::class ) || ! FeaturesUtil::feature_is_enabled( 'analytics' ) ) {
			return new WP_Error(
				'local_unavailable',
				__( 'This report needs WooCommerce with its Analytics enabled.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 503 )
			);
		}

		return true;
	}
}
