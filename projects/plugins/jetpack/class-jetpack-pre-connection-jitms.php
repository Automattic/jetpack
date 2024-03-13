<?php
/**
 * Jetpack's Pre-Connection JITMs class.
 *
 * @deprecated 13.3
 *
 * @package jetpack
 */

use Automattic\Jetpack\Redirect;

/**
 * Jetpack's Pre-Connection JITMs. These can be displayed with the JITM package.
 *
 * @deprecated 13.3
 */
class Jetpack_Pre_Connection_JITMs {

	/**
	 * Returns all the pre-connection messages.
	 *
	 * @deprecated 13.3
	 *
	 * @return array An array containing the pre-connection JITM messages.
	 */
	private function get_raw_messages() {
		_deprecated_function( __METHOD__, 'jetpack-13.3' );
		return array();
	}

	/**
	 * Generate a description text with links to ToS documents.
	 *
	 * Those messages must mention the ToS agreement message,
	 * but do not use the standard message defined in jetpack_render_tos_blurb.
	 * Instead, they use their own custom messages.
	 *
	 * @deprecated 13.3
	 *
	 * @param string $description Description string with placeholders.
	 *
	 * @return string
	 */
	private function generate_description_with_tos( $description ) {
		return sprintf(
			wp_kses(
				$description,
				array(
					'a'      => array(
						'href'   => array(),
						'target' => array(),
						'rel'    => array(),
					),
					'strong' => true,
				)
			),
			esc_url( Redirect::get_url( 'wpcom-tos' ) ),
			esc_url( Redirect::get_url( 'jetpack-support-what-data-does-jetpack-sync' ) )
		);
	}

	/**
	 * Returns partnership related pre-connection messages.
	 *
	 * @since 10.4
	 *
	 * @deprecated 13.3
	 *
	 * @return array An array containing the pre-connection JITM messages.
	 */
	private function maybe_get_raw_partnership_messages() {
		_deprecated_function( __METHOD__, 'jetpack-13.3' );
		return array();
	}

	/**
	 * Adds the input query arguments to the admin url.
	 *
	 * @deprecated 13.3
	 *
	 * @param array $args The query arguments.
	 *
	 * @return string The admin url.
	 */
	private function generate_admin_url( $args ) {
		$url = add_query_arg( $args, admin_url( 'admin.php' ) );
		return $url;
	}

	/**
	 * Add the Jetpack pre-connection JITMs to the list of pre-connection JITM messages.
	 *
	 * @deprecated 13.3
	 *
	 * @param array $pre_connection_messages An array of pre-connection JITMs.
	 *
	 * @return array The array of pre-connection JITMs.
	 */
	public function add_pre_connection_jitms( $pre_connection_messages ) {
		_deprecated_function( __METHOD__, 'jetpack-13.3' );
		return $pre_connection_messages;
	}
}
