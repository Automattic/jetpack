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

		$module_info = $this->jitm_module_tags( $search_term );

		//If we have a JITM to show, show it in a notice above the search results
		if ( $module_info ){

			$show_jitm = Jetpack_Options::get_option( 'jitm_plugins' );

			// get JITM show option, if unset, set it to true
			if ( 0 != $show_jitm ){
				$show_jitm = 1;
				Jetpack_Options::update_option( 'jitm_plugins', $show_jitm );
			}

			// Don't show JITM if option is set to false
			if ( 1 == $show_jitm ){

				// enqueue styles
				echo '
					<style>
						.jetpack-jitm { background: #fff; padding-left: 15px; border: 1px solid #dedede; margin: 25px 0 15px 0; }
						.jetpack-jitm p { font-size: 1.2em; line-height: 1.2em; vertical-align: middle; }
						.jetpack-jitm span { float: left; margin: 1px 5px 0 0; }
						.jetpack-jitm .icon:before { font-family: \'jetpack\' !important; content: \'\f102\'; color: #8cc258; font-size: 2em; }
						.jetpack-jitm .dismiss:before {  font: 400 20px/1 dashicons; content: \'\f405\'; }
						.jetpack-jitm .dismiss { float: right; margin: -45px 10px 0 0; }
					</style>
					';
				//display content
				echo '<div class="jetpack-jitm"><p><span class="icon"></span>Jetpack is already here to help. Click here to learn more about <a href="' . Jetpack::admin_url() . '_modules&info=' . $module_info[0]['module_slug'] .'" class="jetpack-learnmore-module">Jetpack ' . $module_info[0]['module_name'] . '</a></p><a href="#" class="dismiss"><span class="genericon genericon-close"></span></a></div>';

				// Enqueue javascript to handle jitm notice events
				wp_enqueue_script( 'jetpack-jitm-js', plugins_url( '_inc/jetpack-jitm.js', JETPACK__PLUGIN_FILE ),
					array( 'jquery' ), JETPACK__VERSION . '-20121111' );
				wp_localize_script(
					'jetpack-jitm-js',
					'jitmL10n',
					array(
						'jumpstart_stats_urls'  => $this->build_jitm_stats_urls( array( 'dismiss', 'learnmore' ) ),
						'jitm_plugins'          => $show_jitm,
						'ajaxurl'               => admin_url( 'admin-ajax.php' ),
						'jitm_nonce'            => wp_create_nonce( 'jetpack-jitm-nonce' ),
					)
				);

				//JITM is being viewed send data to MC Stats
				$jetpack = Jetpack::init();
				$jetpack->stat( 'jitm', 'viewed,'.$module_info[0]['module_slug'].','.$search_term );
				$jetpack->do_stats( 'server_side' );
			}
		}
	}

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
			if ( ! empty( $value['jitm_tags'] ) && in_array( $search_term, $value['jitm_tags'] ) ) {
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

	/*
     * Build an array of JITM stats urls.
     * requires the build URL args passed as an array
     *
	 * @param array $jitm_stats
     * @return (array) of built stats urls
     */
	function build_jitm_stats_urls( $jitm_stats ) {
		$jitm_urls = array();

		foreach ( $jitm_stats as $value) {
			$jitm_urls[$value] = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => $value ) );
		}

		return $jitm_urls;

	}

}
Jetpack_JITM::init();
