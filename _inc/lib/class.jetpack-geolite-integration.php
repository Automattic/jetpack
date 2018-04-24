<?php
/**
 * Wrapper for MaxMind GeoLite2 Reader
 *
 * This class provide an interface to handle geolocation and error handling.
 *
 * Requires PHP 5.4+.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Geolite integration class.
 */
class Jetpack_Geolite_Integration {

	/**
	 * MaxMind GeoLite2 database path.
	 *
	 * @var string
	 */
	private $database = '';

	/**
	 * Constructor.
	 *
	 * @param string $database MaxMind GeoLite2 database path.
	 */
	public function __construct( $database ) {
		$this->database = $database;

		if ( ! class_exists( 'MaxMind\\Db\\Reader', false ) ) {
			$this->require_geolite_library();
		}
	}

	/**
	 * Get country 2-letters ISO by IP address.
	 * Retuns empty string when not able to find any ISO code.
	 *
	 * @param string $ip_address User IP address.
	 * @return string
	 */
	public function get_country_iso( $ip_address ) {
		$iso_code = '';

		try {
			$reader   = new MaxMind\Db\Reader( $this->database ); // phpcs:ignore PHPCompatibility.PHP.NewLanguageConstructs.t_ns_separatorFound
			$data     = $reader->get( $ip_address );
			$iso_code = $data['country']['iso_code'];

			$reader->close();
		} catch ( Exception $e ) {
			error_log( $e->getMessage() );
		}

		return sanitize_text_field( strtoupper( $iso_code ) );
	}

	/**
	 * Require geolite library.
	 */
	private function require_geolite_library() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/geolite2/Reader/Decoder.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/geolite2/Reader/InvalidDatabaseException.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/geolite2/Reader/Metadata.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/geolite2/Reader/Util.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/geolite2/Reader.php';
	}
}
