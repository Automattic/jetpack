import { addQueryArgs } from '@wordpress/url';
import { useCallback, useEffect, useState } from 'react';
import wpcomRequest from 'wpcom-proxy-request';

export type Viewer = {
	ID: number;
	login: string;
	email: boolean | string;
	name: string;
	first_name: string;
	last_name: string;
	nice_name: string;
	URL: string;
	avatar_URL: string;
	profile_URL: string;
	ip_address: boolean | string;
};

declare global {
	interface Window {
		wpcomPrivateViewers: {
			siteId: number;
		};
	}
}

/**
 * Hook to fetch and manage private site viewers.
 *
 * The API endpoint does not support sorting and searching, so it fetches all viewers from the API
 * (in batches of 100) and then lets the client paginate, sort, and filter the results.
 *
 * @return {object} Object containing viewers array, total count, and loading state.
 */
export const useViewers = () => {
	const [ viewers, setViewers ] = useState< Viewer[] >( [] );
	const [ isLoading, setIsLoading ] = useState< boolean >( false );

	const fetchAllViewers = useCallback( async () => {
		setIsLoading( true );
		try {
			const allViewers: Viewer[] = [];
			const batchSize = 100;

			// Helper function to fetch a single page of viewers.
			const fetchPage = async ( page: number ) => {
				const path = addQueryArgs( `/sites/${ window.wpcomPrivateViewers.siteId }/viewers`, {
					page,
					number: batchSize,
				} );
				return await wpcomRequest< { viewers: Viewer[]; found: number } >( {
					path,
					apiVersion: '1.1',
				} );
			};

			// Fetch first page to get total count.
			const firstResponse = await fetchPage( 1 );
			allViewers.push( ...firstResponse.viewers );

			// Calculate total pages and fetch remaining.
			const totalPages = Math.ceil( firstResponse.found / batchSize );
			for ( let page = 2; page <= totalPages; page++ ) {
				const response = await fetchPage( page );
				allViewers.push( ...response.viewers );
			}

			setViewers( allViewers );
		} finally {
			setIsLoading( false );
		}
	}, [] );

	useEffect( () => {
		fetchAllViewers();
	}, [ fetchAllViewers ] );

	return {
		viewers,
		isLoading,
	};
};
