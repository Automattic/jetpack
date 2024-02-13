import './editor.scss';
import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { REGEX, parseUrl } from './utils';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && REGEX.test( node.textContent ),
				transform: node => {
					const embedUrl = parseUrl( node.textContent );
					return createBlock( 'jetpack/nextdoor', { url: embedUrl } );
				},
			},
		],
	},
} );
