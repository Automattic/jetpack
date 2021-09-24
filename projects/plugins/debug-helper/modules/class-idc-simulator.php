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
	 * Whether to enable siteurl spoofing.
	 *
	 * @var Boolean
	 */
	protected $idc_simulation_enabled = false;

	/**
	 * What URL to use instead of the real siteurl.
	 *
	 * @var Boolean
	 */
	protected $idc_siteurl;

	/**
	 * Options.
	 */
	const STORED_OPTIONS_KEY = 'idc_simulator_stored_options';

	/**
	 * IDC_Simulator constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'idc_simulator_register_submenu_page' ), 1000 );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Stored options.
		add_action( 'admin_post_store_current_options', array( $this, 'admin_post_store_current_options' ) );

		$settings                     = $this->get_stored_settings();
		$this->idc_simulation_enabled = 1 === intval( $settings['idc_simulation'] ) ?
			true : false;
		$this->idc_siteurl            = ( ! empty( $settings['idc_siteurl'] ) && is_string( $settings['idc_siteurl'] ) ) ?
			$settings['idc_siteurl'] : 'https://example.org/';

		add_filter( 'jetpack_sync_site_url', array( $this, 'spoof_siteurl' ) );
	}

	/**
	 * Do the main thing this class is aimed to do.
	 *
	 * @param string $url the siteurl value.
	 */
	public function spoof_siteurl( $url ) {
		if ( false === $this->idc_simulation_enabled ) {
			return $url;
		}

		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			return $url;
		}

		return $this->idc_siteurl;
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
		<p>Site URL spoofing: <?php echo esc_html( $settings['idc_simulation'] ); ?></p>
		<p>Site URL value: <?php echo esc_html( $settings['idc_siteurl'] ); ?></p>

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

			</tbody>
			</table>

			<input type="hidden" name="action" value="store_current_options">
			<?php wp_nonce_field( 'store-current-options' ); ?>
			<input type="submit" value="Store these options" class="button button-primary">
		</form>

		<hr>
		<?php
	}

	/**
	 * Store options.
	 */
	public function admin_post_store_current_options() {
		check_admin_referer( 'store-current-options' );
		$this->notice_type = 'store-options';

		update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'idc_siteurl'    => $_POST['idc_siteurl'],
				'idc_simulation' => $_POST['idc_simulation'],
			)
		);

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Retrieves the stored IDC options.
	 *
	 * @return array
	 */
	public function get_stored_settings() {
		return wp_parse_args(
			get_option( self::STORED_OPTIONS_KEY ),
			array(
				'idc_siteurl'    => '',
				'idc_simulation' => false,
			)
		);
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
						'notice' => $this->notice_type,
						'nonce'  => wp_create_nonce( 'jetpack_debug_broken_token_admin_notice' ),
					),
					wp_get_referer()
				)
			);
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

	/**
	 * Displays an admin notice...
	 */
	public function render_admin_notice() {
		switch ( $this->notice_type ) {
			case 'store-options':
				$message = 'IDC Simulation settings saved successfully!';
				break;
			default:
				$message = 'Setting saved!';
				break;
		}

		printf( '<div class="notice notice-success"><p>%s</p></div>', esc_html( $message ) );
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

// phpcs:enable
