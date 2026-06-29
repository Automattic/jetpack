import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { normalizeUrl, URL_REGEX } from './utils';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && URL_REGEX.test( node.textContent.trim() ),
				transform: node => {
					const url = normalizeUrl( node.textContent.trim() );
					return createBlock( 'jetpack/zoom-scheduler', { url } );
				},
			},
		],
	},
} );
