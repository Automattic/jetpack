<?php
/**
 * Jetpack's Pre-Connection JITM class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\JITMS\Engine;

/**
 * Jetpack just in time messaging through out the admin
 */
class Pre_Connection_JITM extends JITM {

	const PACKAGE_VERSION = '1.0'; // TODO: Keep in sync with version specified in composer.json.

	/**
	 * Determines if JITMs are enabled.
	 *
	 * @return bool Enable JITMs.
	 */
	public function register() {
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
		return true;
	}

	/**
	 * Retrieve the current message to display keyed on query string and message path
	 *
	 * @param string $message_path The message path to ask for.
	 * @param string $query The query string originally from the front end. Unused in this subclass.
	 * @param bool   $full_jp_logo_exists If there is a full Jetpack logo already on the page.
	 *
	 * @return array The JITM's to show, or an empty array if there is nothing to show
	 */
	public function get_messages( $message_path, $query, $full_jp_logo_exists ) {
		$jitm_engine = new Engine();

		$envelopes = $jitm_engine->render_messages( $message_path );

		if ( ! is_array( $envelopes ) ) {
			return array();
		}

		$hidden_jitms = \Jetpack_Options::get_option( 'hide_jitm' );

		foreach ( $envelopes as $idx => &$envelope ) {
			$dismissed_feature = isset( $hidden_jitms[ 'pre-connection-' . $envelope->id ] ) &&
				is_array( $hidden_jitms[ 'pre-connection-' . $envelope->id ] ) ? $hidden_jitms[ 'pre-connection-' . $envelope->id ] : null;

			if ( is_array( $dismissed_feature ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			$envelope->content['icon'] = $this->generate_icon( $envelope->content['icon'], $full_jp_logo_exists );
		}

		return $envelopes;
	}

	/**
	 * Dismisses a JITM ID so that it will no longer be shown.
	 *
	 * @param string $id The id of the JITM that was dismissed.
	 * @param string $feature_class The feature class of the JITM that was dismissed. Unused in this subclass.
	 *
	 * @return bool Always true
	 */
	public function dismiss( $id, $feature_class ) {
		$hide_jitm = \Jetpack_Options::get_option( 'hide_jitm' );
		if ( ! is_array( $hide_jitm ) ) {
			$hide_jitm = array();
		}

		if ( empty( $hide_jitm[ 'pre-connection-' . $id ] ) || ! is_array( $hide_jitm[ 'pre-connection-' . $id ] ) ) {
			$hide_jitm[ $id ] = array(
				'last_dismissal' => 0,
				'number'         => 0,
			);
		}

		$hide_jitm[ 'pre-connection-' . $id ] = array(
			'last_dismissal' => time(),
			'number'         => intval( $hide_jitm[ 'pre-connection-' . $id ]['number'] ) + 1,
		);

		\Jetpack_Options::update_option( 'hide_jitm', $hide_jitm );

		return true;
	}
}
