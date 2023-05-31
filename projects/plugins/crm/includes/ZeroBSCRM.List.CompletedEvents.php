<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.19
 *
 * Copyright 2020 Automattic
 *
 * Date: 18/10/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */





if ( ! class_exists( 'WP_List_Table' ) ) {
    require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );
}


class zeroBSCRM_Events_List_Complete extends WP_List_Table {

	/** Class constructor */
	public function __construct() {
		parent::__construct(
			array(
				'singular' => __( 'Task', 'zero-bs-crm' ),
				'plural'   => __( 'Tasks', 'zero-bs-crm' ),
				'ajax'     => false,
			)
		);
	}

    /**
     * Retrieve bookings data from the database
     *
     * @param int $per_page
     * @param int $page_number
     *
     * @return mixed
     */
    public static function get_transactions( $per_page = 10, $page_number = 1 ) {

        #} ;} - this wires up to the retrieve func
        return zeroBS_getTransactions(true,$per_page,$page_number,true); #} True for full customer deets

    }


    /**
     * Delete a booking
     *
     * @param int $id booking ID
     */
    public static function delete_transaction( $id ) {

        #} Brutal!
        #wp_delete_post($id);

    }


    /**
     * Returns the count of records in the database.
     *
     * @return null|string
     */
    public static function record_count() {
      
        #} Just uses wp_count_posts
        return zeroBS_getTransactionCount();

    }


    /** Text displayed when no booking data is available */
    public function no_items() {
        esc_html_e( 'No Transactions avaliable.', 'zero-bs-crm' );
    }


    /**
     * Render a column when no column specific method exist.
     *
     * @param array $item
     * @param string $column_name
     *
     * @return mixed
     */
    public function column_default( $item, $column_name ) {
        switch ( $column_name ) {
            #case 'address':
            #case 'city':
            #    return $item[ $column_name ];
            default:
                return print_r( $item, true ); //Show the whole array for troubleshooting purposes
        }
    }

    /**
     * Render the bulk edit checkbox
     *
     * @param array $item
     *
     * @return string
     */
    function column_cb( $item ) {
        return sprintf(
            '<input type="checkbox" name="bulk-delete[]" value="%s" />', $item['id']
        );
    }

    /**
     * Render the booking name column
     *
     * @param array $item
     *
     * @return string
     */
    function column_customername( $item ) {
        
        $colStr = '';
        if (isset($item['customer']) && isset($item['customer'])){
            $colStr = '<strong>'.zeroBS_customerName($item['customerid'],$item['customer'],false,false).'</strong><br />';
            if (isset($item['customer']['addr1']) && isset($item['customer']['city']))
                #$colStr .= '<div>'.$item['customer']['addr1'].', '.$item['customer']['city'].'</div>';
                $colStr .= '<div>'.zeroBS_customerAddr($item['customer']['id'],$item['customer'],'short',', ').'</div>';
        }
        #$colStr .= '(<span>ID:'.$item['id'].'</span>)';

        return $colStr;

    }


    /**
     * Render the pickuptime column
     *
     * @param array $item
     *
     * @return string
     */
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


        #} Following was bugging out for me... switch for now

        #if (isset($item['meta']) && isset($item['meta']['date'])) $d = $item['meta']['date'];

        #return date("d/m/y",strtotime($d));

        return $d;

    }



    /**
     * Method for name column
     *
     * @param array $item an array of DB data
     *
     * @return string
     */
    function column_name( $item ) {

        $delete_nonce = wp_create_nonce( 'tbp_delete_customer' );

        $title = '<strong>' . $item['name'] . '</strong>';

        $actions = array(
            'delete' => sprintf( '<a href="?page=%s&action=%s&booking=%s&_wpnonce=%s">Delete</a>', esc_attr( sanitize_text_field($_REQUEST['page']) ), 'delete', absint( $item['id'] ), $delete_nonce )
        );

        return $title . $this->row_actions( $actions );
    }


    /**
     *  Associative array of columns
     *
     * @return array
     */
    function get_columns() {
        $columns = array(
            #'cb'      => '<input type="checkbox" />',
            'transactionno'    => __( 'Transaction No#', 'zero-bs-crm' ),
            'val' => __( 'Value', 'zero-bs-crm' ),
            'date' => __( 'Date', 'zero-bs-crm' )
        );

        return $columns;
    }


    /**
     * Columns to make sortable.
     *
     * @return array
     */
    public function get_sortable_columns() {
        $sortable_columns = array(
            'transactionno' => array( 'transactionno', true ),
            'val' => array( 'val', true ),
            'date' => array( 'date', false )
        );

        return $sortable_columns;
    }

    /**
     * Returns an associative array containing the bulk action
     *
     * @return array
     */
    public function get_bulk_actions() {
        $actions = array(
            #'bulk-delete' => 'Delete'
        );

        return $actions;
    }


    /**
     * Handles data query and filter, sorting, and pagination.
     */
    public function prepare_items() {

        #} had to switch this:
        #$this->_column_headers = $this->get_column_info();

        #} For this... 
        $columns = $this->get_columns();
        $hidden = array();
        $sortable = $this->get_sortable_columns();
        $this->_column_headers = array($columns, $hidden, $sortable);
        #} (Because get_column_info is doing something to do with 'screen' that I cba to explore)

        /** Process bulk action */
        $this->process_bulk_action();

        $per_page     = $this->get_items_per_page( 'events_per_page', 10 );
        $current_page = $this->get_pagenum();
        $total_items  = self::record_count();

        $this->set_pagination_args( array(
            'total_items' => $total_items, //WE have to calculate the total number of items
            'per_page'    => $per_page //WE have to determine how many items to show on a page
        ) );

        $this->items = self::get_transactions( $per_page, $current_page );

    }

    public function process_bulk_action() {

        /*
        //Detect when a bulk action is being triggered...
        if ( 'delete' === $this->current_action() ) {

            // In our file that handles the request, verify the nonce.
            $nonce = esc_attr( $_REQUEST['_wpnonce'] );

            if ( ! wp_verify_nonce( $nonce, 'tbp_delete_customer' ) ) {
                die( '!' ); #} Go get a life script kiddies
            }
            else {
                self::delete_customer( absint( $_GET['booking'] ) );

                wp_redirect( esc_url( add_query_arg() ) );
                exit;
            }

        }

        // If the delete bulk action is triggered
        if ( ( isset( $_POST['action'] ) && $_POST['action'] == 'bulk-delete' )
             || ( isset( $_POST['action2'] ) && $_POST['action2'] == 'bulk-delete' )
        ) {

            $delete_ids = esc_sql( $_POST['bulk-delete'] );

            // loop over the array of record IDs and delete them
            foreach ( $delete_ids as $id ) {
                self::delete_customer( $id );

            }

            wp_redirect( esc_url( add_query_arg() ) );
            exit;
        }

        */
    }

}





function zeroBSCRM_render_eventslistcomplete_page(){

    $option = 'per_page';
    $args   = array(
		'label'   => 'Completed Tasks',
        'default' => 10,
        'option'  => 'events_per_page'
    );

    add_screen_option( $option, $args );
    
    $transactionListTable = new zeroBSCRM_Events_List();
        
        #} Load Library?
        $normalLoad = true;
        
        
        
        if ($normalLoad){

            #} Updated this to work with 4.5.2 wp list setup :) 
            #} https://core.trac.wordpress.org/browser/tags/4.5.2/src/wp-admin/edit.php
            #} https://core.trac.wordpress.org/browser/tags/4.5.2/src//wp-admin/includes/class-wp-list-table.php#L0


            /*
            get_current_screen()->set_screen_reader_content( array(
                     'heading_views'      => $post_type_object->labels->filter_items_list,
                     'heading_pagination' => $post_type_object->labels->items_list_navigation,
                     'heading_list'       => $post_type_object->labels->items_list,
             ) );
            add_screen_option( 'per_page', array( 'default' => 20, 'option' => 'edit_' . $post_type . '_per_page' ) );
            */

            #} Prep items
            $transactionListTable->prepare_items();

            ?><div class="wrap">
                <h1>Events<?php 
                    #} Add new?
                    if ( zeroBSCRM_permsEvents() ) {
                        echo ' <a href="' . jpcrm_esc_link( 'create', -1, ZBS_TYPE_EVENT ) . '" class="page-title-action">' . esc_html( 'Add New' ) . '</a>';
                    }
                ?></h1>
                <?php 

                   /* Ignore search for this for MVP
                    #} If searching, show:
                    if (isset($_POST['s']) && !empty($_POST['s'])) {

                        $searchTerm = sanitize_text_field($_POST['s']);

                        echo '<div id="zbsSearchTerm">Searching: "'.$searchTerm.'" <button type="button" class="button" id="clearSearch">Cancel Search</button></div>';

                    } */

                $transactionListTable->views(); ?>


                <?php
                    global $wpdb;
                    $query = "SELECT * FROM $wpdb->posts WHERE post_type = 'zerobs_event' AND post_status = 'publish'";
                    $results = $wpdb->get_results($query);
                    $event = array();
                    $i=0;
                    foreach($results as $result){

              

                        $zbsEventMeta = get_post_meta($result->ID, 'zbs_event_meta', true);
                        $zbsEventActions = get_post_meta($result->ID, 'zbs_event_actions', true);

                        if($zbsEventActions['complete'] == 1){
                            $event[$i]['title'] = $result->post_title;
                            $event[$i]['start'] = $zbsEventMeta['from'];
                            $event[$i]['end'] =  $zbsEventMeta['to'];
                            $event[$i]['url'] = admin_url('post.php?post='.$result->ID.'&action=edit');
                            $i++;
                        }
                    }
                    $event_json = json_encode($event);
                ?>




<script>
    jQuery(function() {
        
        jQuery('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek, agendaDay, listMonth'
            },
            defaultDate: '<?php echo esc_html( date('Y-m-d') ); ?>',
            navLinks: true, // can click day/week names to navigate views
            editable: true,
            eventLimit: true, // allow "more" link when too many events
            events: <?php echo $event_json; ?>
        });
        
    });

</script>
<style>
    #calendar {
        max-width: 900px;
        margin: 0 auto;
    }
    .zerobs_event_page_manage-events-completed{
        background: white;
    }
</style>


<div id='calendar'></div>


                <br class="clear">
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
