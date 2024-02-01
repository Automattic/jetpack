<?php
/*
!
 * Main Dashboard Page file: This is the main file which renders the dashboard view
 * Jetpack CRM - https://jetpackcrm.com
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// permissions check
global $current_user;
if ( ! $current_user || ! $current_user->has_cap( 'zbs_dash' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
}

// render the page
jpcrm_render_dashboard_page();

/**
 * Render the main dashboard
 */
function jpcrm_render_dashboard_page() {

	global  $zbs;

	$current_user_id = get_current_user_id();

	// Get dashcard visibility. Note that get_user_meta() returns an empty string if the meta doesn't exist. Default to visible (`true`).
	$settings_dashboard_sales_funnel    = get_user_meta( $current_user_id, 'settings_dashboard_sales_funnel', true ) !== '0';
	$settings_dashboard_revenue_chart   = get_user_meta( $current_user_id, 'settings_dashboard_revenue_chart', true ) !== '0';
	$settings_dashboard_recent_activity = get_user_meta( $current_user_id, 'settings_dashboard_recent_activity', true ) !== '0';
	$settings_dashboard_latest_contacts = get_user_meta( $current_user_id, 'settings_dashboard_latest_contacts', true ) !== '0';

	// process data for use in sales funnel
	$funnel_data = array();

	$funnel_status_str = zeroBSCRM_getSetting( 'zbsfunnel' );

	// if no setting exists, grab it from the init config
	if ( empty( $funnel_status_str ) ) {
		global $zeroBSCRM_Conf_Setup; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$funnel_status_str = $zeroBSCRM_Conf_Setup['conf_defaults']['zbsfunnel']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}

	$funnel_statuses = explode( ',', $funnel_status_str );

	$backfill_count = 0;

	// reverse for backfill purposes
	foreach ( array_reverse( $funnel_statuses ) as $contact_status ) {

		// number of contacts in a given status
		$count = zeroBS_customerCountByStatus( $contact_status );

		// number of contacts in this status plus later statuses
		$backfill_count += $count;

		// The funnel supports links, so we could link to the contact list filtered by statuses,
		// for example...however, there's no predefined list of status filters and the current
		// conversion methods indicate they're not entirely i18n-safe and/or tested.
		$funnel_data[] = array(
			'count'          => $count,
			'backfill_count' => $backfill_count,
			'contact_status' => $contact_status,
			'link'           => false,
		);
	}

	$funnel_data = array_reverse( $funnel_data );

	/* Transactions - Revenue Chart data gen */
	$labels = array();

	$labels[0] = gmdate( 'F Y' );

	for ( $i = 0; $i < 12; $i++ ) {
		$labels[ $i ] = gmdate( 'M y', mktime( 0, 0, 0, gmdate( 'm' ) - $i, 1, gmdate( 'Y' ) ) );
	}

	$labels = array_reverse( $labels );

	$transaction_totals_by_month = array();
	$transaction_totals_array    = array();

	// fill with zeros if months aren't present
	for ( $i = 11; $i > 0; $i-- ) {
		$key                                 = gmdate( 'nY', mktime( 0, 0, 0, gmdate( 'm' ) - $i, 1, gmdate( 'Y' ) ) );
		$transaction_totals_by_month[ $key ] = 0;
	}

	$args = array(
		'paidAfter'  => strtotime( 'first day of ' . gmdate( 'F Y', strtotime( '11 month ago' ) ) ),
		'paidBefore' => time(),
	);

	$recent_transactions = $zbs->DAL->transactions->getTransactionTotalByMonth( $args ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	foreach ( $recent_transactions as $k => $v ) {
		$transaction_totals_array[ $k ]       = $v['total'];
		$dkey                                 = $v['month'] . $v['year'];
		$transaction_totals_by_month[ $dkey ] = $v['total'];
	}

	$i = 0;
	foreach ( $transaction_totals_by_month as $k => $v ) {
		$transaction_totals_array[ $i ] = $v;
		++$i;
	}

	$chartdata = array_values( $transaction_totals_by_month );

	?>
	<?php wp_nonce_field( 'zbs_dash_setting', 'zbs_dash_setting_security' ); ?>
	<?php wp_nonce_field( 'zbs_dash_count', 'zbs_dash_count_security' ); ?>

	<div class="dashboard-custom-choices hidden">
		<ul>

			<?php
				// this is to put a control AFTER row 1. i.e. the TOTALS
				do_action( 'zbs_dashboard_customiser_after_row_1' );
			?>

			<li class="item">
				<label>
					<input type="checkbox" id="settings_dashboard_sales_funnel"<?php echo ( $settings_dashboard_sales_funnel ? ' checked' : '' ); ?>>
					<?php esc_html_e( 'Sales Funnel', 'zero-bs-crm' ); ?>
				</label>
			</li>

			<li class="item">
				<label>
					<input type="checkbox" id="settings_dashboard_revenue_chart"<?php echo ( $settings_dashboard_revenue_chart ? ' checked' : '' ); ?>>
					<?php esc_html_e( 'Revenue Chart', 'zero-bs-crm' ); ?>
				</label>
			</li>

			<li class="item">
				<label>
					<input type="checkbox" id="settings_dashboard_recent_activity"<?php echo ( $settings_dashboard_recent_activity ? ' checked' : '' ); ?>>
					<?php esc_html_e( 'Recent Activity', 'zero-bs-crm' ); ?>
				</label>
			</li>

			<li class="item">
				<label>
					<input type="checkbox" id="settings_dashboard_latest_contacts"<?php echo ( $settings_dashboard_latest_contacts ? ' checked' : '' ); ?>>
					<?php esc_html_e( 'Latest Contacts', 'zero-bs-crm' ); ?>
				</label>
			</li>

			<?php do_action( 'zerobscrm_dashboard_setting' ); ?>

		</ul>

	</div>

	<jpcrm-dashcount></jpcrm-dashcount>

	<?php do_action( 'zbs_dashboard_pre_dashbox_post_totals' ); ?>

	<div style="display:flex; max-width: 100%">

		<div id="settings_dashboard_sales_funnel_display"<?php echo $settings_dashboard_sales_funnel ? '' : ' style="display:none;"'; ?>>
			<div class="jpcrm-dashcard">
				<div class="jpcrm-dashcard-header">
					<h4><?php esc_html_e( 'Sales Funnel', 'zero-bs-crm' ); ?></h4>
				</div>
				<div class="jpcrm-listview-table-container">
					<div id="jpcrm_sales_funnel"></div>
				</div>
			</div>
		</div>

		<div id="settings_dashboard_revenue_chart_display"<?php echo $settings_dashboard_revenue_chart ? '' : ' style="display:none;"'; ?>>
			<div class="jpcrm-dashcard">
				<div class="jpcrm-dashcard-header">
					<?php $currency_char = zeroBSCRM_getCurrencyChr(); ?>
					<h4><?php esc_html_e( 'Revenue Chart', 'zero-bs-crm' ); ?> (<?php echo esc_html( $currency_char ); ?>)</h4>
					<span>
					<?php
					##WLREMOVE
					if ( ! zeroBSCRM_isExtensionInstalled( 'salesdash' ) ) {
						?>
						<a href="<?php echo esc_url( $zbs->urls['salesdash'] ); ?>" target="_blank"><?php esc_html_e( 'Want More?', 'zero-bs-crm' ); ?></a>
						<?php
					} else {
						?>
						<a href="<?php echo jpcrm_esc_link( $zbs->slugs['salesdash'] ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>"><?php esc_html_e( 'Sales Dashboard', 'zero-bs-crm' ); ?></a>
						<?php
					}
					##/WLREMOVE
					?>
					</span>
				</div>

				<div class="jpcrm-listview-table-container">
					<?php
					if ( is_array( $transaction_totals_array ) && array_sum( $transaction_totals_array ) > 0 ) {
						?>
						<div>
							<canvas id="bar-chart" height="400"></canvas>
						</div>
						<?php
					} else {
						?>
						<div class="jpcrm-div-message-box">
							<div class="jpcrm-div-message">
								<?php esc_html_e( 'No valid transactions were added during the last 12 months. You need transactions for your revenue chart to show. If you have transactions, check the guide for more info.', 'zero-bs-crm' ); ?>
							</div>
							<div class="jpcrm-div-message">
								<?php ##WLREMOVE ?>
								<a href="<?php echo esc_url( $zbs->urls['kbrevoverview'] ); ?>" target="_blank" class="jpcrm-button white-bg"><?php echo esc_html__( 'Read guide', 'zero-bs-crm' ); ?></a>
								<?php ##/WLREMOVE ?>
								<a href="<?php echo jpcrm_esc_link( 'create', -1, 'zerobs_transaction', false, false ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="jpcrm-button"><?php esc_html_e( 'Add a transaction', 'zero-bs-crm' ); ?></a>
							</div>
						</div>
						<?php
					}
					?>
				</div>
			</div>
		</div>

	</div>




	<?php
	$latest_logs = zeroBSCRM_getAllContactLogs( true, 9 );
	?>


	<div style="display:flex; max-width: 100%">
		<div id="settings_dashboard_recent_activity_display"<?php echo $settings_dashboard_recent_activity ? '' : ' style="display:none;"'; ?>>
			<div class="jpcrm-dashcard">
				<div class="jpcrm-dashcard-header">
					<h4><?php esc_html_e( 'Recent Activity', 'zero-bs-crm' ); ?></h4>
				</div>

				<div class="jpcrm-listview-table-container">

					<?php
					if ( is_array( $latest_logs ) && count( $latest_logs ) > 0 ) {

						$last_x_ago = '';
						foreach ( $latest_logs as $log ) {

							$em     = zeroBS_customerEmail( $log['owner'] );
							$avatar = zeroBSCRM_getGravatarURLfromEmail( $em, 28 );
							$unixts = gmdate( 'U', strtotime( $log['created'] ) );
							$diff   = human_time_diff( $unixts, current_time( 'timestamp' ) ); // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested

							if ( isset( $log['type'] ) ) {
								$logmetatype = $log['type'];
							} else {
								$logmetatype = '';
							}

							// WH added from contact view:

							global $zeroBSCRM_logTypes; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							if ( isset( $zeroBSCRM_logTypes['zerobs_customer'][ $logmetatype ] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$logmetatype = __( $zeroBSCRM_logTypes['zerobs_customer'][ $logmetatype ]['label'], 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,WordPress.WP.I18n.NonSingularStringLiteralText
							}

							if ( isset( $log['shortdesc'] ) ) {
								$logmetashot = $log['shortdesc'];
							} else {
								$logmetashot = '';
							}

							$x_ago = $diff . __( ' ago', 'zero-bs-crm' );

							if ( $last_x_ago !== $x_ago ) {
								?>
								<div class="x_ago"><?php echo esc_html( $x_ago ); ?></div>
								<?php
							}
							?>
								<div class="feed-item">
									<img class="ui avatar img img-rounded" alt="<?php esc_attr_e( 'Contact Image', 'zero-bs-crm' ); ?>" src="<?php echo esc_url( $avatar ); ?>"/>
									<div>
										<?php echo esc_html( $logmetatype ); ?>
										<div><?php echo wp_kses( $logmetashot, array( 'i' => array( 'class' => true ) ) ); ?></div>
									</div>
								</div>
							<?php
							$last_x_ago = $x_ago;
						}
					} else {
						?>
						<div class="jpcrm-div-message-box">
							<div class="jpcrm-div-message">
								<?php esc_html_e( 'No recent activity.', 'zero-bs-crm' ); ?>
							</div>
						</div>
						<?php
					}
					?>
				</div>
			</div>
		</div>
		<div id="settings_dashboard_latest_contacts_display"<?php echo $settings_dashboard_latest_contacts ? '' : ' style="display:none;"'; ?>>
			<div class="jpcrm-dashcard">
				<div class="jpcrm-dashcard-header">
					<h4><?php esc_html_e( 'Latest Contacts', 'zero-bs-crm' ); ?></h4>
					<span><a href="<?php echo jpcrm_esc_link( $zbs->slugs['managecontacts'] ); ?>"><?php esc_html_e( 'View All', 'zero-bs-crm' ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?></a></span>
				</div>

				<div class="jpcrm-listview-table-container">
					<?php
					$latest_cust = zeroBS_getCustomers( true, 10, 0 );

					if ( count( $latest_cust ) > 0 ) {
						?>

						<table class="jpcrm-listview-table alternating-colors">
							<thead>
								<tr>
									<th><?php esc_html_e( 'ID', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Avatar', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'First Name', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Last Name', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'Status', 'zero-bs-crm' ); ?></th>
									<th><?php esc_html_e( 'View', 'zero-bs-crm' ); ?></th>
									<th style="text-align:right;"><?php esc_html_e( 'Added', 'zero-bs-crm' ); ?></th>
								</tr>
							</thead>
							<tbody>
								<?php
								foreach ( $latest_cust as $cust ) {
									// phpcs:disable WordPress.NamingConventions.ValidVariableName -- to be refactored.
									$contactAvatar = $zbs->DAL->contacts->getContactAvatar( $cust['id'] );
									$avatar        = ( isset( $cust ) && isset( $cust['id'] ) ) ? ( $contactAvatar ? $contactAvatar : zeroBSCRM_getDefaultContactAvatar() ) : '';
									$fname         = ( isset( $cust ) && isset( $cust['fname'] ) ) ? $cust['fname'] : '';
									$lname         = ( isset( $cust ) && isset( $cust['lname'] ) ) ? $cust['lname'] : '';
									$status        = ( isset( $cust ) && isset( $cust['status'] ) ) ? $cust['status'] : '';
									// phpcs:enable WordPress.NamingConventions.ValidVariableName
									if ( empty( $status ) ) {
										$status = __( 'None', 'zero-bs-crm' );
									}
									?>
									<tr>
									<td><?php echo esc_html( $cust['id'] ); ?></td>
									<td><img class='img-rounded jpcrm-avatar-small' alt='<?php esc_attr_e( 'Contact Image', 'zero-bs-crm' ); ?>' src='<?php echo esc_attr( $avatar ); ?>'/></td>
									<td><?php echo esc_html( $fname ); ?></td>
									<td><?php echo esc_html( $lname ); ?></td>
									<td><?php echo esc_html( $status ); ?></td>
									<td><a href='<?php echo jpcrm_esc_link( 'view', $cust['id'], 'zerobs_customer' ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>'><?php esc_html_e( 'View', 'zero-bs-crm' ); ?></a></td>
									<td style='text-align:right;' class='zbs-datemoment-since' data-zbs-created-uts='<?php echo esc_attr( $cust['createduts'] ); ?>'><?php echo esc_html( $cust['created'] ); ?></td>
									</tr>
									<?php
								}
								?>
							</tbody>
						</table>

						<?php
					} else {
						?>
						<div class="jpcrm-div-message-box">
							<div class="jpcrm-div-message">
								<?php esc_html_e( 'No contacts.', 'zero-bs-crm' ); ?>
							</div>
						</div>
						<?php
					}
					?>
				</div>
			</div>
		</div>
	</div>
	<?php

	// First use dashboard
	if ( zeroBSCRM_permsCustomers() && (int) $zbs->DAL->contacts->getFullCount() === 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// if WooCommerce installed, show that variant
		if ( $zbs->woocommerce_is_active() ) {

			jpcrm_render_partial_block( 'first-use-dashboard-woo' );

		} else {

			jpcrm_render_partial_block( 'first-use-dashboard' );

		}

		// (where permitted by user) track the first-use-dashboard load
		$tracking = $zbs->load_usage_tracking();
		if ( $tracking ) {
			$tracking->track_specific_pageview( 'first-use-dashboard' );
		}
	}
	?>

	<script>

	// set default color for charts
	Chart.defaults.global.defaultColor = zbs_root['jp_green']['40'];
	// build sales funnel
	let funnel_element = document.getElementById('jpcrm_sales_funnel');
	let funnel_data = <?php echo wp_json_encode( $funnel_data ); ?>;
	jpcrm_build_funnel(funnel_data,funnel_element);


	// draw revenue chart
	if (document.getElementById('bar-chart')) {

		new Chart(
			document.getElementById("bar-chart"),
			{
				type: 'bar',
				data: {
					labels: <?php echo wp_json_encode( $labels ); ?>,
					datasets: [
						{
							label: "",
							backgroundColor: Chart.defaults.global.defaultColor,
							data: <?php echo wp_json_encode( $chartdata ); ?>
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					legend: { display: false },
					title: {
						display: false,
						text: ''
					},
					scales: {
						yAxes: [
							{
								display: true,
								ticks: {
									beginAtZero: true // minimum value will be 0.
								}
							}
						]
					}
				}
			}
		);
	}
	</script>
	<?php
}

/**
 * Render a partial
 *
 * @param string $title
 */
function jpcrm_render_partial_block( $block ) {

	if ( ! empty( $block ) ) {
			include 'partials/' . $block . '.block.php';
	}
}
