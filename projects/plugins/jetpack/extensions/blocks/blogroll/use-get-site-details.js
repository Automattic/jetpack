import { useEffect, useRef, useState, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { getSiteIcon, getValidDomain } from './utils';

const cache = {};

export default function useGetSiteDetails( {
	siteURL,
	subscriptions,
	enabled = false,
	enableSiteSearch = false,
} ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ siteDetails, setSiteDetails ] = useState( subscriptions ?? [] );
	const abortControllerRef = useRef();
	const fetchSiteDetails = useCallback( () => {
		const validDomain = getValidDomain( siteURL );

		fetch(
			addQueryArgs(
				'https://public-api.wordpress.com/rest/v1.1/sites/' + encodeURIComponent( validDomain ),
				{ force: 'wpcom' }
			)
		)
			.then( response => {
				if ( ! response.ok ) {
					setSiteDetails( [] );
					cache[ validDomain ] = null;
				} else {
					return response.json();
				}
			} )
			.then( data => {
				if ( data ) {
					cache[ validDomain ] = data;
					setSiteDetails( [
						{
							blog_id: data?.ID,
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
			} );
	}, [ siteURL ] );

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

				const validDomain = getValidDomain( siteURL );
				if ( validDomain && enableSiteSearch ) {
					if ( validDomain in cache ) {
						const cachedSiteDetails = cache[ validDomain ]
							? [
									{
										id: cache[ validDomain ]?.ID,
										description: cache[ validDomain ]?.description,
										URL: cache[ validDomain ]?.URL,
										site_icon: getSiteIcon( cache[ validDomain ]?.logo?.url ),
										name: cache[ validDomain ]?.name,
									},
							  ]
							: [];

						setSiteDetails( cachedSiteDetails );
						return;
					}
					fetchSiteDetails();
				} else {
					setSiteDetails( existInSubscriptions );
				}
			} else {
				setSiteDetails( subscriptions );
			}
			setIsLoading( false );
		}, 250 );

		return () => {
			clearTimeout( cancellableSearch );
		};
	}, [ siteURL, enabled, subscriptions, fetchSiteDetails, enableSiteSearch ] );

	return { isLoading, errorMessage, siteDetails };
}
