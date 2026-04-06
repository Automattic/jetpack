import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { AI_STORE_NAME } from '../store';

const config = window.jetpackContentGuidelinesAiConfig || {};

export default function SectionGenerateButton( { slug } ) {
	const { createErrorNotice, createWarningNotice } = useDispatch( noticesStore );
	const { startSectionLoading, stopSectionLoading, setSuggestion } =
		useDispatch( AI_STORE_NAME );

	const sectionLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( slug ),
		[ slug ]
	);
	const draft = useSelect(
		select => select( STORE_NAME ).getGuideline( slug ),
		[ slug ]
	);

	const isEmpty = ! draft;
	const label = isEmpty
		? __( 'Generate guidelines', 'jetpack' )
		: __( 'Improve guidelines', 'jetpack' );

	const handleClick = useCallback( async () => {
		if ( ! config.available ) {
			const message = ! config.isConnected
				? __(
						'Jetpack AI is not available. Connect your site to WordPress.com to get started.',
						'jetpack'
				  )
				: __( 'Upgrade now to start using Jetpack AI.', 'jetpack' );
			const actionLabel = ! config.isConnected
				? __( 'Connect', 'jetpack' )
				: __( 'Upgrade', 'jetpack' );

			createWarningNotice( message, {
				type: 'snackbar',
				actions: config.upgradeUrl
					? [ { label: actionLabel, url: config.upgradeUrl } ]
					: [],
			} );
			return;
		}

		startSectionLoading( slug );
		try {
			const existingContent = draft ? { [ slug ]: draft } : {};
			const response = await suggestGuidelines( [ slug ], existingContent );
			const suggestion = response?.suggestions?.[ slug ];
			if ( suggestion ) {
				setSuggestion( slug, suggestion );
			}
		} catch {
			createErrorNotice(
				__( 'Failed to generate guidelines. Please try again.', 'jetpack' ),
				{ type: 'snackbar' }
			);
		} finally {
			stopSectionLoading( slug );
		}
	}, [
		slug,
		draft,
		startSectionLoading,
		stopSectionLoading,
		setSuggestion,
		createErrorNotice,
		createWarningNotice,
	] );

	return (
		<Button
			variant="tertiary"
			onClick={ handleClick }
			disabled={ sectionLoading }
			accessibleWhenDisabled
			className="jetpack-content-guidelines-ai__section-generate-button"
		>
			{ label }
		</Button>
	);
}
