import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { showUnavailableNotice } from '../lib/availability';
import { AI_STORE_NAME } from '../store';

export default function EmptyStateBanner() {
	const { createWarningNotice, createErrorNotice } = useDispatch( noticesStore );
	const { startLoading, stopLoading, setSuggestion } = useDispatch( AI_STORE_NAME );

	const allEmpty = useSelect( select => {
		const store = select( STORE_NAME );
		return VALID_SECTIONS.every( slug => ! store.getGuideline( slug ) );
	}, [] );

	const loading = useSelect( select => select( AI_STORE_NAME ).isLoading(), [] );
	const hasSuggestions = useSelect(
		select => VALID_SECTIONS.some( slug => select( AI_STORE_NAME ).hasSuggestion( slug ) ),
		[]
	);

	const handleGetStarted = useCallback( async () => {
		if ( showUnavailableNotice( createWarningNotice ) ) {
			return;
		}

		startLoading();
		try {
			const response = await suggestGuidelines( VALID_SECTIONS );
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
	}, [ startLoading, stopLoading, setSuggestion, createWarningNotice, createErrorNotice ] );

	// Hide when guidelines exist or suggestions are pending review.
	if ( ! allEmpty || hasSuggestions ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__banner">
			<div className="jetpack-content-guidelines-ai__banner-content">
				<h2>{ __( 'Generate your guidelines in seconds', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Use Jetpack to analyze your site and create draft guidelines based on your actual content.',
						'jetpack'
					) }
				</p>
				<div className="jetpack-content-guidelines-ai__banner-actions">
					<Button
						className="jetpack-content-guidelines-ai__banner-cta"
						variant="primary"
						onClick={ handleGetStarted }
						disabled={ loading }
						isBusy={ loading }
					>
						{ __( 'Get started', 'jetpack' ) }
					</Button>
				</div>
			</div>
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--top" />
			<div className="jetpack-content-guidelines-ai__banner-orb jetpack-content-guidelines-ai__banner-orb--bottom" />
		</div>
	);
}
