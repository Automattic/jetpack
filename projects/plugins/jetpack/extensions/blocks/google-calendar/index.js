import { createBlock } from '@wordpress/blocks';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import edit from './edit';
import icon from './icon';
import { extractAttributesFromIframe, URL_REGEX, IFRAME_REGEX } from './utils';
import './editor.scss';

export const name = 'google-calendar';
export const title = __( 'Google Calendar', 'jetpack' );

export const settings = {
	title,
	description: __( 'Embed a Google Calendar', 'jetpack' ),
	keywords: [
		_x( 'events', 'block search term', 'jetpack' ),
		_x( 'dates', 'block search term', 'jetpack' ),
		_x( 'schedule', 'block search term', 'jetpack' ),
		_x( 'appointments', 'block search term', 'jetpack' ),
	],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'embed',
	supports: {
		align: true,
		alignWide: true,
		html: false,
	},
	attributes: {
		url: {
			type: 'string',
		},
		height: {
			type: 'integer',
			default: 600,
		},
	},
	edit,
	save: ( { attributes: { url } } ) => <a href={ url }>{ url }</a>,
	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'googleapps',
				isMatch: function ( attributes ) {
					return attributes.named.domain === 'calendar';
				},
				attributes: {
					url: {
						type: 'string',
						shortcode: ( { named: { domain, dir, query } } ) => {
							return `https://${ domain }.google.com/${ dir }?${ query }`;
						},
					},
				},
			},
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && URL_REGEX.test( node.textContent ),
				transform: node => {
					return createBlock( 'jetpack/google-calendar', {
						url: node.textContent.trim(),
					} );
				},
			},
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'FIGURE' && IFRAME_REGEX.test( node.innerHTML ),
				transform: node => {
					const { url, height } = extractAttributesFromIframe( node.innerHTML.trim() );
					return createBlock( 'jetpack/google-calendar', { url, height } );
				},
			},
		],
	},
	example: {
		attributes: {
			url:
				'https://calendar.google.com/calendar/embed?src=jb4bu80jirp0u11a6niie21pp4%40group.calendar.google.com&ctz=America/New_York',
		},
	},
};
