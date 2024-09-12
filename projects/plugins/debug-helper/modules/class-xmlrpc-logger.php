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
	 * The XML-RPC logger settings.
	 *
	 * @var array
	 * @access private
	 */
	private $settings;

	/**
	 * XMLRPC_Logger constructor.
	 * Hooks the XML-RPC logging function into WordPress's init action.
	 */
	public function __construct() {
		$this->settings = $this->get_stored_settings();
		// Hook into the WordPress initialization process to log XML-RPC requests.
		add_action( 'init', array( $this, 'log_xmlrpc_requests_on_init' ) );
		// Hook into the WordPress admin menu to register the XML-RPC logger submenu page.
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
	}

	/**
	 * Logs XML-RPC requests.
	 * Checks if the current request is a POST to xmlrpc.php and logs.
	 */
	public function log_xmlrpc_requests_on_init() {
		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset( $_SERVER['SCRIPT_FILENAME'] ) && basename( esc_url_raw( wp_unslash( $_SERVER['SCRIPT_FILENAME'] ) ) ) === 'xmlrpc.php'
		&& $this->settings['log_incoming_xmlrpc_requests']
		) {
			$this->log_xmlrpc_request();
		}
	}

	/**
	 * Registers the XML-RPC logger submenu page.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'XML-RPC Logger',
			'XML-RPC Logger',
			'manage_options',
			'jetpack_xmlrpc_logger',
			array( $this, 'render_submenu_page' )
		);
	}

	/**
	 * Retrieves the stored XML-RPC logger settings.
	 *
	 * @return array The stored XML-RPC logger settings.
	 */
	public function get_stored_settings() {
		$defaults = array(
			'log_incoming_xmlrpc_requests' => true,
			'log_xmlrpc_requests_as_json'  => false,
		);
		$settings = get_option( 'jetpack_xmlrpc_logger_settings', $defaults );
		return wp_parse_args( $settings, $defaults );
	}

	/**
	 * Saves the XML-RPC logger settings.
	 */
	public function maybe_handle_submit() {
		if ( isset( $_POST['save_xmlrpc_logger'] ) ) {
			check_admin_referer( 'xmlrpc_logger_nonce' );
		} else {
			return;
		}
		$this->settings                                 = $this->get_stored_settings();
		$this->settings['log_incoming_xmlrpc_requests'] = isset( $_POST['log_incoming_xmlrpc_requests'] );
		$this->settings['log_xmlrpc_requests_as_json']  = isset( $_POST['log_xmlrpc_requests_as_json'] );
		return update_option( 'jetpack_xmlrpc_logger_settings', $this->settings );
	}

	/**
	 * Renders the XML-RPC logger settings page.
	 */
	public function render_submenu_page() {
		$this->maybe_handle_submit();

		$log_incoming_xmlrpc_requests_checked = $this->settings['log_incoming_xmlrpc_requests'] ? 'checked="checked"' : '';
		$log_xmlrpc_requests_as_json_checked  = $this->settings['log_xmlrpc_requests_as_json'] ? 'checked="checked"' : '';
		?>
		<h1>XML-RPC Logger</h1>
		<p>This module helps you log all incoming XML-RPC requests.</p>
		<p>All instances of logging are stored in debug.log. Nothing done here will alter or expose sensitive data.</p>
		<hr>

		<h2>Current XML-RPC options being used by the module:</h2>
		<form method="post">

		<?php wp_nonce_field( 'xmlrpc_logger_nonce' ); ?>

		<div>
			<table class="form-table">
				<tbody>
					<tr>
						<th scope=row>
							Log incoming XML-RPC requests
						</th>
						<td>
						<fieldset>
							<label for="log_incoming_xmlrpc_requests">
								<input type="checkbox" name="log_incoming_xmlrpc_requests" id="log_incoming_xmlrpc_requests"
								<?php echo esc_attr( $log_incoming_xmlrpc_requests_checked ); ?> />
								Enables logging of incoming XML-RPC requests.
							</label>
						</fieldset>
						</td>
					</tr>
					<tr>
						<th scope=row>
							Log as JSON
						</th>
						<td>
						<fieldset>
							<label for="log_xmlrpc_requests_as_json">
								<input type="checkbox" name="log_xmlrpc_requests_as_json" id="log_xmlrpc_requests_as_json"
								<?php echo esc_attr( $log_xmlrpc_requests_as_json_checked ); ?> />
								Maps the XML structure to JSON and pretty-prints it.
							</label>
						</fieldset>
						</td>
					</tr>
				</tbody>
			</table>

		</div>

		<div>
			<input type="submit" name="save_xmlrpc_logger" value="Update" class="button button-primary" />
		</div>
		</form>
		<?php
	}

	/**
	 * Logs a message.
	 *
	 * Checks if WP_DEBUG_LOG is enabled and logs the message.
	 * If the l() function exists, it is used to log the message.
	 * Otherwise, the message is logged using error_log().
	 *
	 * @param string $message The message to log.
	 */
	public function log( $message ) {
		if ( ! ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) ) {
			return;
		}
		if ( function_exists( 'l' ) ) {
			l( $message );
		} else {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( $message );
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
			$this->log( 'XML-RPC Request: Empty payload' );
			return;
		}
		libxml_use_internal_errors( true );
		$xml = simplexml_load_string( $xml_string );

		if ( $xml ) {
			// Extract the method name
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$method_name = $xml->methodName ? (string) $xml->methodName : 'Unknown Method';
			$formatted   = $this->settings['log_xmlrpc_requests_as_json'] ? $this->convert_xml_rpc_to_json( $xml ) : $this->pretty_print_xml( $xml_string );

			// Format and log the request
			if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
				$log_message  = "XML-RPC Request - Method: $method_name\n";
				$log_message .= "Payload:\n" . $formatted . "\n";
				$this->log( $log_message );
			}
		} else {
			$this->log( 'XML-RPC Request: Invalid XML - ' . libxml_get_errors()[0]->message );
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
