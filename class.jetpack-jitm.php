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
		add_action( 'install_plugins_search', array( $this, 'plugin_search' ) );
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
				if ( $value['jitm_tags'] && in_array( $search_term, $value['jitm_tags'] ) ) {
					$module_info[] = array(
						'module_slug'   => $value['module'],
						'module_name'   => $value['name'],
					);

					//we only need one result, if we find it move on
					break;

				}
			}
			return $module_info;
		}

		$module_info = jitm_module_tags( $search_term );

		//If we have a JITM to show, show it in a notice above the search results
		if ( $module_info ){
			// enqueue styles
			echo '
				<style>
					.jetpack-jitm { background: #fff; padding-left: 15px; border: 1px solid #dedede; margin: 25px 0 15px 0; }
					.jetpack-jitm p { font-size: 1.2em; line-height: 1.2em; vertical-align: middle; }
					.jetpack-jitm span { float: left; margin: 1px 5px 0 0; }
					.jetpack-jitm .icon:before { font-family: \'jetpack\' !important; content: \'\f102\'; color: #333; font-size: 2em;  }
				</style>
				';
			// enqueue script
			//display content
			echo '<div class="jetpack-jitm"><p><span class="icon"></span>Jetpack is already here to help. Click here to learn more about <a href="' . Jetpack::admin_url() . '_modules&info=' . $module_info[0]['module_slug'] .'" class="jetpack-learnmore-module">Jetpack ' . $module_info[0]['module_name'] . '</a></p></div>';
		}
	}

}
Jetpack_JITM::init();
