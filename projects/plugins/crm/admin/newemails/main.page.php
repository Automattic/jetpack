<?php
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Email main page
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Email;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Render the Emails page, which is simply a mounting point for React.
 *
 * @return void
 */
function render_page() {
	echo '<div id="jetpack-crm-emails-root"></div>';
}

render_page();
