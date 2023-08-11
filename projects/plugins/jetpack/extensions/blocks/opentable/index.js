import { createBlock } from '@wordpress/blocks';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import { defaultAttributes, getStyleOptions } from './attributes';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import icon from './icon';
import { getAttributesFromEmbedCode, restRefRegex, ridRegex } from './utils';
import './editor.scss';
import './view.scss';

export const name = 'opentable';
export const title = __( 'OpenTable', 'jetpack' );

export const settings = {
	title,
	description: __( 'Allow visitors to book a reservation with OpenTable', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
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
		<div>
			{ rid.map( ( restaurantId, restaurantIndex ) => (
				<a
					href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
					key={ `${ restaurantId }-${ restaurantIndex }` }
				>
					{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
				</a>
			) ) }
		</div>
	),
	attributes: defaultAttributes,
	styles: getStyleOptions(),
	example: {
		attributes: {
			rid: [ '1' ],
			style: 'standard',
			iframe: true,
			domain: 'com',
			lang: 'en-US',
			newtab: false,
			negativeMargin: false,
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
	deprecated: [ deprecatedV1, deprecatedV2 ],
};
