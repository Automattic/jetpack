<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Custom Jetpack Admin Page
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Builds a custom admin page for Jetpack.
 */
class Jetpack_Custom_Page extends Jetpack_Admin_Page {

	/**
	 * Show the page only when Jetpack is active.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = false;

	/**
	 * Add the admin page to the Jetpack menu.
	 *
	 * @return string|false Return value from WordPress's `add_submenu_page()`.
	 */
	public function get_page_hook() {
		return add_submenu_page(
			'jetpack', // Parent slug
			__( 'Media Editor', 'jetpack' ), // Page title
			__( 'Media Editor', 'jetpack' ), // Menu title
			'manage_options', // Capability
			'jetpack-custom', // Menu slug
			array( $this, 'page_render' ) // Callback
		);
	}

	/**
	 * Add page-specific actions.
	 *
	 * @param string $hook Hook of current page.
	 */
	public function add_page_actions( $hook ) {
		// Add any page-specific hooks here
		if ( 'jetpack_page_jetpack-custom' === $hook ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'page_admin_scripts' ) );
		}
	}

	/**
	 * Enqueue page-specific scripts and styles.
	 */
	public function page_admin_scripts() {
		// Enqueue WordPress packages needed for React components
		wp_enqueue_script( 'wp-element' );
		wp_enqueue_script( 'wp-components' );
		wp_enqueue_script( 'wp-data' );
		wp_enqueue_script( 'wp-core-data' );
		wp_enqueue_script( 'wp-i18n' );
		wp_enqueue_script( 'wp-notices' );

		// Enqueue custom styles
		wp_enqueue_style( 'jetpack-custom-page', plugins_url( '_inc/css/custom-page.css', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );

		// Build the media editor script path
		$media_editor_script = plugins_url( '_inc/js/media-editor-page.js', JETPACK__PLUGIN_FILE );
		wp_enqueue_script( 'jetpack-media-editor-page', $media_editor_script, array( 'wp-element', 'wp-components', 'wp-data', 'wp-core-data', 'wp-i18n' ), JETPACK__VERSION, true );

		// Localize script with data
		wp_localize_script(
			'jetpack-media-editor-page',
			'jetpackCustomPage',
			array(
				'nonce'   => wp_create_nonce( 'jetpack-custom-page' ),
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'postId'  => '27', // The post ID you specified
			)
		);
	}

	/**
	 * Render the page content.
	 */
	public function page_render() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Media Editor', 'jetpack' ); ?></h1>

			<!-- Container-based MediaEditor -->
			<div id="jetpack-media-editor-container" class="jetpack-container-media-editor">
				<div class="loading-placeholder">
					<p><?php esc_html_e( 'Loading Media Editor...', 'jetpack' ); ?></p>
				</div>
			</div>
		</div>

		<!-- Settings Panel (Hidden by default, accessible via escape or settings button) -->
		<div id="jetpack-settings-panel" class="jetpack-settings-panel" style="display: none;">
			<div class="wrap">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
					<h1 style="margin: 0;"><?php esc_html_e( 'Media Editor Settings', 'jetpack' ); ?></h1>
					<button onclick="document.getElementById('jetpack-settings-panel').style.display='none'" class="button button-secondary">
						<?php esc_html_e( 'Close', 'jetpack' ); ?>
					</button>
				</div>

				<div class="card">
					<h2><?php esc_html_e( 'Settings', 'jetpack' ); ?></h2>
					<form method="post" action="options.php">
						<?php
						settings_fields( 'jetpack_custom_settings' );
						do_settings_sections( 'jetpack_custom_settings' );
						?>
						<table class="form-table">
							<tr>
								<th scope="row">
									<label for="custom_setting"><?php esc_html_e( 'Default Post ID for Media Editor', 'jetpack' ); ?></label>
								</th>
								<td>
									<input type="text" id="custom_setting" name="jetpack_custom_setting" value="<?php echo esc_attr( get_option( 'jetpack_custom_setting', '27' ) ); ?>" class="regular-text" />
									<p class="description"><?php esc_html_e( 'Enter the default post ID to display when loading the Media Editor.', 'jetpack' ); ?></p>
								</td>
							</tr>
						</table>
						<?php submit_button(); ?>
					</form>
				</div>

				<div class="card">
					<h2><?php esc_html_e( 'Instructions', 'jetpack' ); ?></h2>
					<p><?php esc_html_e( 'The Media Editor opens in fullscreen mode by default. You can:', 'jetpack' ); ?></p>
					<ul>
						<li><?php esc_html_e( 'Change post ID using the input field in the header', 'jetpack' ); ?></li>
						<li><?php esc_html_e( 'Navigate between media using the arrow buttons', 'jetpack' ); ?></li>
						<li><?php esc_html_e( 'Toggle the sidebar using the "Hide/Show Sidebar" button', 'jetpack' ); ?></li>
						<li><?php esc_html_e( 'Access these settings by pressing ESC key', 'jetpack' ); ?></li>
					</ul>
				</div>
			</div>
		</div>

		<style>
			.wrap h1 {
				margin-bottom: 10px;
				color: #1d2327;
			}
			.card {
				background: #fff;
				border: 1px solid #ccd0d4;
				box-shadow: 0 1px 1px rgba(0,0,0,.04);
				padding: 20px;
				margin: 20px 0;
			}
			.card h2 {
				margin-top: 0;
			}
			.loading-placeholder {
				padding: 40px;
				text-align: center;
				background: #f9f9f9;
				border: 2px dashed #ddd;
				border-radius: 4px;
			}
		</style>
		<?php
	}

	/**
	 * Initialize settings.
	 */
	public function init_settings() {
		register_setting( 'jetpack_custom_settings', 'jetpack_custom_setting' );
	}
}