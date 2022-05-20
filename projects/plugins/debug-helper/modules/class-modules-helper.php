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
class Modules_Helper {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Modules Helper',
			'Modules Helper',
			'manage_options',
			'modules-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Some custom style.
	 */
	public function enqueue_scripts() {
		$screen = get_current_screen();
		if ( $screen->id !== 'jetpack-debug_page_modules-helper' ) {
			return;
		}
		?>
			<style>
				table {
					width: 50%;
					float: left;
					margin-bottom: 50px;
				}
				th {
					text-align: left;
					font-size: 110%;
				}
			</style>
		<?php
	}

	/**
	 * Renders the UI.
	 */
	public function render_ui() {
		$html  = '<h1>Modules debug helper</h1>';
		$html .= '<p>Simply lists the callable and option values for Jetpack modules.</p><hr />';

		$html             .= '<h2>Available modules:</h2>';
		$html             .= '<table style="width: 50%; float: left;">';
		$html             .= '<th>Modules->get_available()</th>';
		$available_modules = ( new Modules() )->get_available();
		foreach ( $available_modules as $available_module ) {
			$html .= '<tr><td>' . $available_module . '</td></tr>';
		}
		$html .= '</table>';

		$html             .= '<table style="width: 50%; float: left;">';
		$html             .= "<th>Jetpack_Options::get_option( 'available_modules' )</th>";
		$available_modules = \Jetpack_Options::get_option( 'available_modules' );
		foreach ( $available_modules as $available_module ) {
			foreach ( $available_module as $module => $version ) {
				$html .= '<tr><td>' . $module . '</td></tr>';
			}
		}
		$html .= '</table>';

		$html          .= '<h2>Active modules:</h2>';
		$html          .= '<table style="width: 50%; float: left;">';
		$html          .= '<th>Modules->get_active()</th>';
		$active_modules = ( new Modules() )->get_active();
		foreach ( $active_modules as $active_modules ) {
			$html .= '<tr><td>' . $active_modules . '</td></tr>';
		}
		$html .= '</table>';

		$html          .= '<table style="width: 50%; float: left;">';
		$html          .= "<th>Jetpack_Options::get_option( 'active_modules' )</th>";
		$active_modules = \Jetpack_Options::get_option( 'active_modules' );
		foreach ( $active_modules as $active_module ) {
			$html .= '<tr><td>' . $active_module . '</td></tr>';
		}
		$html .= '</table>';
		?>

		<div><?php echo wp_kses_post( $html ); ?></div>

		<?php
	}

}

add_action(
	'plugins_loaded',
	function () {
		new Modules_Helper();
	},
	1000
);

