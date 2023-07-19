<?php
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

if ( ! apply_filters( 'jetpack_crm_feature_flag_automations', false ) ) {
	return;
}

/**
 * Render the Automations page, which is simply a mounting point for React.
 *
 * @return void
 */
function render_page() {
	echo '<div id="jetpack-crm-automations-root"></div>';
}

render_page();
