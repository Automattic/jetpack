<?php

$is_avada = false;

$theme = function_exists( 'wp_get_theme' ) ? wp_get_theme() : get_theme( get_current_theme() );
$theme_name = strtolower( $theme->stylesheet );
$theme_version = strtolower( $theme->version );

if( $theme_name == 'avada' && version_compare( $theme_version, '3.7.4', '<=' ) ) {
	return;
}

if( ! $is_avada && isset( $theme->template ) ) {
	$theme_parent = function_exists( 'wp_get_theme' ) ? wp_get_theme( $theme->template ) : get_theme( $theme->template );
	$theme_parent_name = strtolower( $theme_parent->stylesheet );
	$theme_parent_version = strtolower( $theme_parent->version );
	if( $theme_parent_name == 'avada' && version_compare( $theme_parent_version, '3.7.4', '<=' ) ) {
		return;
	}
}

if ( ! class_exists( 'Contact_Info_Widget' ) ) {

	//register Contact_Info_Widget widget
	function contact_info_widget_init() {
		register_widget( 'Contact_Info_Widget' );
	}

	add_action( 'widgets_init', 'contact_info_widget_init' );

	/**
	 * Makes a custom Widget for displaying Resturant Location, Hours and Contact Info available.
	 *
	 * @package WordPress
	 */
	class Contact_Info_Widget extends WP_Widget {

		/**
		 * Constructor
		 *
		 * @return void
		 **/
		function __construct() {
			$widget_ops = array(
				'classname' => 'widget_contact_info',
				'description' => __( 'Display your location, hours, and contact information.', 'jetpack' )
			);
			parent::__construct(
				'widget_contact_info',
				apply_filters( 'jetpack_widget_name', __( 'Contact Info', 'jetpack' ) ),
				$widget_ops
			);
			$this->alt_option_name = 'widget_contact_info';
		}


		/**
		 * Return an associative array of default values
		 *
		 * These values are used in new widgets.
		 *
		 * @return array Array of default values for the Widget's options
		 */
		public function defaults() {
			return array(
				'title'   => __( 'Hours & Info', 'jetpack' ),
				'address' => __( "3999 Mission Boulevard,\nSan Diego CA 92109", 'jetpack' ),
				'phone'   => _x( '1-202-555-1212', 'Example of a phone number', 'jetpack' ),
				'hours'   => __( "Lunch: 11am - 2pm \nDinner: M-Th 5pm - 11pm, Fri-Sat:5pm - 1am", 'jetpack' ),
				'showmap' => 1,
				'lat'     => null,
				'lon'     => null
			);
		}
		/**
		 * Outputs the HTML for this widget.
		 *
		 * @param array An array of standard parameters for widgets in this theme
		 * @param array An array of settings for this widget instance
		 * @return void Echoes it's output
		 **/
		function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );

			extract( $args, EXTR_SKIP );

			echo $before_widget;

			if ( $instance['title'] != '' )
				echo $before_title . $instance['title'] . $after_title;


			$map_link = 0;


			if ( $instance['address'] != '' ) {

				$showmap = $instance['showmap'];

				if ( $showmap && $this->has_good_map( $instance ) ) {

					$lat = $instance['lat'];
					$lon = $instance['lon'];

					echo $this->build_map( $lat, $lon );
				}

				$map_link = $this->build_map_link( $instance['address'] );

				echo '<div class="confit-address"><a href="' . esc_url( $map_link ) . '" target="_blank">' . str_replace( "\n", "<br/>", esc_html( $instance['address'] ) ) . "</a></div>";


			}


			if ( $instance['phone'] != '' ) {

				if( wp_is_mobile() ) {
					echo '<div class="confit-phone"><a href="'. esc_url( 'tel:'. $instance['phone'] ) . '">' . esc_html( $instance['phone'] ) . "</a></div>";
				} else {
					echo '<div class="confit-phone">' . esc_html( $instance['phone'] ) . '</div>';
				}

			}


			if ( $instance['hours'] != '' ) {
				echo '<div class="confit-hours">' . str_replace( "\n", "<br/>", esc_html( $instance['hours'] ) ) . "</div>";
			}


			echo $after_widget;

		}


		/**
		 * Deals with the settings when they are saved by the admin. Here is
		 * where any validation should be dealt with.
		 **/
		function update( $new_instance, $old_instance ) {
			$update_lat_lon = false;
			if ( $this->urlencode_address( $old_instance['address'] ) != $this->urlencode_address( $new_instance['address'] ) ) {
				$update_lat_lon = true;
			}

			$instance = array();
			$instance['title'] = wp_kses( $new_instance['title'], array() );
			$instance['address'] = wp_kses( $new_instance['address'], array() );
			$instance['phone'] = wp_kses( $new_instance['phone'], array() );
			$instance['hours'] = wp_kses( $new_instance['hours'], array() );
			$instance['lat'] = isset( $old_instance['lat'] ) ? floatval( $old_instance['lat'] ) : 0;
			$instance['lon'] = isset( $old_instance['lon'] ) ? floatval( $old_instance['lon'] ) : 0;

			if ( ! $instance['lat'] || ! $instance['lon'] ) {
				$update_lat_lon = true;
			}

			if ( $instance['address'] && $update_lat_lon ) {

				// Get the lat/lon of the user specified address.
				$address = $this->urlencode_address( $instance['address'] );
				$path = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" . $address;
				$json = wp_remote_retrieve_body( wp_remote_get( $path ) );

				if ( ! $json ) {
					// The read failed :(
					esc_html_e( "There was a problem getting the data to display this address on a map.  Please refresh your browser and try again.", 'jetpack' );
					die();
				}

				$json_obj = json_decode( $json );

				if ( $err = $json_obj->status == "ZERO_RESULTS" ) {
					// The address supplied does not have a matching lat / lon.
					// No map is available.
					$instance['lat'] = "0";
					$instance['lon'] = "0";
				} else {

					$loc = $json_obj->results[0]->geometry->location;

					$lat = floatval( $loc->lat );
					$lon = floatval( $loc->lng );

					$instance['lat'] = "$lat";
					$instance['lon'] = "$lon";
				}
			}

			if ( ! isset( $new_instance['showmap'] ) ) {
				$instance['showmap'] = 0;
			} else {
				$instance['showmap'] = intval( $new_instance['showmap'] );
			}

			return $instance;
		}


		/**
		 * Displays the form for this widget on the Widgets page of the WP Admin area.
		 **/
		function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			extract( $instance );

			$disabled = !$this->has_good_map( $instance );
	?>
				<p><label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>

				<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" /></p>

				<p><label for="<?php echo esc_attr( $this->get_field_id( 'address' ) ); ?>"><?php esc_html_e( 'Address:', 'jetpack' ); ?></label>
				<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'address' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'address' ) ); ?>"><?php echo esc_textarea( $address ); ?></textarea>
	<?php
			if ( $this->has_good_map( $instance ) ) {
	?>
				<input class="" id="<?php echo esc_attr( $this->get_field_id( 'showmap' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'showmap' ) ); ?>" value="1" type="checkbox" <?php checked( $showmap , 1); ?> />
				<label for="<?php echo esc_attr( $this->get_field_id( 'showmap' ) ); ?>"><?php esc_html_e( 'Show map', 'jetpack' ); ?></label></p>
	<?php
			} else {
	?>
				<span class="error-message"><?php _e( 'Sorry. We can not plot this address. A map will not be displayed. Is the address formatted correctly?', 'jetpack' ); ?></span></p>
				<input id="<?php echo esc_attr( $this->get_field_id( 'showmap' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'showmap' ) ); ?>" value="<?php echo( intval( $instance['showmap'] ) ); ?>" type="hidden" />
	<?php
			}
	?>

				<p><label for="<?php echo esc_attr( $this->get_field_id( 'phone' ) ); ?>"><?php esc_html_e( 'Phone:', 'jetpack' ); ?></label>
				<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'phone' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'phone' ) ); ?>" type="text" value="<?php echo esc_attr( $phone ); ?>" /></p>

				<p><label for="<?php echo esc_attr( $this->get_field_id( 'hours' ) ); ?>"><?php esc_html_e( 'Hours:', 'jetpack' ); ?></label>

				<textarea class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'hours' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'hours' ) ); ?>"><?php echo esc_textarea( $hours ); ?></textarea></p>

	<?php
		}


		function build_map_link( $address ) {
			// Google map urls have lots of available params but zoom (z) and query (q) are enough.
			return "http://maps.google.com/maps?z=16&q=" . $this->urlencode_address( $address );
		}


		function build_map( $lat, $lon ) {

			wp_enqueue_script( "jquery" );
			wp_enqueue_script( "google-maps", "https://maps.googleapis.com/maps/api/js?sensor=false" );
			wp_enqueue_script( "contact-info-map-js", plugins_url( 'contact-info/contact-info-map.js', __FILE__ ), array( 'jquery', 'google-maps' ), 20150127 );
			wp_enqueue_style( "contact-info-map-css", plugins_url( 'contact-info/contact-info-map.css', __FILE__ ), null, 20150127 );

			$lat = esc_attr( $lat );
			$lon = esc_attr( $lon );
			$html = <<<EOT
				<div class="contact-map">
				<input type="hidden" class="contact-info-map-lat" value="$lat" />
				<input type="hidden" class="contact-info-map-lon" value="$lon" />
				<div class="contact-info-map-canvas"></div></div>
EOT;

			return $html;
		}


		function urlencode_address( $address ) {

			$address = strtolower( $address );
			$address = preg_replace( "/\s+/", " ", trim( $address ) ); // Get rid of any unwanted whitespace
			$address = str_ireplace( " ", "+", $address ); // Use + not %20
			urlencode( $address );

			return $address;
		}


		function has_good_map( $instance ) {
			// The lat and lon of an address that could not be plotted will have values of 0 and 0.
			return ! ( $instance['lat'] == "0" && $instance['lon'] == "0" );
		}

	}

}
