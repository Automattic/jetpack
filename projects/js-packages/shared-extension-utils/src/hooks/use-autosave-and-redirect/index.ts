import { useSelect, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

const noop = () => {};

interface PreventableEvent {
	preventDefault: () => void;
}

export interface UseAutosaveAndRedirectReturn {
	autosave: ( event?: PreventableEvent ) => Promise< void >;
	autosaveAndRedirect: ( event?: PreventableEvent ) => Promise< void >;
	isRedirecting: boolean;
}

/**
 * To handle the redirection
 * @param {string}   url                 - The redirect URL.
 * @param {Function} callback            - The callback of the redirection.
 * @param {boolean}  shouldOpenNewWindow - Whether to open the new window.
 * @return {Window | null} - The open window.
 */
function redirect( url: string, callback: ( url: string ) => void, shouldOpenNewWindow = false ) {
	if ( callback ) {
		callback( url );
	}

	return shouldOpenNewWindow
		? window.open( url, '_blank' )
		: ( ( window.top as Window ).location.href = url );
}

/**
 * Hook to get properties for autosave and redirect.
 *
 * @param {string}   redirectUrl - The redirect URL.
 * @param {Function} onRedirect  - To handle the redirection.
 * @return Object containing properties to handle autosave and redirect.
 */
export default function useAutosaveAndRedirect(
	redirectUrl: string | null = null,
	onRedirect: ( url: string ) => void = noop
): UseAutosaveAndRedirectReturn {
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const { isAutosaveablePost, isDirtyPost, currentPost } = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const editorSelector = select( 'core/editor' ) as any;

		return {
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
			currentPost: editorSelector.getCurrentPost(),
		};
	}, [] );

	const isPostEditor = Object.keys( currentPost ).length > 0;

	const isWidgetEditor = useSelect( select => {
		if ( ( window as { wp?: { customize?: unknown } } ).wp?.customize ) {
			return true;
		}

		return !! select( 'core/edit-widgets' );
	} );

	// Alias. Save post by dispatch.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const savePost = ( dispatch( 'core/editor' ) as any ).savePost;

	// For the site editor, save entities
	const entityRecords = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ( select( 'core' ) as any ).__experimentalGetDirtyEntityRecords();
	} );

	// Save
	const saveEntities = async () => {
		for ( let i = 0; i < entityRecords.length; i++ ) {
			// await is needed here due to the loop.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await ( dispatch( 'core' ) as any ).saveEditedEntityRecord(
				entityRecords[ i ].kind,
				entityRecords[ i ].name,
				entityRecords[ i ].key
			);
		}
	};

	const autosave = async ( event?: PreventableEvent ) => {
		event?.preventDefault();

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
			await saveEntities();
		}
	};

	const autosaveAndRedirect = async ( event?: PreventableEvent ) => {
		event?.preventDefault();

		// Lock re-redirecting attempts.
		if ( isRedirecting ) {
			return;
		}

		setIsRedirecting( true );

		autosave( event ).then( () => {
			if ( redirectUrl ) {
				redirect( redirectUrl, onRedirect, isWidgetEditor );
			}
		} );
	};

	return { autosave, autosaveAndRedirect, isRedirecting };
}
