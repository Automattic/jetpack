import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from 'react';
import { ADS_ACCOUNT_KEY, ADS_PAYOUT_KEY, ADS_SETTINGS_KEY } from './ads-keys';
import { trackModuleToggle, trackSettingToggle } from './tracking';
import { WPCOM_ADS_SETTINGS } from './use-wpcom-ads-settings';
import { useAdsAccount } from './wordads';
import { wpcomFetch } from './wpcom-fetch';

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

/** Options only Simple has: WordPress.com's sidebar ad, and keeping ads from logged-in visitors. */
export type SimpleOption = 'sidebar' | 'logged_out_only';

export const TEXT_OPTIONS: readonly AdsOption[] = [
	'wordads_ccpa_privacy_policy_url',
	'wordads_custom_adstxt',
];

export type AdsValues = { wordads: boolean } & { [ K in AdsOption ]: boolean | string } & {
	[ K in SimpleOption ]?: boolean;
};

type AdsKey = keyof AdsValues;

// The `display_options` key WordPress.com stores each placement under on Simple.
const SIMPLE_DISPLAY_OPTIONS: Partial< Record< AdsOption | SimpleOption, string > > = {
	enable_header_ad: 'enable_header_ad',
	wordads_second_belowpost: 'second_belowpost',
	wordads_inline_enabled: 'inline_enabled',
	wordads_display_front_page: 'display_front_page',
	wordads_display_post: 'display_post',
	wordads_display_page: 'display_page',
	wordads_display_archive: 'display_archive',
	sidebar: 'sidebar',
};

interface WpcomAdsSettings {
	settings?: {
		show_to_logged_in?: string;
		display_options?: Record< string, boolean >;
		ccpa_enabled?: boolean;
		ccpa_privacy_policy_url?: string;
	};
}

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
 * The Ads values from WordPress.com's settings on Simple, which has no GDPR banner or ads.txt options.
 *
 * Leaves `wordads` off: Simple reads the switch from the Ads account.
 *
 * @param response          - The `wordads/settings` response.
 * @param response.settings - The settings.
 * @return The Ads options.
 */
function parseSimpleValues( { settings = {} }: WpcomAdsSettings ): AdsValues {
	const display = settings.display_options ?? {};
	const values = {
		wordads: false,
		logged_out_only: settings.show_to_logged_in === 'no',
	} as AdsValues;
	for ( const name of ADS_OPTIONS ) {
		values[ name ] = TEXT_OPTIONS.includes( name ) ? '' : false;
	}
	for ( const [ name, key ] of Object.entries( SIMPLE_DISPLAY_OPTIONS ) ) {
		// WordPress.com shows every placement until the site saves one.
		values[ name as AdsKey ] = display[ key ] ?? true;
	}
	values.wordads_ccpa_enabled = Boolean( settings.ccpa_enabled );
	values.wordads_ccpa_privacy_policy_url = settings.ccpa_privacy_policy_url ?? '';
	return values;
}

/**
 * What to send WordPress.com on Simple to save one value; it keeps every field left out.
 *
 * @param key     - The value's key.
 * @param value   - The value.
 * @param current - The values before the change.
 * @return The request body.
 */
function toSimpleChange(
	key: AdsKey,
	value: boolean | string,
	current: AdsValues | undefined
): Record< string, unknown > {
	switch ( key ) {
		case 'wordads':
			// Turning ads on agrees to the terms, as the switch says.
			return value
				? { show_to_logged_in: current?.logged_out_only ? 'no' : 'yes', tos: 'signed' }
				: { show_to_logged_in: 'pause' };
		case 'logged_out_only':
			return { show_to_logged_in: value ? 'no' : 'yes' };
		case 'wordads_ccpa_enabled':
			return { ccpa_enabled: value };
		case 'wordads_ccpa_privacy_policy_url':
			return { ccpa_privacy_policy_url: value };
		default:
			return { display_options: { [ SIMPLE_DISPLAY_OPTIONS[ key ] as string ]: value } };
	}
}

/**
 * The stored Ads options, loaded once for every tab that reads them: Jetpack's settings, or WordPress.com's on Simple.
 *
 * @param enabled - Whether to load them.
 * @return The query.
 */
export function useStoredAdsValues( enabled = true ) {
	return useQuery( {
		queryKey: ADS_SETTINGS_KEY,
		queryFn: async () =>
			isSimpleSite()
				? parseSimpleValues( await wpcomFetch< WpcomAdsSettings >( WPCOM_ADS_SETTINGS ) )
				: parseValues(
						await apiFetch< Record< string, unknown > >( { path: '/jetpack/v4/settings' } )
					),
		enabled,
	} );
}

/**
 * Whether ads are on: the `wordads` module on Jetpack sites, WordPress.com's own state on Simple.
 *
 * Both come from caches the Settings tab updates when it switches ads, so neither waits on a refetch.
 *
 * @return Whether ads are on, undefined while that loads, and whether it failed to.
 */
export function useAdsActive(): { active: boolean | undefined; isError: boolean } {
	const simple = isSimpleSite();
	const account = useAdsAccount();
	const settings = useStoredAdsValues( ! simple );

	return simple
		? { active: account.data?.active, isError: account.isError }
		: { active: settings.data?.wordads, isError: settings.isError };
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
	const simple = isSimpleSite();
	const queryClient = useQueryClient();
	const settings = useStoredAdsValues();
	const account = useAdsAccount( simple );
	const [ requested, setRequested ] = useState< Partial< AdsValues > >( {} );
	const [ saveError, setSaveError ] = useState( false );

	let stored = settings.data;
	if ( simple ) {
		stored = stored && account.data && { ...stored, wordads: account.data.active };
	}

	const save = useCallback(
		async ( key: AdsKey, value: boolean | string, request: () => Promise< unknown > ) => {
			setRequested( prev => ( { ...prev, [ key ]: value } ) );
			setSaveError( false );
			try {
				await request();
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
					// Turning ads on signs the terms on Simple.
					queryClient.invalidateQueries( { queryKey: ADS_PAYOUT_KEY } );
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

	const saveSimple = useCallback(
		( key: AdsKey, value: boolean | string ) =>
			save( key, value, () =>
				wpcomFetch( {
					...WPCOM_ADS_SETTINGS,
					method: 'POST',
					data: toSimpleChange( key, value, stored ),
				} )
			),
		[ save, stored ]
	);

	const setOption = useCallback(
		( name: AdsOption | SimpleOption, value: boolean | string ) => {
			if ( typeof value === 'boolean' ) {
				trackSettingToggle( name, value );
			}
			if ( simple ) {
				return saveSimple( name, value );
			}
			return save( name, value, () =>
				apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data: { [ name ]: value } } )
			);
		},
		[ simple, save, saveSimple ]
	);

	const setModuleActive = useCallback(
		( isActive: boolean ) => {
			trackModuleToggle( isActive );
			if ( simple ) {
				return saveSimple( 'wordads', isActive );
			}
			return save( 'wordads', isActive, () =>
				apiFetch( {
					path: '/jetpack/v4/module/wordads/active',
					method: 'POST',
					data: { active: isActive },
				} )
			);
		},
		[ simple, save, saveSimple ]
	);

	return {
		values: stored && ( { ...stored, ...requested } as AdsValues ),
		// The account is read only on Simple; elsewhere another tab's failed lookup may sit in the cache.
		loadError: settings.isError || ( simple && account.isError ),
		saveError,
		saving: new Set< string >( Object.keys( requested ) ),
		setOption,
		setModuleActive,
	};
}
