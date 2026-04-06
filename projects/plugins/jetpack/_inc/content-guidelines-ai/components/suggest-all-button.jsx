import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { showUnavailableNotice } from '../lib/availability';
import { AI_STORE_NAME } from '../store';

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
	const hasSuggestions = useSelect(
		select => VALID_SECTIONS.some( slug => select( AI_STORE_NAME ).hasSuggestion( slug ) ),
		[]
	);

	// Show "Generate" when empty, "Improve" when content exists.
	const label = allEmpty
		? __( 'Generate guidelines', 'jetpack' )
		: __( 'Improve guidelines', 'jetpack' );

	// Hide when the banner is visible (all empty, no suggestions, not loading).
	const bannerVisible = allEmpty && ! hasSuggestions && ! loading;
	const style = bannerVisible ? { display: 'none' } : undefined;

	const handleClick = useCallback( async () => {
		if ( showUnavailableNotice( createWarningNotice ) ) {
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
			style={ style }
			variant="primary"
			icon={ <JetpackLogo size={ 8 } /> }
			onClick={ handleClick }
			disabled={ loading }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ label }
		</Button>
	);
}
