import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TipLink from './tip-link';

/**
 *
 * @param text
 * @param conversion
 * @param textFallback
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
		context: 'css',
		keywords: [
			'css',
			__( 'css', 'jetpack-mu-wpcom' ),
			'style',
			__( 'style', 'jetpack-mu-wpcom' ),
		],
		description: getTipDescription(
			__(
				'You can visit the the <a>Customizer</a> to edit the CSS on your site.',
				'jetpack-mu-wpcom'
			),
			{
				a: <TipLink section="customizer" subsection="custom_css" />,
			},
			__( 'You can visit the the Customizer to edit the CSS on your site.', 'jetpack-mu-wpcom' )
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
	{
		context: 'header',
		keywords: [ 'header', __( 'header', 'jetpack-mu-wpcom' ) ],
		description: getTipDescription(
			__(
				'You can visit the the <a>Customizer</a> to edit your logo and site title.',
				'jetpack-mu-wpcom'
			),
			{
				a: <TipLink section="customizer" subsection="title_tagline" />,
			},
			__( 'You can visit the the Customizer to edit your logo and site title.', 'jetpack-mu-wpcom' )
		),
		permission: 'settings',
	},
	{
		context: 'color',
		keywords: [ 'color', __( 'color', 'jetpack-mu-wpcom' ) ],
		description: getTipDescription(
			__(
				'You can visit the the <a>Customizer</a> to edit the colors on your site.',
				'jetpack-mu-wpcom'
			),
			{
				a: <TipLink section="customizer" subsection="colors" />,
			},
			__( 'You can visit the the Customizer to edit the colors on your site.', 'jetpack-mu-wpcom' )
		),
		permission: 'settings',
	},
];

export default tips;
