import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { showUnavailableNotice } from '../lib/availability';
import { AI_STORE_NAME } from '../store';

export default function BlockGenerateButton( { blockName } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion } = useDispatch( AI_STORE_NAME );

	const blockLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( blockName ),
		[ blockName ]
	);

	const saved = useSelect(
		select => select( STORE_NAME ).getBlockGuideline( blockName ),
		[ blockName ]
	);

	const isEmpty = ! saved;
	const label = isEmpty
		? __( 'Generate guidelines', 'jetpack' )
		: __( 'Improve guidelines', 'jetpack' );

	const handleClick = useCallback( async () => {
		if ( showUnavailableNotice() ) {
			return;
		}

		// Read the current textarea value from the DOM (may differ from saved store value).
		const modal = document.querySelector( '.block-guideline-modal' );
		const textarea = modal?.querySelector( '.components-textarea-control__input' );
		const currentText = textarea?.value || '';

		startSectionLoading( blockName );
		try {
			const existingContent = currentText ? { [ blockName ]: currentText } : {};
			const response = await suggestGuidelines( [ blockName ], existingContent );
			const suggestion = response?.suggestions?.[ blockName ];
			if ( suggestion ) {
				setSuggestion( blockName, suggestion );
			}
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			stopSectionLoading( blockName );
		}
	}, [ blockName, startSectionLoading, stopSectionLoading, setSuggestion, createErrorNotice ] );

	return (
		<Button
			variant="tertiary"
			onClick={ handleClick }
			disabled={ blockLoading }
			accessibleWhenDisabled
			className="jetpack-content-guidelines-ai__section-generate-button"
		>
			{ label }
		</Button>
	);
}
