import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../constants';
import { AI_STORE_NAME } from '../store';
import DiffView from './diff-view';

export default function SuggestionActions( { slug } ) {
	const suggestion = useSelect( select => select( AI_STORE_NAME ).getSuggestion( slug ), [ slug ] );
	const sectionLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( slug ),
		[ slug ]
	);
	const { clearSuggestion } = useDispatch( AI_STORE_NAME );
	const { setGuideline } = useDispatch( STORE_NAME );

	const [ original, setOriginal ] = useState( '' );
	const [ textareaHeight, setTextareaHeight ] = useState( null );

	// Direct DOM class manipulation is necessary because this component is rendered in
	// a separate React root injected into Gutenberg's page — we can't control classes
	// on Gutenberg-owned elements through React props.
	useEffect( () => {
		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			return;
		}

		// Capture textarea draft and height before hiding it.
		if ( suggestion && ! form.classList.contains( 'has-jetpack-suggestion' ) ) {
			const textarea = form.querySelector( 'textarea' );
			if ( textarea ) {
				setOriginal( textarea.value || '' );
				if ( textarea.offsetHeight > 0 ) {
					setTextareaHeight( textarea.offsetHeight );
				}
			}
		}

		form.classList.toggle( 'has-jetpack-suggestion', !! suggestion );
		form.classList.toggle( 'is-jetpack-loading', sectionLoading && ! suggestion );
		return () => {
			form.classList.remove( 'has-jetpack-suggestion', 'is-jetpack-loading' );
		};
	}, [ slug, suggestion, sectionLoading ] );

	const handleAccept = useCallback( () => {
		setGuideline( slug, suggestion );
		clearSuggestion( slug );
	}, [ slug, suggestion, setGuideline, clearSuggestion ] );

	const handleDismiss = useCallback( () => {
		clearSuggestion( slug );
	}, [ slug, clearSuggestion ] );

	if ( ! suggestion ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__suggestion">
			<DiffView
				original={ original }
				suggestion={ suggestion }
				onAccept={ handleAccept }
				height={ textareaHeight }
			/>
			<div className="jetpack-content-guidelines-ai__suggestion-actions">
				<Button variant="primary" onClick={ handleAccept }>
					{ __( 'Accept suggestion', 'jetpack' ) }
				</Button>
				<Button variant="tertiary" onClick={ handleDismiss }>
					{ __( 'Dismiss', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
