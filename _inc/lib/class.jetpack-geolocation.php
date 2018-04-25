<?php
/**
 * Class Jetpack_Geolocation
 */
class Jetpack_Geolocation {

	protected $geolite_folder;

	protected $geolite_download_url = 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country-CSV.zip';

	function __construct() {

		$this->geolite_folder = apply_filters( 'jetpack_geolocation_local_database_path', $upload_dir['basedir'] . '/geolite2/' );

		if ( ! wp_next_scheduled( 'jetpack_download_geolite2_ip_db' ) ) {
			wp_schedule_event( strtotime( 'first tuesday of next month' ), 'monthly', 'jetpack_download_geolite2_ip_db' );
		}
	}

	/**
	 * This function is adapted from WP Core's WP_Community_Events::get_unsafe_client_ip()
	 *
	 * Determines the user's actual IP address and attempts to partially
	 * anonymize an IP address by converting it to a network ID.
	 *
	 * Geolocating the network ID usually returns a similar location as the
	 * actual IP, but provides some privacy for the user.
	 *
	 * $_SERVER['REMOTE_ADDR'] cannot be used in all cases, such as when the user
	 * is making their request through a proxy, or when the web server is behind
	 * a proxy. In those cases, $_SERVER['REMOTE_ADDR'] is set to the proxy address rather
	 * than the user's actual address.
	 *
	 * Modified from https://stackoverflow.com/a/2031935/450127, MIT license.
	 * Modified from https://github.com/geertw/php-ip-anonymizer, MIT license.
	 *
	 * @since 4.8.0
	 *
	 * @return false|string The anonymized address on success; the given address
	 *                      or false on failure.
	 */
	public static function get_visitor_ip_address() {
		$client_ip = false;
		// In order of preference, with the best ones for this purpose first.
		$address_headers = array(
			'HTTP_CLIENT_IP',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_FORWARDED',
			'HTTP_X_CLUSTER_CLIENT_IP',
			'HTTP_FORWARDED_FOR',
			'HTTP_FORWARDED',
			'REMOTE_ADDR',
		);
		foreach ( $address_headers as $header ) {
			if ( array_key_exists( $header, $_SERVER ) ) {
				/*
				 * HTTP_X_FORWARDED_FOR can contain a chain of comma-separated
				 * addresses. The first one is the original client. It can't be
				 * trusted for authenticity, but we don't need to for this purpose.
				 */
				$address_chain = explode( ',', $_SERVER[ $header ] );
				$client_ip     = trim( $address_chain[0] );
				break;
			}
		}
		return $client_ip;
	}

	function get_ip_country( $ip_address = '' ) {
		$country_headers = array(
			'HTTP_CF_IPCOUNTRY',
			'GEOIP_COUNTRY_CODE',
			'HTTP_X_COUNTRY_CODE',
		);

		foreach ( $country_headers as $header ) {
			if ( array_key_exists( $header, $_SERVER ) ) {
				$country_code = sanitize_text_field( stripslashes( $_SERVER[ $header ] ) );
				break;
			}
		}

		if ( ! isset( $country_code ) ) {
			geolite_ip_lookup( $ip_address );
		}
	}

	function geolite_ip_lookup( $ip_address = '' ) {
		$ipv4       = 'GeoLite2-Country-Blocks-IPv4.csv';
		$ipv6       = 'GeoLite2-Country-Blocks-IPv6.csv';
		$countries  = 'GeoLite2-Country-Locations-en.csv';
		if (
			! file_exists( $this->geolite_folder . $ipv4 )
			|| ! file_exists( $this->geolite_folder . $ipv6 )
			|| ! file_exists( $this->geolite_folder . $countries )
		) {
			$this->download_geolite_db();
		}

		// @TODO Lookup IP in the csv files.
	}

	function jetpack_download_geolite2_ip_db() {
		require_once ABSPATH . 'wp-admin/includes/file.php';

		try {
			$tmp_geolite_path = download_url( $this->geolite_download_url );
			$unzip_action = unzip_file( $tmp_geolite_path, $this->geolite_folder );
		} catch ( Exception $e ) {
			error_log( $e->getMessage() );
		}

		@unlink( $tmp_geolite_path );
	}

	function remove_geolite_db() {
		global $wp_filesystem;
		$wp_filesystem->delete( $this->geolite_folder, true );
		wp_clear_scheduled_hook( 'jetpack_download_geolite2_ip_db' );
	}

} // class Jetpack_Geolocation

register_activation_hook( __FILE__, array( 'Jetpack_Geolocation', 'jetpack_download_geolite2_ip_db' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Geolocation', 'remove_geolite_db' ) );
