import { useAiFeature } from '@automattic/jetpack-ai-client';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import { suggestGuidelines } from '../lib/api';
import { AI_STORE_NAME } from '../store';

/**
 * Hook that returns a callback to generate suggestions for all sections.
 *
 * @return {{ generate: Function, loading: boolean }} Generate callback and loading state.
 */
export default function useGenerateAll() {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { startLoading, stopLoading, setSuggestion } = useDispatch( AI_STORE_NAME );
	const loading = useSelect( select => select( AI_STORE_NAME ).isLoading(), [] );
	const { requireUpgrade } = useAiFeature();

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] ) );
	}, [] );

	const generate = useCallback( async () => {
		if ( requireUpgrade ) {
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
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			stopLoading();
		}
	}, [
		requireUpgrade,
		allGuidelines,
		startLoading,
		stopLoading,
		setSuggestion,
		createErrorNotice,
	] );

	return { generate, loading, requireUpgrade };
}
