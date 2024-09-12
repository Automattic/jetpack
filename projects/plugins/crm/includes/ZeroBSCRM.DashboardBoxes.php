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
	?>
	<div class="jpcrm-dashcard" style="margin: 10px; padding: 10px;">
		<div class="jpcrm-dashcard-header">
			<h4><?php esc_html_e( 'CRM contacts', 'zero-bs-crm' ); ?></h4>
			<?php
			if ( $contacts_added_in_last_year !== 0 ) {
				?>
				<div id="zbs-date-picker-background">
					<div class='month-selector'>
						<div id="reportrange" class="pull-right jpcrm-date-range" style="cursor: pointer; width:240px;">
							<i class="fa fa-calendar"></i>&nbsp;
							<span></span> <b class="caret"></b>
						</div>
					</div>
				</div>
				<div class="day-or-month">
					<div class="button" data-range="daily"><?php esc_html_e( 'Day', 'zero-bs-crm' ); ?></div>
					<div class="button" data-range="weekly"><?php esc_html_e( 'Week', 'zero-bs-crm' ); ?></div>
					<div class="button selected" data-range="monthly"><?php esc_html_e( 'Month', 'zero-bs-crm' ); ?></div>
					<div class="button" data-range="yearly"><?php esc_html_e( 'Year', 'zero-bs-crm' ); ?></div>
				</div>
				<?php
			}
			?>
		</div>
		<div class="jpcrm-listview-table-container">
			<?php
			if ( $contacts_added_in_last_year !== 0 ) {
				// Chart requires an empty div or else the height grows indefinitely
				?>
				<div>
					<canvas id="growth-chart" height="400"></canvas>
				</div>
				<?php
			} else {
				?>
				<div class="jpcrm-div-message-box">
					<div class="jpcrm-div-message">
						<?php esc_html_e( 'No contacts were added during the last 12 months. You need contacts for your growth chart to show.', 'zero-bs-crm' ); ?>
					</div>
					<div class="jpcrm-div-message">
						<?php ##WLREMOVE ?>
						<a href="<?php echo esc_url( $zbs->urls['kbfirstcontact'] ); ?>" target="_blank" class="jpcrm-button white-bg"><?php echo esc_html__( 'Read guide', 'zero-bs-crm' ); ?></a>
						<?php ##/WLREMOVE ?>
						<a href="<?php echo jpcrm_esc_link( 'create', -1, 'zerobs_customer', false, false ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="jpcrm-button"><?php esc_html_e( 'Add a contact', 'zero-bs-crm' ); ?></a>
					</div>
				</div>
				<?php
			}
			?>
		</div>
	</div>
	<?php
}
