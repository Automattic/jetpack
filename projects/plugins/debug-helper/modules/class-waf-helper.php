<?php
/**
 * Jetpack WAF (Web Application Firewall) helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Helps debug WAF
 */
class Waf_Helper {

	/**
	 * Options.
	 */
	const STORED_OPTIONS_KEY = 'waf_helper_option_name';

	/**
	 * Construction.
	 */
	public function __construct() {
		add_filter( 'filesystem_method', array( $this, 'break_file_system' ), 10, 1 );
		add_filter( 'pre_http_request', array( $this, 'break_wpcom_request' ), 10, 3 );

		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Firewall Helper',
			'Firewall Helper',
			'manage_options',
			'firewall-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Enqueue scripts
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( str_starts_with( $hook, 'jetpack-debug_page_firewall-helper' ) ) {
			wp_enqueue_style( 'waf_helper_style', plugin_dir_url( __FILE__ ) . 'inc/css/waf-helper.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Retrieves the stored IDC options.
	 *
	 * @return array
	 */
	public static function get_stored_settings() {
		return wp_parse_args(
			get_option( self::STORED_OPTIONS_KEY ),
			array(
				'break_file_system'    => false,
				'break_wpcom_requests' => false,
			)
		);
	}

	/**
	 * Break the filesystem if configured.
	 *
	 * @param string $filesystem The filesystem method.
	 * @return string
	 */
	public function break_file_system( $filesystem ) {
		$settings = $this->get_stored_settings();
		if ( ! $settings['break_file_system'] ) {
			return $filesystem;
		}

		return 'Code is poetry.';
	}

	/**
	 * Break WPCOM requests by mocking a 503 response.
	 *
	 * @param array  $response The response.
	 * @param array  $args     The arguments.
	 * @param string $url      The URL.
	 */
	public function break_wpcom_request( $response, $args, $url ) {
		if ( ! str_contains( $url, 'waf-rules' ) ) {
			return $response;
		}

		$settings = $this->get_stored_settings();

		if ( ! $settings['break_wpcom_requests'] ) {
			return $response;
		}

		return array(
			'body'     => '',
			'response' => array(
				'code'    => 503,
				'message' => '',
			),
		);
	}

	/**
	 * Handles the form submission
	 *
	 * @return bool
	 */
	private function handle_submit() {
		if ( ! isset( $_POST['save_waf_helper'] ) ) {
			return;
		}

		check_admin_referer( 'waf_helper_nonce' );

		$updated = update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'break_file_system'    => isset( $_POST['break_file_system'] ) ? true : false,
				'break_wpcom_requests' => isset( $_POST['break_wpcom_requests'] ) ? true : false,
			)
		);

		return $updated;
	}

	/**
	 * Render a file preview.
	 *
	 * @global $wp_filesystem
	 *
	 * @param string $file The file path in the WAF directory.
	 *
	 * @return void
	 */
	public function render_waf_file( $file ) {
		global $wp_filesystem;

		$file_path = Waf_Runner::get_waf_file_path( $file );
		if ( $wp_filesystem->exists( $file_path ) ) {
			$file_contents = $wp_filesystem->get_contents( $file_path );
			$file_mtime    = $wp_filesystem->mtime( $file_path );
			?>
			<p>File Path: <code><?php echo esc_html( $file_path ); ?></code></p>
			<p>Last Modified: <code><?php echo esc_html( gmdate( 'Y-m-d H:i:s', $file_mtime ) ); ?></code></p>
			<textarea disabled class="jpdebug-waf-filecontents"><?php echo esc_html( $file_contents ); ?></textarea>
			<?php
		}
	}

	/**
	 * Render the UI.
	 */
	public function render_ui() {
		// Handle form submission.
		$this->handle_submit();

		// Initialize the filesystem.
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();

		// Get settings.
		$settings                     = $this->get_stored_settings();
		$break_file_system_checked    = $settings['break_file_system'] ? 'checked="checked"' : '';
		$break_wpcom_requests_checked = $settings['break_wpcom_requests'] ? 'checked="checked"' : '';

		?>
		<h1>Firewall Helper</h1>
		<p>Utilities to help develop and debug the Jetpack Web Application Firewall (WAF).</p>

		<hr>

		<h2>Status</h2>
		<p>WAF is supported: <code><?php echo Waf_Runner::is_supported_environment() ? 'true' : 'false'; ?></code></p>
		<p>Firewall status: <code><?php echo Waf_Runner::is_enabled() ? 'enabled' : 'disabled'; ?></code></p>

		<hr>

		<h2>Break Stuff</h2>
		<form method="post" class="jpdebug-waf-settings">

			<?php wp_nonce_field( 'waf_helper_nonce' ); ?>

			<div>
				<label for="break_file_system">
					<input type="checkbox" name="break_file_system" id="break_file_system" <?php echo esc_attr( $break_file_system_checked ); ?> />
					<strong>Break File System Access</strong>
					<br>
					Causes trouble by defining the "FS_METHOD" to an invalid value. Useful for mocking a site with an inaccessible filesystem.
				</label>
			</div>

			<div>
				<label for="break_wpcom_requests">
					<input type="checkbox" name="break_wpcom_requests" id="break_wpcom_requests" <?php echo esc_attr( $break_wpcom_requests_checked ); ?> />
					<strong>Break WPCOM Requests</strong>
					<br>
					Wreak havoc by injecting errors into WPCOM requests. Useful for mocking a site that cannot access the latest firewall rules from WPCOM.
				</label>
			</div>

			<div>
				<input type="submit" name="save_waf_helper" value="Update" class="button button-primary" />
			</div>
		</form>

		<hr>

		<h2>Blocklog</h2>
		<?php $this->render_waf_file( 'waf-blocklog' ); ?>

		<hr>

		<h2>Rules Entrypoint</h2>
		<?php $this->render_waf_file( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE ); ?>

		<hr>

		<h2>Automatic Rules</h2>
		<?php $this->render_waf_file( Waf_Rules_Manager::AUTOMATIC_RULES_FILE ); ?>

		<hr>

		<h2>IP Allow List</h2>
		<?php $this->render_waf_file( Waf_Rules_Manager::IP_ALLOW_RULES_FILE ); ?>

		<hr>

		<h2>IP Block List</h2>
		<?php $this->render_waf_file( Waf_Rules_Manager::IP_BLOCK_RULES_FILE ); ?>

		<?php
	}
}

add_action(
	'init',
	function () {
		new Waf_Helper();
	},
	1000
);
