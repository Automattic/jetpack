<?php
/**
 * The Mocker class creates mock data userful for testing.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

use Automattic\Jetpack\Debug_Helper\Mocker\Runner_Interface;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/inc/mockers/interface-runner.php';

/**
 * REST_API_Tester to test REST API endpoints.
 */
class Mocker {

	const REST_BASE = 'jetpack-debug';

	/**
	 * List of available runners.
	 *
	 * @var string[]
	 */
	private $runners = array(
		'options' => 'Options',
		'nonces'  => 'Nonces (stored in options)',
		'waf'     => 'Firewall blocked requests',
	);

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'rest_api_init', array( $this, 'register_endpoints' ) );
	}

	/**
	 * Register the REST endpoint.
	 */
	public function register_endpoints() {
		register_rest_route(
			self::REST_BASE,
			'/mocker',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'run' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Mocker',
			'Mocker',
			'manage_options',
			'mocker',
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
		if ( strpos( $hook, 'jetpack-debug_page_mocker' ) === 0 ) {
			wp_enqueue_style( 'mocker_style', plugin_dir_url( __FILE__ ) . 'inc/css/mocker.css', array(), JETPACK_DEBUG_HELPER_VERSION );
			wp_enqueue_script( 'mocker_script', plugin_dir_url( __FILE__ ) . 'inc/js/mocker.js', array( 'wp-api' ), JETPACK_DEBUG_HELPER_VERSION, true );

			add_filter(
				'script_loader_tag',
				function ( $tag, $handle ) {
					if ( 'mocker_script' === $handle ) {
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
			'wp-mocker',
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_mocker' ),
			)
		);

		?>
		<h1>Fastest Data Mocker in Town!</h1>

		<div class="jetpack-debug-mocker">
			<form method="post" id="jetpack-debug-mocker-form">
				<div class="mocker-block">
					<label for="mocker-data">Data:</label>
					<div class="mocker-field">
						<select name="data" id="mocker-data">
							<?php foreach ( $this->runners as $key => $name ) : ?>
								<option value="<?php echo esc_html( $key ); ?>"><?php echo esc_html( $name ); ?></option>
							<?php endforeach ?>
						</select>
					</div>
				</div>

				<div class="mocker-block">
					<label for="mocker-number">How Many:</label>
					<div class="mocker-field">
						<input type="number" name="number" class="input-number" id="mocker-number" value="50">
					</div>
				</div>

				<div class="mocker-block align-right">
					<button type="submit" class="button-right" id="mocker-submit">Run! 🚀</button>
				</div>

				<div id="mocker-response" class="block-hide"></div>
			</form>
		</div>
		<?php
	}

	/**
	 * Load the class.
	 */
	public static function register_mocker() {
		new Mocker();
	}

	/**
	 * Initialize the runner and run it.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function run( WP_REST_Request $request ) {
		$params = $request->get_query_params();

		$runner = empty( $params['data'] ) ? null : $params['data'];
		$number = empty( $params['number'] ) ? null : (int) $params['number'];

		if ( ! $runner || ! array_key_exists( $runner, $this->runners ) ) {
			return new WP_Error( 'unknown_runner' );
		}

		if ( ! $number ) {
			return new WP_Error( 'invalid_number' );
		}

		$filename = __DIR__ . "/inc/mockers/class-{$runner}-runner.php";
		if ( ! file_exists( $filename ) ) {
			return new WP_Error( 'runner_not_found' );
		}

		require_once $filename;

		$class_name = '\Automattic\Jetpack\Debug_Helper\Mocker\\' . ucfirst( $runner ) . '_Runner';

		if ( ! class_exists( $class_name ) || ! is_a( $class_name, Runner_Interface::class, true ) ) {
			return new WP_Error( 'invalid_runner' );
		}

		$runner = new $class_name();

		$result = $runner->run( (int) $params['number'] );

		if ( $result instanceof WP_Error ) {
			return $result;
		}

		if ( false === $result ) {
			return new WP_Error( 'runner_error' );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}
}

add_action( 'plugins_loaded', array( Mocker::class, 'register_mocker' ), 1000 );
