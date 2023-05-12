import { writable } from 'svelte/store';

export const isaIgnoredImages = writable< string[] >( [] );
export function ignoreImage( targetID: string ) {
	isaIgnoredImages.update( imageIDs => {
		if ( ! imageIDs.find( imageID => imageID === targetID ) ) {
			imageIDs.push( targetID );
		}
		return imageIDs;
	} );
}

export function unignoreImage( targetID: string ) {
	isaIgnoredImages.update( imageIDs => {
		return imageIDs.filter( imageID => imageID !== targetID );
	} );
}
