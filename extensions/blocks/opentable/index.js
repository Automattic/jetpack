/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { defaultAttributes } from './attributes';
import edit from './edit';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';
import './view.scss';

export const name = 'opentable';
export const title = __( 'OpenTable', 'jetpack' );
import { getAttributesFromEmbedCode, restRefRegex, ridRegex } from './utils';
import { supportsCollections } from '../../shared/block-category';

export const settings = {
	title,
	description: __( 'Allow visitors to book a reservation with OpenTable', 'jetpack' ),
	icon,
	category: supportsCollections() ? 'earn' : 'jetpack',
	keywords: [
		_x( 'booking', 'block search term', 'jetpack' ),
		_x( 'reservation', 'block search term', 'jetpack' ),
		_x( 'restaurant', 'block search term', 'jetpack' ),
	],
	supports: {
		align: true,
		html: false,
	},
	edit,
	save: ( { attributes: { rid } } ) => (
		<>
			{ rid.map( restaurantId => (
				<a href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }>
					{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
				</a>
			) ) }
		</>
	),
	attributes: defaultAttributes,
	example: {
		attributes: {
			rid: [ '1' ],
			style: 'standard',
			iframe: true,
			domain: 'com',
			lang: 'en-US',
			newtab: false,
		},
	},
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'P' &&
					node.textContent.indexOf( 'http' ) === 0 &&
					( ridRegex.test( node.textContent ) || restRefRegex.test( node.textContent ) ),
				transform: node => {
					const newAttributes = getAttributesFromEmbedCode( node.textContent );
					return createBlock( 'jetpack/opentable', newAttributes );
				},
			},
		],
	},
};
