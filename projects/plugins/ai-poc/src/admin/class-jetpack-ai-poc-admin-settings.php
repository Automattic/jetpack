<?php
/**
 * Admin Settings for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Admin_Settings
 *
 * Handles admin settings page and API key management.
 */
class Jetpack_AI_POC_Admin_Settings {

	const OPTION_API_KEY = 'jetpack_ai_poc_anthropic_api_key';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register plugin settings.
	 */
	public function register_settings() {
		// Register the setting
		register_setting(
			'general',
			self::OPTION_API_KEY,
			array(
				'type'              => 'string',
				'sanitize_callback' => array( $this, 'sanitize_api_key' ),
				'default'           => '',
			)
		);

		// Add settings section
		add_settings_section(
			'jetpack_ai_poc_section',
			__( 'Jetpack AI POC', 'jetpack-ai-poc' ),
			array( $this, 'render_section_description' ),
			'general'
		);

		// Add settings field
		add_settings_field(
			self::OPTION_API_KEY,
			__( 'Anthropic API Key', 'jetpack-ai-poc' ),
			array( $this, 'render_api_key_field' ),
			'general',
			'jetpack_ai_poc_section'
		);
	}

	/**
	 * Render section description.
	 */
	public function render_section_description() {
		echo '<p>' . esc_html__( 'Configure the Anthropic API key for AI-powered WordPress actions.', 'jetpack-ai-poc' ) . '</p>';
	}

	/**
	 * Render API key field.
	 */
	public function render_api_key_field() {
		$api_key = get_option( self::OPTION_API_KEY, '' );
		?>
		<input
			type="password"
			id="<?php echo esc_attr( self::OPTION_API_KEY ); ?>"
			name="<?php echo esc_attr( self::OPTION_API_KEY ); ?>"
			value="<?php echo esc_attr( $api_key ); ?>"
			class="regular-text"
			placeholder="sk-ant-..."
		/>
		<p class="description">
			<?php echo esc_html__( 'Enter your Anthropic API key from the Anthropic Console.', 'jetpack-ai-poc' ); ?>
			<?php if ( ! empty( $api_key ) ) : ?>
				<br><span style="color: #00a32a;">✓ <?php echo esc_html__( 'API key is configured', 'jetpack-ai-poc' ); ?></span>
			<?php endif; ?>
		</p>
		<?php
	}

	/**
	 * Register REST API routes for settings.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack-ai-poc/v1',
			'/settings',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		register_rest_route(
			'jetpack-ai-poc/v1',
			'/settings',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args'                => array(
					'api_key' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => array( $this, 'sanitize_api_key' ),
					),
				),
			)
		);
	}

	/**
	 * Get settings via REST API.
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		$api_key = get_option( self::OPTION_API_KEY, '' );

		return new WP_REST_Response(
			array(
				'has_api_key' => ! empty( $api_key ),
				'api_key'     => ! empty( $api_key ) ? substr( $api_key, 0, 10 ) . '...' : '',
			)
		);
	}

	/**
	 * Update settings via REST API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function update_settings( $request ) {
		$api_key = $request->get_param( 'api_key' );

		$updated = update_option( self::OPTION_API_KEY, $api_key );

		return new WP_REST_Response(
			array(
				'success' => $updated,
				'message' => $updated ? 'API key saved successfully' : 'Failed to save API key',
			)
		);
	}

	/**
	 * Sanitize API key.
	 *
	 * @param string $api_key API key to sanitize.
	 * @return string
	 */
	public function sanitize_api_key( $api_key ) {
		return sanitize_text_field( trim( $api_key ) );
	}

	/**
	 * Check if current user has admin permission.
	 *
	 * @return bool
	 */
	public function check_admin_permission() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get the saved API key.
	 *
	 * @return string
	 */
	public static function get_api_key() {
		return get_option( self::OPTION_API_KEY, '' );
	}

	/**
	 * Check if API key is configured.
	 *
	 * @return bool
	 */
	public static function has_api_key() {
		return ! empty( self::get_api_key() );
	}
}
