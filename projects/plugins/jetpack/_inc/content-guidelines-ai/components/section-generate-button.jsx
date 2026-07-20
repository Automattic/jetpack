import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Tooltip } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useSectionHasDraft } from '../hooks/use-drafts';
import { suggestGuidelines } from '../lib/api';
import { readSectionDraft } from '../lib/drafts';
import { recordGuidelinesEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function SectionGenerateButton( { slug } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion, showUpgradeNotice } =
		useDispatch( AI_STORE_NAME );
	const { hasFeature } = useAiFeature();

	const sectionLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( slug ),
		[ slug ]
	);
	const isEmpty = ! useSectionHasDraft( slug );
	const generateLabel = __( 'Generate guidelines', 'jetpack' );
	const improveLabel = __( 'Improve guidelines', 'jetpack' );
	const label = isEmpty ? generateLabel : improveLabel;

	const handleClick = useCallback( async () => {
		if ( ! hasFeature ) {
			// No AI plan: the locked button opens the upgrade notice instead of
			// generating. The click is a fresh intent signal, so the notice
			// reappears even after a persisted dismissal.
			recordGuidelinesEvent( 'upgrade_notice', { trigger: 'section', slug } );
			showUpgradeNotice();
			return;
		}

		// Snapshot the draft at click time — the render-time hook value could
		// be stale if a page-driven change slipped past the notifications.
		const currentDraft = readSectionDraft( slug );
		const action = currentDraft ? 'improve' : 'generate';
		recordGuidelinesEvent( 'generate', { type: 'section', slug, action } );

		startSectionLoading( slug );
		try {
			const existingContent = currentDraft ? { [ slug ]: currentDraft } : {};
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
		hasFeature,
		startSectionLoading,
		stopSectionLoading,
		setSuggestion,
		showUpgradeNotice,
		createErrorNotice,
	] );

	const button = (
		<Button
			variant="tertiary"
			icon={ hasFeature ? undefined : lock }
			onClick={ handleClick }
			disabled={ sectionLoading }
			accessibleWhenDisabled
			className="jetpack-content-guidelines-ai__section-generate-button"
		>
			{ label }
		</Button>
	);

	if ( ! hasFeature ) {
		return (
			<Tooltip text={ __( 'Upgrade to unlock the AI assistant', 'jetpack' ) }>{ button }</Tooltip>
		);
	}

	return button;
}
