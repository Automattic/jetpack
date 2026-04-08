import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { diffWords } from 'diff';
import { STORE_NAME } from '../constants';
import { AI_STORE_NAME } from '../store';

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

	const diff = useMemo( () => {
		if ( ! suggestion ) {
			return [];
		}
		return diffWords( original, suggestion );
	}, [ original, suggestion ] );

	const handleAccept = useCallback( () => {
		setGuideline( slug, suggestion );
		clearSuggestion( slug );
	}, [ slug, suggestion, setGuideline, clearSuggestion ] );

	const handleDismiss = useCallback( () => {
		clearSuggestion( slug );
	}, [ slug, clearSuggestion ] );

	const handleKeyDown = useCallback(
		e => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				handleAccept();
			}
		},
		[ handleAccept ]
	);

	if ( ! suggestion ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__suggestion">
			<div
				className="jetpack-content-guidelines-ai__diff"
				style={ textareaHeight ? { height: textareaHeight } : undefined }
				role="button"
				tabIndex={ 0 }
				aria-label={ __( 'Click to accept suggested changes', 'jetpack' ) }
				onClick={ handleAccept }
				onKeyDown={ handleKeyDown }
			>
				<span className="screen-reader-text">
					{ __( 'Changes from current to suggested guidelines:', 'jetpack' ) }
				</span>
				{ diff.map( ( part, i ) => {
					if ( part.added ) {
						return (
							<ins key={ i } className="jetpack-content-guidelines-ai__diff-added">
								{ part.value }
							</ins>
						);
					}
					if ( part.removed ) {
						return (
							<del key={ i } className="jetpack-content-guidelines-ai__diff-removed">
								{ part.value }
							</del>
						);
					}
					return <span key={ i }>{ part.value }</span>;
				} ) }
			</div>
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
