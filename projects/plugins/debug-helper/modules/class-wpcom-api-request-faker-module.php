<?php
/**
 * Plugin Name: WPCOM API Request Faker
 * Description: Send custom requests to the WPcom API, authorized via your Jetpack connection.
 * Author: Bestpack
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Class WPCOM_API_Request_Faker_Module
 */
class WPCOM_API_Request_Faker_Module {

	/**
	 * WPCOM_API_Request_Faker constructor.
	 */
	public static function init() {
		$module = new static();
		add_action( 'admin_menu', array( $module, 'register_submenu_page' ), 2000 );
		add_action( 'admin_enqueue_scripts', array( $module, 'enqueue_scripts' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'WPcom API Request Faker',
			'WPcom API Request Faker',
			'manage_options',
			'wpcom-api-request-faker',
			array( $this, 'render' ),
			9999
		);
	}

	/**
	 * Enqueue scripts!
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( str_starts_with( $hook, 'jetpack-debug_page_wpcom-api-request-faker' ) ) {
			wp_enqueue_style( 'rest_api_tester_style', plugin_dir_url( __FILE__ ) . 'inc/css/rest-api-tester.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Render the details panel.
	 */
	public function render() {
		$version = '2';
		$method  = 'get';

		if ( ! class_exists( 'Automattic\Jetpack\Connection\Client' ) || ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			echo '<p>Error: This helper requires a jetpack connection to work. Please ensure that you have set one up before using.</p>';
			return;
		}

		// Handle the form submit
		if ( ! empty( $_POST ) ) {
			if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ?? '' ) ), 'wpcom-api-request-faker' ) ) {
				echo '<p>Wrong nonce, aborting.</p>';
				return;
			}

			$is_connected = ( new Connection_Manager() )->is_connected();
			if ( ! $is_connected ) {
				echo '<p>Site is not connected, please establish a jetpack connection first</p>';
				return;
			}

			$api_url = '/' . sanitize_text_field( wp_unslash( $_POST['url'] ?? '' ) );
			$version = sanitize_text_field( wp_unslash( $_POST['version'] ?? '2' ) );
			$method  = sanitize_text_field( wp_unslash( $_POST['method'] ?? 'get' ) );

			$body = null;
			if ( 'post' === $_POST['method'] || 'put' === $_POST['method'] ) {
				$body = json_decode( sanitize_text_field( wp_unslash( $_POST['body'] ?? '' ) ), true );
			}

			$response = Client::wpcom_json_api_request_as_blog(
				$api_url,
				$version,
				array( 'method' => sanitize_text_field( wp_unslash( $_POST['method'] ?? '2' ) ) ),
				$body,
				'wpcom'
			);

			$response_code = wp_remote_retrieve_response_code( $response );

			// Display error or response
			if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response['body'] ) ) {
				?>
				<h2>Something went wrong, here is the error (http code <?php echo esc_html( $response_code ); ?>)</h2>
				<?php // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export ?>
				<pre><?php echo esc_html( var_export( $response, true ) ); ?></pre>
				<?php
			} else {
				$human_api_url = '/wpcom/v' . $version . $api_url;
				?>
				<h2>Response for <?php echo esc_html( $human_api_url ); ?></h2>
				<?php
				$body            = wp_remote_retrieve_body( $response );
				$looks_like_json = json_decode( $body ) !== null;
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export
				echo '<pre>' . esc_html( var_export( $looks_like_json ? json_decode( $body, true ) : $body, true ) ) . '</pre>';
			}
		}

		?>
		<div id='wpcom-api-request-faker'>

			<h1>WPcom API Request Faker</h1>

			<div class="jetpack-debug-api-tester">
				<form method="post" id="jetpack-debug-api-tester-form">
					<div class="api-tester-block">
						<label for="api-tester-method">Method:</label>
						<div class="api-tester-field">
							<select name="method" id="api-tester-method">
								<option value="get" <?php echo $method === 'get' ? 'selected="selected"' : ''; ?>>GET</option>
								<option value="post" <?php echo $method === 'post' ? 'selected="selected"' : ''; ?>>POST</option>
								<option value="put" <?php echo $method === 'put' ? 'selected="selected"' : ''; ?>>PUT</option>
								<option value="delete" <?php echo $method === 'delete' ? 'selected="selected"' : ''; ?>>DELETE</option>
							</select>
						</div>
					</div>

					<div class="api-tester-block">
						<label for="api-tester-version">Version:</label>
						<div class="api-tester-field">
							<select name="version" id="api-tester-version">
								<option <?php echo $version === '2' ? 'selected="selected"' : ''; ?>>2</option>
								<option <?php echo $version === '3' ? 'selected="selected"' : ''; ?>>3</option>
								<option <?php echo $version === '4' ? 'selected="selected"' : ''; ?>>4</option>
							</select>
						</div>
					</div>

					<div class="api-tester-block">
						<label for="api-tester-url">REST Route:</label>
						<div class="api-tester-field">
							<span class="rest-route-prefix">/</span>
							<input type="text" name="url" class="input-url" id="api-tester-url" value="<?php echo esc_attr( sanitize_text_field( wp_unslash( $_POST['url'] ?? '' ) ) ); ?>">
						</div>
					</div>

					<div class="api-tester-block api-tester-filter-post">
						<label for="api-tester-content-type">Content-Type:<br><small>ignored if irrelevant</small></label>
						<div class="api-tester-field">
							<select name="content-type" id="api-tester-content-type">
								<option name="application/json">application/json</option>
							</select>
						</div>
					</div>

					<div class="api-tester-block api-tester-filter-post">
						<label for="api-tester-body">Body:<br><small>ignored if irrelevant</small></label>
						<div class="api-tester-field">
							<textarea name="body" id="api-tester-body"><?php echo esc_html( sanitize_text_field( wp_unslash( $_POST['body'] ?? '' ) ) ); ?></textarea>
						</div>
					</div>

					<div class="api-tester-block align-right">
						<input type="hidden" name="nonce" value="<?php echo esc_attr( wp_create_nonce( 'wpcom-api-request-faker' ) ); ?>">
						<button type="submit" class="button-right" id="api-tester-submit">Send</button>
					</div>

					<div id="api-tester-response" class="block-hide"></div>
				</form>
			</div>
		</div>
		<?php
	}
}

WPCOM_API_Request_Faker_Module::init();
