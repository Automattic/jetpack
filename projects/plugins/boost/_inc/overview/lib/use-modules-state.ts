import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z } from 'zod';
import { isCriticalCssEnabled } from '../../../app/assets/src/js/features/critical-css/lib/is-critical-css-enabled';

type DataSyncEntry = {
	nonce: string;
	value: unknown;
};

type DataSyncKey =
	| 'cornerstone_pages_properties'
	| 'modules_state'
	| 'performance_history'
	| 'dismissed_alerts'
	| 'critical_css_state'
	| 'lcp_state';

declare global {
	interface Window {
		jetpack_boost_ds?: {
			rest_api: { nonce: string; value: string };
		} & Partial< Record< DataSyncKey, DataSyncEntry > >;
	}
}

const modulesStateSchema = z.record(
	z.string().min( 1 ),
	z.object( {
		active: z.boolean(),
		available: z.boolean(),
	} )
);

export type ModulesState = z.infer< typeof modulesStateSchema >;

export function parseDataSyncEnvelope( response: unknown ): unknown {
	const error = z
		.object( { status: z.literal( 'error' ), message: z.string() } )
		.safeParse( response );
	if ( error.success ) {
		throw new Error( error.data.message );
	}
	const envelope = z
		.object( { status: z.literal( 'success' ), JSON: z.unknown() } )
		.parse( response );
	if ( ! Object.prototype.hasOwnProperty.call( envelope, 'JSON' ) ) {
		throw new Error( 'Missing Data Sync response value.' );
	}
	return envelope.JSON;
}

export function isSiteOnline(): boolean {
	return typeof Jetpack_Boost !== 'undefined' && Jetpack_Boost.site.online;
}

export async function requestDataSync( key: DataSyncKey, value?: unknown ): Promise< unknown > {
	if ( ! isSiteOnline() ) {
		throw new Error( 'The site is not publicly available.' );
	}
	const config = window.jetpack_boost_ds;
	const entry = config?.[ key ];
	if ( ! config?.rest_api?.nonce || ! config.rest_api.value || ! entry?.nonce ) {
		throw new Error( 'Missing Data Sync authentication.' );
	}
	const route = key.replace( /_/g, '-' );
	const response = await apiFetch( {
		url: `${ config.rest_api.value.replace( /\/$/, '' ) }/${ route }${
			value === undefined ? '' : '/set'
		}`,
		method: value === undefined ? 'GET' : 'POST',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': config.rest_api.nonce,
			'X-Jetpack-WP-JS-Sync-Nonce': entry.nonce,
		},
		...( value === undefined ? {} : { data: { JSON: value } } ),
	} );
	return parseDataSyncEnvelope( response );
}

export function parseModulesState( value: unknown ): ModulesState {
	return modulesStateSchema.parse( value );
}

export function useModulesState() {
	const initial = modulesStateSchema.safeParse( window.jetpack_boost_ds?.modules_state?.value );
	return useQuery( {
		queryKey: [ 'modules_state' ],
		queryFn: async () => parseModulesState( await requestDataSync( 'modules_state' ) ),
		initialData: initial.success ? initial.data : undefined,
		enabled: isSiteOnline(),
		refetchOnMount: 'always',
	} );
}

const criticalCssRefreshSchema = z
	.object( {
		status: z.enum( [ 'not_generated', 'generated', 'pending', 'error' ] ),
		updated: z.coerce.number().optional(),
	} )
	.catch( { status: 'not_generated', updated: 0 } );
const lcpRefreshSchema = z
	.object( {
		status: z.enum( [ 'not_analyzed', 'analyzed', 'pending', 'error' ] ).catch( 'not_analyzed' ),
		updated: z.coerce.number().optional(),
	} )
	.catch( { status: 'not_analyzed', updated: 0 } );

const generationSchemas = {
	critical_css_state: criticalCssRefreshSchema,
	lcp_state: lcpRefreshSchema,
};
export type ScoreRefreshState = { config: string | undefined; isPending: boolean };

function useGenerationState( key: 'critical_css_state' | 'lcp_state', enabled: boolean ) {
	const bootstrap = window.jetpack_boost_ds?.[ key ]?.value;
	const initial =
		bootstrap === undefined ? undefined : generationSchemas[ key ].safeParse( bootstrap );
	return useQuery( {
		queryKey: [ key ],
		queryFn: async () => generationSchemas[ key ].parse( await requestDataSync( key ) ),
		initialData: initial?.success ? initial.data : undefined,
		enabled: enabled && isSiteOnline(),
		refetchInterval: query => {
			if ( ! enabled || ! isSiteOnline() ) {
				return false;
			}
			return query.state.data?.status === 'pending' ? 2000 : 30000;
		},
	} );
}

export function useScoreRefreshState( modules?: ModulesState ): ScoreRefreshState {
	const cssEnabled = isCriticalCssEnabled( modules );
	const lcpEnabled = modules?.lcp?.active === true;
	const css = useGenerationState( 'critical_css_state', cssEnabled );
	const lcp = useGenerationState( 'lcp_state', lcpEnabled );
	const states = [ ...( cssEnabled ? [ css ] : [] ), ...( lcpEnabled ? [ lcp ] : [] ) ];
	const isPending =
		! modules ||
		states.some( query => ! query.data || query.isError || query.data.status === 'pending' );
	if ( ! modules || states.some( query => ! query.data ) ) {
		return { config: undefined, isPending };
	}
	const moduleStates = Object.keys( modules )
		.filter( key => key !== 'image_guide' )
		.sort()
		.map( key => [ key, modules[ key ].active ] );
	return {
		config: JSON.stringify( [
			moduleStates,
			cssEnabled ? css.data?.updated ?? 0 : 0,
			lcpEnabled ? lcp.data?.updated ?? 0 : 0,
		] ),
		isPending,
	};
}
