<?php
/**
 * Jetpack modules helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Helps debug modules
 */
class Jetpack_Modules_Debug_Helper {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Modules Debug Helper',
			'Modules Debug Helper',
			'manage_options',
			'modules-debug-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	public function render_ui() {
		$module_options = array(
			'available_modules',
			'active_modules',
		);

		$html = '';

		foreach ( $module_options as $module_option ) {
			$option_values = \Jetpack_Options::get_option( $module_option );

			$html .= '<h2>' . $module_option . '</h2>';
			$html .= '<table>';

			foreach ( $option_values as $option_value ) {
				if ( is_array( $option_value ) ) {
					foreach ( $option_value as $module => $version ) {
						$html .= '<tr><td>' . $module . '</td></tr>';
					}
				} else {
					$html .= '<tr><td>' . $option_value . '</td></tr>';
				}
			}
			$html .= '</table>';
		}
		?>

		<div><?php echo wp_kses_post( $html ); ?></div>

		<?php
	}

	public static function list_available_modules( $modules ) {
		return $modules;
	}

}

add_action(
	'plugins_loaded',
	function () {
		new Jetpack_Modules_Debug_Helper();
	},
	1000
);

