<?php
/**
 * Report export bootstrap.
 *
 * Hand-wires the ported WooCommerce Analytics CSV export subsystem (no DI container)
 * and registers it, gated on WooCommerce being active and Jetpack being connected.
 *
 * This is a local-only test port: it brings the existing export pipeline over as-is so the
 * generation endpoints can be exercised on a Premium Analytics + WooCommerce store. The data
 * source is re-pointed at the package's own proxy (see ReportDataFetcher).
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TopPerformingProductsController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\VisitorsOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\DebugLogger;

defined( 'ABSPATH' ) || exit;

/**
 * Wires up and registers the report export subsystem.
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
		( new OrdersOverTimeController( $registry ) )->register();
		( new TopPerformingProductsController( $registry ) )->register();
		( new VisitorsOverTimeController( $registry ) )->register();
	}
}
