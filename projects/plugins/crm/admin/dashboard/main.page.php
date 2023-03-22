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
if ( ! zeroBSCRM_permsCustomers() ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
}

// render the page
jpcrm_render_dashboard_page();

/**
 * Render the main dashboard
 */
function jpcrm_render_dashboard_page() {

	global  $zbs;

	// retrieve settings
	$cid                                   = get_current_user_id();
	$settings_dashboard_total_contacts     = get_user_meta( $cid, 'settings_dashboard_total_contacts', true );
	$settings_dashboard_total_leads        = get_user_meta( $cid, 'settings_dashboard_total_leads', true );
	$settings_dashboard_total_customers    = get_user_meta( $cid, 'settings_dashboard_total_customers', true );
	$settings_dashboard_total_transactions = get_user_meta( $cid, 'settings_dashboard_total_transactions', true );
	$settings_dashboard_sales_funnel       = get_user_meta( $cid, 'settings_dashboard_sales_funnel', true );
	$settings_dashboard_revenue_chart      = get_user_meta( $cid, 'settings_dashboard_revenue_chart', true );
	$settings_dashboard_recent_activity    = get_user_meta( $cid, 'settings_dashboard_recent_activity', true );
	$settings_dashboard_latest_contacts    = get_user_meta( $cid, 'settings_dashboard_latest_contacts', true );
	if ( $settings_dashboard_total_contacts == '' ) {
		$settings_dashboard_total_contacts = 'true';
	}
	if ( $settings_dashboard_total_leads == '' ) {
		$settings_dashboard_total_leads = 'true';
	}
	if ( $settings_dashboard_total_customers == '' ) {
		$settings_dashboard_total_customers = 'true';
	}
	if ( $settings_dashboard_total_transactions == '' ) {
		$settings_dashboard_total_transactions = 'true';
	}
	if ( $settings_dashboard_sales_funnel == '' ) {
		$settings_dashboard_sales_funnel = 'true';
	}
	if ( $settings_dashboard_revenue_chart == '' ) {
		$settings_dashboard_revenue_chart = 'true';
	}
	if ( $settings_dashboard_recent_activity == '' ) {
		$settings_dashboard_recent_activity = 'true';
	}
	if ( $settings_dashboard_latest_contacts == '' ) {
		$settings_dashboard_latest_contacts = 'true';
	}

	?>


<div class='zbs-dash-header'>
	<?php ##WLREMOVE ?>
	<div class="ui message compact" style="
	max-width: 400px;
	float: right;
	margin-top: -25px;
	margin-right: 30px;text-align:center;display:none;">
	<div class="header">
	</div>
	</div>
	<?php ##/WLREMOVE ?>


</div>

	
	<?php wp_nonce_field( 'zbs_dash_setting', 'zbs_dash_setting_security' ); ?>
	<?php wp_nonce_field( 'zbs_dash_count', 'zbs_dash_count_security' ); ?>

<div class='controls-wrapper'>

	<div id="zbs-date-picker-background">
	<div class='month-selector'>
		<div id="reportrange" class="pull-right jpcrm-date-range" style="cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; width: 100%;margin-top:-3px;width:220px;">
		<i class="fa fa-calendar"></i>&nbsp;
		<span></span> <b class="caret"></b>
		</div>
	</div>
	</div>

	<div class='dashboard-customiser'>
		<i class="icon sliders horizontal"></i>
	</div>

	<div class='dashboard-custom-choices'>
	<ul class="ui form">

	<?php
		// this is to put a control AFTER row 1. i.e. the TOTALS
		do_action( 'zbs_dashboard_customiser_after_row_1' );
	?>


	<li class="item" id="settings_dashboard_sales_funnel_list">
		<label>
		<input type="checkbox" name="settings_dashboard_sales_funnel" id="settings_dashboard_sales_funnel" 
		<?php
		if ( $settings_dashboard_sales_funnel == 'true' ) {
			echo 'checked'; }
		?>
		>
			<?php esc_html_e( 'Sales Funnel', 'zero-bs-crm' ); ?>
	</label></li>

	<li class="item"><label>
		<input type="checkbox" name="settings_dashboard_revenue_chart" id="settings_dashboard_revenue_chart" 
		<?php
		if ( $settings_dashboard_revenue_chart == 'true' ) {
			echo 'checked'; }
		?>
		>
			<?php esc_html_e( 'Revenue Chart', 'zero-bs-crm' ); ?>
	</label></li>


	<li class="item"><label>
		<input type="checkbox" name="settings_dashboard_recent_activity" id="settings_dashboard_recent_activity" 
		<?php
		if ( $settings_dashboard_recent_activity == 'true' ) {
			echo 'checked'; }
		?>
		>
			<?php esc_html_e( 'Recent Activity', 'zero-bs-crm' ); ?>
	</label></li>

	<li class="item"><label>
		<input type="checkbox" name="settings_dashboard_latest_contacts" id="settings_dashboard_latest_contacts" 
		<?php
		if ( $settings_dashboard_latest_contacts == 'true' ) {
			echo 'checked'; }
		?>
		>
			<?php esc_html_e( 'Latest Contacts', 'zero-bs-crm' ); ?>
	</label></li>

	<?php do_action( 'zerobscrm_dashboard_setting' ); ?>

	</ul>

	</div>

</div>

<!-- loads summary boxes -->
<div id="crm_summary_numbers" class="ui cards grid"></div>

<!--- the contacts over time comes in next - PHP below is for the funnel -->
<div class="ui grid narrow">



	<?php

	$zbsFunnelStr = zeroBSCRM_getSetting( 'zbsfunnel' );

	// } Defaults:
	$zbsFunnelArr  = array();
	$zbsFunnelArrN = array();

	// } Unpack.. if present
	if ( ! empty( $zbsFunnelStr ) ) {

		if ( strpos( $zbsFunnelStr, ',' ) > -1 ) {

			// csv
			$zbsFunnelArrN = explode( ',', $zbsFunnelStr );
			$zbsFunnelArr  = array_reverse( $zbsFunnelArrN );

		} else {

			// single str
			$zbsFunnelArr  = array( $zbsFunnelStr );
			$zbsFunnelArrN = array( $zbsFunnelStr );

		}
	}

	$i   = 0;
	$tot = 0;
	$n   = count( $zbsFunnelArr );
	// wh added these to stop php notices?
	$func = array();
	foreach ( $zbsFunnelArr as $Funnel ) {
		// hack for demo site
		$fun[ $i ]  = zeroBS_customerCountByStatus( $Funnel );
		$func[ $i ] = $fun[ $i ] + $tot;
		$tot        = $func[ $i ];
		++$i;
	}

	$values = array_reverse( $func );

	// WH note: added second set of SAME colours here - as was PHP NOTICE for users with more than 6 in setting below
	$colors  = array( '#00a0d2', '#0073aa', '#035d88', '#333', '#222', '#000', '#00a0d2', '#0073aa', '#035d88', '#333', '#222', '#000' );
	$colorsR = array_reverse( $colors );

	$i    = 0;
	$data = '';
	$n    = count( $zbsFunnelArr ) - 1;

	// WH added - to stop 0 0 funnels
	$someDataInData = false;

	for ( $j = $n; $j >= 0;  $j-- ) {

		$val = (int) $func[ $j ];

		if ( $val > 0 ) {
			$someDataInData = true;
		}

		$data     .= '{';
			$data .= 'value: ' . $val . ',';
			$data .= "color: '" . $colors[ $j ] . "',";
			$data .= "labelstr: '" . $func[ $j ] . "'";
		$data     .= '},';
	}

	?>

	<?php

	/* Transactions - Revenue Chart data gen */

	// } Default
	$labels = array();

	$labels[0]  = "'" . date( 'F Y' ) . "'";
	$labelsa[0] = date( 'F Y' );

	for ( $i = 0; $i < 12; $i++ ) {
		$date          = date( 'M y', mktime( 0, 0, 0, date( 'm' ) - $i, 1, date( 'Y' ) ) );
		$labels[ $i ]  = "'" . $date . "'";
		$labelsa[ $i ] = $date;
	}

	$labels = implode( ',', array_reverse( $labels ) );

	$utsFrom = strtotime( 'first day of ' . date( 'F Y', strtotime( '11 month ago' ) ) );
	$utsNow  = time();

	$args = array(
		'paidAfter'  => $utsFrom,
		'paidBefore' => $utsNow,
	);

	// fill with zeros if months aren't present
	for ( $i = 11; $i > 0; $i-- ) {
		$key       = date( 'nY', mktime( 0, 0, 0, date( 'm' ) - $i, 1, date( 'Y' ) ) );
		$t[ $key ] = 0;
	}

	$recentTransactions = $zbs->DAL->transactions->getTransactionTotalByMonth( $args );
	foreach ( $recentTransactions as $k => $v ) {
		$trans[ $k ] = $v['total'];
		$dkey        = $v['month'] . $v['year'];
		$t[ $dkey ]  = $v['total'];
	}

	$i = 0;
	foreach ( $t as $k => $v ) {
		$trans[ $i ] = $v;
		++$i;
	}

	if ( is_array( $trans ) ) {
		$chartdataStr = implode( ',', $t );
	}

	?>


<script type="text/javascript">
jQuery(function(){

	funnel_height = jQuery('#bar-chart').height();
	jQuery('.zbs-funnel').height(funnel_height);

	jQuery('.learn')
	.popup({
		inline: false,
		on:'click',
		lastResort: 'bottom right',
	});

	<?php if ( strlen( $data ) > 0 ) { ?>
	window.funnelData = [<?php echo $data; ?>];
	<?php } else { ?>
	window.funnelData = '';
	<?php } ?>

	if (funnelData != '') jQuery('#funnel-container').drawFunnel(funnelData, {


	width: jQuery('.zbs-funnel').width() - 50, 
	height: jQuery('.zbs-funnel').height() -50,  

	// Padding between segments, in pixels
	padding: 1, 

	// Render only a half funnel
	half: false,  

	// Width of a segment can't be smaller than this, in pixels
	minSegmentSize: 30,  

	// label: function () { return "Label!"; } 


	label: function (obj) {
		return obj;
	}
	});


// WH added: don't draw if not there :)
if (jQuery('#bar-chart').length){

	new Chart(document.getElementById("bar-chart"), {
		type: 'bar',
		data: {
		labels: [<?php echo $labels; ?>],
		datasets: [
			{
			label: "",
			backgroundColor: "#222",
			data: [<?php echo $chartdataStr; ?>]
			}
		]
		},
		options: {
		legend: { display: false },
		title: {
			display: false,
			text: ''
		},

		scales: {
			yAxes: [{
				display: true,
				ticks: {
					beginAtZero: true   // minimum value will be 0.
				}
			}]
		}


		}
	});

}


});
</script>


	<?php
	do_action( 'zbs_dashboard_pre_dashbox_post_totals' );
	?>

</div>

<div class="ui grid narrow">
	<div class="six wide column zbs-funnel"  id="settings_dashboard_sales_funnel_display" 
	<?php
	if ( $settings_dashboard_sales_funnel == 'true' ) {
		echo "style='display:block;'";
	} else {
		echo "style='display:none;'";}
	?>
		>
	<div class='panel'>

		<div class="panel-heading" style="text-align:center">
		<h4 class="panel-title text-muted font-light"><?php esc_html_e( 'Sales Funnel', 'zero-bs-crm' ); ?></h4>
		</div>
		<?php
		if (
			( is_array( $data ) && count( $data ) == 0 )
			||
			( is_string( $data ) && strlen( $data ) == 0 )
			||
			! $someDataInData
			) {
			?>
		<div class='ui message blue' style="text-align:center;margin-bottom:50px;">
				<?php esc_html_e( 'You do not have any contacts. Make sure you have contacts in each stage of your funnel.', 'zero-bs-crm' ); ?> 
				<?php ##WLREMOVE ?><br/><br/>
			<a class="button ui blue" href="<?php echo esc_url( $zbs->urls['kbcrmdashboard'] ); ?>"><?php esc_html_e( 'Read Guide', 'zero-bs-crm' ); ?></a>
				<?php ##/WLREMOVE ?>
		</div>
		<?php } else { ?>
		<div id="funnel-container"></div>
		<?php } ?>

		<div class='funnel-legend'>
			<?php
			$i             = 0;
			$zbsFunnelArrR = array_reverse( $zbsFunnelArr );
			$j             = count( $zbsFunnelArrR );
			foreach ( $zbsFunnelArrR as $Funnel ) {
				echo '<div class="zbs-legend" style="background:' . esc_attr( $colors[ $j - $i - 1 ] ) . '"></div><div class="zbs-label">  ' . esc_html( $Funnel ) . '</div>';
				++$i;
			}
			?>
		</div>

	</div>
	</div>

	<div class="ten wide column" id="settings_dashboard_revenue_chart_display" 
	<?php
	if ( $settings_dashboard_revenue_chart == 'true' ) {
		echo "style='display:block;'";
	} else {
		echo "style='display:none;'";}
	?>
		>
	<div class='panel'>

		<div class="panel-heading" style="text-align:center">
		<?php $currencyChar = zeroBSCRM_getCurrencyChr(); ?>
		<h4 class="panel-title text-muted font-light"><?php esc_html_e( 'Revenue Chart', 'zero-bs-crm' ); ?> (<?php echo esc_html( $currencyChar ); ?>)</h4>
		<?php ##WLREMOVE ?>
		<?php if ( ! zeroBSCRM_isExtensionInstalled( 'salesdash' ) ) { ?>
			<span class='upsell'><a href="<?php echo esc_url( $zbs->urls['salesdash'] ); ?>" target="_blank"><?php esc_html_e( 'Want More?', 'zero-bs-crm' ); ?></a></span>
		<?php } else { ?>
			<span class='upsell'><a href="<?php echo jpcrm_esc_link( $zbs->slugs['salesdash'] ); ?>"><?php esc_html_e( 'Sales Dashboard', 'zero-bs-crm' ); ?></a></span>
		<?php } ?>
		<?php ##/WLREMOVE ?>
		</div>


		<?php
		if ( ! is_array( $trans ) || array_sum( $trans ) == 0 ) {
			?>
		<div class='ui message blue' style="text-align:center;margin-bottom:80px;margin-top:50px;">
				<?php esc_html_e( 'You do not have any transactions that match your chosen settings. You need transactions for your revenue chart to show. If you have transactions check your settings and then transaction statuses to include.', 'zero-bs-crm' ); ?> 
				<?php ##WLREMOVE ?><br/><br/>
			<a class="button ui blue" href="<?php echo esc_url( $zbs->urls['kbrevoverview'] ); ?>"><?php esc_html_e( 'Read Guide', 'zero-bs-crm' ); ?></a>
				<?php ##/WLREMOVE ?>
		</div>
		<?php } else { ?>
		<canvas id="bar-chart" width="800" height="403"></canvas>
		<?php } ?>
	  
	</div>
	</div>
</div>




	<?php
	// changed this from false to 0, so we get all the logs and the functions actually get triggered..
	// WH: changed for proper generic func $latestLogs = zeroBSCRM_getContactLogs(0,true,10);
	$latestLogs = zeroBSCRM_getAllContactLogs( true, 9 );

	?>


<div class="ui grid narrow">
	<div class="six wide column" id="settings_dashboard_recent_activity_display" 
	<?php
	if ( $settings_dashboard_recent_activity == 'true' ) {
		echo "style='display:block;'";
	} else {
		echo "style='display:none;'";}
	?>
	>
	<div class="panel">
		<div class="panel-heading" style="text-align:center">
			<h4 class="panel-title text-muted font-light"><?php esc_html_e( 'Recent Activity', 'zero-bs-crm' ); ?></h4>
		</div>

		<div class="ui list activity-feed" style="padding-left:20px;margin-bottom:20px;">

		<?php

		if ( count( $latestLogs ) == 0 ) {
			?>

			<div class='ui message blue' style="text-align:center;margin-bottom:80px;margin-top:50px;margin-right:20px;">
				<i class="icon info"></i>
				<?php esc_html_e( 'No recent activity.', 'zero-bs-crm' ); ?> 
			</div>


		<?php } ?>

		<?php
		if ( count( $latestLogs ) > 0 ) {
			foreach ( $latestLogs as $log ) {

				$em     = zeroBS_customerEmail( $log['owner'] );
				$avatar = zeroBSCRM_getGravatarURLfromEmail( $em, 28 );
				$unixts = date( 'U', strtotime( $log['created'] ) );
				$diff   = human_time_diff( $unixts, current_time( 'timestamp' ) );

				if ( isset( $log['type'] ) ) {
					$logmetatype = $log['type'];
				} else {
					$logmetatype = '';
				}

				// WH added from contact view:

				global $zeroBSCRM_logTypes, $zbs;
				// DAL 2 saves type as permalinked
				if ( $zbs->isDAL2() ) {
					if ( isset( $zeroBSCRM_logTypes['zerobs_customer'][ $logmetatype ] ) ) {
						$logmetatype = __( $zeroBSCRM_logTypes['zerobs_customer'][ $logmetatype ]['label'], 'zero-bs-crm' );
					}
				}

				if ( isset( $log['shortdesc'] ) ) {
					$logmetashot = $log['shortdesc'];
				} else {
					$logmetashot = '';
				}

				$logauthor = '';
				if ( isset( $log['author'] ) ) {
					$logauthor = ' &mdash; ' . $log['author'];
				}

				?>
			<div class='feed-item'>
				<div class='date'><img class='ui avatar img img-rounded' alt='<?php esc_attr_e( 'Contact Image', 'zero-bs-crm' ); ?>' src='<?php echo esc_url( $avatar ); ?>'/></div>
				<div class='content text'>
				<span class='header'><?php echo esc_html( $logmetatype ); ?><span class='when'> (<?php echo esc_html( $diff . __( ' ago', 'zero-bs-crm' ) ); ?>)</span><span class='who'><?php echo esc_html( $logauthor ); ?></span></span>
				<div class='description'><?php echo wp_kses( $logmetashot, array( 'i' => array( 'class' => true ) ) ); ?><br/></div>
				</div>
			</div>
						<?php
			}
		} else {
			?>
			<div class='feed-item'>
				<div class='content text'>
				<span class='header'><?php esc_html_e( 'Contact Log Feed', 'zero-bs-crm' ); ?><span class='when'> (<?php esc_html_e( 'Just now', 'zero-bs-crm' ); ?>)</span></span>
				<div class='description'>
					<?php esc_html_e( 'This is where recent Contact actions will show up', 'zero-bs-crm' ); ?>
					<br/>
				</div>
				</div>
			</div>
				<?php } ?>
		</div>
	</div>
	</div>
	<div class="ten wide column" id="settings_dashboard_latest_contacts_display" 
	<?php
	if ( $settings_dashboard_latest_contacts == 'true' ) {
		echo "style='display:block;margin: 0;padding-left: 0;'";
	} else {
		echo "style='display:none;'";}
	?>
		>
	<div class="panel">
		<div class="panel-heading" style="text-align:center;position:relative">
			<h4 class="panel-title text-muted font-light"><?php esc_html_e( 'Latest Contacts', 'zero-bs-crm' ); ?></h4>
			<span class='upsell'><a href="<?php echo jpcrm_esc_link( $zbs->slugs['managecontacts'] ); ?>"><?php esc_html_e( 'View All', 'zero-bs-crm' ); ?></a></span>
		</div>


		<?php
		$latest_cust = zeroBS_getCustomers( true, 10, 0 );
		?>

		<?php if ( count( $latest_cust ) == 0 ) { ?>

			<div class='ui message blue' style="text-align:center;margin-bottom:80px;margin-top:50px;margin-right:20px;margin-left:20px;">
				<i class="icon info"></i>
				<?php esc_html_e( 'No contacts.', 'zero-bs-crm' ); ?> 
			</div>


		<?php } else { ?>

	<div class="panel-body">
		<div class="row">
		<div class="col-xs-12">
			<div class="table-responsive">
			<table class="table table-hover m-b-0">
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
						<td><div class='mar'><?php echo esc_html( $fname ); ?></div></td>
						<td><div class='mar'><?php echo esc_html( $lname ); ?></div></td>
						<td class='zbs-s <?php echo esc_attr( 'zbs-' . $zbs->DAL->makeSlug( $status ) ); ?>'><div><?php echo esc_html( $status ); ?></div></td>
						<td><div class='mar'><a href='<?php echo jpcrm_esc_link( 'view', $cust['id'], 'zerobs_customer' ); ?>'><?php esc_html_e( 'View', 'zero-bs-crm' ); ?></a></div></td>
						<td style='text-align:right;' class='zbs-datemoment-since' data-zbs-created-uts='<?php echo esc_attr( $cust['createduts'] ); ?>'><?php echo esc_html( $cust['created'] ); ?></td>
						</tr>
						<?php
					}
					?>
					</tbody>
				</table>
				</div>
			</div>
			</div>
		</div>

		<?php } ?>


		</div>
	</div>
</div>
	<?php

	// First use dashboard
	if ( zeroBSCRM_permsCustomers() && $zbs->DAL->contacts->getFullCount() == 0 ) {

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
