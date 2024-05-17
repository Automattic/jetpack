<?php
/*
!
 * User Profile -> Reminders page
 */
defined( 'ZEROBSCRM_PATH' ) || exit;

global $zbs;

// Display promo box
// Don't display atm - calendars pro not available as at 7/12/21:
// add_action( 'zbs_reminders_promo', 'zeroBSCRM_reminders_promo' );

// render page
jpcrm_render_reminders_page();

/**
 * Render the page
 */
function jpcrm_render_reminders_page() {

	##WLREMOVE
	do_action( 'zbs_reminders_promo' );
	##/WLREMOVE
	do_action( 'zbs_reminders_pro' );
}

// Promo box
function zeroBSCRM_reminders_promo() {

	global $zbs;

	echo "<div class='ui segment' style='margin-right:15px;font-size:18px;text-align:center;'>";

		echo "<h3 style='font-weight:900;'>CRM Reminders</h3>";

		echo '<p>';

			esc_html_e( 'CRM Reminders are part of the Calendar Pro extension. Set yourself and your team reminders to go along with your CRM Tasks', 'zero-bs-crm' );

		echo '</p>';

		echo '<p>';
			echo "<a class='ui button large green' href='" . esc_url( $zbs->urls['extcal'] ) . "'>";
				esc_html_e( 'Find Out More', 'zero-bs-crm' );
			echo '</a>';

		echo '</p>';

	echo '</div>';
}
