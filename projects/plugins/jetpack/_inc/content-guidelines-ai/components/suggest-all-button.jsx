import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { AI_STORE_NAME } from '../store';

const config = window.jetpackContentGuidelinesAiConfig || {};

const jetpackIcon = (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g transform="translate(3,3)">
			<path d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18Z" fill="#069E08" />
			<path d="M14.0335 7.48851L9.53353 16.2141V7.48851H14.0335ZM8.6224 10.4944H4.13997L8.6224 1.78636V10.4944Z" fill="white" />
		</g>
	</svg>
);

export default function SuggestAllButton() {
	const { createErrorNotice, createWarningNotice } = useDispatch( noticesStore );
	const { startLoading, stopLoading, setSuggestion } = useDispatch( AI_STORE_NAME );

	const loading = useSelect( select => select( AI_STORE_NAME ).isLoading(), [] );

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries(
			VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] )
		);
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );
	const label = allEmpty
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
				actions: config.upgradeUrl ? [ { label: actionLabel, url: config.upgradeUrl } ] : [],
			} );
			return;
		}

		startLoading();
		try {
			const existingContent = Object.fromEntries(
				VALID_SECTIONS.filter( slug => allGuidelines[ slug ] ).map( slug => [
					slug,
					allGuidelines[ slug ],
				] )
			);

			const response = await suggestGuidelines( VALID_SECTIONS, existingContent );
			const suggestions = response?.suggestions || {};

			for ( const slug of VALID_SECTIONS ) {
				if ( suggestions[ slug ] ) {
					setSuggestion( slug, suggestions[ slug ] );
				}
			}
		} catch {
			createErrorNotice(
				__( 'Failed to generate guidelines. Please try again.', 'jetpack' ),
				{ type: 'snackbar' }
			);
		} finally {
			stopLoading();
		}
	}, [ allGuidelines, startLoading, stopLoading, setSuggestion, createErrorNotice, createWarningNotice ] );

	return (
		<Button
			variant="primary"
			icon={ jetpackIcon }
			onClick={ handleClick }
			disabled={ loading }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ loading ? __( 'Generating\u2026', 'jetpack' ) : label }
		</Button>
	);
}
