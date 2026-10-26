import apiFetch from '@wordpress/api-fetch';
import type { Catalog, Flow } from './types';

const BASE = '/jetpack-flow/v1';

export const fetchCatalog = () => apiFetch< Catalog >( { path: `${ BASE }/catalog` } );

export const fetchFlows = () => apiFetch< Flow[] >( { path: `${ BASE }/flows` } );

export const fetchFlow = ( id: number ) => apiFetch< Flow >( { path: `${ BASE }/flows/${ id }` } );

export const saveFlow = ( flow: Flow ) =>
	apiFetch< Flow >( {
		path: flow.id ? `${ BASE }/flows/${ flow.id }` : `${ BASE }/flows`,
		method: flow.id ? 'PUT' : 'POST',
		data: flow,
	} );

export const deleteFlow = ( id: number ) =>
	apiFetch( { path: `${ BASE }/flows/${ id }`, method: 'DELETE' } );

export const setFlowEnabled = ( id: number, enabled: boolean ) =>
	apiFetch< Flow >( {
		path: `${ BASE }/flows/${ id }/enabled`,
		method: 'POST',
		data: { enabled },
	} );

export const planFlow = ( prompt: string ) =>
	apiFetch< { flows: Flow[]; source: 'ai' | 'keywords' } >( {
		path: `${ BASE }/plan`,
		method: 'POST',
		data: { prompt },
	} );

/** Install a missing plugin from WordPress.org, or activate an installed one. */
export async function installAndActivate( slug: string, file: string, status: string ) {
	if ( status === 'missing' ) {
		return apiFetch( {
			path: '/wp/v2/plugins',
			method: 'POST',
			data: { slug: file.split( '/' )[ 0 ], status: 'active' },
		} );
	}
	return apiFetch( {
		path: `/wp/v2/plugins/${ file.replace( /\.php$/, '' ) }`,
		method: 'POST',
		data: { status: 'active' },
	} );
}
