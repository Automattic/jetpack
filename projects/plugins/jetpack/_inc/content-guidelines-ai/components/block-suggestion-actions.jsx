import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { acceptBlockSuggestion } from '../lib/dom';
import { recordGuidelinesEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';
import DiffView from './diff-view';

// Renders only the diff view. Accept/Dismiss and Improve buttons live in
// BlockSuggestionButtons, injected as a separate row above the modal action bar.
export default function BlockSuggestionActions( { blockName, blockModal } ) {
	const suggestion = useSelect(
		select => select( AI_STORE_NAME ).getSuggestion( blockName ),
		[ blockName ]
	);
	const blockLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( blockName ),
		[ blockName ]
	);
	const { clearSuggestion } = useDispatch( AI_STORE_NAME );

	const [ original, setOriginal ] = useState( '' );
	const [ textareaHeight, setTextareaHeight ] = useState( null );

	// Clear stale suggestion when the modal closes (component unmounts).
	useEffect( () => {
		return () => clearSuggestion( blockName );
	}, [ blockName, clearSuggestion ] );

	// Toggle shimmer and suggestion classes on the modal.
	useEffect( () => {
		if ( ! blockModal ) {
			return;
		}

		// Capture textarea content and height before hiding it.
		if ( suggestion && ! blockModal.classList.contains( 'has-jetpack-suggestion' ) ) {
			const textarea = blockModal.querySelector( '.components-textarea-control__input' );
			if ( textarea ) {
				setOriginal( textarea.value || '' );
				if ( textarea.offsetHeight > 0 ) {
					setTextareaHeight( textarea.offsetHeight );
				} else {
					const rows = parseInt( textarea.getAttribute( 'rows' ), 10 ) || 6;
					setTextareaHeight( rows * 20 + 20 );
				}
			}
		}

		blockModal.classList.toggle( 'has-jetpack-suggestion', !! suggestion );
		blockModal.classList.toggle( 'is-jetpack-loading', blockLoading && ! suggestion );
		return () => {
			blockModal.classList.remove( 'has-jetpack-suggestion', 'is-jetpack-loading' );
		};
	}, [ blockModal, suggestion, blockLoading ] );

	const handleAccept = useCallback( () => {
		recordGuidelinesEvent( 'accept', { type: 'block', slug: blockName } );
		acceptBlockSuggestion( blockModal, blockName, suggestion, clearSuggestion );
	}, [ blockModal, blockName, suggestion, clearSuggestion ] );

	if ( ! suggestion ) {
		return null;
	}

	return (
		<DiffView
			original={ original }
			suggestion={ suggestion }
			onAccept={ handleAccept }
			height={ textareaHeight }
		/>
	);
}
