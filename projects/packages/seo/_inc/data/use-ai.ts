import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { AiState } from './ai-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — matches the Settings tab.
const SAVE_NOTICE_ID = 'jetpack-seo-ai-save';

type SeoScriptData = {
	seo?: {
		ai?: AiState;
	};
};

/**
 * Read the AI tab state bootstrapped onto `window.JetpackScriptData.seo.ai` by
 * the server. Synchronous — present on first paint, no request. Returns `null`
 * if the bootstrap is missing.
 *
 * @return The AI state, or `null` when unavailable.
 */
export function getAi(): AiState | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.ai ?? null;
}

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
 * Lives above the tab panels (in the page root) so the value survives tab
 * switches — the script-data bootstrap is the initial load only.
 *
 * @return The AI form controller.
 */
export function useAiForm(): AiForm {
	const initial = useMemo( () => getAi(), [] );
	const [ enhancer, setEnhancer ] = useState< AiState[ 'enhancer' ] | null >(
		initial?.enhancer ?? null
	);
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

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
		[ createInfoNotice, createSuccessNotice, createErrorNotice ]
	);

	return { enhancer, isSaving, setEnhancerEnabled };
}
