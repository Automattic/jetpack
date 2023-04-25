<?php 
/*!
 * Jetpack CRM - Notify Me
 * https://jetpackcrm.com
 * V2.4
 *
 * Copyright 2020 Automattic
 *
 * Date: 11/02/18
 *
 */


/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/* ================================================================================================================
 *
 * This is the "notify me" plugin from the plugin hunt theme. Written very similar to IA when I wrote it
 * already has lots of useful things like:-
 * - settings page for notifications per WP users (disabled for now)
 * - browser push notifications for UNREAD notifications
 * have built it in so it does our stuff (upsell stuff + marketing for free)
 * - for INTERNAL team stuff, suggest building the TEAM notifications PRO and include things like @mentions
 * - will write notifications system to also check a JSON file where we can post them notifications from external
 * - e.g. JSON(ID: message) and it marks them as read, then if we want to notify the installs, we can do that ;) 
 * - the EXTENRAL updates is what the 'zbsnotify_reference_id' is for
 *
 * ================================================================================================================ */


//create the DB table on activation... (should move this into a classs.. probably)
register_activation_hook(ZBS_ROOTFILE,'zeroBSCRM_notifyme_createDBtable');
function zeroBSCRM_notifyme_createDBtable(){
  global $wpdb;
  $notify_table = $wpdb->prefix . "zbs_notifications";

  /* reference ID is for our JSON notification check + update i.e. new posts we want to notify folks of 
  /* will use WP cron to check that resource daily + run the script to update zbsnotify_reference_id 
  */

  $sql = "CREATE TABLE IF NOT EXISTS $notify_table (
  `id` INT(32) unsigned NOT NULL AUTO_INCREMENT,
  `zbs_site` INT NULL DEFAULT NULL,
  `zbs_team` INT NULL DEFAULT NULL,
  `zbs_owner` INT NOT NULL,
  `zbsnotify_recipient_id` INT(32) NOT NULL,
  `zbsnotify_sender_id` INT(32) NOT NULL,
  `zbsnotify_unread` tinyint(1) NOT NULL DEFAULT '1',
  `zbsnotify_emailed` tinyint(1) NOT NULL DEFAULT '0',    
  `zbsnotify_type` varchar(255) NOT NULL DEFAULT '',
  `zbsnotify_parameters` text NOT NULL,
  `zbsnotify_reference_id` INT(32) NOT NULL,      
  `zbsnotify_created_at` INT(18) NOT NULL,
  PRIMARY KEY (`id`)
  ) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8
  COLLATE = utf8_general_ci";

  require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
  dbDelta($sql);
}


function zeroBSCRM_notifyme_scripts(){

    global $zbs;
    wp_enqueue_script("jquery");
    wp_enqueue_script('notifyme-front', ZEROBSCRM_URL . 'js/lib/notifyme-front.min.js',array('jquery'), $zbs->version );
    wp_enqueue_style('notifyme-css',  ZEROBSCRM_URL . 'css/lib/notifyme-front.min.css', array(), $zbs->version );

    #} this does the browser notifications
    wp_register_script( 'notifyme_push', ZEROBSCRM_URL . 'js/lib/push.min.js', array( 'jquery' ) , $zbs->version, true ); 
    wp_enqueue_script( 'notifyme_push' );

    #} this stores things in cookies, so not to keep notifying 
    wp_register_script( 'notifyme_cookie', ZEROBSCRM_URL . 'js/lib/cookie.min.js', array( 'jquery' ) , $zbs->version, true ); 
    wp_enqueue_script( 'notifyme_cookie' );

    #} this is the browser notification icon.
    $notify_logo = jpcrm_get_logo();

    #} this is which user to notify for..
    $cid = get_current_user_id();

    #} we want to browser notify our users :-)
    $notification_meta['browser_push'] = 1;
    $args = array(
            'ph_notify_logo' =>  $notify_logo,
            'current_user' => $cid,
            'notification_nonce' => wp_create_nonce( "notifyme_nonce" ),
            'notification_settings' => $notification_meta,
            'ajaxurl'  => admin_url( 'admin-ajax.php' )
    );
    wp_localize_script('notifyme_push','notifyme',$args);
}
add_action( 'zbs-global-admin-styles', 'zeroBSCRM_notifyme_scripts' );


//ADD ANY CORE FUNCTIONS FOR THE PLUGIN HERE
function zeroBSCRM_notify_me(){
  global $zbs, $zeroBSCRM_notifications;

  // jQuery fills in the number in the bubble..
  if ( is_user_logged_in() && zeroBSCRM_permsNotify() ){
    $url = zeroBSCRM_getAdminURL($zbs->slugs['notifications']);
      echo "<a id='notty' class='item' href='". esc_url( $url ) ."'><span class='notifyme' id='notifymebell'><i class='fa fa-bell'></i></span></a>";

  }
}
#} this is the action to add the notification icon to the new admin top menu
add_action('zbs-crm-notify','zeroBSCRM_notify_me');  

#} can put actual settings in here later (for now just have it notify them regardless).
function zeroBSCRM_notifyme_settings(){}


function zeroBSCRM_notifyme_echo_type($type = '', $title = '', $sender = -999, $content = ''){

  global $zbs;

    switch ($type) {

    case 'migration.blocked.errors':
        esc_html_e("There has been a general error with CRM migrations, a single migration appears to be blocked. Please contact support.", "zero-bs-crm");
        break;

    case 'woosync.suggestion':
        esc_html_e("🎯 we have detected that you are running WooCommerce. We have a kick ass extension for that. ", "zero-bs-crm");
        break;

    case 'salesdash.suggestion':
        esc_html_e( '⛽ See all your sales information in a sales dashboard built just for you.', 'zero-bs-crm') . ' ';
        break;


    case 'notifications.suggestion':
        echo wp_kses( sprintf( __( '🔔 Want notifications PRO? This is coming soon to our <a href="%s" target="_blank">Entrepreneur Bundle</a>. Get it while it\'s hot!', 'zero-bs-crm' ), esc_url( $zbs->urls['upgrade'] ) ), $zbs->acceptable_restricted_html ) . ' ';
        break;

    case 'extension.update':
      ##WLREMOVE
        echo wp_kses( sprintf( __( '🔔 [URGENT] Your extension(s) need updating <a href="%s" target="_blank">Click here to retrieve the new versions</a>. (If you don\'t know your login, please <a href="%s" target="_blank">Email Support</a>.)', 'zero-bs-crm' ), esc_url( $zbs->urls['account'] ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );
      ##/WLREMOVE
        break;

    // v2.70 - DB2 contacts migration :)
    case 'db2.update.253':
        echo esc_html( sprintf( __( '🔔 [URGENT] Your Contact Database needs migrating. Running this database update will increase your CRM load-times by up to 60x!', 'zero-bs-crm' ) ) );
        break;

    // v2.70 - DB2 contacts migration :) FINI
    case 'db2.update.253.success':
        echo wp_kses( sprintf( __('Your contact database was successfully migrated. Please update any <a href="%s" target="_blank">PRO Extensions</a> you may have installed.',"zero-bs-crm" ), esc_url( $zbs->urls['products'] ) ), $zbs->acceptable_restricted_html );
        break;

    // v2.70 - DB2 contacts migration :) FINI
    case 'db2.update.253.errors':

          // load errs
          $zbsMigrationErrors = get_option( 'zbs_db_migration_253_errors', -1);
          $errStr = ''; if (isset($zbsMigrationErrors) && is_array($zbsMigrationErrors)) foreach ($zbsMigrationErrors as $zme) $errStr .= '<br />'.$zme;

        echo sprintf( __( 'Jetpack CRM has tried to update your core CRM to 2.70 but hit errors. Please send the following error report to Support:<hr /><strong>Migration Error Report:</strong>%s</hr> <a href="%s" target="_blank">Contact Support</a>', "zero-bs-crm" ), $errStr, esc_url( $zbs->urls['support'] ) );
        break;

    // v2.70 - DB2 contacts migration :) FINI + has extensions to update
    case 'db2.extupdate.253':
        ##WLREMOVE
        echo wp_kses( sprintf( __( 'Please Update your Extensions (DB Migration makes this essential!) <a href="%s">View Extension Updates</a>', "zero-bs-crm" ), jpcrm_esc_link( $zbs->slugs['connect'] ) ), $zbs->acceptable_restricted_html );
        ##/WLREMOVE
        break;

    case 'extension.new.update.avail':
        ##WLREMOVE
        echo wp_kses( sprintf(  __( '🔔 One or more of your extensions need updating. Please update to avoid any issues with security or compatibility <a href="%s">Learn More</a>.', "zero-bs-crm" ), esc_url( admin_url('admin.php?page=zerobscrm-connect')) ), $zbs->acceptable_restricted_html );
        ##/WLREMOVE
        break;

    case 'license.update.needed':
        echo '⚠️ ' . $content;
        break;

    case 'general.extension.update.needed':
        echo '⚠️ ' . $content;
        break;

    // 2.94.2 - smtp mode changed, need to tell peeps to revalidate
    case 'smtp.2943.needtocheck':
        echo sprintf( __( 'Important: 🔔 Jetpack CRM has just updated the way it handles SMTP Delivery Methods.<br />Please check each of your Delivery Methods still works by loading <a href="%s">Mail Delivery Methods</a> and clicking \'send test\', validating that it still sends', 'zero-bs-crm' ), esc_url( admin_url('admin.php?page=zerobscrm-plugin-settings&tab=maildelivery') ) );
    break;
	
    // 3.0.17 - Changed the password encryption, so get people to validate
    case 'smtp.3017.needtocheck':
        echo sprintf( __( 'Important: 🔔 Jetpack CRM has improved the encryption of SMTP passwords.<br />Please check each of your Delivery Methods still works by loading <a href="%s">Mail Delivery Methods</a> and clicking \'send test\', validating that it still sends', 'zero-bs-crm' ), jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=maildelivery' ) );
    break;


    //now do the extension updates like this 

    case 'custom.extension.update.needed':
        $x = __("🔔","zero-bs-crm") . $content  . ' <a href="'. esc_url( admin_url('update-core.php') ) .'">' . __("Update Now", "zero-bs-crm") . '</a>.';
        
        ##WLREMOVE
        $x = __("🔔","zero-bs-crm") . $content  . ' <a href="'. esc_url( admin_url('update-core.php') ) .'">' . __("Update Now", "zero-bs-crm") . '</a>.';
        ##/WLREMOVE
        echo $x;
    break;
    //now do the extension updates like this 
    // this is WL CORE update
    case 'core.update.needed':
        
        echo esc_html__("🔔","zero-bs-crm") . $content  . ' <a href="'. esc_url( admin_url('update-core.php') ) .'">' . esc_html__("Update Now", "zero-bs-crm") . '</a>.';
        
    break;

  
    // 4.5.0 - Missing template file
    case 'missing.template':
        echo wp_kses( __( 'Template File Error:<br /> It was not possible to load the following template file. This will mean that related documents will not be loaded properly.<br/>Template File: ', 'zero-bs-crm' ), $zbs->acceptable_restricted_html ) . $content;
    break;


    // ========= DAL 3 MIGRATIONS

    // v3.0 - DB3 objs migration :)
    case 'db3.update.300':
        echo sprintf( __( '🔔 [URGENT] Your CRM Database needs migrating. <a href="%s">Click here to run migration routine</a><div style="margin: 2em;margin-left: 4em;">Running this database update will increase your CRM load-times by up to 60x!<br /><a href="%s" target="_blank" class="ui button basic">Read Guide</a> <a href="%s" class="ui button green">Run now</a>', "zero-bs-crm" ), jpcrm_esc_link( $zbs->slugs['migratedal3'] ), esc_url( $zbs->urls['db3migrate'] ), jpcrm_esc_link( $zbs->slugs['migratedal3'] ) );
        break;

    // v3.0 - DB3 objs migration :) FINI
    case 'db3.update.300.success':
       echo wp_kses( sprintf( __( 'Your CRM database was successfully migrated. Please update any <a href="%s" target="_blank">PRO Extensions</a> you may have installed.',"zero-bs-crm"), esc_url( $zbs->urls['products'] ) ), $zbs->acceptable_restricted_html );
       break;

    // v3.0 - DB3 objs migration :) FINI
    case 'db3.update.300.errors':

        echo __("Jetpack CRM has tried to updated your core CRM successfully, despite a few errors:","zero-bs-crm").'</hr><a href="'. esc_url( zeroBSCRM_getAdminURL($zbs->slugs['systemstatus']) ).'&v3migrationlog=1" target="_blank">'. esc_html__('View Migration Report','zero-bs-crm').'</a>';
        break;

    // v3.0 - DB3 objs migration :) FINI + has extensions to update
    case 'db3.extupdate.300':
        ##WLREMOVE
        echo esc_html__("Please Update your Extensions (DB Migration makes this essential!)","zero-bs-crm").' <a href="'. jpcrm_esc_link( $zbs->slugs['connect'] ).'">'. esc_html__("View Extension Updates","zero-bs-crm").'</a>';
        ##/WLREMOVE
        break;

    // ========= / DAL 3 MIGRATIONS

    // ========= v5+ MIGRATIONS

    // v5.1 - migrate woosync sites
    case 'woosync.5.1.migration':
        
        echo esc_html__( 'WooSync was unable to migrate settings (5.2). Sync will be stopped until this is remedied.', 'zero-bs-crm' ) . ' ' . wp_kses( sprintf( __( 'Please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

        break;
    // ========= / v5+ MIGRATIONS

    // =========  Exceptions seen

    // Segment audience tried to build but some conditions produced no arguments
    // (likely segment created with adv segments active, then adv segments been deactivated)
    case 'segments.orphaned.conditions':

        echo esc_html__( '⚠️ A segment was retrieved which has conditions which produced no arguments. (This usually happens when a segment was made via Advanced Segments extension, then that extension is deactivated). Please reactivate any segment extending plugins you have, or contact support.', "zero-bs-crm" );
        break;

    // ========= / Exceptions seen

    // =========   MC2
    case 'campaign.paused.due.to.error':

        echo esc_html__( 'A mail campaign has been paused due to an error.', 'zero-bs-crm' ) . '&nbsp;&nbsp;&nbsp;&nbsp;' . $content;

        break;
    case 'campaign.can.be.unpaused':

        echo esc_html__( 'A mail campaign which was previously blocked from sending by an error is now able to send. Please unpause the campaign to continue to send.', 'zero-bs-crm' ) . '&nbsp;&nbsp;&nbsp;&nbsp;' . $content;

        break;
    // ========= / MC2

    // =========   WooSync
    case 'woosync.conflict.deactivated':

        echo wp_kses( sprintf( __( 'Your standalone WooSync extension has been deactivated; WooSync is now in the core CRM! <a href="%s" target="_blank">Read more</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['v5announce'] ) ), $zbs->acceptable_restricted_html );

        break;
    case 'woosync.syncsite.paused':

        echo wp_kses( sprintf( __( 'Your WooSync Store connection has been paused due to three errors in connecting to the store. <a href="%s" target="_blank">View Connections</a>', 'zero-bs-crm' ), esc_url( $content ) ), $zbs->acceptable_restricted_html );

        break;
    // ========= / WooSync

	 // =========   Client Portal Pro
    case 'clientportalpro.incompatible.version.deactivated':

        echo esc_html__( 'You are using an outdated version of the Client Portal Pro extension, which is not compatible with this version of the CRM. It has been deactivated. Please update the extension to continue using Client Portal Pro.', 'zero-bs-crm' );

        break;
    // ========= / Client Portal Pro

    // =========   Package Installer
    case 'package.installer.fail_count_over':

        echo sprintf( __( 'Package Installer was not able to install the requested package %s, after trying the maximum number of times.', 'zero-bs-crm' ), $content ) . wp_kses( sprintf( __( ' Please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

        break;
    case 'package.installer.dir_create_error':

        echo sprintf( __( 'Package Installer could not create directories needed to install the package %s.', 'zero-bs-crm' ), $content ) . wp_kses( sprintf( __( ' Please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

        break;
    case 'package.installer.unzip_error':

        echo sprintf( __( 'Package Installer was not able to expand the requested package zip file for the package %s', 'zero-bs-crm' ), $content ) . wp_kses( sprintf( __( ' Please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

        break;
    case 'package.installer.dl_error':

        echo sprintf( __( 'Package Installer was not able to download the requested package %s', 'zero-bs-crm' ), $content ) . wp_kses( sprintf( __( ' Please <a href="%s" target="_blank">contact support</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

        break;
    case 'curl.timeout.error':

        echo sprintf( __( 'Failed to retrieve key file, your server may not be able to connect to the CRM CDN: %s. If this message persists, please contact support', 'zero-bs-crm' ), $content );

        break;
    // ========= / Package Installer

    default:
        esc_html_e(" something went wrong", 'zero-bs-crm');
    }
}

function zeroBSCRM_notifyme_time_ago($datetime){
    if (is_numeric($datetime)) {
      $timestamp = $datetime;
    } else {
      $timestamp = strtotime($datetime);
    }
    $diff=time()-$timestamp;

    $min=60;
    $hour=60*60;
    $day=60*60*24;
    $month=$day*30;

    if($diff<60) //Under a min
    {
        $timeago = $diff . " seconds";
    }elseif ($diff<$hour) //Under an hour
    {
        $timeago = round($diff/$min) . " mins";
    }elseif ($diff<$day) //Under a day
    {
        $timeago = round($diff/$hour) . " hours";
    }elseif ($diff<$month) //Under a day
    {
        $timeago = round($diff/$day) . " days";
    }else 
    {
        $timeago = round($diff/$month) ." months";
    }

    return $timeago;
}

//function to insert the notification into the database..
/*


    $recipient = get_current_user_id(); i.e. WHO are we notifying (WP_user ID)
    $sender = -999; //in this case...  we can call ZBS our -999 user ID (for bot icon stuff) and output our icon where it's system stuff. 
    $post_id = 0; //i.e. not a post related activity (but can pass $post_id for linking to various pages) - NOT USED
       ^^ use that in notifications PRO to store edit links for customerID, invoiceID, etc. but with new DB this is effectively the ID of whatever 
    $type = 'woosync.suggestion';   //this is a extension suggestion type, see zeroBSCRM_notifyme_echo_type
    for the switch / case here. Store the InternalAutomator actions strings here and extend where we want to notify of that..  e.g. 10 new leads have been added since you last logged in. 

    /* DOESN'T DO

    - GROUPING of similar notifications. If you do have it to notify on new customer it will show a notification line for each and every one. Rather than "100 new contact since your last visit" it would show [name1 .. name100] has been added as a new conact, 100 times

    - SNOOZING of notifications. They're ALWAYS on.

   // zeroBSCRM_notifyme_insert_notification($recipient,$sender,$post_id,$type);

*/
function zeroBSCRM_notifyme_insert_notification($recipient = -1, $sender = -999, $post_id = -1, $type = '', $parameters = '', $reference = -1){
   global $wpdb;
   $notify_table = $wpdb->prefix . "zbs_notifications";
   $now = time();

   // * WH NOTE:
      // ownership needed DBv2+
      // no need to update these (as of yet) - can't move teams etc.
      //'zbs_site' => zeroBSCRM_installSite(),
      //'zbs_team' => zeroBSCRM_installTeam(),
      //'zbs_owner' => $owner,
   // OWNER was not_null so I've added -1 for now :) to add these 3 when makes sense

   #} only stores if the recipient is NOT the user
   if($recipient != $sender){

    //need to check first whether the reference ID already exists (add with a UNIQUE REFERENCEID going forwards)

    //"parameters" here is really the content of the notification... $reference is the unique ID
    //added new "type" of custom.extension.update.needed

    // if $parameters is empty seems to bug out :) so forcing it to be smt if empty:
    if (empty($parameters)) $parameters = '-1';
    if (empty($type)) $type = '-1';

    $sql = $wpdb->prepare("SELECT id FROM $notify_table WHERE zbsnotify_reference_id = %d AND zbsnotify_parameters = %s", $reference, $parameters);
    $results = $wpdb->get_results($sql);

    if(count($results) == 0){
        $sql = $wpdb->prepare("INSERT INTO $notify_table ( zbs_owner, zbsnotify_recipient_id , zbsnotify_sender_id, zbsnotify_unread, zbsnotify_type, zbsnotify_parameters, zbsnotify_reference_id, zbsnotify_created_at) VALUES ( %d, %d, %d, %d, %s, %s, %d, %s)", -1, $recipient, $sender, '0', $type, $parameters, $reference, $now);
        $wpdb->query($sql);
    }
   }
}


function zeroBSCRM_notifyme_activity(){
  global $wpdb;
  $cid = get_current_user_id();

   // * WH NOTE:
      // ownership needed DBv2+
      // no need to update these (as of yet) - can't move teams etc.
      //'zbs_site' => zeroBSCRM_installSite(),
      //'zbs_team' => zeroBSCRM_installTeam(),
      //'zbs_owner' => $owner,

      $notify_table = $wpdb->prefix . "zbs_notifications";
      $sql = $wpdb->prepare("SELECT * FROM $notify_table WHERE zbsnotify_recipient_id = %d ORDER BY zbsnotify_created_at DESC LIMIT 20", $cid);
      $notifes = $wpdb->get_results($sql);

      echo '<div class="ph_notification_list_wrap ui segment" id="notification-list" style="margin-right:30px;">';

      if(count($notifes) == 0){

        // EXAMPLE NOTIFICATION - FOR THE TOUR :-) 
        $notify_logo_url = jpcrm_get_logo();

        $sender_avatar = "<img src='".$notify_logo_url."'  width='30px;float:left;'>";

        $another_notty = __("Here is another notification example. From a random person.", "zero-bs-crm");
        ##WLREMOVE
        $another_notty  = __("Here is another example. This time from Mike, one of our Jetpack CRM Founders.", "zero-bs-crm");
        ##/WLREMOVE


        echo "<div class='ph_notification_list r0' id='mike-face' style='display:none;'>";
          echo '<div class="ph_noti_img">';
            echo "<img src='". esc_url( ZEROBSCRM_URL )."i/defaultDude.jpeg' width='30px;float:left;'>";
          echo '</div>';
          echo '<div class="ph_noti_message">';
          echo esc_html( $another_notty );
          echo "</div>";
          echo '<div class="ph_noti_timeago">';
            esc_html_e("Just now", "zero-bs-crm");
          echo '</div>';
        echo '</div>';
        echo '<div class="clear"></div>';

        echo "<div class='ph_notification_list r0' id='first-example'>";
          echo '<div class="ph_noti_img">';
            echo $sender_avatar;
          echo '</div>';
          echo '<div class="ph_noti_message">';
            esc_html_e("This is an example notification. Here is where you will be kept notified :) simple. effective.", "zero-bs-crm"); 
          echo "</div>";
          echo '<div class="ph_noti_timeago">';
            esc_html_e("Just now", "zero-bs-crm");
          echo '</div>';
        echo '</div>';




      }else{

      foreach($notifes as $n){

        $title = ''; //can pass specific title to the echo function
        $sender = $n->zbsnotify_sender_id;

        if($sender == -999){
          //this is our "ZBS notifications bot". This sniffs around WP checking everything is OK.. and also lets 
          //them know about any updates we have pinged out from our own JSON file on https:// :-) ... POW ERRRR FULL 
          $notify_logo_url = jpcrm_get_logo();
          $sender_avatar = "<img src='".$notify_logo_url."'  width='30px;float:left;'>";
        }else{
          $sender_avatar = jpcrm_get_avatar( $n->zbsnotify_sender_id, 30); 
        }


        $sender_url = ''; if (isset($n) && isset($n->sender_id)) $sender_url = get_author_posts_url($n->sender_id);


        echo "<div class='ph_notification_list r". esc_attr( $n->zbsnotify_unread ) ."'>";
          echo '<div class="ph_noti_img">';
            echo $sender_avatar;
          echo '</div>';
          echo '<div class="ph_noti_message">';
            zeroBSCRM_notifyme_echo_type($n->zbsnotify_type, $title, $n->zbsnotify_sender_id, $n->zbsnotify_parameters); 
          echo "</div>";
          echo '<div class="ph_noti_timeago">';
            esc_html_e(zeroBSCRM_notifyme_time_ago($n->zbsnotify_created_at) . " ago ", "zero-bs-crm");
          echo '</div>';
        echo '</div>';
        echo '<div class="clear"></div>';


     }

           echo "</div>";

   }

      //got here. Mark the notifications as read for this user :-)
      $sql = $wpdb->prepare("UPDATE $notify_table SET zbsnotify_unread = %d WHERE zbsnotify_recipient_id = %d", 1, $cid);
      $wpdb->query($sql);

}



add_action('wp_ajax_nopriv_notifyme_get_notifications_ajax','zeroBSCRM_notifyme_get_notifications_ajax');
add_action( 'wp_ajax_notifyme_get_notifications_ajax', 'zeroBSCRM_notifyme_get_notifications_ajax' );
function zeroBSCRM_notifyme_get_notifications_ajax(){
      global $wpdb;
      check_ajax_referer( 'notifyme_nonce', 'security' );
      $cid = get_current_user_id();
      $now = date("U");
      $notify_table = $wpdb->prefix . "zbs_notifications";

       // * WH NOTE:
          // ownership needed DBv2+
          // no need to update these (as of yet) - can't move teams etc.
          //'zbs_site' => zeroBSCRM_installSite(),
          //'zbs_team' => zeroBSCRM_installTeam(),
          //'zbs_owner' => $owner,

      $sql = $wpdb->prepare("SELECT * FROM $notify_table WHERE zbsnotify_recipient_id = %d AND zbsnotify_unread = %d", $cid, 0);
      $notifes = $wpdb->get_results($sql);
      $res['count'] = 0;

      $res['notifications'] = $notifes;
      if(!$notifes){
        $res['count'] = 0;
      }else{
        $res['message'] = "Passed AJAX nonce check";
        $res['notifytitle'] = 'This is the title';
        $res['notifybody'] = 'This is the body';
        $res['count'] = count($res['notifications']);
      }
      echo json_encode($res,true);
      die();
}



#} no need to send email from this. Only want CRM wide (i.e. from WP admin, bell icon in new UI top menu)
/*
function notifyme_sendemail($recipient_id, $sender_id, $type, $reference_id){


    $notification_meta = get_user_meta($recipient_id, 'notifyme_user_settings', true);
    if($notification_meta == ''){
          $notification_meta['email_comment'] = 1;
          $notification_meta['email_upvote'] = 1;
          $notification_meta['email_follow'] = 1;
          $notification_meta['email_follows_post'] = 1;    
    }

    #} NOTE - LONGSTANDING ANNOYINB BUG HERE IN NOTIFY ME IN MY $message where it's not sending links, it's sending the actual
    #} HTML, i.e. <a href = ...   will fix as moving into Jetpack CRM, and then possibly fix it in Notify Me

    $site_title = get_bloginfo( 'name' );
    $recipitent = get_user_by('id' , $recipient_id);
    $sender     = get_user_by('id' , $sender_id);
    $sender_url = get_author_posts_url($sender_id);
    $to = $recipitent->user_email;
    switch ($type) {
    case 'post.vote':
        if($notification_meta['email_upvote'] == 1){
          $post_title = get_the_title($reference_id); //reference_id is the post ID.
          $subject = __($site_title . ": " . $post_title . " has been upvoted", 'zero-bs-crm');
          $post_link = get_permalink($reference_id);
          $message = __("View the post here <a href='". esc_url($post_link) ."'>" . $post_title . "</a>", 'zero-bs-crm');
          wp_mail( $to, $subject, $message);
          write_log('to ' . $to . ' subject ' . $subject . ' message ' . $message);
        }
        break;
    case 'comment.new':
        if($notification_meta['email_comment'] == 1){        
          $post_title = get_the_title($reference_id); //reference_id is the post ID.
          $subject = __($site_title .  ": " . $post_title . " has received a comment", 'zero-bs-crm');
          $post_link = get_permalink($reference_id);
          $message = __("View the post here <a href='". esc_url($post_link) ."'>" . $post_title . "</a>", 'zero-bs-crm');
          wp_mail( $to, $subject, $message);
          write_log('comment new to ' . $to . ' subject ' . $subject . ' message ' . $message);
        }
        break;
    case 'comment.reply':
        if($notification_meta['email_comment'] == 1){
          $post_title = get_the_title($reference_id); //reference_id is the post ID.
          $subject = __($site_title .  ": " . $post_title . " has received a comment", 'zero-bs-crm');
          $post_link = get_permalink($reference_id);
          $message = __("View the post here <a href='". esc_url($post_link) ."'>" . $post_title . "</a>", 'zero-bs-crm');
          wp_mail( $to, $subject, $message);
          write_log('comment reply to ' . $to . ' subject ' . $subject . ' message ' . $message);
        }
        break;
    case 'user.follow':
        if($notification_meta['email_follow'] == 1){
          $subject = __($site_title .  ": " . ucfirst($sender->user_nicename). " has started tof follow you", 'zero-bs-crm');
          $message = __("View them here <a href='". esc_url($sender_url) ."'>" . ucfirst($sender->user_nicename) . "</a>", 'zero-bs-crm');
          wp_mail( $to, $subject, $message);
          write_log('user follow' . $to . ' subject ' . $subject . ' message ' . $message);
        }
        break;
    case 'follower.post':
        if($notification_meta['email_follows_post'] == 1){
          $post_title = get_the_title($reference_id); //reference_id is the post ID.
          $subject = __($site_title .  ": " . ucfirst($sender->user_nicename) . " has posted" . $post_tile, 'zero-bs-crm');
          $post_link = get_permalink($reference_id);
          $message = __("View the post here <a href='". esc_url($post_link) ."'>" . $post_title . "</a>", 'zero-bs-crm');
          wp_mail( $to, $subject, $message);
          write_log('follower post to ' . $to . ' subject ' . $subject . ' message ' . $message);
        }
        break;
    default:
    }
}
*/
