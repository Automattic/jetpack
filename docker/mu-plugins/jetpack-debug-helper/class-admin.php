<?php
/**
 * Simple admin interface to activate/deactivate modules
 *
 * @package Jetpack
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
	}

	/**
	 * Register's submenu.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack',
			'Debug tools',
			'Debug tools',
			'manage_options',
			'debug-tools',
			array( $this, 'render_ui' ),
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

		$this->update_option();

		$stored_options = get_option( self::OPTION_NAME, array() );
		global $jetpack_dev_debug_modules;
		?>
		<h1>Jetpack Debug tools</h1>
		<p>This plugin adds debugging tools to your jetpack. Choose which tools you want to activate.</p>

		<form method="post">
			<input type="hidden" name="action" value="store_debug_active_modules">
			<?php wp_nonce_field( 'store-debug-modules' ); ?>

			<?php foreach ( $jetpack_dev_debug_modules as $module_slug => $module_details ) : ?>

				<p>
					<input type="checkbox" name="active_modules[]" value="<?php echo esc_attr( $module_slug ); ?>" <?php checked( in_array( $module_slug, $stored_options, true ) ); ?> />
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

		if ( isset( $_POST['action'] ) && 'store_debug_active_modules' === $_POST['action'] ) {
			check_admin_referer( 'store-debug-modules' );
			update_option( self::OPTION_NAME, $_POST['active_modules'] );
		}

	}

}

add_action(
	'plugins_loaded',
	function() {
		new Admin();
	}
);

