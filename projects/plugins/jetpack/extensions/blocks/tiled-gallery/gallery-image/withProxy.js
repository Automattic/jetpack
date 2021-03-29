/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

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
			//const safeQuery = ( proxyQuery || '' ).replace( /^\?/, '' );
			//testsitemmrtag.files.wordpress.com/2021/03/drone-4.jpg?resize=750x750
			// fetch(
			// 	'https://public-api.wordpress.com/wpcom/v2/sites/testsitemmrtag.wordpress.com/atomic-auth-proxy/file/wp-content/uploads/2021/03/drone-4.jpg?resize=214%2C214'
			// )
			console.log( 'apifetching..' );
			apiFetch( { path: '/wpcom/v2/joltw/file?path=/wp-content/uploads/2021/03/drone-2-1.jpg' } )
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
		}
	}, [ proxyIsEnabled, imageObjectUrl, isFetching, isError, proxyQuery ] );

	if ( proxyIsEnabled ) {
		return <WrappedComponent { ...restProps } src={ imageObjectUrl } srcSet={ null } />;
	}
	return <WrappedComponent { ...restProps } />;
};

export default createHigherOrderComponent( withProxy, 'withProxy' );
