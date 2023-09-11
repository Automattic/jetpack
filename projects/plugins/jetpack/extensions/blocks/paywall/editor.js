import { unregisterBlockType } from '@wordpress/blocks';
import { subscribe, select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';

const unsubscribe = subscribe( () => {
	const postType = select( editorStore ).getCurrentPostType();

	// If postType is still not available, simply return and wait for the next call.
	if ( postType === null ) {
		return;
	}
	unsubscribe();
	// If postType is defined and not 'post', unregister the block.
	if ( postType && postType !== 'post' ) {
		unregisterBlockType( 'jetpack/' + name );
	}
} );

registerJetpackBlock( name, settings );
