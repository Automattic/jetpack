<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */


/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


/*
	Add code in here for the dashboard boxes. Keeps it a bit tidier than ALL in the AdminPages.php file

	action hooks to use:
		zbs_dashboard_pre_dashbox_post_totals:  shows up on the first row AFTER the total boxes
		zbs_dashboard_customiser_after_row_1:   lets you add a on / off control (if desired after tht total boxes checkbox controls)
*/

//example code to add a new box below the totals, but above the funnels. This one is NOT turn off-able (is off-able a word, lol).
add_action('zbs_dashboard_pre_dashbox_post_totals', 'zeroBS_dashboard_crm_list_growth', 1);
function zeroBS_dashboard_crm_list_growth(){

	global $zbs;
	$contacts_added_in_last_year = (int) $zbs->DAL->getContacts( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		array(
			'newerThan' => strtotime( '-1 year', time() ),
			'count'     => true,
		)
	);

	if ( $contacts_added_in_last_year === 0 ) {
		?>

		<div class='one column row'>
			<div class="column"  id="settings_dashboard_growth_display">
				<div class='panel' style="padding:20px;">
					<div class='ui message blue' style="text-align:center;margin-bottom:80px;margin-top:50px;">
						<?php esc_html_e( 'No contacts were added during the last 12 months. You need contacts for your growth chart to show.', 'zero-bs-crm' ); ?>
						<br />
						<a href="<?php echo jpcrm_esc_link( 'create', -1, 'zerobs_customer', false, false ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="ui tiny green button" style="margin-top:1em"><?php esc_html_e( 'Add a Contact', 'zero-bs-crm' ); ?></a>
					</div>
				</div>
			</div>
		</div>
		<?php
	} else {
		?>
		<div class='one column row'>
			<div class="column"  id="settings_dashboard_growth_display">
				<div class='panel' style="padding:20px;height:400px;padding-bottom:50px;">
					<div class="panel-heading" style="text-align:center">
						<div class="contact-display-chooser">

							<h4 class="panel-title text-muted font-light"><?php esc_html_e( 'CRM contacts', 'zero-bs-crm' ); ?></h4>

							<div class="ui buttons day-or-month">
								<div class="ui button" data-range="daily"><?php esc_html_e( 'Day', 'zero-bs-crm' ); ?></div>
								<div class="ui button" data-range="weekly"><?php esc_html_e( 'Week', 'zero-bs-crm' ); ?></div>
								<div class="ui button selected" data-range="monthly"><?php esc_html_e( 'Month', 'zero-bs-crm' ); ?></div>
								<div class="ui button" data-range="yearly"><?php esc_html_e( 'Year', 'zero-bs-crm' ); ?></div>
							</div>
						</div>
					</div>
					<canvas id="growth-chart" width="500" height="400"></canvas>
				</div>
			</div>
		</div>
		<?php
	}
}
