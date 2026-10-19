import apiFetch from '@wordpress/api-fetch';
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	buildCorePayload,
	buildModulesPayload,
	changedCodes,
	readCoreResponse,
} from './build-payload';
import { recordSeoEvent } from './record-seo-event';
import { settingsStore } from './settings-store';
import { VERIFICATION_KEYS } from './verification-services';
import type { SchemaSettings } from './schema-settings-types';
import type { SettingsResponse, VerificationKey } from './settings-types';

// Single snackbar id reused across a save so "Updating settings…" is replaced
// in place by "Settings saved." (or an error) — mirrors the Jetpack → Settings
// page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-settings-save';

/** Tracks props for one changed setting; `none` stands in for N/A. */
type SettingChange = {
	setting: string;
	verification_service: string;
	setting_value: string | boolean;
};

// The Tracks name of each setting a save can send, keyed by its form field.
const TRACKED_SETTINGS = {
	front_page_description: 'front_page_description',
	title_formats: 'title_formats',
	search_engines_visible: 'search_engines_visible',
	sitemap_active: 'sitemap',
	canonical_active: 'canonical',
	verification_tools_active: 'verification_tools',
	verification: 'site_verification',
} as const;

type TrackedField = keyof typeof TRACKED_SETTINGS;

/** A setting a save sends, and whether the module route carries it. */
type SentSetting = { field: TrackedField; viaModules: boolean; props: SettingChange };

/**
 * One Tracks payload per setting this save sends, so co-firing can't inflate the
 * distinct-site metric. Text settings report `none`, never their content.
 *
 * @param baseline - The last-saved values.
 * @param values   - The values being saved.
 * @return One entry per sent setting.
 */
function sentSettings( baseline: SettingsResponse, values: SettingsResponse ): SentSetting[] {
	return ( Object.keys( TRACKED_SETTINGS ) as TrackedField[] ).flatMap( field => {
		// A payload built from this field alone tells whether, and where, build-payload sends it.
		const alone = { ...baseline, [ field ]: values[ field ] };
		const viaModules = Object.keys( buildModulesPayload( baseline, alone ) ).length > 0;
		if ( ! viaModules && Object.keys( buildCorePayload( baseline, alone ) ).length === 0 ) {
			return [];
		}

		const sent = ( value: string | boolean, service = 'none' ): SentSetting => ( {
			field,
			viaModules,
			props: {
				setting: TRACKED_SETTINGS[ field ],
				verification_service: service,
				setting_value: value,
			},
		} );
		if ( field === 'verification' ) {
			return VERIFICATION_KEYS.filter(
				key => baseline.verification[ key ] !== values.verification[ key ]
			).map( key => sent( values.verification[ key ] ? 'set' : 'cleared', key ) );
		}
		const value = values[ field ];
		return [ sent( typeof value === 'boolean' ? value : 'none' ) ];
	} );
}

/**
 * Replace one verification code.
 *
 * @param state - Form values, or null before they load.
 * @param key   - The verification service.
 * @param value - The new code.
 * @return The values with that code replaced.
 */
function withVerification< T extends SettingsResponse | null >(
	state: T,
	key: VerificationKey,
	value: string
): T {
	return state ? { ...state, verification: { ...state.verification, [ key ]: value } } : state;
}

/**
 * Apply a patch, taking from its verification map only the given codes: the others
 * may be older than a code another save has adopted since.
 *
 * @param state - Values to update, or null before they load.
 * @param patch - The fields to apply.
 * @param codes - The verification codes the patch owns.
 * @return The updated values.
 */
function withPatch< T extends SettingsResponse | null >(
	state: T,
	patch: Partial< SettingsResponse >,
	codes: VerificationKey[]
): T {
	if ( ! state ) {
		return state;
	}
	const next: SettingsResponse = { ...state, ...patch };
	const verification = patch.verification;
	if ( verification ) {
		next.verification = {
			...state.verification,
			...Object.fromEntries( codes.map( key => [ key, verification[ key ] ] ) ),
		};
	}
	return next as T;
}

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
	/** Save one verification code straight away (Google auto-verify) and adopt it as saved. Rejects if the save fails. */
	saveVerification: ( key: VerificationKey, value: string ) => Promise< void >;
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

	// Writes patch the store's latest snapshot, not this form's: a form left on another
	// tab mid-save must not roll back what a newer one saved since.
	const patchStore = useCallback(
		( apply: ( saved: SettingsResponse ) => SettingsResponse ) => {
			const saved = select( settingsStore ).getSettings();
			if ( saved ) {
				setSettings( apply( saved ) );
			}
		},
		[ setSettings ]
	);

	// Refs so `commit()` reads the freshest values without stale closures and
	// without re-creating the callback on every keystroke.
	const baselineRef = useRef< SettingsResponse | null >( initial );
	// Saves run one at a time: each waits for the one before. The server merges codes
	// without a lock, and a late re-read must not land after a newer save.
	const inFlightRef = useRef< Promise< unknown > >( Promise.resolve() );
	// `isSaving` holds until the last queued save settles, not the first.
	const activeSavesRef = useRef( 0 );
	const beginSave = useCallback( () => {
		activeSavesRef.current += 1;
		setIsSaving( true );
	}, [] );
	const endSave = useCallback( () => {
		activeSavesRef.current -= 1;
		if ( activeSavesRef.current === 0 ) {
			setIsSaving( false );
		}
	}, [] );
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
		(
			touched: Array< keyof SettingsResponse >,
			savedTitlePage?: string,
			codes: VerificationKey[] = []
		) =>
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

						const localPatch = { ...patch };
						if ( savedTitlePage && patch.title_formats ) {
							const titleFormats = { ...patch.title_formats };
							Object.keys( current.title_formats ).forEach( pageType => {
								if (
									pageType !== savedTitlePage &&
									JSON.stringify( current.title_formats[ pageType ] ?? [] ) !==
										JSON.stringify( baseline.title_formats[ pageType ] ?? [] )
								) {
									// Refresh the saved row without discarding another row's pending edit.
									titleFormats[ pageType ] = current.title_formats[ pageType ];
								}
							} );
							localPatch.title_formats = titleFormats;
						}

						localRef.current = withPatch( current, localPatch, codes );
						baselineRef.current = withPatch( baseline, patch, codes );
						setLocal( localRef.current );
						patchStore( saved => withPatch( saved, patch, codes ) );
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
		[ patchStore ]
	);

	const saveValues = useCallback(
		( values: SettingsResponse, savedTitlePage?: string ) => {
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
			const sent: Partial< SettingsResponse > = Object.fromEntries(
				touched.map( field => [ field, values[ field ] ] )
			);
			const codes = Object.keys( changedCodes( baseline, values ) ) as VerificationKey[];
			const settings = sentSettings( baseline, values );
			// What landed: core's settings write reports what it stored, and the module
			// route lists what it applied, even when it fails partway.
			let coreSaved = false;
			let coreStored: Partial< SettingsResponse > = {};
			let modulesApplied: string[] = [];
			// Core answers 200 even when a sanitizer kept the old value, so a setting
			// counts only once its stored value moved off the baseline.
			const storedInCore = ( { field, props }: SentSetting ): boolean => {
				if ( ! coreSaved ) {
					return false;
				}
				if ( ! ( field in coreStored ) ) {
					return true;
				}
				const key = props.verification_service as VerificationKey;
				return field === 'verification'
					? coreStored.verification?.[ key ] !== baseline.verification[ key ]
					: JSON.stringify( coreStored[ field ] ) !== JSON.stringify( baseline[ field ] );
			};

			beginSave();
			createInfoNotice( __( 'Updating settings…', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );

			// Sequential, not parallel: the module writes switch Jetpack modules and can
			// be refused, and the re-read below has to see a settled server state to
			// reconcile against. Overlapping the two would race that read, and a failure
			// in one would leave the client unable to say what the other had landed.
			inFlightRef.current = inFlightRef.current
				.then( () =>
					Object.keys( corePayload ).length > 0
						? apiFetch( { path: CORE_SETTINGS_PATH, method: 'POST', data: corePayload } )
						: undefined
				)
				.then( response => {
					coreSaved = true;
					coreStored = readCoreResponse( response );
					return Object.keys( modulesPayload ).length > 0
						? apiFetch< Record< string, boolean > >( {
								path: SEO_MODULES_PATH,
								method: 'POST',
								data: modulesPayload,
							} )
						: undefined;
				} )
				.then( applied => {
					modulesApplied = Object.keys( applied ?? {} );
					// Adopt what we asked for; `adoptServerState()` below then corrects it
					// wherever the server reports something else. Skipped on failure, where
					// only the server knows what landed. Only what this save changed, so a
					// code `saveVerification()` adopted meanwhile isn't rolled back.
					baselineRef.current = withPatch( baselineRef.current ?? baseline, sent, codes );
					patchStore( saved => withPatch( saved, sent, codes ) );
					createSuccessNotice( __( 'Settings saved.', 'jetpack-seo' ), {
						id: SAVE_NOTICE_ID,
						type: 'snackbar',
					} );
				} )
				.catch( ( error: { message?: string; data?: { applied?: Record< string, boolean > } } ) => {
					modulesApplied = Object.keys( error?.data?.applied ?? {} );
					createErrorNotice(
						error?.message ?? __( 'Could not save settings. Please try again.', 'jetpack-seo' ),
						{ id: SAVE_NOTICE_ID, type: 'snackbar' }
					);
				} )
				// Recorded before the re-read, which can take seconds, so leaving the page
				// straight after a save doesn't lose the event.
				.then( () =>
					settings.forEach( setting =>
						recordSeoEvent(
							(
								setting.viaModules
									? modulesApplied.includes( setting.field )
									: storedInCore( setting )
							)
								? 'jetpack_seo_setting_updated'
								: 'jetpack_seo_setting_update_failed',
							'settings',
							setting.props
						)
					)
				)
				// Either way — including a save that failed with its first request already
				// committed — the form is reconciled with the server before the controls
				// unlock, so `isSaving` also serializes this against the next save.
				.then( () => adoptServerState( touched, savedTitlePage, codes ) )
				.finally( endSave );
		},
		[
			createInfoNotice,
			createSuccessNotice,
			createErrorNotice,
			patchStore,
			adoptServerState,
			beginSave,
			endSave,
		]
	);

	const setField = useCallback(
		( patch: Partial< SettingsResponse > ) =>
			setLocal( state => ( state ? { ...state, ...patch } : state ) ),
		[]
	);

	const setVerification = useCallback(
		( key: VerificationKey, value: string ) =>
			setLocal( state => withVerification( state, key, value ) ),
		[]
	);

	const saveVerification = useCallback(
		( key: VerificationKey, value: string ) => {
			const props: SettingChange = {
				setting: TRACKED_SETTINGS.verification,
				verification_service: key,
				setting_value: value ? 'set' : 'cleared',
			};
			beginSave();
			const run = inFlightRef.current
				.then( () => {
					// As in `sentSettings()`, a retry that saves the code already stored records nothing.
					const changed = baselineRef.current?.verification[ key ] !== value;
					return apiFetch( {
						path: CORE_SETTINGS_PATH,
						method: 'POST',
						data: { verification_services_codes: { [ key ]: value } },
					} ).then(
						() => {
							if ( changed ) {
								recordSeoEvent( 'jetpack_seo_setting_updated', 'settings', props );
							}
							baselineRef.current = withVerification( baselineRef.current, key, value );
							localRef.current = withVerification( localRef.current, key, value );
							setLocal( state => withVerification( state, key, value ) );
							patchStore( saved => withVerification( saved, key, value ) );
						},
						( error: unknown ) => {
							if ( changed ) {
								recordSeoEvent( 'jetpack_seo_setting_update_failed', 'settings', props );
							}
							throw error;
						}
					);
				} )
				.finally( endSave );
			inFlightRef.current = run.catch( () => undefined );
			return run;
		},
		[ patchStore, beginSave, endSave ]
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
			patchStore( saved => ( { ...saved, schema } ) );
		},
		[ patchStore ]
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
			saveValues( values, pageType );
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
		saveVerification,
		commit,
		commitFields,
		isDirty,
		commitTitleFormat,
		isTitleFormatDirty,
	};
}
