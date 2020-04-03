/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import { getAttributesFromEmbedCode, REGEX } from './utils';

/**
 * Style dependencies
 */
import './editor.scss';
import { supportsCollections } from '../../shared/block-category';

export const CALENDLY_EXAMPLE_URL = 'https://calendly.com/wordpresscom/jetpack-block-example';

export const name = 'calendly';
export const title = __( 'Calendly', 'jetpack' );
export const settings = {
	title,
	description: __( 'Embed a calendar for customers to schedule appointments', 'jetpack' ),
	icon,
	category: supportsCollections() ? 'grow' : 'jetpack',
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
	save: ( { attributes: { url } } ) => <a href={ url }>{ url }</a>,
	attributes,
	example: {
		attributes: {
			submitButtonText: __( 'Schedule time with me', 'jetpack' ),
			hideEventTypeDetails: false,
			style: 'inline',
			url: CALENDLY_EXAMPLE_URL,
		},
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
};
