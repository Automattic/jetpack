/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { G, Rect, SVG } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import { extractAttributesFromIframe, URL_REGEX, IFRAME_REGEX } from './utils';
import './editor.scss';

export const name = 'google-calendar';
export const title = __( 'Google Calendar', 'jetpack' );

export const icon = (
	<SVG height="69" viewBox="0 0 66 69" width="66" xmlns="http://www.w3.org/2000/svg">
		<G fill="none" fill-rule="evenodd">
			<Rect height="62" rx="7" stroke="#656a74" stroke-width="4" width="62" x="2" y="5" />
			<G fill="#656a74">
				<Rect height="14" rx="2" width="5" x="16" />
				<Rect height="14" rx="2" width="5" x="45" />
				<text
					font-family="SFUIText-Bold, SF UI Text"
					font-size="33"
					font-weight="bold"
					letter-spacing="1.17132335"
				>
					<tspan x="13" y="50">
						31
					</tspan>
				</text>
			</G>
		</G>
	</SVG>
);

export const settings = {
	title,

	description: __( 'Embed a Google Calendar view', 'jetpack' ),

	icon,

	category: 'jetpack',

	supports: {
		align: true,
		alignWide: false,
		html: false,
	},

	attributes: {
		url: {
			type: 'string',
		},
		width: {
			type: 'integer',
			default: 800,
		},
		height: {
			type: 'integer',
			default: 600,
		},
	},

	edit,

	save: () => null,

	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'googleapps',
				isMatch: function( attributes ) {
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
					const { url, width, height } = extractAttributesFromIframe( node.innerHTML.trim() );
					return createBlock( 'jetpack/google-calendar', { url, width, height } );
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
