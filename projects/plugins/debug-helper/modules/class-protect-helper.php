<?php
/**
 * Jetpack Protect helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;

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

			define( 'JETPACK_PROTECT_DEV__DATA_SOURCE', 'protect_report' );
			$option_name      = Automattic\Jetpack\Protect\Protect_Status::OPTION_NAME;
			$option_time_name = Automattic\Jetpack\Protect\Protect_Status::OPTION_TIMESTAMP_NAME;
			add_filter( "option_$option_name", array( $this, 'get_mock_response' ) );
			add_filter( "option_$option_time_name", array( $this, 'filter_option_time' ) );

			if ( 'error' === $settings['status'] ) {
				add_filter( 'pre_http_request', array( $this, 'filter_status_fetch' ), 10, 3 );
			}
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
						<fieldset>
							<p>If enabled, the Protect status fetched from the server will be ignored and the rules below will define the current status.</p>
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
							<option value="error" <?php selected( 'error', $settings['status'] ); ?>>Error - When there's an error fetching the status</option>
							<option value="incomplete" <?php selected( 'incomplete', $settings['status'] ); ?>>Incomplete - When we have results, but some extensions were not scanned</option>
							<option value="complete" <?php selected( 'complete', $settings['status'] ); ?>>Complete - When we have results for all extensions</option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row">Vulnerabilities</th>
					<td>
						<label><input type="checkbox" name="vuls_for_core" <?php echo ( $settings['vuls_for_core'] ? 'checked="checked"' : '' ); ?>> Add vulnerabilities to Core</label><br>
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

	/**
	 * Gets a mock api response
	 */
	public function get_mock_response() {
		$settings = $this->get_stored_settings();
		$response = (object) array(
			'last_checked'                => '',
			'num_vulnerabilities'         => 0,
			'num_plugins_vulnerabilities' => 0,
			'num_themes_vulnerabilities'  => 0,
			'status'                      => 'scheduled',
		);
		if ( 'empty' === $settings['status'] ) {
			return $response;
		}

		global $wp_version;

		$response->last_checked = gmdate( 'Y-m-d H:i:s', time() - 1000 );
		$installed_plugins      = Plugins_Installer::get_plugins();
		$installed_themes       = Sync_Functions::get_themes();

		$response->core    = (object) array(
			'version'         => $wp_version,
			'vulnerabilities' => $this->get_vulnerabilities( 'core' ),
		);
		$response->themes  = new StdClass();
		$response->plugins = new StdClass();
		$skipped_plugin    = false;

		foreach ( $installed_plugins as $plugin_slug => $plugin ) {
			if ( ! $skipped_plugin && 'incomplete' === $settings['status'] ) {
				$skipped_plugin = true;
				continue;
			}
			$response->plugins->{ $plugin_slug } = (object) array(
				'version'         => $plugin['Version'],
				'vulnerabilities' => $this->get_vulnerabilities( 'plugins' ),
			);
		}
		foreach ( $installed_themes as $theme_slug => $theme ) {
			$response->themes->{ $theme_slug } = (object) array(
				'version'         => $theme['Version'],
				'vulnerabilities' => $this->get_vulnerabilities( 'themes' ),
			);
		}

		if ( $settings['vuls_for_core'] ) {
			$response->num_vulnerabilities += 2;
		}
		if ( $settings['vuls_for_plugins'] ) {
			$response->num_vulnerabilities         += 2;
			$response->num_plugins_vulnerabilities += 2;
		}
		if ( $settings['vuls_for_themes'] ) {
			$response->num_vulnerabilities        += 2;
			$response->num_themes_vulnerabilities += 2;
		}

		return $response;

	}

	/**
	 * Get random fake vulnerability ID
	 *
	 * @return string
	 */
	public function get_random_id() {
		$random1 = wp_generate_password( 8, false, false );
		$random2 = wp_generate_password( 6, false, false );
		return $random1 . '-1a32-446d-be3d-RANDOM' . $random2;
	}

	/**
	 * Gets a fake list of vulnerabilities
	 *
	 * @param string  $type Core, plugins or themes.
	 * @param integer $how_many Number of vulnerabilities to return.
	 * @return array
	 */
	public function get_vulnerabilities( $type, $how_many = 2 ) {
		static $current_index = 0;
		static $done          = array(
			'plugins' => false,
			'themes'  => false,
			'core'    => false,
		);
		$settings             = $this->get_stored_settings();
		$vuls                 = array();
		if ( ! $settings[ 'vuls_for_' . $type ] || $done[ $type ] ) {
			return $vuls;
		}

		$done[ $type ] = true;

		$ids = array(
			'1fd6742e-1a32-446d-be3d-7cce44f8f416',
			'1ac912c1-5e29-41ac-8f76-a062de254c09',
			'6e61b246-5af1-4a4f-9ca8-a8c87eb2e499',
			'36e3817f-7fcc-4a97-9ea2-e5e3b01f93a1',
			'd442acac-4394-45e4-b6bb-adf4a40960fb',
			'0c980e1c-d4dc-4b96-b0ce-282289674f55',
			'5abdae02-215f-4df8-a0e8-c1c1b2eafa4b',
			'0b58b722-e75a-4dc2-b63b-35375f475344',
			'd3ef5644-1044-492f-ac23-ea90b32f1e77',
			'ce716e4f-60f8-42e3-8891-a38e7948b970',
			'be165b4b-cddb-46ec-8863-4d44e4d53045',
			'72400eb2-b055-4431-aa02-8247a07ee8d4',
		);
		for ( $i = 1; $i <= $how_many; $i++ ) {
			$id     = $current_index < count( $ids ) ? $ids[ $current_index ] : $this->get_random_id();
			$vuls[] = (object) array(
				'id'          => $id,
				'title'       => 'Sample Vulnerability number ' . $i . ' with a long title',
				'description' => 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Phasellus hendrerit. 
								  Pellentesque aliquet nibh nec urna. In nisi neque, aliquet vel, dapibus id, mattis 
								  vel, nisi. Sed pretium, ligula sollicitudin laoreet viverra, tortor libero sodales 
								  leo, eget blandit nunc tortor eu nibh. Nullam mollis. Ut justo. Suspendisse potenti.',
				'fixed_in'    => '3.14.2',
			);
			$current_index ++;
		}

		return $vuls;

	}

	/**
	 * Filter the cache expire date and make sure it always look like it's not expired, except on status = error
	 *
	 * @return int
	 */
	public function filter_option_time() {
		$settings = $this->get_stored_settings();
		if ( 'error' === $settings['status'] ) {
			return time() - 100;
		}
		return time() + 100;
	}

	/**
	 * Forces the request for the Protect Status API ro return an error
	 *
	 * @param false|array|WP_Error $preempt The original response.
	 * @param array                $parsed_args The request args.
	 * @param string               $url The request URL.
	 * @return mixed WP_Error if it's a request to Protect status API
	 */
	public function filter_status_fetch( $preempt, $parsed_args, $url ) {
		if ( strpos( $url, Automattic\Jetpack\Protect\Protect_Status::get_api_url() ) !== false ) {
			return new WP_Error( 'error' );
		}
		return $preempt;
	}
}

add_action(
	'plugins_loaded',
	function () {
		new Protect_Helper();
	},
	1000
);

