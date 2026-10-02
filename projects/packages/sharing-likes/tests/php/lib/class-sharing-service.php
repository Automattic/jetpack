<?php
/**
 * Stands in for the plugin class the settings screen uses opportunistically.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

/**
 * A `Sharing_Service` that records the global options rather than saving them,
 * and offers the services UI nothing to list.
 *
 * The real one ships with the Jetpack plugin's Sharing module, which this
 * package does not depend on. Validating the payload is that class's job, so
 * the tests here only assert what the handler hands over.
 */
class Sharing_Service {

	/**
	 * Record a save.
	 *
	 * @param array<string,mixed> $data Posted data.
	 */
	public function set_global_options( $data ) {
		$GLOBALS['sharing_likes_test_global_options'] = $data;
	}

	/**
	 * Store the enabled services, as the real one does.
	 *
	 * @param array $visible Visible service IDs.
	 * @param array $hidden  Service IDs behind the "More" button.
	 */
	public function set_blog_services( array $visible, array $hidden ) {
		return update_option( 'sharing-services', compact( 'visible', 'hidden' ) );
	}

	/**
	 * No enabled services, which is all the services UI needs to render.
	 *
	 * @return array
	 */
	public function get_blog_services() {
		return array(
			'visible' => array(),
			'hidden'  => array(),
			'all'     => array(),
		);
	}

	/**
	 * No services to offer.
	 *
	 * @return array
	 */
	public function get_all_services_blog() {
		return array();
	}

	/**
	 * The global options the services UI reads.
	 *
	 * @return array
	 */
	public function get_global_options() {
		return array(
			'button_style'  => 'icon-text',
			'sharing_label' => 'Share this:',
		);
	}
}
