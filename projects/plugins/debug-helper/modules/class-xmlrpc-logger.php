<?php
/**
 * XMLRPC Logger file contains the class `XMLRPC_Logger` that logs XMLRPC requests.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * Class XMLRPC_Logger
 *
 * Handles logging of XML-RPC requests in WordPress.
 * It hooks into the WordPress initialization process to log details about XML-RPC requests.
 *
 * @package Automattic\Jetpack\Debug_Helper
 */
class XMLRPC_Logger {

	/**
	 * XMLRPC_Logger constructor.
	 * Hooks the XML-RPC logging function into WordPress's init action.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'log_xmlrpc_requests_on_init' ) );
	}

	/**
	 * Logs XML-RPC requests.
	 * Checks if the current request is a POST to xmlrpc.php and logs.
	 */
	public function log_xmlrpc_requests_on_init() {
		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset( $_SERVER['SCRIPT_FILENAME'] ) && basename( esc_url_raw( wp_unslash( $_SERVER['SCRIPT_FILENAME'] ) ) ) === 'xmlrpc.php' ) {
			$this->log_xmlrpc_request();
		}
	}

	/**
	 * Logs the XML-RPC request.
	 * Captures the request data, formats it, and logs it if WP_DEBUG_LOG is enabled.
	 */
	public function log_xmlrpc_request() {
		// Load the XML from the raw POST data
		$xml_string = file_get_contents( 'php://input' );
		if ( ! $xml_string ) {
			l( 'XML-RPC Request: Empty payload' );
			return;
		}
		libxml_use_internal_errors( true );
		$xml = simplexml_load_string( $xml_string );
		l( $this->convert_xml_rpc_to_json( $xml ) );
		if ( $xml ) {
			// Extract the method name
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$method_name   = $xml->methodName ? (string) $xml->methodName : 'Unknown Method';
			$formatted_xml = $this->pretty_print_xml( $xml_string );

			// Format and log the request
			if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
				$log_message  = "XML-RPC Request - Method: $method_name\n";
				$log_message .= "Payload:\n" . $formatted_xml . "\n";
				l( $log_message );
			}
		} else {
			l( 'XML-RPC Request: Invalid XML - ' . libxml_get_errors()[0]->message );
			libxml_clear_errors();
			return;
		}
	}

	/**
	 * Pretty prints the XML.
	 *
	 * @param string $xml The XML to pretty print.
	 * @return string The pretty printed XML.
	 */
	public function pretty_print_xml( $xml ) {
		$dom = new \DOMDocument();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$dom->preserveWhiteSpace = false;
		$dom->loadXML( $xml );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$dom->formatOutput = true;
		return $dom->saveXML();
	}

	/**
	 * Converts the XML-RPC request to JSON.
	 *
	 * @param \SimpleXMLElement $xml The XML to convert.
	 * @return string The JSON string.
	 */
	public function convert_xml_rpc_to_json( $xml ) {
		// Convert SimpleXML object to an array
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode, WordPress.WP.AlternativeFunctions.json_decode_json_decode
		$array = json_decode( json_encode( (array) $xml ), true );

		// Recursively clean up the array from empty arrays and objects
		$array = $this->recursive_array_clean( $array );

		// Convert the array to a JSON string
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		return json_encode( $array, JSON_PRETTY_PRINT );
	}

	/**
	 * Recursively cleans up an array from empty arrays and objects.
	 *
	 * @param array $array The array to clean up.
	 * @return array The cleaned up array.
	 */
	public function recursive_array_clean( $array ) {
		foreach ( $array as $key => $value ) {
			if ( is_array( $value ) ) {
				$array[ $key ] = $this->recursive_array_clean( $array[ $key ] );
			}

			// Remove empty arrays and objects
			if ( empty( $array[ $key ] ) ) {
				unset( $array[ $key ] );
			}
		}

		return $array;
	}

	/**
	 * Load the class.
	 */
	public static function register_xmlrpc_logger() {
		new self();
	}
}

add_action( 'plugins_loaded', array( XMLRPC_Logger::class, 'register_xmlrpc_logger' ), 1000 );
