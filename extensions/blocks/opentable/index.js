/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
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
const supports = {
	align: true,
	html: false,
};
export const settings = {
	title,
	description: __( 'Allow visitors to book a reservation with OpenTable', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		__( 'opentable', 'jetpack' ),
		__( 'reservation', 'jetpack' ),
		__( 'restaurant', 'jetpack' ),
	],
	supports,
	edit,
	save: ( { attributes: { rid } } ) => (
		<div>
			{ rid.map( restaurantId => (
				<a href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }>
					{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
				</a>
			) ) }
		</div>
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
	deprecated: [
		{
			attributes: defaultAttributes,
			save: ( { attributes: { rid } } ) => (
				<>
					{ rid.map( restaurantId => (
						<a href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }>
							{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
						</a>
					) ) }
				</>
			),
		},
	],
};
