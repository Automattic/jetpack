<?php
/**
 * Stats report export bootstrap.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\Top_Posts_Export_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Error_Log_Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Wires up and registers the Stats WP-Cron export subsystem.
 *
 * @since $$next-version$$
 */
class Stats_Export {

	const SLUG = 'jetpack-premium-analytics';

	/**
	 * WPCOM proxy prefix for Jetpack Stats endpoints.
	 */
	const PROXY_PREFIX = 'stats';

	/**
	 * WPCOM API version segment for Jetpack Stats endpoints.
	 */
	const PROXY_VERSION = '1.1';

	/**
	 * Whether the subsystem has been wired up.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hand-wire the export services and register them. No-op unless Jetpack is connected.
	 *
	 * @return void
	 */
	public static function configure(): void {
		if ( self::$initialized ) {
			return;
		}

		if ( ! ( new Manager( self::SLUG ) )->is_connected() ) {
			return;
		}

		self::$initialized = true;

		$logger     = new Error_Log_Logger();
		$registry   = new Report_Registry();
		$fetcher    = new Report_Data_Fetcher( $logger, self::PROXY_PREFIX, self::PROXY_VERSION );
		$generator  = new Report_Csv_Generator( $logger );
		$email      = new Wp_Mail_Export_Email( $logger );
		$scheduler  = new Wp_Cron_Export_Scheduler( $registry, $fetcher, $generator, $email, $logger );
		$controller = new Stats_Csv_Export_Controller( $registry, $fetcher, $generator, $scheduler, $logger );

		$controller->register();
		$scheduler->register();
		$email->register();

		( new Top_Posts_Export_Controller( $registry ) )->register();
	}
}
