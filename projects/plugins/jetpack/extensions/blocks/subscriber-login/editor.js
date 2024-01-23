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
				transform: ( { fontSize, redirectToCurrent } ) => {
					return createBlock( 'jetpack/subscriber-login', { fontSize, redirectToCurrent } );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/loginout' ],
				transform: ( { fontSize, redirectToCurrent } ) => {
					return createBlock( 'core/loginout', { fontSize, redirectToCurrent } );
				},
			},
		],
	},
} );
