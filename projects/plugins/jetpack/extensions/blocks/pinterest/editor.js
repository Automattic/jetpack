import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { URL_REGEX } from './constants';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && URL_REGEX.test( node.textContent ),
				transform: node => {
					return createBlock( 'jetpack/pinterest', {
						url: node.textContent.trim(),
					} );
				},
			},
		],
	},
	deprecated: [ deprecatedV1 ],
} );
