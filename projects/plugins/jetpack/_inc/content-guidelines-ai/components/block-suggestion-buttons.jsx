import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { acceptBlockSuggestion } from '../lib/dom';
import { recordGuidelinesEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function BlockSuggestionButtons( { blockName, blockModal } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion, clearSuggestion } =
		useDispatch( AI_STORE_NAME );
	const { hasFeature } = useAiFeature();

	const blockLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( blockName ),
		[ blockName ]
	);

	const suggestion = useSelect(
		select => select( AI_STORE_NAME ).getSuggestion( blockName ),
		[ blockName ]
	);

	const saved = useSelect(
		select => select( STORE_NAME ).getBlockGuideline( blockName ),
		[ blockName ]
	);

	const handleGenerate = useCallback( async () => {
		const action = saved ? 'improve' : 'generate';
		recordGuidelinesEvent( 'generate', { type: 'block', slug: blockName, action } );

		const textarea = blockModal?.querySelector( '.components-textarea-control__input' );
		const currentText = textarea?.value || '';

		startSectionLoading( blockName );
		try {
			const existingContent = currentText ? { [ blockName ]: currentText } : {};
			const response = await suggestGuidelines( [ blockName ], existingContent );
			const text = response?.suggestions?.[ blockName ];
			if ( ! text ) {
				throw new Error( 'No suggestion returned.' );
			}
			setSuggestion( blockName, text );
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			stopSectionLoading( blockName );
		}
	}, [
		blockModal,
		blockName,
		saved,
		startSectionLoading,
		stopSectionLoading,
		setSuggestion,
		createErrorNotice,
	] );

	const handleAccept = useCallback( () => {
		recordGuidelinesEvent( 'accept', { type: 'block', slug: blockName } );
		acceptBlockSuggestion( blockModal, blockName, suggestion, clearSuggestion );
	}, [ blockModal, blockName, suggestion, clearSuggestion ] );

	const handleDismiss = useCallback( () => {
		recordGuidelinesEvent( 'dismiss', { type: 'block', slug: blockName } );
		clearSuggestion( blockName );
	}, [ blockName, clearSuggestion ] );

	if ( suggestion ) {
		return (
			<div className="jetpack-content-guidelines-ai__suggestion-actions">
				<Button variant="primary" onClick={ handleAccept }>
					{ __( 'Accept suggestion', 'jetpack' ) }
				</Button>
				<Button variant="tertiary" onClick={ handleDismiss }>
					{ __( 'Dismiss', 'jetpack' ) }
				</Button>
			</div>
		);
	}

	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = saved ? improveLabel : generateLabel;

	return (
		<div className="jetpack-content-guidelines-ai__suggestion-actions">
			<Button
				variant="secondary"
				onClick={ handleGenerate }
				disabled={ blockLoading || ! hasFeature }
				accessibleWhenDisabled
				className="jetpack-content-guidelines-ai__section-generate-button"
			>
				{ label }
			</Button>
		</div>
	);
}
