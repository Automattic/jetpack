import { createBlock } from '@wordpress/blocks';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import icon from './icon';
import save from './save';
import { getAttributesFromEmbedCode, REGEX } from './utils';

import './editor.scss';

export const CALENDLY_EXAMPLE_URL = 'https://calendly.com/wpcom/jetpack-block-example';

export const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'a',
		text: __( 'Schedule time with me', 'jetpack' ),
		uniqueId: 'calendly-widget-id',
		url: CALENDLY_EXAMPLE_URL,
	},
};

export const name = 'calendly';
export const title = __( 'Calendly', 'jetpack' );
export const settings = {
	title,
	description: __( 'Embed a calendar for customers to schedule appointments', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [
		_x( 'calendar', 'block search term', 'jetpack' ),
		_x( 'schedule', 'block search term', 'jetpack' ),
		_x( 'appointments', 'block search term', 'jetpack' ),
		_x( 'events', 'block search term', 'jetpack' ),
		_x( 'dates', 'block search term', 'jetpack' ),
	],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {
			hideEventTypeDetails: false,
			style: 'inline',
			url: CALENDLY_EXAMPLE_URL,
		},
		innerBlocks: [ innerButtonBlock ],
	},
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && REGEX.test( node.textContent ),
				transform: node => {
					const newAttributes = getAttributesFromEmbedCode( node.textContent );
					return createBlock( 'jetpack/calendly', newAttributes );
				},
			},
		],
	},
	deprecated: [ deprecatedV1 ],
};
