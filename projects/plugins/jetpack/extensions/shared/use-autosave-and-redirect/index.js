import { useSelect, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { noop } from 'lodash';

function redirect( url, callback, shouldOpenNewWindow = false ) {
	if ( callback ) {
		callback( url );
	}

	return shouldOpenNewWindow ? window.open( url, '_blank' ) : ( window.top.location.href = url );
}

export default function useAutosaveAndRedirect( redirectUrl, onRedirect = noop ) {
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const { isAutosaveablePost, isDirtyPost, currentPost } = useSelect( select => {
		const editorSelector = select( 'core/editor' );

		return {
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
			currentPost: editorSelector.getCurrentPost(),
		};
	}, [] );

	const isPostEditor = Object.keys( currentPost ).length > 0;

	const isWidgetEditor = useSelect( select => {
		if ( window.wp?.customize ) {
			return true;
		}

		return !! select( 'core/edit-widgets' );
	} );

	// Alias. Save post by dispatch.
	const savePost = dispatch( 'core/editor' ).savePost;

	// For the site editor, save entities
	const entityRecords = useSelect( select => {
		return select( 'core' ).__experimentalGetDirtyEntityRecords();
	} );

	// Save
	const saveEntities = async () => {
		for ( let i = 0; i < entityRecords.length; i++ ) {
			// await is needed here due to the loop.
			await dispatch( 'core' ).saveEditedEntityRecord(
				entityRecords[ i ].kind,
				entityRecords[ i ].name,
				entityRecords[ i ].key
			);
		}
	};

	const autosave = async event => {
		event.preventDefault();

		if ( isPostEditor ) {
			/**
			 * If there are not unsaved values, return.
			 * If the post is not auto-savable, return.
			 */
			if ( isDirtyPost && isAutosaveablePost ) {
				await savePost( event );
			}
		} else {
			// Save entities in the site editor.
			await saveEntities( event );
		}
	};

	const autosaveAndRedirect = async event => {
		event.preventDefault();

		// Lock re-redirecting attempts.
		if ( isRedirecting ) {
			return;
		}

		setIsRedirecting( true );

		autosave( event ).then( () => {
			redirect( redirectUrl, onRedirect, isWidgetEditor );
		} );
	};

	return { autosave, autosaveAndRedirect, isRedirecting };
}
