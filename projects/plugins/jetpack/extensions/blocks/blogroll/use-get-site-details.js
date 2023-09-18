import { useEffect, useRef, useState, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { getSiteIcon, checkIfValidDomain } from './utils';

const cache = {};

export default function useGetSiteDetails( siteURL, subscriptions, enabled = false ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ siteDetails, setSiteDetails ] = useState( subscriptions ?? [] );
	const abortControllerRef = useRef();

	const fetchSiteDetails = useCallback(
		async () =>
			await fetch(
				addQueryArgs(
					'https://public-api.wordpress.com/rest/v1.1/sites/' + encodeURIComponent( siteURL ),
					{ force: 'wpcom' }
				)
			)
				.then( response => {
					if ( ! response.ok ) {
						setSiteDetails( [] );
						cache[ siteURL ] = null;
					} else {
						return response.json();
					}
				} )
				.then( data => {
					if ( data ) {
						cache[ siteURL ] = data;
						setSiteDetails( [
							{
								id: data?.ID,
								description: data?.description,
								URL: data?.URL,
								site_icon: getSiteIcon( data?.logo?.url ),
								name: data?.name,
							},
						] );
					} else {
						setSiteDetails( [] );
					}
				} )
				.catch( error => {
					setErrorMessage( error?.message );
					setSiteDetails( [] );
				} )
				.finally( () => {
					abortControllerRef.current = null;
				} ),
		[ siteURL ]
	);

	useEffect( () => {
		if ( ! enabled ) {
			setIsLoading( false );
			setSiteDetails( subscriptions );
			return;
		}

		setIsLoading( true );
		setErrorMessage( null );

		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}

		abortControllerRef.current =
			typeof AbortController === 'undefined' ? undefined : new AbortController();

		const cancellableSearch = setTimeout( () => {
			const searchQuery = siteURL.toLowerCase().trim();
			if ( searchQuery.length > 0 ) {
				const existInSubscriptions = subscriptions.filter( item => {
					const nameContainsSearch = item.name.toLowerCase().includes( siteURL.toLowerCase() );
					const urlContainsSearch = item.URL.toLowerCase().includes( siteURL.toLowerCase() );

					return nameContainsSearch || urlContainsSearch;
				} );

				if ( checkIfValidDomain( siteURL ) ) {
					if ( searchQuery in cache ) {
						const cachedSiteDetails = cache[ searchQuery ]
							? [
									{
										id: cache[ searchQuery ]?.ID,
										description: cache[ searchQuery ]?.description,
										URL: cache[ searchQuery ]?.URL,
										site_icon: getSiteIcon( cache[ searchQuery ]?.logo?.url ),
										name: cache[ searchQuery ]?.name,
									},
							  ]
							: [];

						setSiteDetails( cachedSiteDetails );
						return;
					}
					fetchSiteDetails( searchQuery );
				} else {
					setSiteDetails( existInSubscriptions );
				}
			} else {
				setSiteDetails( subscriptions );
			}
			setIsLoading( false );
		}, 1000 );

		return () => {
			clearTimeout( cancellableSearch );
		};
	}, [ siteURL, enabled, subscriptions, fetchSiteDetails ] );

	return { isLoading, errorMessage, siteDetails };
}
