import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { recordSettingEvents } from './setting-events';

// One id, so a burst of saves shows one snackbar.
const SAVED_NOTICE_ID = 'jetpack-protect-settings-saved';

type Failure = { message: string; keys: string[] };
const NO_KEYS: string[] = [];

/**
 * A readable message for the firewall's error codes, which it returns after storing the options.
 *
 * @param code - The REST error code.
 * @return The message, or undefined for any other code.
 */
function getWafErrorMessage( code: unknown ): string | undefined {
	switch ( code ) {
		case 'file_system_error':
			return __( 'The firewall couldn’t update its files on your server.', 'jetpack-protect-pkg' );
		case 'rules_api_error':
			return __(
				'The latest automatic firewall rules couldn’t be retrieved.',
				'jetpack-protect-pkg'
			);
		case 'waf_error':
			return __( 'The firewall couldn’t finish applying your change.', 'jetpack-protect-pkg' );
		default:
			return undefined;
	}
}

/**
 * Why the server refused a setting's value, which WordPress puts under `data.params` for `rest_invalid_param`.
 *
 * @param data - The REST error's data.
 * @return The first reason, or undefined when there is none.
 */
function getInvalidParamMessage( data: unknown ): string | undefined {
	const params = ( data as { params?: unknown } | undefined )?.params;
	if ( ! params || typeof params !== 'object' ) {
		return undefined;
	}
	return Object.values( params ).find( ( reason ): reason is string => typeof reason === 'string' );
}

/** Flat Jetpack settings, keyed by option or module slug, as `jetpack/v4/settings` returns them. */
export type ProtectSettings = Record< string, unknown >;

export type WafConfig = {
	waf_supported?: boolean;
	automatic_rules_available?: boolean;
	/** The file `auto_prepend_file` must point to for the firewall to run before WordPress. */
	bootstrap_path?: string;
	/** Whether the firewall ran before WordPress on this request, through `auto_prepend_file`. */
	standalone_mode?: boolean;
};

export type ProtectSettingsData = {
	/** Null until `load()` has finished, or partial when a save ran first. */
	settings: ProtectSettings | null;
	/** Whether `load()` has fetched the full settings. */
	isLoaded: boolean;
	waf: WafConfig | null;
	error: string | null;
	/** The keys whose save failed, so a card shows only its own errors; empty when loading failed. */
	errorKeys: string[];
	dismissError: () => void;
	isSaving: ( key: string ) => boolean;
	/** Fetches the settings once; later calls do nothing unless the fetch failed. */
	load: () => void;
	/** Saves to `path` (default `/jetpack/v4/settings`) and merges the patch into `settings`; resolves to whether it saved. */
	save: ( patch: ProtectSettings, path?: string ) => Promise< boolean >;
	/** Re-reads the given keys, for settings the server changes as a side effect of another save. */
	refresh: ( keys: string[] ) => Promise< void >;
};

/**
 * Read and save the Jetpack settings behind Protect's features, the same way Jetpack Settings does.
 *
 * Nothing is fetched until `load()` runs. Saves apply optimistically and roll back if the request fails,
 * unless the firewall stored the change before failing.
 *
 * @return The settings, the firewall's capabilities, and load and save functions.
 */
export default function useProtectSettings(): ProtectSettingsData {
	const [ settings, setSettingsState ] = useState< ProtectSettings | null >( null );
	const [ waf, setWaf ] = useState< WafConfig | null >( null );
	const [ isLoaded, setIsLoaded ] = useState( false );
	const [ failure, setFailure ] = useState< Failure | null >( null );
	const [ saving, setSaving ] = useState< string[] >( [] );
	const settingsRef = useRef< ProtectSettings | null >( null );
	const loadStarted = useRef( false );
	// Keys saved so far; the initial GET's response must not overwrite them.
	const savedKeys = useRef( new Set< string >() );

	const setSettings = useCallback( ( next: ProtectSettings ) => {
		settingsRef.current = next;
		setSettingsState( next );
	}, [] );

	const load = useCallback( () => {
		if ( loadStarted.current ) {
			return;
		}
		loadStarted.current = true;
		setFailure( null );

		Promise.all( [
			apiFetch< ProtectSettings >( { path: '/jetpack/v4/settings' } ),
			apiFetch< WafConfig >( { path: '/jetpack/v4/waf' } ).catch( () => null ),
		] )
			.then( ( [ nextSettings, nextWaf ] ) => {
				const current = settingsRef.current ?? {};
				const kept = [ ...savedKeys.current ]
					.filter( key => key in current )
					.map( key => [ key, current[ key ] ] );
				setSettings( { ...nextSettings, ...Object.fromEntries( kept ) } );
				setWaf( nextWaf );
				setIsLoaded( true );
			} )
			.catch( () => {
				loadStarted.current = false;
				setFailure( {
					message: __( 'Your settings couldn’t be loaded.', 'jetpack-protect-pkg' ),
					keys: NO_KEYS,
				} );
			} );
	}, [ setSettings ] );

	const refresh = useCallback(
		async ( keys: string[] ) => {
			try {
				const latest = await apiFetch< ProtectSettings >( { path: '/jetpack/v4/settings' } );
				const fresh = keys.filter( key => key in latest ).map( key => [ key, latest[ key ] ] );
				setSettings( { ...settingsRef.current, ...Object.fromEntries( fresh ) } );
			} catch {
				// Keep what we have; the next full load corrects it.
			}
		},
		[ setSettings ]
	);

	const save = useCallback(
		async ( patch: ProtectSettings, path = '/jetpack/v4/settings' ) => {
			const keys = Object.keys( patch );
			const before = settingsRef.current;
			const previous = Object.fromEntries(
				keys.filter( key => before && key in before ).map( key => [ key, before?.[ key ] ] )
			);

			keys.forEach( key => savedKeys.current.add( key ) );
			setSettings( { ...before, ...patch } );
			setSaving( current => [ ...current, ...keys ] );
			setFailure( null );
			let saved = true;

			try {
				await apiFetch( { path, method: 'POST', data: patch } );
				dispatch( noticesStore ).createSuccessNotice(
					__( 'Settings updated.', 'jetpack-protect-pkg' ),
					{ type: 'snackbar', id: SAVED_NOTICE_ID }
				);
			} catch ( e ) {
				const { code, message, data } = ( e ?? {} ) as {
					code?: unknown;
					message?: string;
					data?: unknown;
				};
				const wafMessage = getWafErrorMessage( code );
				setFailure( {
					message:
						wafMessage ||
						( code === 'rest_invalid_param' ? getInvalidParamMessage( data ) : undefined ) ||
						message ||
						__( 'Your change couldn’t be saved. Try again.', 'jetpack-protect-pkg' ),
					keys,
				} );
				if ( wafMessage ) {
					// The change was stored, so show the server's values rather than roll back.
					await refresh( keys );
				} else {
					const rolledBack = { ...settingsRef.current };
					keys.forEach( key => {
						// A later save of this key already replaced our value; keep it.
						if ( rolledBack[ key ] !== patch[ key ] ) {
							return;
						}
						savedKeys.current.delete( key );
						if ( key in previous ) {
							rolledBack[ key ] = previous[ key ];
						} else {
							delete rolledBack[ key ];
						}
					} );
					setSettings( rolledBack );
				}
				saved = false;
			} finally {
				// One entry per save in flight, so an overlapping save of the same key keeps it busy.
				setSaving( current => {
					const next = [ ...current ];
					keys.forEach( key => next.splice( next.indexOf( key ), 1 ) );
					return next;
				} );
			}
			if ( saved ) {
				recordSettingEvents( patch, before );
			}
			return saved;
		},
		[ setSettings, refresh ]
	);

	const isSaving = useCallback( ( key: string ) => saving.includes( key ), [ saving ] );
	const dismissError = useCallback( () => setFailure( null ), [] );

	return useMemo(
		() => ( {
			settings,
			isLoaded,
			waf,
			error: failure?.message ?? null,
			errorKeys: failure?.keys ?? NO_KEYS,
			dismissError,
			isSaving,
			load,
			save,
			refresh,
		} ),
		[ settings, isLoaded, waf, failure, dismissError, isSaving, load, save, refresh ]
	);
}
