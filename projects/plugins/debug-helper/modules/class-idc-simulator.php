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
	public $notice_type = 'success';

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

		if ( isset( $_GET['idc_notice'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_notices', array( $this, 'admin_notice__success' ) );
		}
	}

	/**
	 * Do the main thing this class is aimed to do.
	 *
	 * @param string $url the siteurl value.
	 */
	public static function spoof_siteurl( $url ) {
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			return $url;
		}

		$settings                   = self::get_stored_settings();
		$settings['idc_simulation'] = $settings['idc_simulation'] ?
			true : false;
		$settings['idc_siteurl']    = ( ! empty( $settings['idc_siteurl'] ) && is_string( $settings['idc_siteurl'] ) ) ?
			$settings['idc_siteurl'] : 'https://example.org/';

		if ( false === $settings['idc_simulation'] ) {
			return $url;
		}

		return $settings['idc_siteurl'];
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

			</tbody>
			</table>

			<input type="hidden" name="action" value="store_current_options">
			<?php wp_nonce_field( 'store-current-options' ); ?>
			<input type="submit" value="Store these options" class="button button-primary">
		</form>

		<hr>

		<h2>Current IDC transient values</h2>
		<h3>jetpack_idc_local</h3>
		<pre><?php var_dump( get_transient( 'jetpack_idc_local' ) ); //phpcs:ignore ?></pre>

		<hr>
		<?php
	}

	/**
	 * Store options.
	 */
	public function admin_post_store_current_options() {
		check_admin_referer( 'store-current-options' );

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
	 * Shows a simple success notice.
	 */
	public function admin_notice__success() {
		?>
		<div class="notice notice-success is-dismissible">
			<p>IDC simulation settings have been saved!</p>
		</div>
		<?php
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
				'idc_siteurl'    => '',
				'idc_simulation' => false,
			)
		);
	}

	/**
	 * Early initialization needed for some option value spoofing.
	 */
	public static function early_init() {
		add_filter( 'jetpack_sync_site_url', array( 'IDC_Simulator', 'spoof_siteurl' ) );
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
