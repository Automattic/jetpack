import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { diffWords } from 'diff';
import { AI_STORE_NAME } from '../store';

/**
 * Programmatically set a React-controlled textarea's value.
 * Uses the native setter so React's synthetic onChange fires.
 */
function setTextareaValue( textarea, value ) {
	const setter = Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		'value'
	).set;
	setter.call( textarea, value );
	textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

export default function BlockSuggestionActions( { blockName } ) {
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

	// Toggle shimmer and suggestion classes on the modal.
	useEffect( () => {
		const modal = document.querySelector( '.block-guideline-modal' );
		if ( ! modal ) {
			return;
		}

		// Capture textarea content and height before hiding it.
		if ( suggestion && ! modal.classList.contains( 'has-jetpack-suggestion' ) ) {
			const textarea = modal.querySelector( '.components-textarea-control__input' );
			if ( textarea ) {
				setOriginal( textarea.value || '' );
				if ( textarea.offsetHeight > 0 ) {
					setTextareaHeight( textarea.offsetHeight );
				}
			}
		}

		modal.classList.toggle( 'has-jetpack-suggestion', !! suggestion );
		modal.classList.toggle( 'is-jetpack-loading', blockLoading && ! suggestion );
		return () => {
			modal.classList.remove( 'has-jetpack-suggestion', 'is-jetpack-loading' );
		};
	}, [ suggestion, blockLoading ] );

	const diff = useMemo( () => {
		if ( ! suggestion ) {
			return [];
		}
		return diffWords( original, suggestion );
	}, [ original, suggestion ] );

	const handleAccept = useCallback( () => {
		const modal = document.querySelector( '.block-guideline-modal' );
		const textarea = modal?.querySelector( '.components-textarea-control__input' );
		if ( textarea ) {
			setTextareaValue( textarea, suggestion );
		}
		clearSuggestion( blockName );
	}, [ blockName, suggestion, clearSuggestion ] );

	const handleDismiss = useCallback( () => {
		clearSuggestion( blockName );
	}, [ blockName, clearSuggestion ] );

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
