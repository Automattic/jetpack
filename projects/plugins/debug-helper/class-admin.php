<?php
/**
 * Simple admin interface to activate/deactivate modules
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * Class Jetpack_Debug_Helper_Admin
 */
class Admin {

	/**
	 * Option name.
	 */
	const OPTION_NAME = 'jetpack_debug_helper_active_modules';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_post_store_debug_active_modules', array( $this, 'update_option' ) );
	}

	/**
	 * Register's submenu.
	 */
	public function register_submenu_page() {
		add_menu_page(
			'Jetpack Debug Helper',
			'Jetpack Debug',
			'manage_options',
			'jetpack-debug-tools',
			array( $this, 'render_ui' ),
			'dashicons-hammer',
			99
		);
	}

	/**
	 * Get the list of active modules
	 *
	 * @return array
	 */
	public static function get_active_modules() {
		return get_option( self::OPTION_NAME, array() );
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		$stored_options = get_option( self::OPTION_NAME, array() );
		global $jetpack_dev_debug_modules;
		?>
		<h1>Jetpack Debug tools</h1>
		<p>This plugin adds debugging tools to your jetpack. Choose which tools you want to activate.</p>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<input type="hidden" name="action" value="store_debug_active_modules">
			<?php wp_nonce_field( 'store-debug-modules' ); ?>

			<?php foreach ( $jetpack_dev_debug_modules as $module_slug => $module_details ) : ?>

				<p>
					<input type="checkbox" name="active_modules[]" value="<?php echo esc_attr( $module_slug ); ?>" <?php checked( in_array( $module_slug, (array) $stored_options, true ) ); ?> />
					<b><?php echo esc_html( $module_details['name'] ); ?></b>
					<?php echo esc_html( $module_details['description'] ); ?>
				</p>

			<?php endforeach; ?>

			<input type="submit" value="Save" class="button button-primary">

		</form>
		<br>

		<?php
	}

	/**
	 * Store options.
	 */
	public function update_option() {
		check_admin_referer( 'store-debug-modules' );
		$active_modules = ! empty( $_POST['active_modules'] ) ? array_map( 'filter_var', wp_unslash( (array) $_POST['active_modules'] ) ) : array();
		update_option( self::OPTION_NAME, $active_modules );
		if ( wp_get_referer() ) {
			wp_safe_redirect( wp_get_referer() );
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

}

add_action(
	'plugins_loaded',
	function () {
		new Admin();
	}
);

