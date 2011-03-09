<?php

include_once dirname( __FILE__ ).'/sharing-sources.php';

define( 'WP_SHARING_PLUGIN_VERSION', '0.3' );

class Sharing_Service {
	private $global = false;

	/**
	 * Gets a generic list of all services, without any config
	 */
	public function get_all_services_blog() {
		$options  = get_option( 'sharing-options' );

		$all = $this->get_all_services();
		$services = array();
		
		foreach ( $all AS $id => $name ) {
			if ( isset( $all[$id] ) ) {
				$config = array();
				
				// Pre-load custom modules otherwise they won't know who they are
				if ( substr( $id, 0, 7 ) == 'custom-' && is_array( $options[$id] ) )
					$config = $options[$id];

				$services[$id] = new $all[$id]( $id, $config );
			}
		}

		return $services;
	}
	
	/**
	 * Gets a list of all available service names and classes
	 */
	private function get_all_services() {
		// Default services
		$services = array(
			'email'       => 'Share_Email',
			'print'       => 'Share_Print',
			'digg'        => 'Share_Digg',
			'facebook'    => 'Share_Facebook',
			'reddit'      => 'Share_Reddit',
			'stumbleupon' => 'Share_Stumbleupon',
			'twitter'     => 'Share_Twitter',
			'press-this'	=> 'Share_PressThis',
		);
		
		// Add any custom services in
		$options = $this->get_global_options();
		foreach ( (array)$options['custom'] AS $custom_id ) {
			$services[$custom_id] = 'Share_Custom';
		}
		
		return apply_filters( 'sharing_services', $services );
	}
	
	public function new_service( $label, $url, $icon ) {
		// Validate
		$label = trim( wp_html_excerpt( wp_kses( $label, array() ), 30 ) );
		$url   = trim( esc_url_raw( $url ) );
		$icon  = trim( esc_url_raw( $icon ) );
		
		if ( $label && $url && $icon ) {
			$options = get_option( 'sharing-options' );
			if ( !is_array( $options ) )
				$options = array();
			
			$service_id = 'custom-'.time();
			
			// Add a new custom service
			$options['global']['custom'][] = $service_id;

			update_option( 'sharing-options', $options );

			// Create a custom service and set the options for it
			$service = new Share_Custom( $service_id, array( 'name' => $label, 'url' => $url, 'icon' => $icon ) );
			$this->set_service( $service_id, $service );

			// Return the service
			return $service;
		}
		
		return false;
	}
	
	public function delete_service( $service_id ) {
		$service = $this->get_service( $service_id );

		if ( $service ) {
			$options = get_option( 'sharing-options' );
			if ( isset( $options[$service_id] ) )
				unset( $options[$service_id] );
				
			$key = array_search( $service_id, $options['global']['custom'] );
			if ( $key !== false )
				unset( $options['global']['custom'][$key] );

			update_option( 'sharing-options', $options );				
			return true;
		}
		
		return false;
	}
	
	public function set_blog_services( array $visible, array $hidden ) {
		$services =  $this->get_all_services();
		// Validate the services
		$available = array_keys( $services );

		// Only allow services that we have defined
		$hidden  = array_intersect( $hidden, $available );
		$visible = array_intersect( $visible, $available );

		// Ensure we don't have the same ones in hidden and visible
		$hidden = array_diff( $hidden, $visible );
		
		do_action( 'sharing_get_services_state', array( 
			'services'			=> $services,
			'available' 		=> $available, 
			'hidden' 			=> $hidden, 
			'visible' 			=> $visible, 
			'currently_enabled' => $this->get_blog_services()
		) );

		update_option( 'sharing-services', array( 'visible' => $visible, 'hidden' => $hidden ) );
	}

	public function get_blog_services() {
		$options  = get_option( 'sharing-options' );
		$enabled  = get_option( 'sharing-services' );
		$services = $this->get_all_services();

		if ( !is_array( $options ) )
			$options = array( 'global' => $this->get_global_options() );

		$global = $options['global'];

		// Default services
		if ( !is_array( $enabled ) ) {
			$enabled = array(
				'visible' => array(),
				'hidden' => array()
			);

			$enabled = apply_filters( 'sharing_default_services', $enabled );
		}

		// Cleanup after any filters that may have produced duplicate services
		$enabled['visible'] = array_unique( $enabled['visible'] );
		$enabled['hidden']  = array_unique( $enabled['hidden'] );
		
		// Form the enabled services
		$blog = array( 'visible' => array(), 'hidden' => array() );
		
		foreach ( $blog AS $area => $stuff ) {
			foreach ( (array)$enabled[$area] AS $service ) {
				if ( isset( $services[$service] ) ) {
					$blog[$area][$service] = new $services[$service]( $service, array_merge( $global, isset( $options[$service] ) ? $options[$service] : array() ) );
				}
			}
		}

		$blog = apply_filters( 'sharing_services_enabled', $blog );

		// Convenience for checking if a service is present
		$blog['all'] = array_flip( array_merge( array_keys( $blog['visible'] ), array_keys( $blog['hidden'] ) ) );
		return $blog;
	}
	
	public function get_service( $service_name ) {
		$services = $this->get_blog_services();

		if ( isset( $services['visible'][$service_name] ) )
			return $services['visible'][$service_name];

		if ( isset( $services['hidden'][$service_name] ) )
			return $services['hidden'][$service_name];
			
		return false;
	}
	
	public function set_global_options( $data ) {
		$options = get_option( 'sharing-options' );

		// No options yet
		if ( !is_array( $options ) )
			$options = array();

		// Defaults
		$options['global'] = array(
			'button_style'  => 'icon-text',
			'sharing_label' => __( 'Share this:', 'jetpack' ),
			'open_links'    => 'same',
			'show'          => 'posts',
			'custom'        => isset( $options['global']['custom'] ) ? $options['global']['custom'] : array()
		);
		
		$options['global'] = apply_filters( 'sharing_default_global', $options['global'] );

		// Validate options and set from our data
		if ( isset( $data['button_style'] ) && in_array( $data['button_style'], array( 'icon-text', 'icon', 'text' ) ) )
			$options['global']['button_style'] = $data['button_style'];

		if ( isset( $data['sharing_label'] ) )
			$options['global']['sharing_label'] = trim( wp_kses( stripslashes( $data['sharing_label'] ), array() ) );

		if ( isset( $data['open_links'] ) && in_array( $data['open_links'], array( 'new', 'same' ) ) )
			$options['global']['open_links'] = $data['open_links'];

		if ( isset( $data['show'] ) && in_array( $data['show'], array( 'posts', 'index', 'posts-index' ) ) )
			$options['global']['show'] = $data['show'];

		update_option( 'sharing-options', $options );
		return $options['global'];
	}
	
	public function get_global_options() {
		if ( $this->global === false ) {
			$options = get_option( 'sharing-options' );

			if ( is_array( $options ) && isset( $options['global'] ) )
				$this->global = $options['global'];
			else
				$this->global = $this->set_global_options( $options['global'] );
		}		

		return $this->global;
	}
	
	public function set_service( $id, Sharing_Source $service ) {
		// Update the options for this service
		$options = get_option( 'sharing-options' );
		
		// No options yet
		if ( !is_array( $options ) )
			$options = array();
			
		do_action( 'sharing_get_button_state', array( 'id' => $id, 'options' => $options, 'service' => $service ) );
		
		$options[$id] = $service->get_options();

		update_option( 'sharing-options', array_filter( $options ) );
	}
	
	// Soon to come to a .org plugin near you!
	public function get_total( $service_name = false, $post_id = false ) {
		global $wpdb, $blog_id;
		if ( $service_name == false ) {
			if ( $post_id > 0 ) {
				// total number of shares for this post
				return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND post_id = %d", $blog_id, $post_id ) );
			} else {
				// total number of shares for this blog
				return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d", $blog_id ) );
			}
		}
		
		if ( $post_id > 0 )
			return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND post_id = %d AND share_service = %s", $blog_id, $post_id, $service_name ) );
		else
			return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND share_service = %s", $blog_id, $service_name ) );
	}
	
	public function get_services_total( $post_id = false ) {
		$totals = array();
		$services = $this->get_blog_services();
		
		if ( !empty( $services ) && isset( $services[ 'all' ] ) )
			foreach( $services[ 'all' ] as $key => $value ) {
				$totals[$key] = new Sharing_Service_Total( $key, $this->get_total( $key, $post_id ) );
			}
		usort( $totals, array( 'Sharing_Service_Total', 'cmp' ) );
		
		return $totals;
	}	
	
	public function get_posts_total() {
		$totals = array();
		global $wpdb, $blog_id;
		
		$my_data = $wpdb->get_results( $wpdb->prepare( "SELECT post_id as id, SUM( count ) as total FROM sharing_stats WHERE blog_id = %d GROUP BY post_id ORDER BY count DESC ", $blog_id ) );
		
		if ( !empty( $my_data ) )
			foreach( $my_data as $row )
				$totals[] = new Sharing_Post_Total( $row->id, $row->total );
		
		usort( $totals, array( 'Sharing_Post_Total', 'cmp' ) );
		
		return $totals;
	}	
}

class Sharing_Service_Total {
	var $id 		= '';
	var $name 		= '';
	var $service	= '';
	var $total 		= 0;
	
	public function Sharing_Service_Total( $id, $total ) {
		$services 		= new Sharing_Service();
		$this->id 		= esc_html( $id );
		$this->service 	= $services->get_service( $id );
		$this->total 	= (int) $total;
		
		$this->name 	= $this->service->get_name();
	}
	
	static function cmp( $a, $b ) {
		if ( $a->total == $b->total )
			return $a->name < $b->name;
		return $a->total < $b->total;
	}
}

class Sharing_Post_Total {
	var $id		= 0;
	var $total	= 0;
	var $title 	= '';
	var $url	= '';
	
	public function Sharing_Post_Total( $id, $total ) {
		$this->id 		= (int) $id;
		$this->total 	= (int) $total;
		$this->title	= get_the_title( $this->id );	
		$this->url		= get_permalink( $this->id );	
	}
	
	static function cmp( $a, $b ) {
		if ( $a->total == $b->total )
			return $a->id < $b->id;
		return $a->total < $b->total;
	}
}

function sharing_add_footer() {
	if ( apply_filters( 'sharing_js', true ) )
		wp_print_scripts( 'sharing-js' );
	
	$sharer = new Sharing_Service();
	$enabled = $sharer->get_blog_services();
	foreach ( array_merge( $enabled['visible'], $enabled['hidden'] ) AS $service ) {
		$service->display_footer();
	}
} 

function sharing_add_header() {
	$sharer = new Sharing_Service();
	$enabled = $sharer->get_blog_services();

	foreach ( array_merge( $enabled['visible'], $enabled['hidden'] ) AS $service ) {
		$service->display_header();
	}

	if ( count( $enabled['all'] ) > 0 )
		wp_enqueue_style( 'sharedaddy', plugin_dir_url( __FILE__ ) .'sharing.css' );
}

function sharing_process_requests() {
	global $post;

	// Only process if: single post and share=X defined
	if ( ( is_page() || is_single() ) && isset( $_GET['share'] ) ) {
		$sharer = new Sharing_Service();

		$service = $sharer->get_service( $_GET['share'] );
		if ( $service ) {
			$service->process_request( $post, $_POST );
		}		
	}
}

function sharing_display( $text = '' ) {
	static $shared_with_posts = array();
	global $post;
	
	$sharer = new Sharing_Service();
	$global = $sharer->get_global_options();

	$show = false;
	if ( !is_feed() ) {
		if ( $global['show'] == 'posts' && ( is_single() || is_page() ) )
			$show = true;
		elseif ( $global['show'] == 'index' && ( is_home() || is_archive() || is_search() ) )
			$show = true;
		elseif ( $global['show'] == 'posts-index' && ( is_single() || is_page() || is_home() || is_search() || is_archive() ) )
			$show = true;
	}

	// Pass through a filter for final say so
	$show = apply_filters( 'sharing_show', $show, $post );
	
	// Disabled for this post?
	$switched_status = get_post_meta( $post->ID, 'sharing_disabled', false );

	if ( !empty( $switched_status ) )
		$show = false;

	// Only show once
	if ( isset( $shared_with_posts[$post->ID] ) )
		$show = false;

	$shared_with_posts[$post->ID] = true;
	$sharing_content = '';
	
	if ( $show ) {
		$enabled = $sharer->get_blog_services();

		if ( count( $enabled['all'] ) > 0 ) {
			global $post;
			
			$dir = get_option( 'text_direction' );

			// Wrapper
			$sharing_content .= '<div class="snap_nopreview sharing robots-nocontent">';
			$sharing_content .= '<ul>';
			
			// Visible items
			$visible = '';
			foreach ( $enabled['visible'] AS $id => $service ) {
				// Individual HTML for sharing service
				$visible .= '<li class="share-'.$service->get_class().' share-regular">';
				$visible .= $service->get_display( $post );
				$visible .= '</li>';
			}

			$parts = array();
			if ( $global['sharing_label'] != '' )
				$parts[] = '<li class="sharing_label">'.$global['sharing_label'].'</li>';

			$parts[] = $visible;
			if ( count( $enabled['hidden'] ) > 0 )
				$parts[] = '<li class="share-custom"><a href="#" class="sharing-anchor">'._x( 'Share', 'dropdown button', 'jetpack' ).'</a></li>';

			if ( $dir == 'rtl' )
				$parts = array_reverse( $parts );

			$sharing_content .= implode( '', $parts );			
			$sharing_content .= '<li class="share-end"></li></ul>';
			
			if ( count( $enabled['hidden'] ) > 0 ) {
				$sharing_content .= '<div class="sharing-hidden"><div class="inner" style="display: none;';

				if ( count( $enabled['hidden'] ) == 1 )
					$sharing_content .= 'width:150px;';
								
				$sharing_content .= '">';
				
				if ( count( $enabled['hidden'] ) == 1 )
					$sharing_content .= '<ul style="background-image:none;">';
				else
					$sharing_content .= '<ul>';
	
				$count = 1;
				foreach ( $enabled['hidden'] AS $id => $service ) {
					// Individual HTML for sharing service
					$sharing_content .= '<li class="share-'.$service->get_class().'">';
					$sharing_content .= $service->get_display( $post );
					$sharing_content .= '</li>';
					
					if ( ( $count % 2 ) == 0 )
						$sharing_content .= '<li class="share-end"></li>';

					$count ++;
				}
				
				// End of wrapper
				$sharing_content .= '<li class="share-end"></li></ul></div></div>';
			}

			$sharing_content .= '<div class="sharing-clear"></div></div>';
			
			// Register our JS
			wp_register_script( 'sharing-js', plugin_dir_url( __FILE__ ).'sharing.js', array( 'jquery' ), '0.1' );
			add_action( 'wp_footer', 'sharing_add_footer' );
		}
	}
	
	return $text.$sharing_content;
}

function calculate_excerpt_length( $length = 55 ) { 
	$text = get_the_content(''); 
	$text = strip_shortcodes( $text ); 
	$text = apply_filters('the_content', $text); 
	
	if ( function_exists( 'mb_stripos' ) ) {
		$mb = true;
		$share_start = mb_stripos( $text, '<div class="sharing">' ); 
	} else {
		$mb = false;
		$share_start = stripos( $text, '<div class="sharing">' ); 
	}
	if ( $share_start > 0 ) { 
		if ( $mb ) {
			$post_minus_share = mb_substr( $text, 0, $share_start ); 
		} else {
			$post_minus_share = substr( $text, 0, $share_start ); 
		}
	
		$words = preg_split("/[\n\r\t ]+/", $post_minus_share, $length + 1, PREG_SPLIT_NO_EMPTY); 
		if ( count( $words ) < $length ) { 
			add_filter( 'excerpt_more', 'remove_helipse' ); 
			
			return count( $words ) - 1; 
		} 	
	} 

	return $length; 
} 

function remove_helipse() { 
	return ''; 
}

add_filter( 'excerpt_length', 'calculate_excerpt_length' ); 
add_filter( 'the_content', 'sharing_display', 19 );
add_filter( 'the_excerpt', 'sharing_display', 19 );

// Register our CSS
add_action( 'wp_head', 'sharing_add_header', 1 );

add_action( 'template_redirect', 'sharing_process_requests' );
