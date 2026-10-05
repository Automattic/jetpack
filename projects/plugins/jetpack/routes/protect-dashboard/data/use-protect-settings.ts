import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/** Flat Jetpack settings, keyed by option or module slug, as `jetpack/v4/settings` returns them. */
export type ProtectSettings = Record< string, unknown >;

export type WafConfig = {
	waf_supported?: boolean;
	automatic_rules_available?: boolean;
};

export type ProtectSettingsData = {
	settings: ProtectSettings | null;
	waf: WafConfig | null;
	error: string | null;
	dismissError: () => void;
	isSaving: ( key: string ) => boolean;
	save: ( patch: ProtectSettings ) => Promise< void >;
};

/**
 * Read and save the Jetpack settings behind Protect's features, the same way Jetpack Settings does.
 *
 * Saves apply optimistically and roll back if the request fails.
 *
 * @return The settings, the firewall's capabilities, and a save function.
 */
export default function useProtectSettings(): ProtectSettingsData {
	const [ settings, setSettings ] = useState< ProtectSettings | null >( null );
	const [ waf, setWaf ] = useState< WafConfig | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState< string[] >( [] );

	useEffect( () => {
		Promise.all( [
			apiFetch< ProtectSettings >( { path: '/jetpack/v4/settings' } ),
			apiFetch< WafConfig >( { path: '/jetpack/v4/waf' } ).catch( () => null ),
		] )
			.then( ( [ nextSettings, nextWaf ] ) => {
				setSettings( nextSettings );
				setWaf( nextWaf );
			} )
			.catch( () => setError( __( 'Your settings couldn’t be loaded. Try again.', 'jetpack' ) ) );
	}, [] );

	const save = useCallback( async ( patch: ProtectSettings ) => {
		const keys = Object.keys( patch );
		let previous: ProtectSettings = {};

		setSettings( current => {
			previous = Object.fromEntries( keys.map( key => [ key, current?.[ key ] ] ) );
			return { ...current, ...patch };
		} );
		setSaving( current => [ ...current, ...keys ] );
		setError( null );

		try {
			await apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data: patch } );
		} catch ( e ) {
			setSettings( current => ( { ...current, ...previous } ) );
			setError(
				( e as { message?: string } )?.message ||
					__( 'Your change couldn’t be saved. Try again.', 'jetpack' )
			);
		} finally {
			setSaving( current => current.filter( key => ! keys.includes( key ) ) );
		}
	}, [] );

	const isSaving = useCallback( ( key: string ) => saving.includes( key ), [ saving ] );
	const dismissError = useCallback( () => setError( null ), [] );

	return { settings, waf, error, dismissError, isSaving, save };
}
