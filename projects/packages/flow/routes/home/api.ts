import apiFetch from '@wordpress/api-fetch';
import type { Catalog, Flow } from './types';

const BASE = '/jetpack-flow/v1';

export const fetchCatalog = () => apiFetch< Catalog >( { path: `${ BASE }/catalog` } );

export const fetchFlows = () => apiFetch< Flow[] >( { path: `${ BASE }/flows` } );

export const saveFlows = ( flows: Flow[] ) =>
	apiFetch< Flow[] >( { path: `${ BASE }/flows`, method: 'PUT', data: { flows } } );

export const planFlows = ( prompt: string ) =>
	apiFetch< { flows: Flow[]; source: 'ai' | 'keywords' } >( {
		path: `${ BASE }/plan`,
		method: 'POST',
		data: { prompt },
	} );
