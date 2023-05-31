<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2+
 *
 * Copyright 2020 Automattic
 *
 * Date: 22/12/2016
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


class zeroBSCRM_QuoteTemplate_List extends WP_List_Table {

    /** Class constructor */
    public function __construct() {

        parent::__construct( array(
            'singular' => __( 'Quote Template', 'zero-bs-crm' ), //singular name of the listed records
            'plural'   => __( 'Quote Templates', 'zero-bs-crm' ), //plural name of the listed records
            'ajax'     => false //does this table support ajax?
        ) );

    }


    /**
     * Retrieve bookings data from the database
     *
     * @param int $per_page
     * @param int $page_number
     *
     * @return mixed
     */
    public static function get_quotetemplates( $per_page = 10, $page_number = 1 ) {

        #} ;} - this wires up to the retrieve func
        return zeroBS_getQuoteTemplates(true,$per_page,$page_number);

    }


    /**
     * Delete a booking
     *
     * @param int $id booking ID
     */
    public static function delete_quotetemplate( $id ) {

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
        return zeroBS_getQuoteTemplateCount();

    }


    /** Text displayed when no booking data is available */
    public function no_items() {
        esc_html_e( 'No Quote Templates avaliable.', 'zero-bs-crm' );
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
    function column_templatename( $item ) {
        
        $colStr = '';
        if (isset($item['name'])){
            $colStr = '<a href="post.php?post='.$item['id'].'&action=edit"><strong>'.$item['name'].'</strong></a>';
            # created by? used x times?
        }
        $colStr .= ' (<span>#'.$item['id'].'</span>)';

        #} if default
        if (isset($item['zbsdefault']) && $item['zbsdefault'] == 1){

            $colStr .= '<br />(Default Template)';

        }

        return $colStr;

    }


    /**
     * Render the pickuptime column
     *
     * @param array $item
     *
     * @return string
     */
    function column_quotetemplateno( $item ) {
        
        return '<a href="post.php?post='.$item['id'].'&action=edit">'.$item['id'].'</a>';

    }

    function column_date( $item ) {

        $d = $item['created'];

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
    /*function column_name( $item ) {

        $delete_nonce = wp_create_nonce( 'tbp_delete_customer' );

        $title = '<strong>' . $item['name'] . '</strong>';

        $actions = array(
            'delete' => sprintf( '<a href="?page=%s&action=%s&booking=%s&_wpnonce=%s">Delete</a>', esc_attr( sanitize_text_field( $_REQUEST['page'] ) ), 'delete', absint( $item['id'] ), $delete_nonce )
        );

        return $title . $this->row_actions( $actions );
    }
    */

    /**
     *  Associative array of columns
     *
     * @return array
     */
    function get_columns() {
        $columns = array(
            #'cb'      => '<input type="checkbox" />',
            #'quotetemplateno'    => __( 'Template ID', 'zero-bs-crm' ),
            'templatename' => __( 'Template', 'zero-bs-crm' ),
            'date' => __( 'Created', 'zero-bs-crm' )
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
            #'quotetemplateno' => array( 'quotetemplateno', true ),
            'templatename' => array( 'templatename', true ),
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

        $per_page     = $this->get_items_per_page( 'quotetemplates_per_page', 10 );
        $current_page = $this->get_pagenum();
        $total_items  = self::record_count();

        $this->set_pagination_args( array(
            'total_items' => $total_items, //WE have to calculate the total number of items
            'per_page'    => $per_page //WE have to determine how many items to show on a page
        ) );

        $this->items = self::get_quotetemplates( $per_page, $current_page );

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





function zeroBSCRM_render_quotetemplateslist_page(){

    $option = 'per_page';
    $args   = array(
        'label'   => 'Quote Templates',
        'default' => 10,
        'option'  => 'quotetemplates_per_page'
    );

    add_screen_option( $option, $args );
    
    $quotetemplateListTable = new zeroBSCRM_QuoteTemplate_List();
        
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
            $quotetemplateListTable->prepare_items();

            ?>


            <div class="wrap">

                <?php 

                   /* Ignore search for this for MVP
                    #} If searching, show:
                    if (isset($_POST['s']) && !empty($_POST['s'])) {

                        $searchTerm = sanitize_text_field($_POST['s']);

                        echo '<div id="zbsSearchTerm">Searching: "'.$searchTerm.'" <button type="button" class="button" id="clearSearch">Cancel Search</button></div>';

                    } */

                $quotetemplateListTable->views(); ?>
                <?php /*
                #} clash in code here, will be addressed when properly re-write these list tables
                <form id="posts-filter" method="get">*/ ?>
                <form method="post">
                    <?php /* Ignore search for this for MVP$customerListTable->search_box('Search Customers','customersearch'); */ ?>
                    <?php $quotetemplateListTable->display(); ?>
                </form>
                <br class="clear">
            </div>

                <script type="text/javascript">
                    jQuery(function(){


                    });
                </script>
                
            <?php
    
        }
}
