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
    add code in here for the dashboard boxes. Keeps it a bit tidier than ALL in the AdminPages.php file 

    action hooks to use:
        zbs_dashboard_pre_dashbox_post_totals:  shows up on the first row AFTER the total boxes
        zbs_dashboard_customiser_after_row_1:   lets you add a on / off control (if desired after tht total boxes checkbox controls)

*/

//example code to add a new box below the totals, but above the funnels. This one is NOT turn off-able (is off-able a word, lol).
add_action('zbs_dashboard_pre_dashbox_post_totals', 'zeroBS_dashboard_crm_list_growth', 1);
function zeroBS_dashboard_crm_list_growth(){

    //shows a chart of CRM growth over time, feat creep (will prob add) stack by status
    //using chart JS like the other charts on that page. 

    global $zbs;

    // ============== v2 of get counts per mo (better SQL perf)
    $col = '#00a0d2';
    $i=0;
    $date_group = date('M Y');
    $group_tot = 0;
    $newdata = array();



    for ($i = 0; $i < 12; $i++) {

        $timeStart = mktime(0, 0, 0, date("m")-$i, 1, date("Y"));
        $timeEnd = mktime(0, 0, 0, date("m")-($i-1), 1, date("Y"))-1; // 1 second before midnight of month after
        $date = date("M Y", $timeStart);
        $labels[$i] = "'" . $date . "'";
        $background[$i] = "'" . $col . "'";
        $labelsa[$i] = $date;

        // retrieve st
        $countInMonth = $zbs->DAL->contacts->getContacts(array(
            'olderThan'         => $timeEnd, // uts
            'newerThan'         => $timeStart, // uts
            'count'             => true,
            'page'              => -1,
            'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)
        ));
  
        $newdata[$date] = $countInMonth;
    }


  
    $labels = implode(",",array_reverse($labels));
    $background = implode(",", $background);


    $chartdata = array();
    foreach($labelsa as $label){
        if(array_key_exists($label, $newdata)){
          $chartdata[$label] = $newdata[$label];
        }else{
          $chartdata[$label] = 0;
        }
    }
    $chartdataStr = implode(",",array_reverse($chartdata));

    if(array_sum($newdata) == 0){ ?>

    <div class='one column row'>
        <div class="column"  id="settings_dashboard_growth_display">
            <div class='panel' style="padding:20px;">
                <div class='ui message blue' style="text-align:center;margin-bottom:80px;margin-top:50px;">
                <?php esc_html_e( 'You do not have any contacts. You need contacts for your growth chart to show.', 'zero-bs-crm' );?> 
                <br />
                <a href="<?php echo jpcrm_esc_link( 'create', -1, 'zerobs_customer', false, false ); ?>" class="ui tiny green button" style="margin-top:1em"><?php esc_html_e( 'Add a Contact', 'zero-bs-crm' ); ?></a>
                </div>
            </div>
        </div>
    </div>
    <?php }else{ ?>
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
    <?php } 

    //what we want here is a chart (data summary) showing, per month, the contact growth 
    //limit to 24 months, but can (and probably should) add data filters to this later
    ?>


    <?php


}