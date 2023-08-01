import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';

/* global wp */
const unsubscribe = wp.data.subscribe( () => {
	const postType = wp.data.select( 'core/editor' ).getCurrentPostType();

	// If postType is still not available, simply return and wait for the next call.
	if ( postType === null ) {
		return;
	}
	unsubscribe();
	// If postType is defined and not 'post', unregister the block.
	if ( postType && postType !== 'post' ) {
		wp.blocks.unregisterBlockType( 'jetpack/' + name );
	}
} );

registerJetpackBlock( name, settings );
