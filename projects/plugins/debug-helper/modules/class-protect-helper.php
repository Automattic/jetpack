<?php
/**
 * Jetpack Protect helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Helps debug Protect
 */
class Protect_Helper {

	/**
	 * Options.
	 */
	const STORED_OPTIONS_KEY = 'protect_helper_option_name';

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );

		add_action( 'admin_post_protect_helper_store_options', array( $this, 'admin_post_store_current_options' ) );

		if ( isset( $_GET['show_notice'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_notices', array( $this, 'display_notice' ) );
		}

		$settings = self::get_stored_settings();
		if ( $settings['overwrite_status'] ) {
			// Display a notice when this module overwrites Protect Status.
			add_action( 'admin_notices', array( $this, 'display_protect_overwritten_notice' ) );
		}

	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Protect Helper',
			'Protect Helper',
			'manage_options',
			'protect-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Renders the UI.
	 */
	public function render_ui() {
		$settings = $this->get_stored_settings();
		?>
		<h1>Protect Helper</h1>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">

		<table class="form-table" role="presentation">
		<tbody>
		<tr>
			<th scope="row">Overwrite Protect Status</th>
			<td>
				<fieldset><legend class="screen-reader-text"><span>If enable, Protet status fetched from the server will be ignored and the rules below will define the current status.</span></legend>
				<label><input type="radio" name="overwrite_status" value="1" <?php echo ( $settings['overwrite_status'] ? 'checked="checked"' : '' ); ?>> enabled</label><br>
				<label><input type="radio" name="overwrite_status" value="0" <?php echo ( ! $settings['overwrite_status'] ? 'checked="checked"' : '' ); ?>> disabled</label><br>
				</fieldset>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="idc_siteurl">Status</label></th>
			<td>
				<select name="status">
					<option value="empty" <?php selected( 'empty', $settings['status'] ); ?>>Empty - When the initial scan did not run yet</option>
					<option value="incomplete" <?php selected( 'incomplete', $settings['status'] ); ?>>Incomplete - When we have results, but some extensions were not scanned</option>
					<option value="complete" <?php selected( 'complete', $settings['status'] ); ?>>Complete - When we have results for all extensions</option>
				</select>
			</td>
		</tr>
		<tr>
			<th scope="row">Vulnerabilities</th>
			<td>
				<label><input type="checkbox" name="vuls_for_core" <?php echo ( $settings['vuls_for_core'] ? 'checked="checked"' : '' ); ?>> Add vulnerabilities to core</label><br>
				<label><input type="checkbox" name="vuls_for_plugins" <?php echo ( $settings['vuls_for_plugins'] ? 'checked="checked"' : '' ); ?>> Add vulnerabilities to Plugins</label><br>
				<label><input type="checkbox" name="vuls_for_themes" <?php echo ( $settings['vuls_for_themes'] ? 'checked="checked"' : '' ); ?>> Add vulnerabilities to Themes</label><br>
			</td>
		</tr>

		</tbody>
		</table>

		<input type="hidden" name="action" value="protect_helper_store_options">
		<?php wp_nonce_field( 'protect-helper-store-options' ); ?>
		<input type="submit" value="Store these options" class="button button-primary">
		</form>

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
				'overwrite_status' => false,
				'status'           => 'empty',
				'vuls_for_core'    => false,
				'vuls_for_plugins' => false,
				'vuls_for_themes'  => false,
			)
		);
	}

	/**
	 * Store options.
	 */
	public function admin_post_store_current_options() {
		check_admin_referer( 'protect-helper-store-options' );

		update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'overwrite_status' => isset( $_POST['overwrite_status'] ) ? filter_var( wp_unslash( $_POST['overwrite_status'] ) ) : null,
				'status'           => isset( $_POST['status'] ) ? filter_var( wp_unslash( $_POST['status'] ) ) : null,
				'vuls_for_core'    => isset( $_POST['vuls_for_core'] ) ? true : false,
				'vuls_for_plugins' => isset( $_POST['vuls_for_plugins'] ) ? true : false,
				'vuls_for_themes'  => isset( $_POST['vuls_for_themes'] ) ? true : false,
			)
		);

		$this->notice_type = 'stored_success';
		$this->admin_post_redirect_referrer();
	}

	/**
	 * Just redirects back to the referrer. Keeping it DRY.
	 */
	public function admin_post_redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect(
				add_query_arg(
					array(
						'show_notice' => $this->notice_type,
					),
					wp_get_referer()
				)
			);
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

	/**
	 * Display a notice if necessary.
	 */
	public function display_notice() {
		?>
		<div class="notice notice-success is-dismissible">
			<p>Settings have been saved!</p>
		</div>
		<?php
	}

	/**
	 * Display a notice when Sync is disabled by this module.
	 */
	public function display_protect_overwritten_notice() {
		echo '<div class="notice notice-warning"><p>Jetpack Protect Status is being overwritten by the Jetpack Debug Helper plugin.</p></div>';

	}

}

add_action(
	'plugins_loaded',
	function () {
		new Protect_Helper();
	},
	1000
);

