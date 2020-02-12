/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { G, Rect, SVG, Path } from '@wordpress/components';
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
	<SVG height="23" viewBox="0 0 24 23" width="24" xmlns="http://www.w3.org/2000/svg">
		<G fill="none" fill-rule="evenodd" transform="translate(.5)">
			<Rect
				height="20.956522"
				rx="3"
				stroke="#656a74"
				stroke-width="2"
				width="20.956522"
				x="1"
				y="1.043478"
			/>
			<G fill="#656a74">
				<Rect height="2" rx=".869565" width="1.73913" x="5.565217" y="3.869565" />
				<Rect height="2" rx=".869565" width="1.73913" x="15.652174" y="3.869565" />
				<Path
					d="m8.32727582 17.5986753c1.84391988 0 3.17781928-1.0256454 3.17781928-2.4436142 0-1.0648777-.6949728-1.8046875-1.80468749-1.9279891v-.1008831c.90234379-.1849525 1.49082879-.913553 1.49082879-1.8495245 0-1.2722486-1.19378395-2.18019701-2.85275135-2.18019701-1.76545516 0-2.90319293.96399461-2.95923913 2.49405571h1.56368886c.04483696-.7005774.56606658-1.1433424 1.35071332-1.1433424.79025136 0 1.29466712.4147419 1.29466712 1.0648777 0 .6613451-.52122962 1.1097147-1.2890625 1.1097147h-.98641305v1.2610394h1.00322691c.90794837 0 1.4628057.4371603 1.4628057 1.1433424 0 .6893682-.58848505 1.1657609-1.43478261 1.1657609-.86871603 0-1.44599184-.4315557-1.49643342-1.1153193h-1.61973505c.07286005 1.5244565 1.29466712 2.5220788 3.09935462 2.5220788zm8.74709068-.207371v-8.08746598h-1.6869904l-2.0905231 1.44038718v1.5748981l1.9840353-1.3675271h.1008831v6.4397078z"
					fill-rule="nonzero"
				/>
			</G>
		</G>
	</SVG>
);

export const settings = {
	title,

	description: __( 'Embed a Google Calendar', 'jetpack' ),

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
