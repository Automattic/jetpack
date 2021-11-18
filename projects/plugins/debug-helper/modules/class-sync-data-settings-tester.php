<?php
/**
 * Sync Data Settings Tester file contains the class `Sync_Date_Setting_Tester` that tests the Sync data settings.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * Sync_Data_Settings_Tester to test the Sync data settings.
 */
class Sync_Data_Settings_Tester {

	/**
	 * The list of sync data setting filters and the location of the default list for that filter.
	 *
	 * TODO: get this list from the Sync package.
	 */
	const DATA_FILTER_DEFAULTS = array(
		'jetpack_sync_modules'                      =>
			array(
				'class'    => 'Automattic\\Jetpack\\Sync\\Modules',
				'constant' => 'DEFAULT_SYNC_MODULES',
			),
		'jetpack_sync_options_whitelist'            =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_options_whitelist',
			),
		'jetpack_sync_options_contentless'          =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_options_contentless',
			),
		'jetpack_sync_constants_whitelist'          =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_constants_whitelist',
			),
		'jetpack_sync_callable_whitelist'           =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_callable_whitelist',
			),
		'jetpack_sync_multisite_callable_whitelist' =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_multisite_callable_whitelist',
			),
		'jetpack_sync_post_meta_whitelist'          =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'post_meta_whitelist',
			),
		'jetpack_sync_comment_meta_whitelist'       =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'comment_meta_whitelist',
			),
		'jetpack_sync_capabilities_whitelist'       =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_capabilities_whitelist',
			),
		'jetpack_sync_known_importers'              =>
			array(
				'class'    => 'Automattic\Jetpack\Sync\Defaults',
				'property' => 'default_known_importers',
			),
	);

	/**
	 * The data associated with these filters are associative arrays.
	 *
	 * TODO: get this list from the Sync package.
	 */
	const ASSOCIATIVE_FILTERS = array(
		'jetpack_sync_callable_whitelist',
		'jetpack_sync_multisite_callable_whitelist',
	);

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
			'Sync Data Settings Tester',
			'Sync Data Settings Tester',
			'manage_options',
			'sync-data-settings-tester',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Returns the default data settings list for the provided filter.
	 *
	 * @param string $filter The filter name.
	 *
	 * @return array The default list of data settings.
	 *
	 * TODO: Use this method from the Sync package.
	 */
	private function get_default_value_for_filter( $filter ) {
		$default_value = self::DATA_FILTER_DEFAULTS[ $filter ];

		if ( array_key_exists( 'constant', $default_value ) ) {
			// The modules list is a class constant.
			$setting = constant( $default_value['class'] . '::' . $default_value['constant'] );
		} else {
			// The other default lists are class properties.
			$property = $default_value['property'];
			$setting  = $default_value['class']::$$property;
		}

		return $setting;
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		$filters_to_display = array_keys( self::DATA_FILTER_DEFAULTS );

		$html = '';

		foreach ( $filters_to_display as $filter ) {
			$html .= '<h2>' . $filter . '</h2>';
			$html .= '<table>';

			$items = apply_filters( $filter, $this->get_default_value_for_filter( $filter ) );

			if ( in_array( $filter, self::ASSOCIATIVE_FILTERS, true ) ) {
				foreach ( $items as $key => $item ) {
					$html .= '<tr><td>' . $key . '</td><td>' . print_r( $item, true ) . '</td></tr>'; //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
				}
			} else {
				foreach ( $items as $item ) {
					$html .= '<tr><td>' . $item . '</td></tr>';
				}
			}
			$html .= '</table>';
		}
		?>

		<h1>Sync Data Settings Tester</h1>
		<p>Displays the output of the <code>apply_filters</code> method on each of the Sync data settings filters.</p>
		<p>The default value passed to <code>apply_filters</code> is the filter's default list (see default lists in the <code>Automattic\Jetpack\Sync\Defaults</code> class.)</p>
		<div><?php echo wp_kses_post( $html ); ?></div>

		<?php
	}

	/**
	 * Load the class.
	 */
	public static function register_data_settings_tester() {
		new Sync_Data_Settings_Tester();
	}
}

add_action( 'plugins_loaded', array( Sync_Data_Settings_Tester::class, 'register_data_settings_tester' ), 1000 );
