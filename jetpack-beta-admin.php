<?php

class Jetpack_Beta_Admin {

	function __construct() {
		add_action( 'load-jetpack_page_jetpack-beta', array( $this, 'save_settings' ) );
		add_action( 'jetpack_admin_menu', array( $this, 'register_admin_page' ), 12 );
	}

	function register_admin_page() {
		return add_submenu_page(
			'jetpack',
			'Jetpack Beta',
			'Jetpack Beta',
			'update_plugins',
			'jetpack-beta',
			array( $this, 'render_admin_page' )
		);

	}

	function render_admin_page() {
		include JPBETA__DIR . 'admin/jpbeta-admin-main.php';
	}

	/**
	 * Save our JPS settings options
	 */
	function save_settings() {
		// Most recent release
		if ( isset( $_POST['jp_beta_recent_save_nonce'] ) && wp_verify_nonce( $_POST['jp_beta_recent_save_nonce'], 'jp_beta_recent_save' ) ) {
			update_option( 'jp_beta_type', sanitize_text_field( $_POST['version_type'] ) );

			if ( ! isset( $_POST['auto_update'] ) || ! $_POST['auto_update'] ) {
				update_option( 'jp_beta_autoupdate', 'no' );
			} else {
				update_option( 'jp_beta_autoupdate', 'sure' );
			}

			// Resets the plugin data
			Jetpack_Beta_Tester::activate();

			add_action( 'admin_notices', array( $this, 'success_message' ) );
		}
	}

	static function testing_list() {
		$jetpack_dir    = WP_PLUGIN_DIR . '/' . JETPACK_PLUGIN_FOLDER;
		$test_list_path = $jetpack_dir . '/to-test.md';
		if ( ! file_exists( $test_list_path ) ) {
			return "You're currently not using a beta version of Jetpack";
		}

		$test_list_file = file_get_contents( $test_list_path );

		// We'll apply standard content filters to our content.
		add_filter( 'jetpack_beta_test_content', 'wptexturize' );
		add_filter( 'jetpack_beta_test_content', 'convert_smilies' );
		add_filter( 'jetpack_beta_test_content', 'convert_chars' );
		add_filter( 'jetpack_beta_test_content', 'wpautop' );
		add_filter( 'jetpack_beta_test_content', 'shortcode_unautop' );
		add_filter( 'jetpack_beta_test_content', 'prepend_attachment' );

		// Then let's use Jetpack Markdown to process our content
		jetpack_require_lib( 'markdown' );
		if ( ! class_exists( 'WPCom_Markdown' ) ) {
			require_once( $jetpack_dir . '/modules/markdown/easy-markdown.php' );
		}
		$rendered_html = WPCom_Markdown::get_instance()->transform( $test_list_file, array(
			'id'      => false,
			'unslash' => false
		) );

		return apply_filters( 'jetpack_beta_test_content', $rendered_html );
	}

	function success_message() {
		$update_url = wp_nonce_url( self_admin_url('update.php?action=upgrade-plugin&plugin=' . JETPACK_PLUGIN_ID ), 'upgrade-plugin_' . JETPACK_PLUGIN_ID );
		// $update_url = self_admin_url( 'plugins.php?action=upgrade-plugin&plugin=' . JETPACK_PLUGIN_ID )
		?>
		<div id="message" class="updated settings-error notice is-dismissible">
			<p><?php _e( 'Settings Saved!', 'jpbeta' ); ?><br/><br/>
				<a href="<?php echo esc_url( $update_url ); ?> "
				   class="button button-primary"><?php _e( 'Please click here to update now.', 'jpbeta' ); ?></a></p>
		</div>
		<?php
	}

}
