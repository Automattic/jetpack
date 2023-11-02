import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { URL_REGEX, CUSTOM_URL_REGEX } from './constants';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'P' &&
					( URL_REGEX.test( node.textContent ) || CUSTOM_URL_REGEX.test( node.textContent ) ),
				transform: node =>
					createBlock( 'jetpack/eventbrite', {
						url: node.textContent.trim(),
					} ),
			},
		],
	},
	deprecated,
} );
