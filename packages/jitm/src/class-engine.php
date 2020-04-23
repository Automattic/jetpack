<?php
/**
 * Jetpack's JITM Engine class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\JITMS\Message;

/**
 * Class JITM\Engine
 *
 * Determines the rules of a JITM, which should display and when.
 */
class Engine {

	/**
	 * Returns the pre-connection JITMs rules
	 *
	 * @return array Pre-connection JITMs rules.
	 */
	private function preconnection_rules() {

		return array(
			( new Message( 'jpsetup-posts' ) )
				->message_path( '/wp:edit-post:admin_notices/' )
				->show(
					__( 'Do you know which of these posts gets the most traffic?', 'jetpack' ),
					__( 'Setup Jetpack to get in-depth stats about your content and visitors.', 'jetpack' )
				)
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-posts' ) )
				),
			( new Message( 'jpsetup-upload' ) )
				->message_path( '/wp:upload:admin_notices/' )
				->show(
					__( 'Do you want lightning-fast images?', 'jetpack' ),
					__( 'Setup Jetpack, enable Site Accelerator, and start serving your images lightning fast, for free.', 'jetpack' )
				)
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-upload' ) )
				),
			( new Message( 'jpsetup-widgets' ) )
				->message_path( '/wp:widgets:admin_notices/' )
				->show(
					__( 'Looking for even more widgets?', 'jetpack' ),
					__( 'Setup Jetpack for great additional widgets like business hours and maps.', 'jetpack' )
				)
				->with_cta(
					__( 'Setup Jetpack', 'jetpack' ),
					esc_url( \Jetpack::init()->build_connect_url( true, false, 'pre-connection-jitm-widgets' ) )
				),
		);
	}

	/**
	 * Gets the top messages
	 *
	 * @param string $message_path Message path.
	 *
	 * @return array Rendered messages.
	 */
	public function render_messages( $message_path ) {
		$rules = $this->preconnection_rules();

		$rendered_rules = array();

		foreach ( $rules as $rule ) {

			if ( ! preg_match( $rule->message_path_regex, $message_path ) ) {
				continue;
			}

			// TODO: add partner filter here.

			$rendered_rules[] = $rule->render();
		}

		return $rendered_rules;
	}

}
