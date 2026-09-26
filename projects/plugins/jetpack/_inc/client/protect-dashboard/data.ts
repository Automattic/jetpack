import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export type SecurityFeature = {
	module: string;
	title: string;
	description: string;
};

// The security modules this dashboard controls, in display order.
export const SECURITY_FEATURES: SecurityFeature[] = [
	{
		module: 'waf',
		title: __( 'Firewall', 'jetpack' ),
		description: __( 'Block malicious requests before they reach your site.', 'jetpack' ),
	},
	{
		module: 'protect',
		title: __( 'Brute force protection', 'jetpack' ),
		description: __( 'Stop repeated failed login attempts from the same IP.', 'jetpack' ),
	},
	{
		module: 'account-protection',
		title: __( 'Account protection', 'jetpack' ),
		description: __(
			'Require strong passwords and verify suspicious logins for privileged users.',
			'jetpack'
		),
	},
	{
		module: 'monitor',
		title: __( 'Downtime monitoring', 'jetpack' ),
		description: __( 'Get an alert as soon as your site goes down.', 'jetpack' ),
	},
	{
		module: 'sso',
		title: __( 'Secure sign-on', 'jetpack' ),
		description: __( 'Let users log in with their WordPress.com account and 2FA.', 'jetpack' ),
	},
];

export type ModuleInfo = {
	module: string;
	name: string;
	activated: boolean;
	available?: boolean;
	override?: string;
};

export type WafConfig = {
	waf_supported: boolean;
	jetpack_waf_automatic_rules: boolean;
	jetpack_waf_ip_allow_list: string;
	jetpack_waf_ip_allow_list_enabled: boolean;
	jetpack_waf_ip_block_list: string;
	jetpack_waf_ip_block_list_enabled: boolean;
	automatic_rules_available?: boolean;
	[ key: string ]: unknown;
};

export type SiteCounts = {
	plugins: number;
	themes: number;
	wpVersion: string;
};

export type FirewallBlocks = {
	current_day: number;
	thirty_days: number;
	all_time: number;
};

/**
 * Requests the firewall has blocked, printed by PHP; null while the firewall is off.
 *
 * @return The block counts, or null.
 */
export const getFirewallBlocks = (): FirewallBlocks | null =>
	window.JP_PROTECT_DASHBOARD?.firewallBlocks ?? null;

declare global {
	interface Window {
		JP_PROTECT_DASHBOARD?: { counts?: SiteCounts; firewallBlocks?: FirewallBlocks | null };
	}
}

/**
 * What a scan covers on this site, printed by PHP.
 *
 * @return Plugin and theme counts and the WordPress version.
 */
export const getSiteCounts = (): SiteCounts => ( {
	plugins: Number( window.JP_PROTECT_DASHBOARD?.counts?.plugins ?? 0 ),
	themes: Number( window.JP_PROTECT_DASHBOARD?.counts?.themes ?? 0 ),
	wpVersion: String( window.JP_PROTECT_DASHBOARD?.counts?.wpVersion ?? '' ),
} );

export const settingsQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'settings' ] as const,
		queryFn: () => apiFetch< Record< string, unknown > >( { path: '/jetpack/v4/settings' } ),
	} );

// `/data` 404s while the module is off, so callers enable this only when it's on.
export const moduleDataQuery = < T >( module: string ) =>
	queryOptions( {
		queryKey: [ 'jetpack', 'module-data', module ] as const,
		queryFn: () => apiFetch< T >( { path: `/jetpack/v4/module/${ module }/data` } ),
		retry: false,
	} );

export const modulesQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'modules' ] as const,
		queryFn: () => apiFetch< Record< string, ModuleInfo > >( { path: '/jetpack/v4/module/all' } ),
	} );

export const wafQuery = () =>
	queryOptions( {
		queryKey: [ 'jetpack', 'waf' ] as const,
		queryFn: () => apiFetch< WafConfig >( { path: '/jetpack/v4/waf' } ),
	} );

/**
 * Activate or deactivate one Jetpack module, then refresh everything that reads module state.
 *
 * @return The mutation.
 */
export function useToggleModule() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( { module, active }: { module: string; active: boolean } ) =>
			apiFetch( {
				path: `/jetpack/v4/module/${ module }/active`,
				method: 'POST',
				data: { active },
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'modules' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'waf' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'settings' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'module-data' ] } );
		},
	} );
}

/**
 * Save Jetpack settings (e.g. monitor notifications, SSO options).
 *
 * @return The mutation.
 */
export function useUpdateSettings() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( data: Record< string, unknown > ) =>
			apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data } ),
		onSuccess: () => queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'settings' ] } ),
	} );
}

/**
 * Save part of the firewall configuration.
 *
 * @return The mutation.
 */
export function useUpdateWaf() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( data: Partial< WafConfig > ) =>
			apiFetch( { path: '/jetpack/v4/waf', method: 'POST', data } ),
		onSuccess: () => queryClient.invalidateQueries( { queryKey: [ 'jetpack', 'waf' ] } ),
	} );
}
