<?php
/*
		Copyright 2006  Aaron D. Campbell  (email : wp_plugins@xavisys.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

/**
 * Jetpack_Google_Analytics is the class that handles ALL of the plugin functionality.
 * It helps us avoid name collisions
 * http://codex.wordpress.org/Writing_a_Plugin#Avoiding_Function_Name_Collisions
 */
class Jetpack_Google_Analytics {

	/**
	 * @var Jetpack_Google_Analytics - Static property to hold our singleton instance
	 */
	static $instance = false;

	/**
	 * This is our constructor, which is private to force the use of get_instance()
	 *
	 * @return void
	 */
	private function __construct() {
		add_filter( 'jetpack_wga_classic_custom_vars', array( $this, 'jetpack_wga_classic_anonymize_ip' ) );
		add_filter( 'jetpack_wga_classic_custom_vars', array( $this, 'jetpack_wga_classic_track_purchases' ) );
		add_action( 'wp_footer', array( $this, 'insert_code' ) );
		add_action( 'wp_footer', array( $this, 'jetpack_wga_classic_track_add_to_cart' ) );
	}

	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	/**
	 * Used to generate a tracking URL
	 *
	 * @param array $track - Must have ['data'] and ['code'].
	 * @return string - Tracking URL
	 */
	private function _get_url( $track ) {
		$site_url = ( is_ssl() ? 'https://':'http://' ) . sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ); // Input var okay.
		foreach ( $track as $k => $value ) {
			if ( strpos( strtolower( $value ), strtolower( $site_url ) ) === 0 ) {
				$track[ $k ] = substr( $track[ $k ], strlen( $site_url ) );
			}
			if ( 'data' === $k ) {
				$track[ $k ] = preg_replace( '/^https?:\/\/|^\/+/i', '', $track[ $k ] );
			}

			// This way we don't lose search data.
			if ( 'data' === $k && 'search' === $track['code'] ) {
				$track[ $k ] = rawurlencode( $track[ $k ] );
			} else {
				$track[ $k ] = preg_replace( '/[^a-z0-9\.\/\+\?=-]+/i', '_', $track[ $k ] );
			}

			$track[ $k ] = trim( $track[ $k ], '_' );
		}
		$char = ( strpos( $track['data'], '?' ) === false ) ? '?' : '&amp;';
		return str_replace( "'", "\'", "/{$track['code']}/{$track['data']}{$char}referer=" . rawurlencode( isset( $_SERVER['HTTP_REFERER'] ) ? $_SERVER['HTTP_REFERER'] : '' ) ); // Input var okay.
	}

	/**
	 * Maybe output or return, depending on the context
	 */
	private function _output_or_return( $val, $maybe ) {
		if ( $maybe ) {
			echo $val . "\r\n";
		} else {
			return $val;
		}
	}

	/**
	 * This injects the Google Analytics code into the footer of the page.
	 *
	 * @param bool[optional] $output - defaults to true, false returns but does NOT echo the code.
	 */
	public function insert_code( $output = true ) {
		// If $output is not a boolean false, set it to true (default).
		$output = ( false !== $output);

		$tracking_id = $this->_get_tracking_code();
		if ( empty( $tracking_id ) ) {
			return $this->_output_or_return( '<!-- Your Google Analytics Plugin is missing the tracking ID -->', $output );
		}

		// If we're in the admin_area, return without inserting code.
		if ( is_admin() ) {
			return $this->_output_or_return( '<!-- Your Google Analytics Plugin is set to ignore Admin area -->', $output );
		}

		$custom_vars = array(
			"_gaq.push(['_setAccount', '{$tracking_id}']);",
		);

		$track = array();
		if ( is_404() ) {
			// This is a 404 and we are supposed to track them.
			$custom_vars[] = "_gaq.push(['_trackEvent', '404', document.location.href, document.referrer]);";
		} elseif ( is_search() ) {
			// Set track for searches, if it's a search, and we are supposed to.
			$track['data'] = sanitize_text_field( wp_unslash( $_REQUEST['s'] ) ); // Input var okay.
			$track['code'] = 'search';
		}

		if ( ! empty( $track ) ) {
			$track['url'] = $this->_get_url( $track );
			// adjust the code that we output, account for both types of tracking.
			$track['url'] = esc_js( str_replace( '&', '&amp;', $track['url'] ) );
			$custom_vars[] = "_gaq.push(['_trackPageview','{$track['url']}']);";
		} else {
			$custom_vars[] = "_gaq.push(['_trackPageview']);";
		}

		/**
		 * Allow for additional elements to be added to the classic Google Analytics queue (_gaq) array
		 *
		 * @since 5.4.0
		 *
		 * @param array $custom_vars Array of classic Google Analytics queue elements
		 */
		$custom_vars = apply_filters( 'jetpack_wga_classic_custom_vars', $custom_vars );

		// Ref: https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingEcommerce#Example
		$async_code = "<!-- Jetpack Google Analytics -->
			<script type='text/javascript'>
				var _gaq = _gaq || [];
				%custom_vars%

				(function() {
					var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
					ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
					var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
				})();
			</script>";

		$custom_vars_string = implode( "\r\n", $custom_vars );
		$async_code = str_replace( '%custom_vars%', $custom_vars_string, $async_code );

		return $this->_output_or_return( $async_code, $output );
	}

	/**
	 * Used to get the tracking code option
	 *
	 * @return tracking code option value.
	 */
	private function _get_tracking_code() {
		$o = get_option( 'jetpack_wga' );

		if ( isset( $o['code'] ) && preg_match( '#UA-[\d-]+#', $o['code'], $matches ) ) {
				return $o['code'];
		}

		return '';
	}

	/**
	 * Used to filter in the anonymize IP snippet to the custom vars array for classic analytics
	 * Ref https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApi_gat#_gat._anonymizelp
	 * @param array custom vars to be filtered
	 * @return array possibly updated custom vars
	 */
	public function jetpack_wga_classic_anonymize_ip( $custom_vars ) {
		$o = get_option( 'jetpack_wga' );
		$anonymize_ip = isset( $o[ 'anonymize_ip' ] ) ? $o[ 'anonymize_ip' ] : false;
		if ( $anonymize_ip ) {
			array_push( $custom_vars, "_gaq.push(['_gat._anonymizeIp']);" );
		}

		return $custom_vars;
	}

	/**
	 * Used to filter in the order details to the custom vars array for classic analytics
	 * @param array custom vars to be filtered
	 * @return array possibly updated custom vars
	 */
	public function jetpack_wga_classic_track_purchases( $custom_vars ) {
		global $wp;

		if ( ! class_exists( 'WooCommerce' ) ) {
			return $custom_vars;
		}

		// Ref: https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingEcommerce#Example
		$o = get_option( 'jetpack_wga' );
		$ec_track_purchases = isset( $o[ 'ec_track_purchases' ] ) ? $o[ 'ec_track_purchases' ] : false;
		$minimum_woocommerce_active = class_exists( 'WooCommerce' ) && version_compare( WC_VERSION, '3.0', '>=' );
		if ( $ec_track_purchases && $minimum_woocommerce_active && is_order_received_page() ) {
			$order_id = isset( $wp->query_vars['order-received'] ) ? $wp->query_vars['order-received'] : 0;
			if ( 0 < $order_id && 1 != get_post_meta( $order_id, '_ga_tracked', true ) ) {
				$order = new WC_Order( $order_id );

				// [ '_add_Trans', '123', 'Site Title', '21.00', '1.00', '5.00', 'Snohomish', 'WA', 'USA' ]
				array_push(
					$custom_vars,
					sprintf(
						'_gaq.push( %s );', json_encode(
							array(
								'_addTrans',
								(string) $order->get_order_number(),
								get_bloginfo( 'name' ),
								(string) $order->get_total(),
								(string) $order->get_total_tax(),
								(string) $order->get_total_shipping(),
								(string) $order->get_billing_city(),
								(string) $order->get_billing_state(),
								(string) $order->get_billing_country()
							)
						)
					)
				);

				// Order items
				if ( $order->get_items() ) {
					foreach ( $order->get_items() as $item ) {
						$product = $order->get_product_from_item( $item );
						$product_sku_or_id = $product->get_sku() ? $product->get_sku() : $product->get_id();

						array_push(
							$custom_vars,
							sprintf(
								'_gaq.push( %s );', json_encode(
									array(
										'_addItem',
										(string) $order->get_order_number(),
										(string) $product_sku_or_id,
										$item['name'],
										self::get_product_categories_concatenated( $product ),
										(string) $order->get_item_total( $item ),
										(string) $item['qty']
									)
								)
							)
						);
					}
				} // get_items

				// Mark the order as tracked
				update_post_meta( $order_id, '_ga_tracked', 1 );
				array_push( $custom_vars, "_gaq.push(['_trackTrans']);" );
			} // order not yet tracked
		} // is order received page

		return $custom_vars;
	}

	/**
	 * Gets product categories or varation attributes as a formatted concatenated string
	 * @param WC_Product
	 * @return string
	 */
	public function get_product_categories_concatenated( $product ) {
		$variation_data = $product->is_type( 'variation' ) ? wc_get_product_variation_attributes( $product->get_id() ) : '';
		if ( is_array( $variation_data ) && ! empty( $variation_data ) ) {
			$line = wc_get_formatted_variation( $variation_data, true );
		} else {
			$out = array();
			$categories = get_the_terms( $product->get_id(), 'product_cat' );
			if ( $categories ) {
				foreach ( $categories as $category ) {
					$out[] = $category->name;
				}
			}
			$line = join( "/", $out );
		}
		return $line;
	}

	/**
	 * Used to add footer javascript to track user clicking on add-to-cart buttons
	 * on single views (.single_add_to_cart_button) and list views (.add_to_cart_button)
	 */
	public function jetpack_wga_classic_track_add_to_cart() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}

		$tracking_id = $this->_get_tracking_code();
		if ( empty( $tracking_id ) ) {
			return;
		}

		$o = get_option( 'jetpack_wga' );
		$ec_track_add_to_cart = isset( $o[ 'ec_track_add_to_cart' ] ) ? $o[ 'ec_track_add_to_cart' ] : false;
		if ( $ec_track_add_to_cart ) {
			if ( is_product() ) { // product page
				global $product;
				$product_sku_or_id = $product->get_sku() ? $product->get_sku() : "#" + $product->get_id();
				wc_enqueue_js(
					"jQuery( function( $ ) {
						$( '.single_add_to_cart_button' ).click( function() {
							_gaq.push(['_trackEvent', 'Products', 'Add to Cart', '#" . esc_js( $product_sku_or_id ) . "']);
						} );
					} );"
				);
			} else if ( is_woocommerce() ) { // any other page that uses templates (like product lists, archives, etc)
				wc_enqueue_js(
					"jQuery( function( $ ) {
						$( '.add_to_cart_button:not(.product_type_variable, .product_type_grouped)' ).click( function() {
							var label = $( this ).data( 'product_sku' ) ? $( this ).data( 'product_sku' ) : '#' + $( this ).data( 'product_id' );
							_gaq.push(['_trackEvent', 'Products', 'Add to Cart', label]);
						} );
					} );"
				);
			}
		}
	}
}

global $jetpack_google_analytics;
$jetpack_google_analytics = Jetpack_Google_Analytics::get_instance();
