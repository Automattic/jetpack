<?php
/**
 * WooCommerce Tax Settings
 *
 * @author      WooThemes
 * @category    Admin
 * @package     WooCommerce/Admin
 * @version     2.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WC_Settings_Tax' ) ) :

/**
 * WC_Settings_Tax
 */
class WC_Settings_Tax extends WC_Settings_Page {

	protected $id = 'tax';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->label = __( 'Tax', 'woocommerce' );
		parent::__construct();
	}

	/**
	 * Get sections
	 *
	 * @return array
	 */
	public function get_sections() {
		$sections = array(
			''         => __( 'Tax Options', 'woocommerce' ),
			'standard' => __( 'Standard Rates', 'woocommerce' )
		);

		// Get tax classes and display as links
		$tax_classes = WC_Tax::get_tax_classes();

		foreach ( $tax_classes as $class ) {
			$sections[ sanitize_title( $class ) ] = sprintf( __( '%s Rates', 'woocommerce' ), $class );
		}

		return apply_filters( 'woocommerce_get_sections_' . $this->id, $sections );
	}

	/**
	 * Get settings array
	 *
	 * @return array
	 */
	public function get_settings() {
		$tax_classes     = WC_Tax::get_tax_classes();
		$classes_options = array();

		foreach ( $tax_classes as $class ) {
			$classes_options[ sanitize_title( $class ) ] = esc_html( $class );
		}

		return apply_filters( 'woocommerce_get_settings_' . $this->id, include( 'views/settings-tax.php' ) );
	}

	/**
	 * Output the settings
	 */
	public function output() {
		global $current_section;

		$tax_classes = WC_Tax::get_tax_classes();

		if ( $current_section == 'standard' || in_array( $current_section, array_map( 'sanitize_title', $tax_classes ) ) ) {
			$this->output_tax_rates();
		} else {
			$settings = $this->get_settings();

			WC_Admin_Settings::output_fields( $settings );
		}
	}

	/**
	 * Save settings
	 */
	public function save() {
		global $current_section, $wpdb;

		if ( ! $current_section ) {
			$settings = $this->get_settings();
			WC_Admin_Settings::save_fields( $settings );

		} elseif ( ! empty( $_POST['tax_rate_country'] ) ) {
			$this->save_tax_rates();
		}

		$wpdb->query( "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE ('_transient_wc_tax_rates_%') OR `option_name` LIKE ('_transient_timeout_wc_tax_rates_%')" );
	}

	/**
	 * Output tax rate tables
	 */
	public function output_tax_rates() {
		global $wpdb;

		$page          = ! empty( $_GET['p'] ) ? absint( $_GET['p'] ) : 1;
		$limit         = 100;
		$current_class = $this->get_current_tax_class();

		include( 'views/html-settings-tax.php' );
	}

	/**
	 * Get tax class being edited
	 * @return string
	 */
	private function get_current_tax_class() {
		global $current_section;

		$tax_classes   = WC_Tax::get_tax_classes();
		$current_class = '';

		foreach( $tax_classes as $class ) {
			if ( sanitize_title( $class ) == $current_section ) {
				$current_class = $class;
			}
		}

		return $current_class;
	}

	/**
	 * Get a posted tax rate
	 * @param  string $key   Key of tax rate in the post data array
	 * @param  int $order Position/order of rate
	 * @param  string $class Tax class for rate
	 * @return array
	 */
	private function get_posted_tax_rate( $key, $order, $class ) {
		$tax_rate     = array();
		$tax_rate_keys = array(
			'tax_rate_country',
			'tax_rate_state',
			'tax_rate',
			'tax_rate_name',
			'tax_rate_priority'
		);

		foreach ( $tax_rate_keys as $tax_rate_key ) {
			if ( isset( $_POST[ $tax_rate_key ] ) && isset( $_POST[ $tax_rate_key ][ $key ] ) ) {
				$tax_rate[ $tax_rate_key ] = wc_clean( $_POST[ $tax_rate_key ][ $key ] );
			}
		}

		$tax_rate['tax_rate_compound'] = isset( $_POST['tax_rate_compound'][ $key ] ) ? 1 : 0;
		$tax_rate['tax_rate_shipping'] = isset( $_POST['tax_rate_shipping'][ $key ] ) ? 1 : 0;
		$tax_rate['tax_rate_order']    = $order;
		$tax_rate['tax_rate_class']    = $class;

		return $tax_rate;
	}

	/**
	 * Save tax rates
	 */
	public function save_tax_rates() {
		global $wpdb;

		$current_class = sanitize_title( $this->get_current_tax_class() );

		// get the tax rate id of the first submited row
		$first_tax_rate_id = key( $_POST['tax_rate_country'] );

		// get the order position of the first tax rate id
		$tax_rate_order = absint( $wpdb->get_var( $wpdb->prepare( "SELECT tax_rate_order FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_id = %s", $first_tax_rate_id ) ) );

		$index = isset( $tax_rate_order ) ? $tax_rate_order : 0;

		// Loop posted fields
		foreach ( $_POST['tax_rate_country'] as $key => $value ) {
			$mode        = 0 === strpos( $key, 'new-' ) ? 'insert' : 'update';
			$tax_rate    = $this->get_posted_tax_rate( $key, $index ++, $current_class );

			if ( 'insert' === $mode ) {
				$tax_rate_id = WC_Tax::_insert_tax_rate( $tax_rate );
			} elseif ( 1 == $_POST['remove_tax_rate'][ $key ] ) {
				$tax_rate_id = absint( $key );
				WC_Tax::_delete_tax_rate( $tax_rate_id );
				continue;
			} else {
				$tax_rate_id = absint( $key );
				WC_Tax::_update_tax_rate( $tax_rate_id, $tax_rate );
			}

			if ( isset( $_POST['tax_rate_postcode'][ $key ] ) ) {
				WC_Tax::_update_tax_rate_postcodes( $tax_rate_id, wc_clean( $_POST['tax_rate_postcode'][ $key ] ) );
			}
			if ( isset( $_POST['tax_rate_city'][ $key ] ) ) {
				WC_Tax::_update_tax_rate_cities( $tax_rate_id, wc_clean( $_POST['tax_rate_city'][ $key ] ) );
			}
		}
	}
}

endif;

return new WC_Settings_Tax();
