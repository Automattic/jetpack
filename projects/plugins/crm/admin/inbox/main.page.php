<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Inbox main page
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Inbox;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Render the Inbox page, which is simply a mounting point for React.
 *
 * @return void
 */
function render_page() {
	echo '<div id="jetpack-crm-inbox-root"></div>';
}

render_page();
