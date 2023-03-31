<?php /* !
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.19
 *
 * Copyright 2020 Automattic
 *
 * Date: 18/10/16
 */



    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;






if ( ! class_exists( 'WP_List_Table' ) ) {
    require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );
}


class zeroBSCRM_Events_List extends WP_List_Table {

    
    public function __construct() {

        parent::__construct( array(
            'singular' => __( 'Task', 'zero-bs-crm' ),             'plural'   => __( 'Tasks', 'zero-bs-crm' ),             'ajax'     => false         ) );

    }


    
    public static function get_transactions( $per_page = 10, $page_number = 1 ) {

                return zeroBS_getTransactions(true,$per_page,$page_number,true); 
    }


    
    public static function delete_transaction( $id ) {

                
    }


    
    public static function record_count() {
      
                return zeroBS_getTransactionCount();

    }


    
    public function no_items() {
        esc_html_e( 'No Tasks avaliable.', 'zero-bs-crm' );
    }


    
    public function column_default( $item, $column_name ) {
        switch ( $column_name ) {
                                                default:
                return print_r( $item, true );         }
    }

    
    function column_cb( $item ) {
        return sprintf(
            '<input type="checkbox" name="bulk-delete[]" value="%s" />', $item['id']
        );
    }

    
    function column_customername( $item ) {
        
        $colStr = '';
        if (isset($item['customer']) && isset($item['customer'])){
            $colStr = '<strong>'.zeroBS_customerName($item['customerid'],$item['customer'],false,false).'</strong><br />';
            if (isset($item['customer']['addr1']) && isset($item['customer']['city']))
                                $colStr .= '<div>'.zeroBS_customerAddr($item['customer']['id'],$item['customer'],'short',', ').'</div>';
        }
        
        return $colStr;

    }


    
    function column_transactionno( $item ) {
        
        $qc = '';

        if (isset($item['meta']) && isset($item['meta']['orderid'])) $qc = $item['meta']['orderid'];
        return '<a href="post.php?post='.$item['id'].'&action=edit">'.$qc.'</a>';

    }
    function column_val( $item ) {
        
        $qc = 0;

        if (isset($item['meta']) && isset($item['meta']['total'])) $qc = $item['meta']['total'];

        return zeroBSCRM_getCurrencyChr().zeroBSCRM_prettifyLongInts($qc);

    }
    function column_date( $item ) {


        $d = new DateTime($item['created']);
        $d = $d->format(zeroBSCRM_getDateFormat());


        
        
        
        return $d;

    }



    
    function column_name( $item ) {

        $delete_nonce = wp_create_nonce( 'tbp_delete_customer' );

        $title = '<strong>' . $item['name'] . '</strong>';

        $actions = array(
            'delete' => sprintf( '<a href="?page=%s&action=%s&booking=%s&_wpnonce=%s">Delete</a>', esc_attr( sanitize_text_field( $_REQUEST['page'] ) ), 'delete', absint( $item['id'] ), $delete_nonce )
        );

        return $title . $this->row_actions( $actions );
    }


    
    function get_columns() {
        $columns = array(
                        'transactionno'    => __( 'Transaction No#', 'zero-bs-crm' ),
            'val' => __( 'Value', 'zero-bs-crm' ),
            'date' => __( 'Date', 'zero-bs-crm' )
        );

        return $columns;
    }


    
    public function get_sortable_columns() {
        $sortable_columns = array(
            'transactionno' => array( 'transactionno', true ),
            'val' => array( 'val', true ),
            'date' => array( 'date', false )
        );

        return $sortable_columns;
    }

    
    public function get_bulk_actions() {
        $actions = array(
                    );

        return $actions;
    }


    
    public function prepare_items() {

                
                $columns = $this->get_columns();
        $hidden = array();
        $sortable = $this->get_sortable_columns();
        $this->_column_headers = array($columns, $hidden, $sortable);
        
        
        $this->process_bulk_action();

        $per_page     = $this->get_items_per_page( 'events_per_page', 10 );
        $current_page = $this->get_pagenum();
        $total_items  = self::record_count();

        $this->set_pagination_args( array(
            'total_items' => $total_items,             'per_page'    => $per_page         ) );

        $this->items = self::get_transactions( $per_page, $current_page );

    }

    public function process_bulk_action() {

        
    }

}





function zeroBSCRM_render_eventscalendar_page(){

    global $zbs;

    $option = 'per_page';
    $args   = array(
        'label'   => __('Tasks',"zero-bs-crm"),
        'default' => 10,
        'option'  => 'events_per_page'
    );

    add_screen_option( $option, $args );
                  
    $normalLoad = true;

    $fullCalendarView = 'month';

    $currentEventUserID = false; if (isset($_GET['zbsowner']) && !empty($_GET['zbsowner'])) $currentEventUserID = (int)sanitize_text_field($_GET['zbsowner']);
    $zbsEventsUsers = zeroBS_getPossibleCustomerOwners();
    $showEventsUsers = false;

    if (count($zbsEventsUsers) > 0 && zeroBSCRM_isZBSAdminOrAdmin()) {
        $showEventsUsers = true;
    } else {
        $taskOwnershipOn = zeroBSCRM_getSetting('taskownership');
        if ($taskOwnershipOn == "1") {
            $currentEventUserID = get_current_user_id();
        }
    }

    if(isset($_GET['zbs_crm_team'])){
        $currentEventUserID = get_current_user_id();
        $fullCalendarView = 'listMonth';
    }
    
    if ($normalLoad){ ?>

<div class="wrap">

    <div class="ui segment main-task-view">

            <?php if ($showEventsUsers){ ?><div style="clear:both;height: 0px;"></div><?php } ?>

            <?php if ($zbs->isDAL3()){

                    // retrieve via DAL, just getting them ALL (pretty gross, but for now, at least more performant.)
                    $args = array(

                        'sortByField'   => 'ID',
                        'sortOrder'     => 'DESC',
                        'page'          => 0,
                        'perPage'       => 50000,
                        
                    );

                    // belonging to specific user
                    if (!empty($currentEventUserID) && $currentEventUserID > 0) {
                        $args['ownedBy'] = $currentEventUserID;
                        //$args['ignoreowner'] = false;
                    }
                        
                    $events = $zbs->DAL->events->getEvents($args);

                    // for now we cycle through and form into same object as MS wrote this for,
                    // v3.0 + to rewrite display engine to use proper DAL objs on fly. 
                    if (is_array($events) && count($events) > 0){

                        $avatar_args = array(
                            'size' => 24
                        );

                        $endEvents = array();
                        foreach ($events as $event){

                            if (isset($event['start']) && $event['start'] > 0 
                                && 
                                isset($event['end']) && $event['end'] > 0){

                                $newEvent = array(
                                    'title' => zeroBSCRM_textExpose($event['title']),
                                    'start' => zeroBSCRM_date_forceEN($event['start']),
                                    'end' => zeroBSCRM_date_forceEN($event['end']),
                                    'url' => jpcrm_esc_link('edit',$event['id'],ZBS_TYPE_EVENT),
                                    'owner' => $event['owner'],
                                    'avatar' => '', // default
                                    'showonCal' => 'hide', // default
                                    'complete' => "-1"
                                );

                                // avatar?
                                if (isset($event['owner']) && $event['owner'] > 0) $newEvent['avatar'] = get_avatar_url($event['owner'], $avatar_args);

                                // show on cal
                                if (isset($event['show_on_cal']) && $event['show_on_cal'] == 1) $newEvent['showonCal'] = 'show';

                                // complete?
                                if (isset($event['complete']) && $event['complete'] == 1) $newEvent['complete'] = 1;

                                // add it
                                $endEvents[] = $newEvent;

                            }

                        }

                        // pass it on and clean up
                        $events = $endEvents; unset($endEvents,$newEvent);

                    } else $events = array();

                    // build json
                    $event_json = json_encode($events);

                } else {

                        global $wpdb;
                        $query = "SELECT * FROM $wpdb->posts WHERE post_type = 'zerobs_event' AND post_status='publish'";

                        if (!empty($currentEventUserID) && $currentEventUserID > 0){
                                
                        $query = "SELECT * FROM $wpdb->posts";
                            $query .= " LEFT JOIN $wpdb->postmeta ON ($wpdb->posts.ID = $wpdb->postmeta.post_id AND $wpdb->postmeta.meta_key = 'zbs_owner')";
                            $query .= " WHERE $wpdb->posts.post_type = 'zerobs_event' AND $wpdb->postmeta.meta_value = ".(int)$currentEventUserID;

                        }
                        $results = $wpdb->get_results($query);
                        $event = array();
                        $i=0;
                        $avatar_args = array(
                            'size' => 24
                        );
                        foreach($results as $result){

                            $zbsEventMeta = get_post_meta($result->ID, 'zbs_event_meta', true);
                            $zbsOwner = zeroBS_getOwner($result->ID);

                            $zbsEventActions = get_post_meta($result->ID, 'zbs_event_actions', true);

      
    							if(isset($zbsEventMeta['from']) && isset($zbsEventMeta['to']) && $zbsEventMeta['from'] != '' && $zbsEventMeta['to'] != ''){
                               
                                if(!array_key_exists('title', $zbsEventMeta)){
                                    $zbsEventMeta['title'] = esc_html($result->post_title);
                                }
                                
                                $event[$i]['title'] = $zbsEventMeta['title'];
                                $event[$i]['start'] = $zbsEventMeta['from'];
                                $event[$i]['end'] =  $zbsEventMeta['to'];
                                $event[$i]['url'] = admin_url('post.php?post='.$result->ID.'&action=edit');
                                $event[$i]['owner'] = $zbsOwner['ID'];

                                if($zbsOwner['ID'] == -1){
                                    $event[$i]['avatar'] = '';
                                }else{
                                    $event[$i]['avatar'] = get_avatar_url($zbsOwner['ID'], $avatar_args);
                                }
                                //if showoncal is not set, then show it on cal (backwards compat)
                                if(!array_key_exists('showoncal', $zbsEventMeta)){
                                    $zbsEventMeta['showoncal'] = 'on';
                                }


                 

                                if($zbsEventMeta['showoncal']){
                                    $event[$i]['showonCal'] = 'show';
                                }else{
                                    $event[$i]['showonCal'] = 'hide';
                                } 
                                

                                $event[$i]['complete'] =  $zbsEventActions['complete'];


                                $i++;
    							}
                            
                        }
                        $event_json = json_encode($event);

                    }

                ?>


                <script>
                <?php /* debug
                var eventDebug = <?php echo $event_json; ?>;
                console.log('events:',eventDebug); */ ?>

                    jQuery(function() {
                        
                        jQuery('#calendar').fullCalendar({
                            header: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'year, month,agendaWeek, agendaDay,listMonth'
                            },
                            defaultDate: '<?php echo esc_html( date('Y-m-d') ); ?>',
                            defaultView: '<?php echo esc_html( $fullCalendarView ); ?>',
                            navLinks: true, // can click day/week names to navigate views
                       //     editable: true,
                            eventLimit: true, // allow "more" link when too many events
                            weekends: true,
                            disableDragging: true,
                            events: <?php echo $event_json; ?>,
                            firstDay: <?php echo (int)get_option('start_of_week',0) ?>
                        });
                        
                    });

                </script>



                <div id='calendar'></div>
                <br class="clear">
                </div>
                </div>


                <script type="text/javascript">
                    jQuery(function(){

                        jQuery('#clearSearch').on( 'click', function(){

                            jQuery('#customersearch-search-input').val('');
                            jQuery('#search-submit').trigger( 'click' );

                        });

                    });
                </script>
                
            <?php
    
        }
}
