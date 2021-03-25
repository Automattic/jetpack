/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
//import apiFetch from '@wordpress/api-fetch';
//import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import wpcomProxyRequest from '../../../../modules/search/instant-search/external/wpcom-proxy-request'; // Unsure about reaching this far "over", but this file may be removed soonish:  https://github.com/Automattic/jetpack/issues/19308

const cache = {};
const cacheResponse = ( requestId, blob, freshness ) => {
	// Cache at most 100 items
	const cacheKeys = Object.keys( cache );
	if ( cacheKeys.length > 100 ) {
		delete cache[ cacheKeys[ 0 ] ];
	}

	cache[ requestId ] = blob;

	// Self-remove this entry after `freshness` ms
	setTimeout( () => {
		delete cache[ requestId ];
	}, freshness );
};

const withProxy = WrappedComponent => props => {
	const { proxyIsEnabled, proxySiteIdOrSlug, proxyMediaPath, proxyQuery, ...restProps } = props;

	const [ imageObjectUrl, setImageObjectUrl ] = useState( '' );
	const [ isFetching, setIsFetching ] = useState( false );
	const [ isError, setIsError ] = useState( false );

	const requestId = 'tiled-gallery-proxied-image-';
	useEffect( () => {
		if ( ! proxyIsEnabled || imageObjectUrl || isFetching || isError ) {
			console.log( 'Deciding not to fetch' );
			console.log( {
				proxyIsEnabled,
				imageObjectUrl,
				isFetching,
				isError,
			} );

			return;
		}
		if ( cache[ requestId ] ) {
			// Load image from cache
			const url = URL.createObjectURL( cache[ requestId ] );
			setImageObjectUrl( url );
			console.log( 'got image from cache', { url } );
		} else {
			// Not in cache, send a request
			setIsFetching( true );
			const safeQuery = ( proxyQuery || '' ).replace( /^\?/, '' );
			/*
			apiFetch( {
				//path: `/sites/${ proxySiteIdOrSlug }/atomic-auth-proxy/file?path=${ proxyMediaPath }&${ safeQuery }`,
				//path: `https://public-api.wordpress.com/sites/${ proxySiteIdOrSlug }/atomic-auth-proxy/file?path=${ proxyMediaPath }&${ safeQuery }`,
				apiNamespace: 'wpcom/v2',
			} )
            */
			//testsitemmrtag.files.wordpress.com/2021/03/drone-4.jpg?resize=750x750
			// https://flarypod.jurassic.tube/wp-content/uploads/2021/03/drone-2-1.jpg
			// fetch(
			// 	'https://public-api.wordpress.com/wpcom/v2/sites/testsitemmrtag.wordpress.com/atomic-auth-proxy/file/wp-content/uploads/2021/03/drone-4.jpg?resize=214%2C214'
			// )
			const responseHandler = data => {
				setIsFetching( false );

				if ( data.ok ) {
					cacheResponse( requestId, data );
					setImageObjectUrl( URL.createObjectURL( data ) );
					console.log( 'got image from API', { requestId, imageObjectUrl, data } );
				} else {
					console.log( 'Got non-200 response', { data } );
					setIsError( true );
				}
			};
			const errorHandler = error => {
				console.log( { error } );
				setIsFetching( false );
				setIsError( true );
				console.error( 'Fetch failed', error );
			};

			console.log( 'Fetching via wpcomProxyRequest...' );
			const pathForPublicApi =
				'/sites/mmrtt1.wpcomstaging.com/atomic-auth-proxy/file?path=/wp-content/uploads/2020/09/qi-bin-w4hbafegiac-unsplash.jpg&ssl=1&resize=219%2C219';
			// const ppr = promiseifedProxyRequest( wpcomProxyRequest, pathForPublicApi )
			// 	.then( responseHandler )
			// 	.catch( errorHandler );
			// console.log( { ppr } );
			const xhr = wpcomProxyRequest( { path: pathForPublicApi, apiVersion: '2' } );
			console.log( { xhr } );
			xhr.then( responseHandler ).catch( errorHandler );
			console.log( { xhr } );
			// wpcomProxyRequest.then( ( { default: proxyRequest } ) => {
			// return promiseifedProxyRequest( proxyRequest, pathForPublicApi )
			// .then( responseHandler )
			// .catch( errorHandler );
			// } );

			/*
			fetch(
				'https://public-api.wordpress.com/wpcom/v2/sites/flarypod.jurassic.tube/atomic-auth-proxy/file/wp-content/uploads/2021/03/drone-2-1.jpg?resize=214%2C214'
			)
				.then( data => {
					setIsFetching( false );

					if ( data.ok ) {
						cacheResponse( requestId, data );
						setImageObjectUrl( URL.createObjectURL( data ) );
						console.log( 'got image from API', { requestId, imageObjectUrl, data } );
					} else {
						console.log( 'Got non-200 response', { data } );
						setIsError( true );
					}
				} )
				.catch( error => {
					console.log( { error } );
					setIsFetching( false );
					setIsError( true );
					console.error( 'Fetch failed', error );
				} );
                */
		}
	}, [ proxyIsEnabled, imageObjectUrl, isFetching, isError, proxyQuery ] );

	if ( proxyIsEnabled ) {
		return <WrappedComponent { ...restProps } src={ imageObjectUrl } srcSet={ null } />;
	}
	return <WrappedComponent { ...restProps } />;
};

/**
 * Turn a proxy request into a promise
 *
 * @param {Function} proxyRequest - The wpcom-proxy-request function
 * @param {string} path - The API path to use
 * @returns {Promise} A promise to a proxy request response
 */
function promiseifedProxyRequest( proxyRequest, path ) {
	return new Promise( function ( resolve, reject ) {
		console.log( 'Calling proxyRequest...' );
		proxyRequest( { path, apiVersion: '2' }, function ( err, body, headers ) {
			console.log( { err, body, headers } );
			if ( err ) {
				reject( err );
			}
			resolve( body, headers );
		} );
	} );
}

export default createHigherOrderComponent( withProxy, 'withProxy' );
