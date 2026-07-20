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
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Average_Items_Per_Order_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Average_Order_Value_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Conversion_Rate_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Coupon_Use_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Gross_Sales_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Net_Sales_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Fulfilled_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Orders_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Refunds_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Revenue_By_Customer_Type_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Campaign_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Channel_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Coupon_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Device_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sales_By_Source_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sessions_By_Device_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Sessions_By_Location_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Tax_Rate_Breakdown_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Taxes_Over_Time_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Performing_Products_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Visitors_Over_Time_Controller;
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
		// Ported faithfully from woocommerce/woocommerce-analytics (develop).
		$report_controllers = array(
			Average_Items_Per_Order_Controller::class,
			Average_Order_Value_Controller::class,
			Conversion_Rate_Over_Time_Controller::class,
			Coupon_Use_Over_Time_Controller::class,
			Gross_Sales_Over_Time_Controller::class,
			Net_Sales_Over_Time_Controller::class,
			Orders_Fulfilled_Over_Time_Controller::class,
			Orders_Over_Time_Controller::class,
			Refunds_Over_Time_Controller::class,
			Revenue_By_Customer_Type_Controller::class,
			Sales_By_Campaign_Controller::class,
			Sales_By_Channel_Controller::class,
			Sales_By_Coupon_Controller::class,
			Sales_By_Device_Controller::class,
			Sales_By_Source_Controller::class,
			Sessions_By_Device_Controller::class,
			Sessions_By_Location_Controller::class,
			Taxes_Over_Time_Controller::class,
			Tax_Rate_Breakdown_Controller::class,
			Top_Performing_Products_Controller::class,
			Visitors_Over_Time_Controller::class,
		);

		foreach ( $report_controllers as $report_controller ) {
			( new $report_controller( $registry ) )->register();
		}
	}
}
