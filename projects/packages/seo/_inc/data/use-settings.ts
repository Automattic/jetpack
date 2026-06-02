import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { SettingsResponse, VerificationKey } from './settings-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — mirrors the Jetpack → Settings
// page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-settings-save';

type SeoScriptData = {
	seo?: {
		settings?: SettingsResponse;
	};
};

/**
 * Read the editable Settings state bootstrapped onto
 * `window.JetpackScriptData.seo.settings` by the server. Synchronous — present
 * on first paint, no request. Returns `null` if the bootstrap is missing.
 *
 * @return The settings, or `null` when unavailable.
 */
export function getSettings(): SettingsResponse | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.settings ?? null;
}

const VERIFICATION_KEYS: readonly VerificationKey[] = [
	'google',
	'bing',
	'pinterest',
	'yandex',
	'facebook',
];

/**
 * Build the changed-fields payload for the Jetpack settings endpoint
 * (`/jetpack/v4/settings`) — everything except search-engine visibility, which
 * is a WordPress core option handled separately. Only changed fields are
 * included so an unchanged save never re-toggles the sitemaps module. The
 * endpoint owns validation/sanitization for every key here.
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The changed-fields payload for `/jetpack/v4/settings`.
 */
function buildJetpackPayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	const payload: Record< string, unknown > = {};

	if ( local.sitemap_active !== baseline.sitemap_active ) {
		payload.sitemaps = local.sitemap_active;
	}
	if ( JSON.stringify( local.title_formats ) !== JSON.stringify( baseline.title_formats ) ) {
		payload.advanced_seo_title_formats = local.title_formats;
	}
	if ( local.front_page_description !== baseline.front_page_description ) {
		payload.advanced_seo_front_page_description = local.front_page_description;
	}
	VERIFICATION_KEYS.forEach( key => {
		if ( local.verification[ key ] !== baseline.verification[ key ] ) {
			payload[ key ] = local.verification[ key ];
		}
	} );

	return payload;
}

/**
 * Build the changed-fields payload for WordPress core settings
 * (`/wp/v2/settings`). Search-engine visibility maps to the core `blog_public`
 * option (1 = allow indexing, 0 = discourage); the Jetpack settings endpoint
 * rejects it, so it round-trips through core REST instead.
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The changed-fields payload for `/wp/v2/settings`, or `{}` if unchanged.
 */
function buildCorePayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	const payload: Record< string, unknown > = {};

	if ( local.search_engines_visible !== baseline.search_engines_visible ) {
		payload.blog_public = local.search_engines_visible ? 1 : 0;
	}

	return payload;
}

export interface SettingsForm {
	local: SettingsResponse | null;
	isSaving: boolean;
	/** Update local state only — for controlled typing; pair with `commit()` on blur. */
	setField: ( patch: Partial< SettingsResponse > ) => void;
	/** Update a verification code locally — pair with `commit()` on blur. */
	setVerification: ( key: VerificationKey, value: string ) => void;
	/** Apply an optional patch and immediately save the changed fields. */
	commit: ( patch?: Partial< SettingsResponse > ) => void;
}

/**
 * Owns the Settings form: seeds local state from the page bootstrap and
 * auto-saves changes — there's no explicit Save button. Toggles `commit()` on
 * change; text/token fields `setField()` while editing and `commit()` on blur.
 * Saves diff against the last-saved baseline (so an unchanged save is a no-op
 * and the sitemaps module is never re-toggled needlessly), surfacing a single
 * "Updating settings…"→"Settings saved." snackbar.
 *
 * Lives above the tab panels (in the page root) so state survives tab switches.
 *
 * @return The settings form controller.
 */
export function useSettingsForm(): SettingsForm {
	const initial = useMemo( () => getSettings(), [] );
	const [ local, setLocal ] = useState< SettingsResponse | null >( initial );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// Refs so `commit()` reads the freshest values without stale closures and
	// without re-creating the callback on every keystroke.
	const baselineRef = useRef< SettingsResponse | null >( initial );
	const localRef = useRef< SettingsResponse | null >( initial );
	useEffect( () => {
		localRef.current = local;
	}, [ local ] );

	const saveValues = useCallback(
		( values: SettingsResponse ) => {
			const baseline = baselineRef.current;
			if ( ! baseline ) {
				return;
			}
			const jetpackPayload = buildJetpackPayload( baseline, values );
			const corePayload = buildCorePayload( baseline, values );

			const requests: Array< Promise< unknown > > = [];
			if ( Object.keys( jetpackPayload ).length > 0 ) {
				requests.push(
					apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data: jetpackPayload } )
				);
			}
			if ( Object.keys( corePayload ).length > 0 ) {
				requests.push( apiFetch( { path: '/wp/v2/settings', method: 'POST', data: corePayload } ) );
			}
			if ( requests.length === 0 ) {
				return;
			}

			setIsSaving( true );
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			Promise.all( requests )
				.then( () => {
					baselineRef.current = values;
					createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), {
						id: SAVE_NOTICE_ID,
						type: 'snackbar',
					} );
				} )
				.catch( ( error: { message?: string } ) => {
					createErrorNotice(
						error?.message ?? __( 'Could not save settings. Please try again.', 'jetpack-seo' ),
						{ id: SAVE_NOTICE_ID, type: 'snackbar' }
					);
				} )
				.finally( () => setIsSaving( false ) );
		},
		[ createInfoNotice, createSuccessNotice, createErrorNotice ]
	);

	const setField = useCallback(
		( patch: Partial< SettingsResponse > ) =>
			setLocal( state => ( state ? { ...state, ...patch } : state ) ),
		[]
	);

	const setVerification = useCallback(
		( key: VerificationKey, value: string ) =>
			setLocal( state =>
				state ? { ...state, verification: { ...state.verification, [ key ]: value } } : state
			),
		[]
	);

	const commit = useCallback(
		( patch?: Partial< SettingsResponse > ) => {
			const current = localRef.current;
			if ( ! current ) {
				return;
			}
			const next = patch ? { ...current, ...patch } : current;
			if ( patch ) {
				localRef.current = next;
				setLocal( next );
			}
			saveValues( next );
		},
		[ saveValues ]
	);

	return { local, isSaving, setField, setVerification, commit };
}
