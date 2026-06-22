import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { buildCorePayload, buildJetpackPayload } from './build-payload';
import { settingsStore } from './settings-store';
import type { SettingsResponse, VerificationKey } from './settings-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — mirrors the Jetpack → Settings
// page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-settings-save';

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
 * The Settings tab is its own route, so this controller remounts on every tab
 * switch. State is seeded from (and written back to) [settings-store] rather
 * than the one-time page bootstrap, so a save persists across route switches
 * without a reload.
 *
 * @return The settings form controller.
 */
export function useSettingsForm(): SettingsForm {
	// Seed from the store (latest-saved snapshot), not the one-time bootstrap, so
	// returning to the tab after a save shows the saved values.
	const initial = useMemo( () => select( settingsStore ).getSettings(), [] );
	const [ local, setLocal ] = useState< SettingsResponse | null >( initial );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { setSettings } = useDispatch( settingsStore );

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
					// Persist the saved snapshot so a return to the tab re-seeds from it.
					setSettings( values );
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
		[ createInfoNotice, createSuccessNotice, createErrorNotice, setSettings ]
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
