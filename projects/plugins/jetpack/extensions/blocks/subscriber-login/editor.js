import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/loginout' ],
				transform: () => {
					return createBlock( 'jetpack/subscriber-login' );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/loginout' ],
				transform: () => {
					return createBlock( 'core/loginout' );
				},
			},
		],
	},
} );
