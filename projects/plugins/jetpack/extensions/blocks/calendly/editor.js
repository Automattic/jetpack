import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';
import { getAttributesFromEmbedCode, REGEX } from './utils';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
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
	deprecated: [ deprecatedV1 ],
} );
