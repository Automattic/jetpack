import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { aiStore } from './ai-store';
import type { AiState } from './ai-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — matches the Settings tab.
const SAVE_NOTICE_ID = 'jetpack-seo-ai-save';

export interface AiForm {
	enhancer: AiState[ 'enhancer' ] | null;
	isSaving: boolean;
	/** Toggle the AI SEO Enhancer and save immediately. */
	setEnhancerEnabled: ( next: boolean ) => void;
}

/**
 * Owns the AI tab's form state: seeds from the page bootstrap and auto-saves the
 * AI SEO Enhancer toggle through `/jetpack/v4/settings` (the same endpoint the
 * legacy Traffic page used). On failure the local value reverts. There's no Save
 * button — the toggle saves on change, surfacing the shared
 * "Updating settings…"→"Settings saved." snackbar.
 *
 * The AI tab is its own route, so this controller remounts on every tab switch.
 * The enhancer is seeded from (and written back to) [ai-store] rather than the
 * one-time bootstrap, so a saved toggle persists across route switches without
 * a reload.
 *
 * @return The AI form controller.
 */
export function useAiForm(): AiForm {
	// Seed from the store (latest-saved snapshot), not the one-time bootstrap.
	const initial = useMemo( () => select( aiStore ).getEnhancer(), [] );
	const [ enhancer, setEnhancer ] = useState< AiState[ 'enhancer' ] | null >( initial );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { setEnhancer: persistEnhancer } = useDispatch( aiStore );

	const setEnhancerEnabled = useCallback(
		( next: boolean ) => {
			setEnhancer( prev => ( prev ? { ...prev, enabled: next } : prev ) );
			setIsSaving( true );
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			apiFetch( {
				path: '/jetpack/v4/settings',
				method: 'POST',
				data: { ai_seo_enhancer_enabled: next },
			} )
				.then( () => {
					// Persist the saved value so a return to the tab re-seeds from it.
					if ( initial ) {
						persistEnhancer( { ...initial, enabled: next } );
					}
					createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), {
						id: SAVE_NOTICE_ID,
						type: 'snackbar',
					} );
				} )
				.catch( ( error: { message?: string } ) => {
					// Revert the optimistic toggle so the UI reflects the persisted value.
					setEnhancer( prev => ( prev ? { ...prev, enabled: ! next } : prev ) );
					createErrorNotice(
						error?.message ?? __( 'Could not save settings. Please try again.', 'jetpack-seo' ),
						{ id: SAVE_NOTICE_ID, type: 'snackbar' }
					);
				} )
				.finally( () => setIsSaving( false ) );
		},
		[ createInfoNotice, createSuccessNotice, createErrorNotice, persistEnhancer, initial ]
	);

	return { enhancer, isSaving, setEnhancerEnabled };
}
