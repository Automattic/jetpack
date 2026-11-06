<?php
/**
 * Stubs core's revenue stats controller class, so the local provider counts as ready for `orders/by-date`.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName, Generic.Files.OneObjectStructurePerFile

namespace Automattic\WooCommerce\Admin\API\Reports\Revenue\Stats;

if ( ! class_exists( Controller::class ) ) {
	/**
	 * Stand-in for the WooCommerce Analytics revenue stats controller.
	 */
	class Controller {}
}
