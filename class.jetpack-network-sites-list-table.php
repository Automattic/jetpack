<?php

if( ! class_exists( 'WP_List_Table' ) ) {
    require_once( ABSPATH . 'wp-admin/includes/class-wp-list-table.php' );
}

class Jetpack_Network_Sites_List_Table extends WP_List_Table {


	public function get_columns() {
		// site name, status, username connected under
		$columns = array(
			'cb'        => '<input type="checkbox" />',
			'blogname' => __( 'Site Name', 'jetpack'  ),
			'blog_path' => __( 'Path', 'jetpack' ),
			'connected' => __( 'Connected', 'jetpack' ),
		);

		return $columns;
	}

	public function prepare_items() {
		$jpms = Jetpack_Network::init();

		// Deal with bulk actions if any were requested by the user
		$this->process_bulk_action();

		// Get sites
		$sites = $jpms->wp_get_sites( array(
			'exclude_blogs' => array( 1 ),
			'archived'      => false,
		) );

		// Setup pagination
		$per_page = 25;
		$current_page = $this->get_pagenum();
		$total_items = count( $sites );
		$sites = array_slice( $sites, ( ( $current_page-1 ) * $per_page ), $per_page );
		$this->set_pagination_args( array(
			'total_items' => $total_items,
			'per_page'    => $per_page
		) );

		$columns = $this->get_columns();
		$hidden = array();
		$sortable = array();
		$this->_column_headers = array( $columns, $hidden, $sortable );
		$this->items = $sites;
	}

	public function column_blogname( $item ) {
		// http://jpms/wp-admin/network/site-info.php?id=1
		switch_to_blog( $item->blog_id );
		$jp_url = admin_url( 'admin.php?page=jetpack' );
		restore_current_blog();

		$actions = array(
            		'edit'      	=> '<a href="' . network_admin_url( 'site-info.php?id=' . $item->blog_id )  .  '">' . __( 'Edit', 'jetpack' ) . '</a>',
        		'dashboard'	=> '<a href="' . get_admin_url( $item->blog_id, '', 'admin' ) . '">Dashboard</a>',
			'view'		=> '<a href="' . get_site_url( $item->blog_id, '', 'admin' ) . '">View</a>',
			'jetpack-' . $item->blog_id	=> '<a href="' . $jp_url . '">Jetpack</a>',
		);

  		return sprintf('%1$s %2$s', '<strong>' . get_blog_option( $item->blog_id, 'blogname' ) . '</strong>', $this->row_actions($actions) );
	}

	public function column_blog_path( $item ) {
		return
                         '<a href="' .
                         get_site_url( $item->blog_id, '', 'admin' ) .
                         '">' .
                         str_replace( array( 'http://', 'https://' ), '', get_site_url( $item->blog_id, '', 'admin' ) ) .
                         '</a>';
	}

	public function column_connected( $item ) {
		$jpms = Jetpack_Network::init();
		$jp = Jetpack::init();

		switch_to_blog( $item->blog_id );
		if( $jp->is_active() ) {
		   // Build url for disconnecting
		    $url = $jpms->get_url( array(
			'name'	    => 'subsitedisconnect',
			'site_id'   => $item->blog_id,

		    ) );
		    restore_current_blog();
		    return '<a href="' . $url . '">Disconnect</a>';
		}
		restore_current_blog();

		// Build URL for connecting
		$url = $jpms->get_url( array(
		    'name'	=> 'subsiteregister',
		    'site_id'	=> $item->blog_id,
		) );
		return '<a href="' . $url . '">Connect</a>';
	}

	public function get_bulk_actions() {
	    $actions = array(
		'connect'	=> 'Connect',
		'disconnect'	=> 'Disconnect'
	    );

	    return $actions;
	}

	function column_cb($item) {
        	return sprintf(
            		'<input type="checkbox" name="bulk[]" value="%s" />', $item->blog_id
        	);
    	}

	public function process_bulk_action() {
		if( !isset( $_POST['bulk'] ) || empty ( $_POST['bulk'] ) )
			return; // Thou shall not pass! There is nothing to do


		$jpms = Jetpack_Network::init();

		$action = $this->current_action();
		switch ( $action ) {

            		case 'connect':
                		foreach( $_POST['bulk'] as $k => $site ) {
							$jpms->do_subsiteregister( $site );
						}
				break;
            		case 'disconnect':
                		foreach( $_POST['bulk'] as $k => $site ) {
							$jpms->do_subsitedisconnect( $site );
						}
				break;
		}
	}
} // end h
