<?php

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;

defined( 'ABSPATH' ) || exit;

/**
 * Trait LoggerTrait
 */
trait LoggerTrait {

	/** @var LoggerInterface|null */
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
