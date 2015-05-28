<?php

/**
 * Jetpack just in time messaging through out the admin
 *
 */
class Jetpack_JITM {

	/**
	 * @var Jetpack_JITM
	 **/
	private static $instance = null;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'install_plugins_search', array( $this, 'plugin_search' ), 1 );
	}

	/*
	 * Present JITM on plugin search results page
	 * so we can better educate users on what Jetpack does already
	 *
	 */
	function plugin_search() {

		$search_term = $_GET['s'];

		/*
		 * Build an array of a specific module tag.
		 *
		 * @param  string Name of the module tag
		 * @return array  The module slug, config url, and name of each Jump Start module
		 */
		function jitm_module_tags( $search_term ) {
			$modules = Jetpack_Admin::init()->get_modules();

			$module_info = array();
			foreach ( $modules as $module => $value ) {
				if ( in_array( $search_term, $value['jitm_tags'] ) ) {
					$module_info[] = array(
						'module_slug'   => $value['module'],
						'module_name'   => $value['name'],
						'configure_url' => $value['configure_url']
					);
				}
			}
			return $module_info;
		}

		$module_info = jitm_module_tags( $search_term );

		echo '<style>.jetpack-jitm { background: #fff; padding-left: 25px; border: 1px solid #333; margin-top: 25px; }</style><div class="jetpack-jitm"><p>Jetpack is already here to help you with "';
		echo $module_info[0]['module_name'];
		echo '" <a href="" class="jetpack-learnmore-module">(learn more)</a></p></div>';
	}

}
Jetpack_JITM::init();
