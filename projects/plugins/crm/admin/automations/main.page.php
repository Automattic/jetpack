<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation UI main page
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Automations;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Render the Automations page, which is simply a mounting point for React.
 *
 * @return void
 */
function render_page() {
	echo '<div id="jetpack-crm-automations-root"></div>';
}

render_page();
