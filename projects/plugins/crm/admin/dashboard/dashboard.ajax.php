<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
/**
 * Generate and return dashboard data
 */
function jetpackcrm_dash_refresh() {

	check_ajax_referer( 'zbs_dash_count', 'security' );  // nonce it up...

	// note for WH - looking at the DAL, we can probably extract these into DAL3 helpers?
	global $zbs, $wpdb, $ZBSCRM_t; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	/**
	 * [06-Nov-2020 09:10:44 UTC] Array
	* (
	*    [action] => jetpackcrm_dash_refresh
	*    [start_date] => 2019-11-06
	*    [end_date] => 2020-11-06
	* )
	*/

	$start_date = sanitize_text_field( $_POST['start_date'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$end_date   = sanitize_text_field( $_POST['end_date'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash

	$start_date = strtotime( $start_date );
	$end_date   = date_create( $end_date )->setTime( 23, 59, 59 )->getTimestamp();

	$summary = array();
	$chart   = array();

	$range_params = array(
		'count'     => true,
		'newerThan' => $start_date,
		'olderThan' => $end_date,
	);

	$summary[] = array(
		'label'             => __( 'Contacts', 'zero-bs-crm' ),
		'range_total'       => zeroBSCRM_prettifyLongInts( $zbs->DAL->getContacts( $range_params ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		'alltime_total_str' => sprintf( __( '%s total', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $zbs->DAL->contacts->getFullCount() ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.WP.I18n.MissingTranslatorsComment
		'link'              => jpcrm_esc_link( $zbs->slugs['managecontacts'] ),
	);

	if ( zeroBSCRM_getSetting( 'feat_transactions' ) > 0 ) {
		$summary[] = array(
			'label'             => __( 'Transactions', 'zero-bs-crm' ),
			'range_total'       => zeroBSCRM_prettifyLongInts( $zbs->DAL->transactions->getTransactions( $range_params ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'alltime_total_str' => sprintf( __( '%s total', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $zbs->DAL->transactions->getFullCount() ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.WP.I18n.MissingTranslatorsComment
			'link'              => jpcrm_esc_link( $zbs->slugs['managetransactions'] ),
		);
	}

	if ( zeroBSCRM_getSetting( 'feat_quotes' ) > 0 ) {
		$summary[] = array(
			'label'             => __( 'Quotes', 'zero-bs-crm' ),
			'range_total'       => zeroBSCRM_prettifyLongInts( $zbs->DAL->quotes->getQuotes( $range_params ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'alltime_total_str' => sprintf( __( '%s total', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $zbs->DAL->quotes->getFullCount() ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.WP.I18n.MissingTranslatorsComment
			'link'              => jpcrm_esc_link( $zbs->slugs['managequotes'] ),
		);
	}

	if ( zeroBSCRM_getSetting( 'feat_invs' ) > 0 ) {
		$summary[] = array(
			'label'             => __( 'Invoices', 'zero-bs-crm' ),
			'range_total'       => zeroBSCRM_prettifyLongInts( $zbs->DAL->invoices->getInvoices( $range_params ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'alltime_total_str' => sprintf( __( '%s total', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $zbs->DAL->invoices->getFullCount() ) ), // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.WP.I18n.MissingTranslatorsComment
			'link'              => jpcrm_esc_link( $zbs->slugs['manageinvoices'] ),
		);
	}

	// next we want the contact chart which is total contacts between the dates grouped by day, week, month, year
	$sql    = $wpdb->prepare( 'SELECT count(ID) as count, YEAR(FROM_UNIXTIME(zbsc_created)) as year FROM ' . $ZBSCRM_t['contacts'] . ' WHERE zbsc_created > %d AND zbsc_created < %d GROUP BY year ORDER BY year', $start_date, $end_date ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$yearly = $wpdb->get_results( $sql );

	$sql     = $wpdb->prepare( 'SELECT count(ID) as count, zbsc_created as ts, MONTH(FROM_UNIXTIME(zbsc_created)) as month, YEAR(FROM_UNIXTIME(zbsc_created)) as year FROM ' . $ZBSCRM_t['contacts'] . ' WHERE zbsc_created > %d AND zbsc_created < %d GROUP BY month, year ORDER BY year, month', $start_date, $end_date ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$monthly = $wpdb->get_results( $sql );

	$sql    = $wpdb->prepare( 'SELECT count(ID) as count, zbsc_created as ts, WEEK(FROM_UNIXTIME(zbsc_created)) as week, YEAR(FROM_UNIXTIME(zbsc_created)) as year FROM ' . $ZBSCRM_t['contacts'] . ' WHERE zbsc_created > %d AND zbsc_created < %d GROUP BY week, year ORDER BY year, week', $start_date, $end_date ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$weekly = $wpdb->get_results( $sql );

	$sql   = $wpdb->prepare( 'SELECT count(ID) as count, zbsc_created as ts, DAY(FROM_UNIXTIME(zbsc_created)) as day, MONTH(FROM_UNIXTIME(zbsc_created)) as month, YEAR(FROM_UNIXTIME(zbsc_created)) as year FROM ' . $ZBSCRM_t['contacts'] . ' WHERE zbsc_created > %d AND zbsc_created < %d GROUP BY day, month, year ORDER BY year, month, day', $start_date, $end_date ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$daily = $wpdb->get_results( $sql );

	$zeros = jetpackcrm_create_zeros_array( $start_date, $end_date );

	// get the data ready for the charts
	foreach ( $yearly as $v ) {
		$zeros['year'][ $v->year ] = $v->count;
	}

	// convert the monthly array into a zero padded one
	foreach ( $monthly as $v ) {
		$the_month                    = gmdate( 'M y', $v->ts );
		$zeros['month'][ $the_month ] = $v->count;
	}

	foreach ( $weekly as $v ) {
		$the_week                   = gmdate( 'W Y', $v->ts );
		$zeros['week'][ $the_week ] = $v->count;
	}

	foreach ( $daily as $v ) {
		$the_day                  = gmdate( 'd M y', $v->ts );
		$zeros['day'][ $the_day ] = $v->count;
	}

	$year_labels  = array_keys( $zeros['year'] );
	$month_labels = array_keys( $zeros['month'] );
	$week_labels  = array_keys( $zeros['week'] );
	$day_labels   = array_keys( $zeros['day'] );

	$chart['yearly'] = array(
		'labels' => $year_labels,
		'data'   => array_values( $zeros['year'] ),
	);

	$chart['monthly'] = array(
		'labels' => $month_labels,
		'data'   => array_values( $zeros['month'] ),
	);

	$chart['weekly'] = array(
		'labels' => $week_labels,
		'data'   => array_values( $zeros['week'] ),
	);

	$chart['daily'] = array(
		'labels' => $day_labels,
		'data'   => array_values( $zeros['day'] ),
	);

	// the final output
	$r = array(
		'summary' => $summary,
		'chart'   => $chart,
	);

	echo wp_json_encode( $r );
	die();
}
add_action( 'wp_ajax_jetpackcrm_dash_refresh', 'jetpackcrm_dash_refresh' );

/**
 * Store dashboard display settings
 */
function jpcrm_dash_setting() {

	check_ajax_referer( 'zbs_dash_setting', 'security' );  // nonce it up...

	// perms?
	if ( zeroBSCRM_permsCustomers() ) {

		$setting_key             = ( isset( $_POST['the_setting'] ) ? sanitize_text_field( wp_unslash( $_POST['the_setting'] ) ) : '' );
		$acceptable_setting_keys = array( 'settings_dashboard_sales_funnel', 'settings_dashboard_revenue_chart', 'settings_dashboard_recent_activity', 'settings_dashboard_latest_contacts' );

		if ( in_array( $setting_key, $acceptable_setting_keys, true ) ) {

			// default to checked
			$is_checked = ( isset( $_POST['is_checked'] ) ? (int) sanitize_text_field( $_POST['is_checked'] ) : 1 ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash

			// retrieve
			$current_user_id = get_current_user_id();

			// update user meta, if legit.
			update_user_meta( $current_user_id, $setting_key, $is_checked );

			// No rights or failed key match
			zeroBSCRM_sendJSONSuccess( array( 'fini' => 1 ) );
		}
	}

	// No rights or failed key match
	zeroBSCRM_sendJSONError( array( 'no-action-or-rights' => 1 ) );
}
add_action( 'wp_ajax_zbs_dash_setting', 'jpcrm_dash_setting' );
