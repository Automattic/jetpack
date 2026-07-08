<?php
/**
 * Report export bootstrap.
 *
 * Hand-wires the CSV export subsystem (no DI container) and registers it, gated on
 * WooCommerce being active and Jetpack being connected. The data source is the package's
 * own analytics proxy (see Report_Data_Fetcher).
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Debug_Logger;

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

		$logger     = new Debug_Logger( \wc_get_logger() );
		$registry   = new Report_Registry();
		$fetcher    = new Report_Data_Fetcher( $logger );
		$generator  = new Report_Csv_Generator( $logger );
		$email      = new Csv_Export_Email( $logger );
		$scheduler  = new Csv_Export_Scheduler( $registry, $fetcher, $generator, $email, $logger );
		$controller = new Csv_Export_Controller( $registry, $fetcher, $generator, $scheduler, $logger );

		// Registrable_Interface implementers: hook their routes / actions / email class.
		$controller->register();
		$scheduler->register();
		$email->register();

		// Report-type controllers self-register into the Report_Registry on register().
		// Ported faithfully from woocommerce/woocommerce-analytics (develop). Additional
		// report controllers are registered here as they land in follow-up changes.
		$report_controllers = array(
			Orders_Over_Time_Controller::class,
		);

		foreach ( $report_controllers as $report_controller ) {
			( new $report_controller( $registry ) )->register();
		}
	}
}
