/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

const globalProperties = {};

export function initializeTracks() {
	window._tkq = window._tkq || [];
}

export function identifySite( siteId ) {
	globalProperties.blog_id = siteId;
}

export function recordEvent( eventName, properties ) {
	window._tkq.push( [ 'recordEvent', eventName, { ...globalProperties, ...properties } ] );
}

export function getRailcarIdPrefix() {
	return `${ uuid().replace( /-/g, '' ) }`;
}

export function recordTrainTracksRender( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_render', properties );
}

export function recordTrainTracksInteract( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_interact', properties );
}
