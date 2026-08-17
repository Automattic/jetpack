import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { buildCorePayload, buildModulesPayload } from './build-payload';
import { settingsStore } from './settings-store';
import type { SchemaSettings } from './schema-settings-types';
import type { SettingsResponse, VerificationKey } from './settings-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — mirrors the Jetpack → Settings
// page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-settings-save';

// The package's own settings read, re-fetched after every save so the form shows
// what the server actually stored — including a value it refused and the
// recomputed `sitemap_url`.
const SEO_SETTINGS_PATH = '/jetpack/v4/seo/settings';

// WordPress core's settings endpoint, which every option-backed SEO setting is
// registered with. Core registers it on every platform, so this one path works
// on WordPress.com and self-hosted alike.
const CORE_SETTINGS_PATH = '/wp/v2/settings';

// The package's own route for the settings whose write switches a Jetpack module,
// which core's settings endpoint can't own because it has no way to refuse a value.
const SEO_MODULES_PATH = '/jetpack/v4/seo/modules';

// Cap on the post-save re-read. It's a courtesy refresh, so a hung request must
// never be what keeps the controls disabled: a stale form is recoverable, a
// permanently locked one isn't.
const REFRESH_TIMEOUT_MS = 10000;

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

	// Re-read the server's own view of the settings and adopt it for the fields this
	// save touched, so the form shows what actually persisted rather than what we
	// hoped would. The server can legitimately refuse a value — the sitemap and
	// canonical settings only take if their legacy module switches with them — and a
	// save can fail after its first request already committed. `sitemap_url` comes
	// along because it's read-only and recomputed by the sitemap toggle.
	const adoptServerState = useCallback(
		( touched: Array< keyof SettingsResponse > ) =>
			new Promise< void >( resolve => {
				// Always settles: on the response, on an error, or on the timeout that
				// aborts a request which never came back.
				const controller = new AbortController();
				const timer = setTimeout( () => {
					controller.abort();
					resolve();
				}, REFRESH_TIMEOUT_MS );

				apiFetch< SettingsResponse >( { path: SEO_SETTINGS_PATH, signal: controller.signal } )
					.then( fresh => {
						const current = localRef.current;
						const baseline = baselineRef.current;
						if ( ! current || ! baseline || ! fresh ) {
							return;
						}
						// Only fields the response actually carries: a truncated payload must
						// blank nothing out.
						const patch: Partial< SettingsResponse > = {};
						[ ...touched, 'sitemap_url' as const ].forEach( field => {
							if ( field in fresh ) {
								( patch as Record< string, unknown > )[ field ] = fresh[ field ];
							}
						} );

						localRef.current = { ...current, ...patch };
						baselineRef.current = { ...baseline, ...patch };
						setLocal( localRef.current );
						setSettings( baselineRef.current );
					} )
					.catch( () => {
						// Nothing better to show than what's already on screen; the next load
						// is authoritative either way.
					} )
					.then( () => {
						clearTimeout( timer );
						resolve();
					} );
			} ),
		[ setSettings ]
	);

	const saveValues = useCallback(
		( values: SettingsResponse ) => {
			const baseline = baselineRef.current;
			if ( ! baseline ) {
				return;
			}
			const corePayload = buildCorePayload( baseline, values );
			const modulesPayload = buildModulesPayload( baseline, values );
			if ( Object.keys( corePayload ).length + Object.keys( modulesPayload ).length === 0 ) {
				return;
			}

			const touched = ( Object.keys( values ) as Array< keyof SettingsResponse > ).filter(
				field => JSON.stringify( values[ field ] ) !== JSON.stringify( baseline[ field ] )
			);

			setIsSaving( true );
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );

			// Sequential, not parallel: both endpoints can end up mutating Jetpack's
			// shared `active_modules` option (the settings write reconciles the sitemap
			// and canonical modules), and two overlapping read-modify-writes of it would
			// let the later one drop the earlier one's change.
			Promise.resolve()
				.then( () =>
					Object.keys( corePayload ).length > 0
						? apiFetch( { path: CORE_SETTINGS_PATH, method: 'POST', data: corePayload } )
						: undefined
				)
				.then( () =>
					Object.keys( modulesPayload ).length > 0
						? apiFetch( { path: SEO_MODULES_PATH, method: 'POST', data: modulesPayload } )
						: undefined
				)
				.then( () => {
					// Adopt what we asked for; `adoptServerState()` below then corrects it
					// wherever the server reports something else. Skipped on failure, where
					// only the server knows what landed.
					baselineRef.current = values;
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
				// Either way — including a save that failed with its first request already
				// committed — the form is reconciled with the server before the controls
				// unlock, so `isSaving` also serializes this against the next save.
				.then( () => adoptServerState( touched ) )
				.finally( () => setIsSaving( false ) );
		},
		[ createInfoNotice, createSuccessNotice, createErrorNotice, setSettings, adoptServerState ]
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
