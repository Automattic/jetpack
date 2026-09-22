<?php
/**
 * Resolves the wpcom_launchpad_personalization_202607_v1 experiment variation server-side.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\ExPlat\Server_Assignment;

/**
 * Reads the launchpad-personalization variation for the current user.
 *
 * The experiment is registered on the `calypso` platform, and the read is
 * non-assigning: rendering wp-admin must never create an assignment.
 */
class Launchpad_Personalization_Experiment {

	const EXPERIMENT_NAME = 'wpcom_launchpad_personalization_202607_v1';

	/**
	 * The current user's variation: 'control', 'ai_launchpad', or 'no_guidance'.
	 *
	 * @return string
	 */
	public static function get_variation() {
		/**
		 * Overrides the resolved variation (testing / manual QA). Return one of the variation strings, or null to use ExPlat.
		 *
		 * @param string|null $override The forced variation, or null.
		 */
		$override = apply_filters( 'wpcom_launchpad_personalization_variation', null );
		if ( null !== $override ) {
			return self::normalize( $override );
		}

		return self::normalize(
			Server_Assignment::get_variation( self::EXPERIMENT_NAME, array( 'platform' => 'calypso' ) )
		);
	}

	/**
	 * Map any variation onto a known value; unknown/null becomes 'control'.
	 *
	 * @param string|null $variation The raw variation name.
	 * @return string
	 */
	private static function normalize( $variation ) {
		if ( 'ai_launchpad' === $variation || 'no_guidance' === $variation ) {
			return $variation;
		}
		return 'control';
	}
}
