import apiFetch from '@wordpress/api-fetch';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/** Flat Jetpack settings, keyed by option or module slug, as `jetpack/v4/settings` returns them. */
export type ProtectSettings = Record< string, unknown >;

export type WafConfig = {
	waf_supported?: boolean;
	automatic_rules_available?: boolean;
};

export type ProtectSettingsData = {
	/** Null until `load()` has finished, or partial when a save ran first. */
	settings: ProtectSettings | null;
	/** Whether `load()` has fetched the full settings. */
	isLoaded: boolean;
	waf: WafConfig | null;
	error: string | null;
	dismissError: () => void;
	isSaving: ( key: string ) => boolean;
	/** Fetches the settings once; later calls do nothing. */
	load: () => void;
	/** Saves to `path` (default `/jetpack/v4/settings`) and merges the patch into `settings`. */
	save: ( patch: ProtectSettings, path?: string ) => Promise< void >;
};

/**
 * Read and save the Jetpack settings behind Protect's features, the same way Jetpack Settings does.
 *
 * Nothing is fetched until `load()` runs. Saves apply optimistically and roll back if the request fails.
 *
 * @return The settings, the firewall's capabilities, and load and save functions.
 */
export default function useProtectSettings(): ProtectSettingsData {
	const [ settings, setSettingsState ] = useState< ProtectSettings | null >( null );
	const [ waf, setWaf ] = useState< WafConfig | null >( null );
	const [ isLoaded, setIsLoaded ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
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
				setError( __( 'Your settings couldn’t be loaded. Try again.', 'jetpack' ) );
			} );
	}, [ setSettings ] );

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
			setError( null );

			try {
				await apiFetch( { path, method: 'POST', data: patch } );
			} catch ( e ) {
				const rolledBack = { ...settingsRef.current };
				keys.forEach( key => {
					savedKeys.current.delete( key );
					if ( key in previous ) {
						rolledBack[ key ] = previous[ key ];
					} else {
						delete rolledBack[ key ];
					}
				} );
				setSettings( rolledBack );
				setError(
					( e as { message?: string } )?.message ||
						__( 'Your change couldn’t be saved. Try again.', 'jetpack' )
				);
			} finally {
				setSaving( current => current.filter( key => ! keys.includes( key ) ) );
			}
		},
		[ setSettings ]
	);

	const isSaving = useCallback( ( key: string ) => saving.includes( key ), [ saving ] );
	const dismissError = useCallback( () => setError( null ), [] );

	return { settings, isLoaded, waf, error, dismissError, isSaving, load, save };
}
