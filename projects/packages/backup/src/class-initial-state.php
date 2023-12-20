<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-backup-plugin
 */

// After changing this file, consider increasing the version number ("VXXX") in the namespace, in order to ensure that
// the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide to load an
// older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin are
// installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0001;

use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use Automattic\Jetpack\Status;

/**
 * The React initial state.
 */
class Initial_State {
	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		return array(
			'API'              => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
			'jetpackStatus'    => array(
				'calypsoSlug' => ( new Status() )->get_site_suffix(),
			),
			'connectedPlugins' => Connection_Plugin_Storage::get_all(),
			'siteData'         => array(
				'id'       => \Jetpack_Options::get_option( 'id' ),
				'title'    => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url(),
				'adminUrl' => esc_url( admin_url() ),
			),
			'assets'           => array(
				'buildUrl' => plugins_url( '../build/', __FILE__ ),
			),
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		add_action( 'jetpack_use_iframe_authorization_flow', '__return_true' );

		return 'var JPBACKUP_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_data() ) ) . '"));';
	}
}
