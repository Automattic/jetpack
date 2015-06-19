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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_css_header' ) );
	}

	/*
	 * Present JITM on plugin search results page
	 * so we can better educate users on what Jetpack does already
	 *
	 */
	function plugin_search() {
		$hide_jitm = Jetpack_Options::get_option( 'hide_jitm_plugins' );

		if ( $hide_jitm ) {
			return;
		}

		$search_term = strtolower( $_GET['s'] );

		$module_info = $this->jitm_module_tags( $search_term );

		//If we have a JITM to show, show it in a notice above the search results
		if ( $module_info ){

			//display content
			echo '<div class="jp-jitm"><a href="#" class="dismiss"><span class="genericon genericon-close"></span></a><p><span class="icon"></span>';
			_e( 'Jetpack is already here to help. Click here to learn more about ', 'jetpack' );
			echo '<a href="' . Jetpack::admin_url() . '_modules&info=' . $module_info[0]['module_slug'] .'" class="jetpack-learnmore-module" id="jetpack-'.$module_info[0]['module_slug'].'">';
			_e( 'Jetpack ' . $module_info[0]['module_name'], 'jetpack' );
			echo '</a></p></div>';

			// Enqueue javascript to handle jitm notice events
			wp_enqueue_script( 'jetpack-jitm-js', plugins_url( '_inc/jetpack-jitm.js', JETPACK__PLUGIN_FILE ),
				array( 'jquery' ), JETPACK__VERSION . '-20121111' );
			wp_localize_script(
				'jetpack-jitm-js',
				'jitmL10n',
				array(
					'jitm_stats_urls'                   => $this->build_jitm_stats_urls( array( 'dismiss', 'learnmore' ) ),
					'jitm_plugin_serp_stats_urls'       => $this->build_jitm_stats_urls( array( 'dismiss', 'learnmore' ), '-plugin-serp'),
					'hide_jitm_plugins'                 => $hide_jitm,
					'ajaxurl'                           => admin_url( 'admin-ajax.php' ),
					'jitm_nonce'                        => wp_create_nonce( 'jetpack-jitm-nonce' ),
				)
			);

			//JITM is being viewed send data to MC Stats
			$search_term_slug = str_replace( ' ', '-', $search_term);
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'viewed' );
			$jetpack->stat( 'jitm-plugin-serp', 'viewed,'.$module_info[0]['module_slug'].',search:-'.$search_term_slug );
			$jetpack->do_stats( 'server_side' );
		}
	}

	/*
	 * Build an array of a specific module tag.
	 *
	 * @param  string Name of the module tag
	 * @return array  The module slug, and name of each module
	 */
	function jitm_module_tags( $search_term ) {
		$modules = Jetpack_Admin::init()->get_modules();

		$module_info = array();

		foreach ( $modules as $module => $value ) {
			if ( ! empty( $value['search_queries'] ) && in_array( $search_term, $value['search_queries'] ) ) {
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
	function build_jitm_stats_urls( $jitm_stats, $jitm_stats_suffix = false ) {
		$jitm_urls = array();
		$jitm_stats_report = $jitm_stats_suffix ? 'x_jetpack-jitm'.$jitm_stats_suffix : 'x_jetpack-jitm';

		foreach ( $jitm_stats as $value) {
			$jitm_urls[$value] = Jetpack::build_stats_url( array( $jitm_stats_report => $value ) );
		}

		return $jitm_urls;

	}

	/*
	* Function to enqueue jitm css specifically in the header
	*/
	function enqueue_css_header( $hook ) {

		$wp_styles = new WP_Styles();

		if ( ! isset( $_GET['tab'] ) || 'search' != $_GET['tab'] && 'plugin-install.php' != $hook ) {
			return;
		}
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-20121016' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );
	}

}

if ( apply_filters( 'jetpack_jitm_plugin_search', false ) ) {
	Jetpack_JITM::init();
}
