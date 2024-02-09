import { createBlock } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
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

addFilter( 'blocks.registerBlockType', 'jetpack-subscriber-login-nav-item', ( settings, name ) => {
	if ( name === 'core/navigation' ) {
		return {
			...settings,
			allowedBlocks: [ ...( settings.allowedBlocks ?? [] ), 'jetpack/subscriber-login' ],
		};
	}

	return settings;
} );
