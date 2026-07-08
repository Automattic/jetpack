<?php
/**
 * Report export bootstrap.
 *
 * Hand-wires the CSV export subsystem (no DI container) and registers it, gated on
 * WooCommerce being active and Jetpack being connected. The data source is the package's
 * own analytics proxy (see ReportDataFetcher).
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AverageItemsPerOrderController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\AverageOrderValueController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\ConversionRateOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\CouponUseOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\GrossSalesOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\NetSalesOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersFulfilledOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\RefundsOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\RevenueByCustomerTypeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SalesByCampaignController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SalesByChannelController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SalesByCouponController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SalesByDeviceController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SalesBySourceController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SessionsByDeviceController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\SessionsByLocationController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TaxesOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TaxRateBreakdownController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TopPerformingProductsController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\VisitorsOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\DebugLogger;

defined( 'ABSPATH' ) || exit;

/**
 * Wires up and registers the report export subsystem.
 *
 * @since $$next-version$$
 */
class Export {

	const SLUG = 'jetpack-premium-analytics';

	/**
	 * Whether the subsystem has been wired up.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the bootstrap on `woocommerce_init` so it only runs when WooCommerce is active
	 * (which also guarantees Action Scheduler and the WC_Email base class are available).
	 *
	 * @return void
	 */
	public static function configure(): void {
		add_action( 'woocommerce_init', array( self::class, 'init' ) );
	}

	/**
	 * Hand-wire the export services and register them. No-op unless Jetpack is connected.
	 *
	 * @return void
	 */
	public static function init(): void {
		if ( self::$initialized ) {
			return;
		}

		// Gate on a live Jetpack connection; the proxy data source requires it.
		if ( ! ( new Manager( self::SLUG ) )->is_connected() ) {
			return;
		}

		self::$initialized = true;

		$logger     = new DebugLogger( \wc_get_logger() );
		$registry   = ReportRegistry::instance();
		$fetcher    = new ReportDataFetcher( $logger );
		$generator  = new ReportCSVGenerator( $logger );
		$email      = new CSVExportEmail( $logger );
		$scheduler  = new CSVExportScheduler( $registry, $fetcher, $generator, $email, $logger );
		$controller = new CSVExportController( $registry, $fetcher, $generator, $scheduler, $logger );

		// RegistrableInterface implementers: hook their routes / actions / email class.
		$controller->register();
		$scheduler->register();
		$email->register();

		// Report-type controllers self-register into the ReportRegistry on register().
		// Ported faithfully from woocommerce/woocommerce-analytics (develop).
		$report_controllers = array(
			AverageItemsPerOrderController::class,
			AverageOrderValueController::class,
			ConversionRateOverTimeController::class,
			CouponUseOverTimeController::class,
			GrossSalesOverTimeController::class,
			NetSalesOverTimeController::class,
			OrdersFulfilledOverTimeController::class,
			OrdersOverTimeController::class,
			RefundsOverTimeController::class,
			RevenueByCustomerTypeController::class,
			SalesByCampaignController::class,
			SalesByChannelController::class,
			SalesByCouponController::class,
			SalesByDeviceController::class,
			SalesBySourceController::class,
			SessionsByDeviceController::class,
			SessionsByLocationController::class,
			TaxesOverTimeController::class,
			TaxRateBreakdownController::class,
			TopPerformingProductsController::class,
			VisitorsOverTimeController::class,
		);

		foreach ( $report_controllers as $report_controller ) {
			( new $report_controller( $registry ) )->register();
		}
	}
}
