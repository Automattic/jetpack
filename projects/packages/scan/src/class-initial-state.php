<?php
/**
 * The Scan React initial state.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use Automattic\Jetpack\Status;
use Jetpack_Options;
use function admin_url;
use function esc_url_raw;
use function get_bloginfo;
use function get_locale;
use function get_option;
use function get_site_url;
use function plugins_url;
use function rest_url;
use function wp_create_nonce;
use function wp_json_encode;
use function wp_parse_url;

/**
 * The Scan React initial state.
 */
class Initial_State {
	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		$gmt_offset      = get_option( 'gmt_offset' );
		$timezone_string = get_option( 'timezone_string' );
		$home_host       = wp_parse_url( get_site_url(), PHP_URL_HOST );

		return array(
			'API'           => array(
				'WP_API_root'  => esc_url_raw( rest_url() ),
				'WP_API_nonce' => wp_create_nonce( 'wp_rest' ),
			),
			'jetpackStatus' => array(
				'calypsoSlug' => ( new Status() )->get_site_suffix(),
			),
			'siteData'      => array(
				'id'             => Jetpack_Options::get_option( 'id' ),
				'title'          => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url(),
				'adminUrl'       => esc_url_raw( admin_url() ),
				'slug'           => is_string( $home_host ) ? $home_host : '',
				'gmtOffset'      => is_numeric( $gmt_offset ) ? (float) $gmt_offset : 0.0,
				'timezoneString' => is_string( $timezone_string ) ? $timezone_string : '',
				'locale'         => str_replace( '_', '-', (string) get_locale() ),
			),
			'assets'        => array(
				'buildUrl' => plugins_url( '../build/', __FILE__ ),
			),
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		return 'var JPSCAN_INITIAL_STATE=' . wp_json_encode( $this->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
	}
}
