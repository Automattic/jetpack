import { useAiFeature } from '@automattic/jetpack-ai-client';
import { Button, Tooltip } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { recordGuidelinesEvent } from '../lib/tracks';
import { AI_STORE_NAME } from '../store';

export default function SectionGenerateButton( { slug } ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion, showUpgradeNotice } =
		useDispatch( AI_STORE_NAME );
	const { hasFeature } = useAiFeature();

	// The plans store defaults hasFeature to true until its fetch resolves, so
	// rendering before resolution would flash the unlocked state on no-plan
	// sites. Wait for the real answer instead.
	const featureResolved = useSelect(
		select => select( 'wordpress-com/plans' ).hasFinishedResolution( 'getAiAssistantFeature' ),
		[]
	);

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
		if ( ! hasFeature ) {
			// No AI plan: the locked button opens the upgrade notice instead of
			// generating. The click is a fresh intent signal, so the notice
			// reappears even after a persisted dismissal.
			recordGuidelinesEvent( 'upgrade_notice', { trigger: 'section', slug } );
			showUpgradeNotice();
			return;
		}

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
		hasFeature,
		startSectionLoading,
		stopSectionLoading,
		setSuggestion,
		showUpgradeNotice,
		createErrorNotice,
	] );

	if ( ! featureResolved ) {
		return null;
	}

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
