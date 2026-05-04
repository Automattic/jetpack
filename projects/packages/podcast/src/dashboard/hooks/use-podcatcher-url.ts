/**
 * Per-site, per-podcatcher localStorage for "directory submission URL" inputs.
 *
 * The user pastes the URL their show ends up at after each platform's submit
 * flow; we store it so future visits to the Distribution tab show that pretty
 * link instead of the raw RSS feed URL again.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';

const STORAGE_PREFIX = 'jetpack-podcast:podcatcher-url';

const buildKey = ( siteUrl: string, directoryId: string ) =>
	`${ STORAGE_PREFIX }:${ siteUrl }:${ directoryId }`;

const safeRead = ( key: string ): string => {
	try {
		return window.localStorage.getItem( key ) || '';
	} catch {
		return '';
	}
};

const safeWrite = ( key: string, value: string ) => {
	try {
		if ( value ) {
			window.localStorage.setItem( key, value );
		} else {
			window.localStorage.removeItem( key );
		}
	} catch {
		// ignore quota / privacy mode errors
	}
};

/**
 * Read and write the user's submitted URL for a single podcatcher (per site).
 *
 * @param siteUrl     - The current site URL, used as a stable cache key prefix.
 * @param directoryId - Identifier for the directory (e.g. 'apple', 'spotify').
 * @return              Tuple of [currentValue, setValue] backed by localStorage.
 */
export function usePodcatcherUrl(
	siteUrl: string,
	directoryId: string
): [ string, ( next: string ) => void ] {
	const key = buildKey( siteUrl, directoryId );
	const [ value, setValue ] = useState< string >( () => safeRead( key ) );

	useEffect( () => {
		setValue( safeRead( key ) );
	}, [ key ] );

	const update = useCallback(
		( next: string ) => {
			setValue( next );
			safeWrite( key, next );
		},
		[ key ]
	);

	return [ value, update ];
}
