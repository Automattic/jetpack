import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { SettingsResponse, VerificationKey } from './settings-types';

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
	isDirty: boolean;
	isSaving: boolean;
	save: () => void;
	update: ( patch: Partial< SettingsResponse > ) => void;
	setVerification: ( key: VerificationKey, value: string ) => void;
}

/**
 * Owns the Settings form: seeds local state from the page bootstrap, tracks
 * dirtiness, saves the diff to `/jetpack/v4/settings`, surfaces snackbars, and
 * guards full-page exit while unsaved.
 *
 * Called above the tab panels (in the page root) so unsaved edits survive
 * switching to the Overview tab and back.
 *
 * @return The settings form controller.
 */
export function useSettingsForm(): SettingsForm {
	const initial = useMemo( () => getSettings(), [] );
	const [ baseline, setBaseline ] = useState< SettingsResponse | null >( initial );
	const [ local, setLocal ] = useState< SettingsResponse | null >( initial );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const isDirty = useMemo(
		() => !! baseline && !! local && JSON.stringify( baseline ) !== JSON.stringify( local ),
		[ baseline, local ]
	);

	const update = useCallback(
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

	const save = useCallback( () => {
		if ( ! local || ! baseline ) {
			return;
		}
		const jetpackPayload = buildJetpackPayload( baseline, local );
		const corePayload = buildCorePayload( baseline, local );

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
		Promise.all( requests )
			.then( () => {
				setBaseline( local );
				createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), { type: 'snackbar' } );
			} )
			.catch( ( error: { message?: string } ) => {
				createErrorNotice(
					error?.message ?? __( 'Could not save settings. Please try again.', 'jetpack-seo' ),
					{ type: 'snackbar' }
				);
			} )
			.finally( () => setIsSaving( false ) );
	}, [ local, baseline, createSuccessNotice, createErrorNotice ] );

	// Native confirm when leaving the page (reload, back, external link) with
	// unsaved changes. In-app tab switches don't lose edits — the state lives
	// above the panels — so no router-level blocker is needed.
	useEffect( () => {
		if ( ! isDirty ) {
			return;
		}
		const handler = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', handler );
		return () => window.removeEventListener( 'beforeunload', handler );
	}, [ isDirty ] );

	return { local, isDirty, isSaving, save, update, setVerification };
}
