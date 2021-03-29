/**
 * External dependencies
 */
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { settings } from './settings';
import { getActiveStyleName } from '../../shared/block-styles';

export const getMapboxImageUrl = ( attributes, token ) => {
	const width = 1000;
	const height = attributes.mapHeight ?? 400;
	const zoom = attributes.zoom ?? 13;
	const bearing = 0;
	const longitude = attributes.mapCenter.lng ?? -122.41941550000001;
	const latitude = attributes.mapCenter.lat ?? 37.7749295;
	// const showStreets = attributes.mapDetails ?? true;
	const markerColor = attributes?.markerColor?.match( /^#[0-9abcdef]{6}$/ )
		? attributes.markerColor.replace( '#', '' )
		: 'ff0000';

	// Switch overlay based on selected className and mapDetails settings.
	let overlay = 'streets-v11';
	const mapStyle = getActiveStyleName( settings.styles, attributes.className );
	if ( mapStyle === 'satellite' && attributes.mapDetails ) {
		overlay = 'satellite-streets-v11';
	} else if ( mapStyle === 'satellite' ) {
		overlay = 'satellite-v9';
	} else if ( mapStyle === 'black_and_white' ) {
		overlay = 'light-v10';
	} else if ( mapStyle === 'terrain' ) {
		overlay = 'outdoors-v11';
	}

	let markersSlug = '';

	// Generate slug for all markers on the map.
	if ( attributes.points?.length ) {
		attributes.points.forEach( point => {
			let marker = markersSlug ? ',' : '';
			marker += `pin-s+${ markerColor }`;

			if ( point?.coordinates?.longitude && point?.coordinates?.latitude ) {
				marker += `(${ point.coordinates.longitude },${ point.coordinates.latitude })`;
				markersSlug += marker;
			}
		} );
		if ( markersSlug ) {
			markersSlug += '/';
		}
	}

	const urlBase = 'https://api.mapbox.com/styles/v1/mapbox';
	const urlWithPaths = `${ urlBase }/${ overlay }/static/${ markersSlug }${ longitude },${ latitude },${ zoom },${ bearing }/${ width }x${ height }@2x`;

	return `${ urlWithPaths }?access_token=${ token }`;
};

export const requestMapboxImage = async url => {
	const getMapboxImage = mapboxUrl => {
		return fetch( mapboxUrl )
			.then( response => {
				if ( ! response.ok ) {
					// TODO: Handle each of the error cases here, particular rate limiting.
					throw new Error( 'Failed' );
				}
				return response.blob();
			} )
			.then( imgBlob => {
				return createBlobURL( imgBlob );
			} )
			.catch( err => {
				console.log( err );
				return false;
			} );
	};
	const result = await getMapboxImage( url );
	return result;
};
