<?php
/**
 * XMLRPC BLocker file contains the class `XMLRPC_Blocker` that blocks XMLRPC requests.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * Class XMLRPC_Blocker
 *
 * Blocks all XML-RPC requests coming to the site.
 *
 * @package Automattic\Jetpack\Debug_Helper
 */
class XMLRPC_Blocker {
	/**
	 * The settings.
	 *
	 * @var array
	 * @access private
	 */
	private $settings;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->settings = $this->get_stored_settings();

		if ( ! empty( $this->settings['block_xmlrpc'] ) ) {
			// Display a notice when this module disables XML-RPC.
			add_action( 'admin_notices', array( $this, 'display_xmlrpc_blocked_notice' ) );

			// Block XML-RPC if it's disabled.
			add_action( 'init', array( $this, 'block_xmlrpc' ) );
		}

		// Hook into the WordPress admin menu to register the XML-RPC blocker submenu page.
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
	}

	/**
	 * Registers the XML-RPC blocker submenu page.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Broken XML-RPC',
			'Broken XML-RPC',
			'manage_options',
			'jetpack_xmlrpc_blocker',
			array( $this, 'render_submenu_page' )
		);
	}

	/**
	 * Retrieves the stored XML-RPC blocker settings.
	 *
	 * @return array The stored XML-RPC blocker settings.
	 */
	public function get_stored_settings() {
		$defaults = array(
			'block_xmlrpc'             => false,
			'allow_alternate_requests' => false,
		);
		$settings = get_option( 'jetpack_xmlrpc_blocker_settings', $defaults );
		return wp_parse_args( $settings, $defaults );
	}

	/**
	 * Saves the XML-RPC blocker settings.
	 */
	public function maybe_handle_submit() {
		if ( isset( $_POST['save_xmlrpc_blocker'] ) ) {
			check_admin_referer( 'xmlrpc_blocker_nonce' );
		} else {
			return;
		}
		$this->settings                             = $this->get_stored_settings();
		$this->settings['block_xmlrpc']             = isset( $_POST['block_xmlrpc'] );
		$this->settings['allow_alternate_requests'] = isset( $_POST['allow_alternate_requests'] );
		update_option( 'jetpack_xmlrpc_blocker_settings', $this->settings );
	}

	/**
	 * Renders the XML-RPC blocker settings page.
	 */
	public function render_submenu_page() {
		$this->maybe_handle_submit();

		$block_xmlrpc             = $this->settings['block_xmlrpc'] ? 'checked="checked"' : '';
		$allow_alternate_requests = $this->settings['allow_alternate_requests'] ? 'checked="checked"' : '';
		?>
		<h1>XML-RPC Blocker</h1>
		<p>Break XML-RPC API any way you want.</p>
		<hr>

		<form method="post">

		<?php wp_nonce_field( 'xmlrpc_blocker_nonce' ); ?>

		<div>
			<table class="form-table">
				<tbody>
					<tr>
						<th scope=row>
							Block incoming XML-RPC requests
						</th>
						<td>
						<fieldset>
							<label for="block_xmlrpc">
								<input type="checkbox" name="block_xmlrpc" id="block_xmlrpc"
								<?php echo esc_attr( $block_xmlrpc ); ?> />
								Block all incoming XMl-RPC requests.
							</label>
						</fieldset>
						</td>
					</tr>
					<tr>
						<th scope=row>
							Allow the Alternate XML-RPC
						</th>
						<td>
						<fieldset>
							<label for="allow_alternate_requests">
								<input type="checkbox" name="allow_alternate_requests" id="allow_alternate_requests"
								<?php echo esc_attr( $allow_alternate_requests ); ?> />
								Make an exception for requests coming to the Alternate XML-RPC endpoint.
							</label>
						</fieldset>
						</td>
					</tr>
				</tbody>
			</table>

		</div>

		<div>
			<input type="submit" name="save_xmlrpc_blocker" value="Update" class="button button-primary" />
		</div>
		</form>
		<?php
	}

	/**
	 * Display a notice when XML-RPC is being blocked.
	 */
	public function display_xmlrpc_blocked_notice() {
		wp_admin_notice(
			"XML-RPC is disabled by the Jetpack Debug Helper's Broken XML-RPC module ("
				. ( empty( $this->settings['allow_alternate_requests'] ) ? 'Alternate still works' : 'Alternate also blocked' )
				. ').',
			array(
				'type' => 'warning',
			)
		);
	}

	/**
	 * Determine if this is an XML-RPC request, and block if it is.
	 *
	 * @return void
	 */
	public function block_xmlrpc() {
		if ( $this->settings['allow_alternate_requests'] ) {
			if ( ! empty( $_SERVER['SCRIPT_NAME'] ) && '/xmlrpc.php' === $_SERVER['SCRIPT_NAME'] ) {
				http_response_code( 403 );
				die( 'XML-RPC requests are not allowed.' );
			}

			return;
		}

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			http_response_code( 403 );
			die( 'XML-RPC requests are not allowed (even alternate ones).' );
		}
	}

	/**
	 * Load the class.
	 */
	public static function register_xmlrpc_blocker() {
		new self();
	}
}

add_action( 'plugins_loaded', array( XMLRPC_Blocker::class, 'register_xmlrpc_blocker' ), 1000 );
