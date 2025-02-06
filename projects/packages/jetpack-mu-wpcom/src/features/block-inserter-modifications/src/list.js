import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TipLink from './tip-link';

/**
 * Creates the tip content as an React element or text.
 *
 * @param {string}                  text         - The tip description text string.
 * @param {Record<string, Element>} conversion   - The map used to convert the string to an element.
 * @param {string}                  textFallback - The fallback text for the tip description.
 * @return {JSX.Element|string} The tip content as a React element or the fallback text.
 */
function getTipDescription( text, conversion, textFallback ) {
	if ( typeof createInterpolateElement !== 'undefined' ) {
		return createInterpolateElement( text, conversion );
	}

	return textFallback;
}

const tips = [
	{
		context: 'theme',
		keywords: [ 'theme', __( 'theme', 'jetpack-mu-wpcom' ) ],
		description: getTipDescription(
			__(
				'You can visit the <a>theme directory</a> to select a different design for your site.',
				'jetpack-mu-wpcom'
			),
			{
				a: <TipLink section="themes" />,
			},
			__(
				'You can visit the theme directory to select a different design for your site.',
				'jetpack-mu-wpcom'
			)
		),
		permission: 'settings',
	},
	{
		context: 'plugin',
		keywords: [ 'plugin', __( 'plugin', 'jetpack-mu-wpcom' ) ],
		description: getTipDescription(
			__(
				'You can visit the <a>plugin directory</a> to get started with installing new plugins.',
				'jetpack-mu-wpcom'
			),
			{
				a: <TipLink section="plugins" />,
			},
			__(
				'You can visit the plugin directory to get started with installing new plugins.',
				'jetpack-mu-wpcom'
			)
		),
		permission: 'settings',
	},
];

export default tips;
