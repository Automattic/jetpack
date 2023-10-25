import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { extractAttributesFromIframe, URL_REGEX, IFRAME_REGEX } from './utils';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
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
} );
