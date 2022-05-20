<?php
/**
 * Jetpack modules helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

use Automattic\Jetpack\Modules;

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
		$html = '';

		$html             .= '<h2>Modules->get_available()</h2>';
		$html             .= '<table>';
		$available_modules = ( new Modules() )->get_available();
		foreach ( $available_modules as $available_module ) {
			$html .= '<tr><td>' . $available_module . '</td></tr>';
		}
		$html .= '</table>';

		$html          .= '<h2>Modules->get_active()</h2>';
		$html          .= '<table>';
		$active_modules = ( new Modules() )->get_active();
		foreach ( $active_modules as $active_modules ) {
			$html .= '<tr><td>' . $active_modules . '</td></tr>';
		}
		$html .= '</table>';

		$module_options = array(
			'available_modules',
			'active_modules',
		);

		foreach ( $module_options as $module_option ) {
			$option_values = \Jetpack_Options::get_option( $module_option );

			$html .= '<h2>Option: jetpack_' . $module_option . '</h2>';
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

