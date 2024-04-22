<?php
/**
 * The class allows setting fake cookie states to test the UI.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

use Automattic\Jetpack\CookieState as State;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * REST_API_Tester to test REST API endpoints.
 */
class Cookie_State {

	const REST_BASE = 'jetpack-debug';

	/**
	 * Allowed state keys.
	 *
	 * @var array
	 */
	private $keys = array(
		'error',
		'error_description',
		'message',
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
			'/cookie-state',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'save' ),
				'permission_callback' => function () {
						return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'key'   => array(
						'description' => 'The state key.',
						'type'        => 'string',
						'required'    => true,
					),
					'value' => array(
						'description' => 'The state value.',
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Cookie State Faker',
			'Cookie State Faker',
			'manage_options',
			'cookie-state',
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
		if ( str_starts_with( $hook, 'jetpack-debug_page_cookie-state' ) ) {
			wp_enqueue_style( 'cookie_state_style', plugin_dir_url( __FILE__ ) . 'inc/css/cookie-state.css', array(), JETPACK_DEBUG_HELPER_VERSION );
			wp_enqueue_script( 'cookie_state_script', plugin_dir_url( __FILE__ ) . 'inc/js/cookie-state.js', array( 'wp-api' ), JETPACK_DEBUG_HELPER_VERSION, true );

			add_filter(
				'script_loader_tag',
				function ( $tag, $handle ) {
					if ( 'cookie_state_script' === $handle ) {
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
			'wp-cookie-state',
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_cookie_state' ),
			)
		);

		?>
		<h1>Cookie State Faker</h1>

		<div class="jetpack-debug-cookie-state">
			<h2>Current Values</h2>

			<ul class="cookie-state-values-list">
				<?php foreach ( $this->keys as $key ) : ?>
					<li><strong><?php echo esc_html( $key ); ?>:</strong> <?php echo esc_html( ( new State() )->state( $key ) ); ?></li>
				<?php endforeach ?>
			</ul>

			<h2>Update Values</h2>

			<form method="post" id="jetpack-debug-cookie-state-form">
				<div class="cookie-state-block">
					<label for="cookie-state-key">Key:</label>
					<div class="cookie-state-field">
						<select name="key" id="cookie-state-key">
							<?php foreach ( $this->keys as $key ) : ?>
								<option value="<?php echo esc_html( $key ); ?>"><?php echo esc_html( $key ); ?></option>
							<?php endforeach ?>
						</select>
					</div>
				</div>

				<div class="cookie-state-block">
					<label for="cookie-state-value">Value:</label>
					<div class="cookie-state-field">
						<input type="text" name="value" class="input-text" id="cookie-state-value" value="">
					</div>
				</div>

				<div class="cookie-state-block">
					<button type="submit" class="button button-primary" id="cookie-state-submit">Save</button>
				</div>

				<div id="cookie-state-response" class="block-hide"></div>
			</form>
		</div>
		<?php
	}

	/**
	 * Load the class.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Update the value
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function save( WP_REST_Request $request ) {
		$params = $request->get_query_params();

		$key = empty( $params['key'] ) ? null : $params['key'];

		if ( ! $key || ! in_array( $key, $this->keys, true ) ) {
			return new WP_Error( 'unknown_key' );
		}

		if ( ! array_key_exists( 'value', $params ) ) {
			return new WP_Error( 'missing_value' );
		}

		( new State() )->state( $key, $params['value'] );

		return rest_ensure_response( array( 'success' => true ) );
	}
}

add_action( 'plugins_loaded', array( Cookie_State::class, 'init' ), 1000 );
