/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { G, Path, Rect, SVG } from '@wordpress/components';
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
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="m20.5698779.97234589c1.1045695 0 2 .8954305 2 2v20.00000001c0 1.1045695-.8954305 2-2 2h-18.5698779c-1.1045695 0-2-.8954305-2-2v-20.00000001c0-1.1045695.8954305-2 2-2zm-12.78425428 8.52983054c-.83841213 0-1.51732659.24082051-2.03674337.72246157-.51941679.481641-.76863191 1.0666407-.74764537 1.7549991l.01259192.0377757h1.18259134c.0099686-.4921342.15477571-.851004.43494597-1.1227797.28961421-.2817442.67471715-.422354 1.15425951-.422354.50472621 0 .88615651.1353631 1.14481558.4066141.25865906.271251.38772626.6673719.38772626 1.1888873 0 .487937-.11385196.868318-.34103122 1.1416676-.22717926.2733497-.6138562.4097622-1.16055547.4097622h-1.07608467l.00052466.9638066h1.07608467c.56716115 0 .98216991.1332646 1.24502628.4003182.26285638.2670537.39402223.6820625.39402223 1.2450263 0 .5545692-.14847975.9737753-.44438991 1.2576182-.29591017.2838429-.70462297.4255021-1.22613841.4255021-.51312082 0-.91711165-.1416592-1.21092316-.4255021-.29433617-.2833182-.44124193-.6652732-.44124193-1.1448155h-1.17629538l-.01888788.0377757c-.02046187.7670579.24082051 1.3751428.78542113 1.8237301.54460063.4485872 1.2319097.6726185 2.06192722.6726185.84680676 0 1.54251045-.2381972 2.08658641-.7135423.54407597-.4758697.81637627-1.128551.81637627-1.9585685 0-.4758697-.113852-.9050444-.3410312-1.289098-.2193093-.3709371-.58814771-.6463854-1.10441651-.816901l-.05613898-.0272825c.45488318-.1962241.7959144-.4805917 1.02309369-.854152.2271792-.3735604.3410312-.7476454.3410312-1.1233044 0-.8300175-.2502645-1.4690575-.75079336-1.9176448-.5005289-.44858719-1.17209807-.67261847-2.01470752-.67261847zm8.51528728.13116586-3.0970882.33788324v.88877987l1.8646538-.0251839v7.9087763h1.2324344zm-12.06905879-7.23087434c-.38953123 0-.70530868.31577745-.70530868.70530868s.31577745.70530869.70530868.70530869c.38953124 0 .70530869-.31577746.70530869-.70530869s-.31577745-.70530868-.70530869-.70530868zm14.10617369 0c-.3895312 0-.7053087.31577745-.7053087.70530868s.3157775.70530869.7053087.70530869c.3895313 0 .7053087-.31577746.7053087-.70530869s-.3157774-.70530868-.7053087-.70530868z" />
		</G>
	</SVG>
);

export const settings = {
	title,

	description: __( 'Embed a Google Calendar view', 'jetpack' ),

	icon,

	category: 'jetpack',

	supports: {
		align: false,
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
