<?php
/**
 * REST API Tester file contains the class `REST_API_Tester` that tests REST API endpoints.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * REST_API_Tester to test REST API endpoints.
 */
class REST_API_Tester {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'REST API Tester',
			'REST API Tester',
			'manage_options',
			'rest-api-tester',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Enqueue scripts!
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'jetpack-debug_page_rest-api-tester' ) === 0 ) {
			wp_enqueue_style( 'rest_api_tester_style', plugin_dir_url( __FILE__ ) . 'inc/css/rest-api-tester.css', array(), JETPACK_DEBUG_HELPER_VERSION );
			wp_enqueue_script( 'rest_api_tester_script', plugin_dir_url( __FILE__ ) . 'inc/js/rest-api-tester.js', array( 'wp-api' ), JETPACK_DEBUG_HELPER_VERSION, true );

			add_filter(
				'script_loader_tag',
				function ( $tag, $handle ) {
					if ( 'rest_api_tester_script' === $handle ) {
						$tag = str_replace( '<script ', '<script type="module" ', $tag );
					}

					return $tag;
				},
				10,
				2
			);
		}
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		wp_localize_script(
			'wp-api',
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		?>
		<h1>REST API Tester</h1>

		<div class="jetpack-debug-api-tester">
			<form method="post" id="jetpack-debug-api-tester-form">
				<div class="api-tester-block">
					<label for="api-tester-method">Method:</label>
					<div class="api-tester-field">
						<select name="method" id="api-tester-method">
							<option value="get">GET</option>
							<option value="post">POST</option>
							<option value="put">PUT</option>
							<option value="delete">DELETE</option>
						</select>
					</div>
				</div>

				<div class="api-tester-block">
					<label for="api-tester-url">REST Route:</label>
					<div class="api-tester-field">
						<span class="rest-route-prefix">/</span>
						<input type="text" name="url" class="input-url" id="api-tester-url">
					</div>
				</div>

				<div class="api-tester-block api-tester-filter-post block-hide">
					<label for="api-tester-content-type">Content-Type:</label>
					<div class="api-tester-field">
						<select name="content-type" id="api-tester-content-type">
							<option name="application/json">application/json</option>
						</select>
					</div>
				</div>

				<div class="api-tester-block api-tester-filter-post block-hide">
					<label for="api-tester-body">Body:</label>
					<div class="api-tester-field">
						<textarea name="body" id="api-tester-body"></textarea>
					</div>
				</div>

				<div class="api-tester-block align-right">
					<sub>Registration Nonce: <?php echo esc_html( wp_create_nonce( 'jetpack-registration-nonce' ) ); ?></sub>&nbsp;
					<button type="submit" class="button-right" id="api-tester-submit">Send</button>
				</div>

				<div id="api-tester-response" class="block-hide"></div>
			</form>
		</div>
		<?php
	}

	/**
	 * Load the class.
	 */
	public static function register_rest_api_tester() {
		new REST_API_Tester();
	}
}

add_action( 'plugins_loaded', array( REST_API_Tester::class, 'register_rest_api_tester' ), 1000 );
