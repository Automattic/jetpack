import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from 'react';
import { trackModuleToggle, trackSettingToggle } from './tracking';
import type { APIFetchOptions } from '@wordpress/api-fetch';

export const ADS_OPTIONS = [
	'enable_header_ad',
	'wordads_second_belowpost',
	'wordads_inline_enabled',
	'wordads_display_front_page',
	'wordads_display_post',
	'wordads_display_page',
	'wordads_display_archive',
	'wordads_ccpa_enabled',
	'wordads_ccpa_privacy_policy_url',
	'wordads_cmp_enabled',
	'wordads_custom_adstxt_enabled',
	'wordads_custom_adstxt',
] as const;

export type AdsOption = ( typeof ADS_OPTIONS )[ number ];

export const TEXT_OPTIONS: readonly AdsOption[] = [
	'wordads_ccpa_privacy_policy_url',
	'wordads_custom_adstxt',
];

export type AdsValues = { wordads: boolean } & { [ K in AdsOption ]: boolean | string };

type AdsKey = keyof AdsValues;

// Saves store `1`/`0`, and some reads return strings, so `"0"` must read as off.
const toBoolean = ( stored: unknown ) =>
	! [ undefined, null, false, 0, '0', '' ].includes( stored as never );

/**
 * The Ads values from `GET jetpack/v4/settings`.
 *
 * @param settings - Every Jetpack setting.
 * @return The module switch and the Ads options.
 */
function parseValues( settings: Record< string, unknown > ): AdsValues {
	const values = { wordads: toBoolean( settings.wordads ) } as AdsValues;
	for ( const name of ADS_OPTIONS ) {
		values[ name ] = TEXT_OPTIONS.includes( name )
			? String( settings[ name ] ?? '' )
			: toBoolean( settings[ name ] );
	}
	return values;
}

/**
 * The Ads switch and options: loads them once, then saves each change as it is made.
 *
 * The asked-for value shows until its save settles, and goes back to the stored one if the save fails.
 *
 * @return The values, load and save state, and the setters.
 */
export function useAdsSettings() {
	const [ stored, setStored ] = useState< AdsValues >();
	const [ requested, setRequested ] = useState< Partial< AdsValues > >( {} );
	const [ loadError, setLoadError ] = useState( false );
	const [ saveError, setSaveError ] = useState( false );

	useEffect( () => {
		let current = true;
		apiFetch< Record< string, unknown > >( { path: '/jetpack/v4/settings' } )
			.then( settings => current && setStored( parseValues( settings ) ) )
			.catch( () => current && setLoadError( true ) );
		return () => {
			current = false;
		};
	}, [] );

	const save = useCallback(
		async ( key: AdsKey, value: boolean | string, request: APIFetchOptions ) => {
			setRequested( prev => ( { ...prev, [ key ]: value } ) );
			setSaveError( false );
			try {
				await apiFetch( request );
				setStored( prev => prev && { ...prev, [ key ]: value } );
			} catch {
				setSaveError( true );
			} finally {
				setRequested( prev => {
					const next = { ...prev };
					delete next[ key ];
					return next;
				} );
			}
		},
		[]
	);

	const setOption = useCallback(
		( name: AdsOption, value: boolean | string ) => {
			if ( typeof value === 'boolean' ) {
				trackSettingToggle( name, value );
			}
			return save( name, value, {
				path: '/jetpack/v4/settings',
				method: 'POST',
				data: { [ name ]: value },
			} );
		},
		[ save ]
	);

	const setModuleActive = useCallback(
		( active: boolean ) => {
			trackModuleToggle( active );
			return save( 'wordads', active, {
				path: '/jetpack/v4/module/wordads/active',
				method: 'POST',
				data: { active },
			} );
		},
		[ save ]
	);

	return {
		values: stored && ( { ...stored, ...requested } as AdsValues ),
		loadError,
		saveError,
		saving: new Set< string >( Object.keys( requested ) ),
		setOption,
		setModuleActive,
	};
}
