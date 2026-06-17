import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { recordGuidelinesEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function SectionGenerateButton( { slug } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion } = useDispatch( AI_STORE_NAME );
	const { hasFeature } = useAiFeature();

	const sectionLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( slug ),
		[ slug ]
	);
	const draft = useSelect( select => select( STORE_NAME ).getGuideline( slug ), [ slug ] );

	const isEmpty = ! draft;
	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = isEmpty ? generateLabel : improveLabel;

	const handleClick = useCallback( async () => {
		const action = isEmpty ? 'generate' : 'improve';
		recordGuidelinesEvent( 'generate', { type: 'section', slug, action } );

		startSectionLoading( slug );
		try {
			const existingContent = draft ? { [ slug ]: draft } : {};
			const response = await suggestGuidelines( [ slug ], existingContent );
			const suggestion = response?.suggestions?.[ slug ];
			if ( ! suggestion ) {
				throw new Error( 'No suggestion returned.' );
			}
			setSuggestion( slug, suggestion );
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			stopSectionLoading( slug );
		}
	}, [
		slug,
		draft,
		isEmpty,
		startSectionLoading,
		stopSectionLoading,
		setSuggestion,
		createErrorNotice,
	] );

	return (
		<Button
			variant="tertiary"
			onClick={ handleClick }
			disabled={ sectionLoading || ! hasFeature }
			accessibleWhenDisabled
			className="jetpack-content-guidelines-ai__section-generate-button"
		>
			{ label }
		</Button>
	);
}
