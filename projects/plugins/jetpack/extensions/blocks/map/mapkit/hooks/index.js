import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { select } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { getLoadContext, waitForObject } from '../../../../shared/block-editor-asset-loader';

// mapRef can be a ref to the element that will render the map
// or a ref to the element that will be on the page when the map is rendered.
// It is only used here to determine the document and window to use.
const useMapKitSetup = mapRef => {
	const [ loaded, setLoaded ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ mapkit, setMapkit ] = useState( null );

	useEffect( () => {
		const blog_id = select( CONNECTION_STORE_ID ).getBlogId();

		const loadLibrary = () => {
			return new Promise( resolve => {
				const { currentDoc } = getLoadContext( mapRef.current );
				const element = currentDoc.createElement( 'script' );
				element.addEventListener(
					'load',
					async () => {
						const { currentWindow } = getLoadContext( mapRef.current );
						const mapkitObj = await waitForObject( currentWindow, 'mapkit' );
						setMapkit( mapkitObj );
						resolve( mapkitObj );
					},
					{ once: true }
				);
				element.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
				element.crossOrigin = 'anonymous';
				currentDoc.head.appendChild( element );
			} );
		};

		const fetchKey = mapkitObj => {
			return new Promise( resolve => {
				mapkitObj.init( {
					authorizationCallback: async done => {
						const response = await fetch(
							`https://public-api.wordpress.com/wpcom/v2/sites/${ blog_id }/mapkit`
						);
						if ( response.status === 200 ) {
							const data = await response.json();
							done( data.wpcom_mapkit_access_token );
						} else {
							setError( 'Mapkit API error' );
						}
						resolve();
					},
				} );
			} );
		};

		if ( mapRef.current ) {
			const { currentWindow } = getLoadContext( mapRef.current );

			// if mapkit is already loaded, reuse it.
			if ( currentWindow.mapkit ) {
				setMapkit( currentWindow.mapkit );
				setLoaded( true );
			} else {
				loadLibrary().then( mapkitObj => {
					fetchKey( mapkitObj ).then( () => {
						setLoaded( true );
					} );
				} );
			}
		}
	}, [ mapRef ] );

	return { loaded, error, mapkit };
};

export { useMapKitSetup };
