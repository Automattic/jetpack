import externalLinkInterpolateVar from './external-link-interpolate-var';

/**
 * Generates a Interpolate var for a link to contact Jetpack Support.
 *
 * @param {string} elementKey element key to use for this link. Default: 'support'
 * @return {Object} Interpolate var which can be sent to createInterpolateElement.
 */
export default function supportLinkInterpolateVar( elementKey = 'support' ) {
	return externalLinkInterpolateVar(
		'https://wordpress.org/support/plugin/jetpack-boost/',
		elementKey
	);
}
