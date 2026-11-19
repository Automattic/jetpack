import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from 'react';
import { ADS_ACCOUNT_KEY, ADS_SETTINGS_KEY } from './ads-keys';
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
 * The stored Ads switch and options, loaded once for every tab that reads them.
 *
 * @param enabled - Whether to load them.
 * @return The query.
 */
export function useStoredAdsValues( enabled = true ) {
	return useQuery( {
		queryKey: ADS_SETTINGS_KEY,
		queryFn: async () =>
			parseValues(
				await apiFetch< Record< string, unknown > >( { path: '/jetpack/v4/settings' } )
			),
		enabled,
	} );
}

/**
 * The Ads switch and options: loads them once, then saves each change as it is made.
 *
 * The asked-for value shows until its save settles, and goes back to the stored one if the save fails.
 *
 * @param onSaved - Called after each successful save.
 * @return The values, load and save state, and the setters.
 */
export function useAdsSettings( onSaved?: () => void ) {
	const queryClient = useQueryClient();
	const { data: stored, isError: loadError } = useStoredAdsValues();
	const [ requested, setRequested ] = useState< Partial< AdsValues > >( {} );
	const [ saveError, setSaveError ] = useState( false );

	const save = useCallback(
		async ( key: AdsKey, value: boolean | string, request: APIFetchOptions ) => {
			setRequested( prev => ( { ...prev, [ key ]: value } ) );
			setSaveError( false );
			try {
				await apiFetch( request );
				queryClient.setQueryData< AdsValues >(
					ADS_SETTINGS_KEY,
					prev => prev && { ...prev, [ key ]: value }
				);
				if ( key === 'wordads' ) {
					// Simple sites read the switch from WordPress.com, which confirms it in the background.
					queryClient.setQueryData< { active?: boolean } >(
						ADS_ACCOUNT_KEY,
						prev => prev && { ...prev, active: Boolean( value ) }
					);
					queryClient.invalidateQueries( { queryKey: ADS_ACCOUNT_KEY } );
				}
				onSaved?.();
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
		[ onSaved, queryClient ]
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
