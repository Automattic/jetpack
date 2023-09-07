<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 *
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Modules\Email;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Defines the interface for inbox services.
 *
 * This interface should be implemented by classes that provide services
 * related to handling inbox functionalities like fetching emails.
 *
 * @since $$next-version$$
 */
interface Inbox_Service {
	/**
	 * Register the inbox service.
	 *
	 * Implementations should include all setup and initialization logic
	 * for the inbox service in this method.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function register();
}
