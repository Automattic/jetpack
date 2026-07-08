import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { buildCorePayload, buildJetpackPayload } from './build-payload';
import { settingsStore } from './settings-store';
import type { SchemaSettings } from './schema-settings-types';
import type { SettingsResponse, VerificationKey } from './settings-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — mirrors the Jetpack → Settings
// page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-settings-save';

export interface SettingsForm {
	local: SettingsResponse | null;
	isSaving: boolean;
	/** Update local state only — for controlled typing; persisted by a per-section save. */
	setField: ( patch: Partial< SettingsResponse > ) => void;
	/** Replace the saved schema snapshot after the schema-specific route succeeds. */
	setSchemaSettings: ( schema: SchemaSettings ) => void;
	/** Update a verification code locally — persisted via `commitFields(['verification'])` on blur. */
	setVerification: ( key: VerificationKey, value: string ) => void;
	/**
	 * Save a toggle change immediately. Persists only the patched field(s) — not
	 * the rest of local — so unsaved edits in the text-heavy sections stay local
	 * until their own Save (per-section isolation).
	 */
	commit: ( patch: Partial< SettingsResponse > ) => void;
	/**
	 * Save only the named fields — a per-section Save for text-heavy sections
	 * (e.g. the front-page description) that edit local state while typing and
	 * persist on an explicit button. Other pending edits stay local.
	 */
	commitFields: ( fields: Array< keyof SettingsResponse > ) => void;
	/** Whether any of the named fields differ from the last-saved baseline. */
	isDirty: ( fields: Array< keyof SettingsResponse > ) => boolean;
	/**
	 * Save one page type's title format — a per-row Save for the title-structure
	 * editor. Persists only that page type, leaving unsaved edits in other rows
	 * local (the back-end stores all formats in one option, so this writes the
	 * whole map with just this page type advanced past the baseline).
	 */
	commitTitleFormat: ( pageType: string ) => void;
	/** Whether one page type's title format differs from the last-saved baseline. */
	isTitleFormatDirty: ( pageType: string ) => boolean;
}

/**
 * Owns the Settings form: seeds local state from the page bootstrap and saves
 * on a hybrid model. Toggle sections (Site visibility, Canonical) `commit()` on
 * change; the front-page description `setField()`s while typing and persists on
 * an explicit Save (`commitFields()`); the title-structure editor saves
 * per page-type row (`commitTitleFormat()`). Saves diff against the last-saved
 * baseline (so an unchanged save is a no-op and the sitemaps module is never
 * re-toggled needlessly), surfacing a single "Updating settings…"→"Settings
 * saved." snackbar.
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

	const setSchemaSettings = useCallback(
		( schema: SchemaSettings ) => {
			const current = localRef.current;
			const baseline = baselineRef.current;
			if ( ! current || ! baseline ) {
				return;
			}

			const nextBaseline = { ...baseline, schema };
			const nextLocal = { ...current, schema };
			baselineRef.current = nextBaseline;
			localRef.current = nextLocal;
			setLocal( nextLocal );
			setSettings( nextBaseline );
		},
		[ setSettings ]
	);

	const commit = useCallback(
		( patch: Partial< SettingsResponse > ) => {
			const current = localRef.current;
			const baseline = baselineRef.current;
			if ( ! current || ! baseline ) {
				return;
			}
			// Update local for immediate UI feedback...
			const next = { ...current, ...patch };
			localRef.current = next;
			setLocal( next );
			// ...but persist only the patched field(s): start from the last-saved
			// baseline and apply just this patch, so unsaved edits in the text-heavy
			// sections aren't dragged in by a toggle save (per-section isolation).
			saveValues( { ...baseline, ...patch } );
		},
		[ saveValues ]
	);

	const commitFields = useCallback(
		( fields: Array< keyof SettingsResponse > ) => {
			const current = localRef.current;
			const baseline = baselineRef.current;
			if ( ! current || ! baseline ) {
				return;
			}
			// Save only the named section: start from the baseline and override just
			// those fields from local, so the diff — and the snapshot saved back as
			// the new baseline — is limited to this section, leaving any other
			// pending (unsaved) edits local until the user saves their own section.
			const values: SettingsResponse = { ...baseline };
			fields.forEach( field => {
				( values as unknown as Record< string, unknown > )[ field ] = current[ field ];
			} );
			saveValues( values );
		},
		[ saveValues ]
	);

	const isDirty = useCallback(
		( fields: Array< keyof SettingsResponse > ) => {
			const baseline = baselineRef.current;
			if ( ! local || ! baseline ) {
				return false;
			}
			return fields.some(
				field => JSON.stringify( local[ field ] ) !== JSON.stringify( baseline[ field ] )
			);
		},
		[ local ]
	);

	const commitTitleFormat = useCallback(
		( pageType: string ) => {
			const current = localRef.current;
			const baseline = baselineRef.current;
			if ( ! current || ! baseline ) {
				return;
			}
			// Persist only this page type's format: write the whole title-formats map
			// but advance just this page type past the baseline, so an unsaved edit in
			// another row stays pending until that row is saved.
			const values: SettingsResponse = {
				...baseline,
				title_formats: {
					...baseline.title_formats,
					[ pageType ]: current.title_formats[ pageType ] ?? [],
				},
			};
			saveValues( values );
		},
		[ saveValues ]
	);

	const isTitleFormatDirty = useCallback(
		( pageType: string ) => {
			const baseline = baselineRef.current;
			if ( ! local || ! baseline ) {
				return false;
			}
			return (
				JSON.stringify( local.title_formats[ pageType ] ?? [] ) !==
				JSON.stringify( baseline.title_formats[ pageType ] ?? [] )
			);
		},
		[ local ]
	);

	return {
		local,
		isSaving,
		setField,
		setSchemaSettings,
		setVerification,
		commit,
		commitFields,
		isDirty,
		commitTitleFormat,
		isTitleFormatDirty,
	};
}
