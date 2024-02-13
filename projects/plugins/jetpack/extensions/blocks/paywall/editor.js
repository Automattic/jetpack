import { unregisterBlockType } from '@wordpress/blocks';
import { subscribe, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

const unsubscribe = subscribe( () => {
	const postType = select( editorStore ).getCurrentPostType();

	// If postType is still not available, simply return and wait for the next call.
	if ( postType === null ) {
		return;
	}
	unsubscribe();
	// If postType is defined and not 'post', unregister the block.
	if ( postType && postType !== 'post' ) {
		unregisterBlockType( metadata.name );
	}
} );

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms,
} );
