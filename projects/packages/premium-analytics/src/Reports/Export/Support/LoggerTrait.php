<?php
/**
 * Shared logger accessor for CSV report export classes.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;

defined( 'ABSPATH' ) || exit;

/**
 * Trait LoggerTrait
 */
trait LoggerTrait {

	/**
	 * Logger instance.
	 *
	 * @var LoggerInterface|null
	 */
	private $logger = null;

	/**
	 * Set the logger object.
	 *
	 * @param LoggerInterface $logger The logger object.
	 *
	 * @return void
	 */
	public function set_logger( LoggerInterface $logger ): void {
		$this->logger = $logger;
	}

	/**
	 * Get the logger object.
	 *
	 * @return LoggerInterface|null
	 */
	public function get_logger(): ?LoggerInterface {
		return $this->logger;
	}
}
