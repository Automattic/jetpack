<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * Plugin Name: IDC Simulator
 * Description: Cause an IDC on your site without having to clone it.
 * Author: Bestpack
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Class Broken_Token
 */
class IDC_Simulator {
	/**
	 * Notice type.
	 *
	 * @var mixed|string
	 */
	public $notice_type = '';

	/**
	 * Stored success notice type.
	 */
	const STORED_SUCCESS_NOTICE_TYPE = 'stored_success';

	/**
	 * Request success notice type.
	 */
	const REQUEST_SUCCESS_NOTICE_TYPE = 'request_success';

	/**
	 * Error notice type.
	 */
	const UNKNOWN_ERROR_NOTICE_TYPE = 'unknown_error';

	/**
	 * Options.
	 */
	const STORED_OPTIONS_KEY = 'idc_simulator_stored_options';

	/**
	 * Request option key.
	 */
	const REQUESTS_OPTION_KEY = 'idc_simulator_requests_option';

	/**
	 * IDC_Simulator constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'idc_simulator_register_submenu_page' ), 1000 );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Stored options.
		add_action( 'admin_post_store_current_options', array( $this, 'admin_post_store_current_options' ) );

		add_action( 'admin_post_idc_send_remote_request', array( $this, 'admin_post_idc_send_remote_request' ) );

		if ( isset( $_GET['idc_notice'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_notices', array( $this, 'display_notice' ) );
		}

		$settings = self::get_stored_settings();
		if ( ! $settings['idc_sync_status'] ) {
			// Display a notice when this module disables Sync.
			add_action( 'admin_notices', array( $this, 'display_sync_disabled_notice' ) );
		}
	}

	/**
	 * Do the main thing this class is aimed to do.
	 *
	 * @param string $url the siteurl value.
	 */
	public static function spoof_url( $url ) {
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			return $url;
		}

		$settings = self::get_stored_settings();

		if ( ! $settings['idc_simulation'] || ! self::should_spoof_url( $settings ) ) {
			return $url;
		}

		$settings['idc_siteurl'] = ( ! empty( $settings['idc_siteurl'] ) && is_string( $settings['idc_siteurl'] ) ) ?
			$settings['idc_siteurl'] : 'https://example.org/';

		return $settings['idc_siteurl'];
	}

	/**
	 * Determines whether the filtered url should be spoofed based on the IDC simulator settings.
	 *
	 * @param array $settings The IDC simulator settings.
	 *
	 * @return bool Whether the filtered siteurl or home values should be spoofed.
	 */
	public static function should_spoof_url( $settings ) {
		$filter_name = current_filter();

		if ( ( 'jetpack_sync_site_url' === $filter_name && ! $settings['idc_spoof_siteurl'] )
			|| ( 'jetpack_sync_home_url' === $filter_name && ! $settings['idc_spoof_home'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Enqueue scripts.
	 *
	 * @param string $hook Called hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'jetpack_page_broken-token' ) === 0 ) {
			wp_enqueue_style( 'broken_token_style', plugin_dir_url( __FILE__ ) . '/css/style.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Register's submenu.
	 */
	public function idc_simulator_register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'IDC Simulator',
			'IDC Simulator',
			'manage_options',
			'idc-simulator',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		$settings = $this->get_stored_settings();
		?>
		<h1>IDC Simulator 😱!</h1>
		<p>Cause an IDC on your site without having to clone it</p>

		<h2>Current ICD simulation settings:</h2>
		<p>URL spoofing: <?php echo esc_html( $settings['idc_simulation'] ); ?></p>
		<p>URL value: <?php echo esc_html( $settings['idc_siteurl'] ); ?></p>

		<hr>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">

			<table class="form-table" role="presentation">
			<tbody>
			<tr>
				<th scope="row">IDC Simulation</th>
				<td>
					<fieldset><legend class="screen-reader-text"><span>Site URL Spoofing</span></legend>
					<label><input type="radio" name="idc_simulation" value="1" <?php echo ( $settings['idc_simulation'] ? 'checked="checked"' : '' ); ?>> enabled</label><br>
					<label><input type="radio" name="idc_simulation" value="0" <?php echo ( ! $settings['idc_simulation'] ? 'checked="checked"' : '' ); ?>> disabled</label><br>
					</fieldset>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="idc_siteurl">Spoof URL</label></th>
				<td><input name="idc_siteurl" type="text" id="blogname" value="<?php echo esc_attr( $settings['idc_siteurl'] ); ?>" class="regular-text"></td>
			</tr>
			<tr>
				<th scope="row">URLs to spoof</th>
				<td>
					<label><input type="checkbox" name="idc_spoof_siteurl" <?php echo ( $settings['idc_spoof_siteurl'] ? 'checked="checked"' : '' ); ?>> Site URL</label><br>
					<label><input type="checkbox" name="idc_spoof_home" <?php echo ( $settings['idc_spoof_home'] ? 'checked="checked"' : '' ); ?>> Home URL</label><br>
				</td>
			</tr>

			<tr>
				<th scope="row">Sync</th>
				<td>
					<fieldset><legend class="screen-reader-text"><span>Control Whether Sync is Enabled</span></legend>
					<label><input type="radio" name="idc_sync_status" value="1" <?php echo ( $settings['idc_sync_status'] ? 'checked="checked"' : '' ); ?>> enabled</label><br>
					<label><input type="radio" name="idc_sync_status" value="0" <?php echo ( ! $settings['idc_sync_status'] ? 'checked="checked"' : '' ); ?>> disabled</label><br>
					</fieldset>
				</td>
			</tr>

			</tbody>
			</table>

			<input type="hidden" name="action" value="store_current_options">
			<?php wp_nonce_field( 'store-current-options' ); ?>
			<input type="submit" value="Store these options" class="button button-primary">
		</form>

		<hr>
		<hr>

		<?php $this->display_request_button(); ?>

		<hr>
		<hr>

		<?php $this->display_idc_transients_options(); ?>

		<hr>
		<hr>

		<?php
		$this->display_last_five_requests();
	}

	/**
	 * Display the IDC transient and option values.
	 */
	private function display_idc_transients_options() {
		?>
		<h2>Information about IDC</h2>
		<h3>Current IDC transient values</h3>
		<h4>jetpack_idc_local</h4>
		<pre><?php var_dump( get_transient( 'jetpack_idc_local' ) ); //phpcs:ignore ?></pre>

		<hr>

		<h3>Current IDC option values</h3>
		<h4>jetpack_sync_error_idc</h4>
		<pre><?php var_dump( get_option( 'jetpack_sync_error_idc' ) ); //phpcs:ignore ?></pre>
		<h4>jetpack_migrate_for_idc</h4>
		<pre><?php var_dump( get_option( 'jetpack_migrate_for_idc' ) ); //phpcs:ignore ?></pre>
		<h4>jetpack_safe_mode_confirmed</h4>
		<pre><?php var_dump( get_option( 'jetpack_safe_mode_confirmed' ) ); //phpcs:ignore ?></pre>

		<?php
	}

	/**
	 * Displays the remote request button.
	 */
	private function display_request_button() {
		?>
		<h2>Send an authenticated remote request to WPCOM</h2>

		<p>Sends an authenticated remote request to the <code>wpcom/v2/sites/{blog id}/jetpack-token-health/blog</code> endpoint.</p>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="idc_send_remote_request">
				<?php wp_nonce_field( 'idc-send-remote-request' ); ?>
			<input type="submit" value="Send Remote Request" class="button button-primary">
		</form>
		<?php
	}

	/**
	 * Displays the last five authenticated remote requests to WPCOM.
	 */
	private function display_last_five_requests() {
		?>
		<h3>Last Five Authenticated Remote Requests (the most recent request is at the top)</h3>
		<style>
				.requests-table,
				.requests-table th,
				.requests-table td {
					padding: 10px;
					border: 1px solid grey;
					border-collapse: collapse;
				}

				.requests-table .requests-table-url-header {
					width: 500px;
				}

				.requests-table .requests-table-response-header {
					width: 120px;
				}

				.requests-table .requests-table-url{
					word-break: break-all;
				}

				.requests-table .requests-table-response{
					text-align: center;
				}
		</style>

		<table class='requests-table'>
			<thead>
				<tr>
					<th class="requests-table-url-header">Request URL</th>
					<th class="requests-table-response-header">idc_detected</th>
					<th class="requests-table-response-header">migrated_for_idc</th>
				</tr>
			</thead>

		<?php
		$requests = get_option( self::REQUESTS_OPTION_KEY, array() );

		foreach ( $requests as $request ) {
			$idc_detected     = empty( $request['idc_detected'] ) ? 'false' : 'true';
			$migrated_for_idc = empty( $request['migrated_for_idc'] ) ? 'false' : 'true';
			?>
			<tr>
				<td class="requests-table-url"><?php echo esc_html( $request['url'] ); ?></td>
				<td class="requests-table-response"><?php echo esc_html( $idc_detected ); ?>
				<td class="requests-table-response"><?php echo esc_html( $migrated_for_idc ); ?></td>
			</tr>
			<?php
		}
		?>

		</table>
		<p>Note that only REST requests will return the <code>idc_detected</code> and <code>migrated_for_idc</code> values. Sync's xmlrpc requests return data in a different way.</p>
		<?php
	}

	/**
	 * Intercept the authenticated remote request responses and store the url and IDC responses.
	 *
	 * @param array|WP_Error $response The HTTP response.
	 */
	public static function intercept_request_response( $response ) {
		if ( ! is_array( $response ) ) {
			return;
		}

		$request_option = get_option( self::REQUESTS_OPTION_KEY, array() );

		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );
		$response      = array(
			'url'              => $response['http_response']->get_response_object()->url,
			'idc_detected'     => isset( $response_body['idc_detected'] ) ? $response_body['idc_detected'] : false,
			'migrated_for_idc' => isset( $response_body['migrated_for_idc'] ) ? $response_body['migrated_for_idc'] : false,
		);

		array_unshift( $request_option, $response );
		if ( count( $request_option ) > 5 ) {
			array_pop( $request_option );
		}

		update_option( self::REQUESTS_OPTION_KEY, $request_option );
	}

	/**
	 * Store options.
	 */
	public function admin_post_store_current_options() {
		check_admin_referer( 'store-current-options' );

		update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'idc_siteurl'       => isset( $_POST['idc_siteurl'] ) ? filter_var( wp_unslash( $_POST['idc_siteurl'] ) ) : null,
				'idc_simulation'    => isset( $_POST['idc_simulation'] ) ? filter_var( wp_unslash( $_POST['idc_simulation'] ) ) : null,
				'idc_spoof_siteurl' => isset( $_POST['idc_spoof_siteurl'] ) ? true : false,
				'idc_spoof_home'    => isset( $_POST['idc_spoof_home'] ) ? true : false,
				'idc_sync_status'   => isset( $_POST['idc_sync_status'] ) ? filter_var( wp_unslash( $_POST['idc_sync_status'] ) ) : null,
			)
		);

		$this->notice_type = 'stored_success';
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Send an authenticated remote request to WPCOM.
	 */
	public function admin_post_idc_send_remote_request() {
		check_admin_referer( 'idc-send-remote-request' );
		$error = false;

		if ( ! class_exists( 'Automattic\Jetpack\Connection\Client' ) ) {
			$this->notice_type = 'unknown_error';
			$error             = true;
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			$this->notice_type = 'unknown_error';
			$error             = true;
		}

		if ( ! $error ) {
			$url    = sprintf(
				'%s/%s/v%s/%s',
				Automattic\Jetpack\Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ),
				'wpcom',
				'2',
				'sites/' . $blog_id . '/jetpack-token-health/blog'
			);
			$method = 'GET';
			Automattic\Jetpack\Connection\Client::remote_request( compact( 'url', 'method' ) );

			$this->notice_type = 'request_success';
		}

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Shows a simple success notice.
	 */
	public function admin_notice__stored_success() {
		?>
		<div class="notice notice-success is-dismissible">
			<p>IDC simulation settings have been saved!</p>
		</div>
		<?php
	}

	/**
	 * Shows a simple success notice.
	 */
	public function admin_notice__request_success() {
		?>
		<div class="notice notice-success is-dismissible">
			<p>The remote request was successfully sent!</p>
		</div>
		<?php
	}

	/**
	 * Shows a simple error notice.
	 */
	public function admin_notice__unknown_error() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>Something went wrong.</p>
		</div>
		<?php
	}

	/**
	 * Display a notice if necessary.
	 */
	public function display_notice() {
		switch ( isset( $_GET['idc_notice'] ) ? $_GET['idc_notice'] : null ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			case self::STORED_SUCCESS_NOTICE_TYPE:
				return $this->admin_notice__stored_success();

			case self::REQUEST_SUCCESS_NOTICE_TYPE:
				return $this->admin_notice__request_success();

			case self::UNKNOWN_ERROR_NOTICE_TYPE:
				return $this->admin_notice__unknown_error();

			default:
				return;
		}
	}

	/**
	 * Display a notice when Sync is disabled by this module.
	 */
	public function display_sync_disabled_notice() {
		echo '<div class="notice notice-warning"><p>Sync has been disabled by the Jetpack Debug Helper plugin\'s IDC Simulator module.</p></div>';

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
				'idc_siteurl'       => '',
				'idc_simulation'    => false,
				'idc_spoof_siteurl' => true,
				'idc_spoof_home'    => true,
				'idc_sync_status'   => true,
			)
		);
	}

	/**
	 * Early initialization needed for some option value spoofing.
	 */
	public static function early_init() {
		add_filter( 'jetpack_sync_site_url', array( 'IDC_Simulator', 'spoof_url' ) );
		add_filter( 'jetpack_sync_home_url', array( 'IDC_Simulator', 'spoof_url' ) );
		add_action( 'jetpack_received_remote_request_response', array( 'IDC_Simulator', 'intercept_request_response' ) );

		$settings = self::get_stored_settings();

		if ( ! $settings['idc_sync_status'] ) {
			// Turn Sync off.
			add_filter( 'option_jetpack_sync_settings_disable', '__return_true' );
		}
	}

	/**
	 * Clears all stored option values.
	 */
	public function clear_stored_options() {
		delete_option( self::STORED_OPTIONS_KEY );
	}

	/**
	 * Just redirects back to the referrer. Keeping it DRY.
	 */
	public function admin_post_redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect(
				add_query_arg(
					array(
						'idc_notice' => $this->notice_type,
					),
					wp_get_referer()
				)
			);
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}
}

add_action( 'plugins_loaded', 'register_idc_simulator', 1000 );

/**
 * Load the simulator
 */
function register_idc_simulator() {
	if ( class_exists( 'Jetpack_Options' ) ) {
		new IDC_Simulator();
	} else {
		add_action( 'admin_notices', 'idc_simulator_jetpack_not_active' );
	}
}

/**
 * Notice for if Jetpack is not active.
 */
function idc_simulator_jetpack_not_active() {
	echo '<div class="notice info"><p>Jetpack Debug tools: Jetpack_Options package must be present for the IDC Simulator to work.</p></div>';
}

IDC_Simulator::early_init();

// phpcs:enable
